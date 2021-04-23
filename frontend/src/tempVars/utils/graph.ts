import {proxy} from 'src/utils/queryUrlGenerator'
import {parseMetaQuery} from 'src/tempVars/parsing'

import templateReplace, {
  templateInternalReplace,
} from 'src/tempVars/utils/replace'

import {resolveValues} from 'src/tempVars/utils'

import {Template, RemoteDataState} from 'src/types'

type TemplateName = string

interface TemplateNode {
  parents: TemplateNode[]
  children: TemplateNode[]
  status: RemoteDataState
  initialTemplate: Template
  hydratedTemplate: Template
}

type TemplateGraph = TemplateNode[]

interface TemplateQueryFetcher {
  fetch: (query: string) => Promise<string[]>
}

interface Selections {
  [tempVar: string]: string
}

export function getDependencyNames(template: Template): TemplateName[] {
  if (template.query) {
    if (template.query.influxql) {
      return getDependencyNamesHelper(template.query.influxql)
    }
    if (template.query.flux) {
      return getDependencyNamesHelper(template.query.flux)
    }
  }

  const names = new Set<string>()

  for (const {value} of template.values) {
    for (const name of getDependencyNamesHelper(value)) {
      names.add(name)
    }
  }

  return [...names]
}

function getDependencyNamesHelper(s: string): TemplateName[] {
  const names = []

  let inName = false
  let name = ''

  for (const c of s) {
    if (inName) {
      if (c === ':') {
        inName = false
        name += ':'
        names.push(name)
        name = ''
      } else if (c === '\n' || (c === ' ' && name.length === 1)) {
        // names cannot start with space or contain a new line,
        // this is especially required for flux, where ':'
        // separates parameter names and record values
        inName = false
        continue
      } else {
        name += c
      }
    } else if (c === ':') {
      inName = true
      name = ':'
    }
  }

  if (inName) {
    throw new Error(`malformed template variable string \`${name}\``)
  }

  return names
}

function verifyAcyclic(graph: TemplateGraph): void {
  for (const node of graph) {
    verifyAcyclicHelper(node, [])
  }
}

function verifyAcyclicHelper(node: TemplateNode, seen: TemplateNode[]): void {
  if (seen.includes(node)) {
    const tempVar = node.initialTemplate.tempVar

    throw new Error(`cyclic dependency in template "${tempVar}"`)
  }

  for (const child of node.children) {
    verifyAcyclicHelper(child, [...seen, node])
  }
}

export function graphFromTemplates(templates: Template[]): TemplateGraph {
  const nodesById: {[id: string]: TemplateNode} = templates.reduce(
    (acc, t) => ({
      ...acc,
      [t.id]: {
        parents: [],
        children: [],
        status: RemoteDataState.NotStarted,
        initialTemplate: t,
        hydratedTemplate: null,
      },
    }),
    {}
  )

  const nodes = Object.values(nodesById)

  for (const template of templates) {
    const childNames = getDependencyNames(template)
    const nodeIsChild = n => childNames.includes(n.initialTemplate.tempVar)
    const children = nodes.filter(nodeIsChild)

    nodesById[template.id].children.push(...children)

    for (const child of children) {
      child.parents.push(nodesById[template.id])
    }
  }

  verifyAcyclic(nodes)

  return nodes
}

export function topologicalSort(nodes: TemplateGraph): TemplateGraph {
  const acc = []
  const seen = new Set<TemplateNode>()

  for (const node of nodes) {
    if (!seen.has(node)) {
      topologicalSortHelper(node, seen, acc)
    }
  }

  return acc.reverse()
}

function topologicalSortHelper(
  node: TemplateNode,
  seen: Set<TemplateNode>,
  acc: TemplateNode[]
) {
  seen.add(node)

  for (const child of node.children) {
    if (!seen.has(child)) {
      topologicalSortHelper(child, seen, acc)
    }
  }

  acc.push(node)
}

function findLeaves(graph: TemplateGraph): TemplateNode[] {
  return graph.filter(node => !node.children.length)
}

function isResolved(node: TemplateNode): boolean {
  return node.status === RemoteDataState.Done
}

class CachingTemplateQueryFetcher implements TemplateQueryFetcher {
  private proxyUrl: string

  private cache: {
    [proxyUrl: string]: {
      [query: string]: string[]
    }
  }

  constructor() {
    this.cache = {}
  }

  public setProxyUrl(proxyUrl: string): CachingTemplateQueryFetcher {
    if (!proxyUrl) {
      throw new Error('Must supply proxyUrl')
    }

    this.proxyUrl = proxyUrl

    if (!this.cache[proxyUrl]) {
      this.cache[proxyUrl] = {}
    }

    return this
  }

  public async fetch(query) {
    const cached = this.cache[this.proxyUrl][query]

    if (cached) {
      return Promise.resolve([...cached])
    }

    const response = await proxy({source: this.proxyUrl, query})
    const values = parseMetaQuery(query, response.data)

    this.cache[this.proxyUrl][query] = values

    return [...values]
  }
}

const defaultFetcher = new CachingTemplateQueryFetcher()

interface HydrateTemplateOptions {
  selections?: Selections
  proxyUrl?: string
  fetcher?: TemplateQueryFetcher
}

export async function hydrateTemplate(
  template: Template,
  templates: Template[],
  {
    proxyUrl,
    fetcher = defaultFetcher.setProxyUrl(proxyUrl),
    selections = {},
  }: HydrateTemplateOptions
): Promise<Template> {
  let newValues: string[]

  if (template.query && (template.query.influxql || template.query.flux)) {
    const renderedQuery = templateReplace(
      templateInternalReplace(template),
      templates
    )

    newValues = await fetcher.fetch(renderedQuery)
  }

  const selection = selections[template.tempVar]
  const templateValues = resolveValues(template, newValues, selection)

  return {...template, values: templateValues}
}

export async function hydrateTemplates(
  templates: Template[],
  hydrateOptions: HydrateTemplateOptions
) {
  const graph = graphFromTemplates(templates)

  async function resolve(node: TemplateNode) {
    const resolvedTemplates = graph
      .filter(isResolved)
      .map(t => t.hydratedTemplate)

    node.status = RemoteDataState.Loading

    node.hydratedTemplate = await hydrateTemplate(
      node.initialTemplate,
      resolvedTemplates,
      hydrateOptions
    )

    node.status = RemoteDataState.Done

    const parents = node.parents
      .filter(p => p.children.every(isResolved))
      .map(resolve)

    return Promise.all(parents)
  }

  await Promise.all(findLeaves(graph).map(resolve))

  return graph.map(t => t.hydratedTemplate)
}
