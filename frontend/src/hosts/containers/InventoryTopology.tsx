import React, {createRef, PureComponent} from 'react'
import {connect} from 'react-redux'
import {
  default as mx,
  mxGraph,
  mxEditor,
  mxCell,
  mxUtils,
  mxGraphHandler,
  mxGuide,
  mxEvent,
  mxEdgeHandler,
  mxClient,
  mxDivResizer,
  mxConstants,
  // mxGraphModel,
} from 'mxgraph'

interface customMxUtils {
  getPrettyXml: typeof mxUtils.getPrettyXML
}

import _ from 'lodash'

// component
// import {Button, ButtonShape, IconFont} from 'src/reusable_ui'
import HostList from 'src/hosts/components/HostList'
// import Tools from 'src/hosts/components/Tools'
// import Properties from 'src/hosts/components/Properties'

import Threesizer from 'src/shared/components/threesizer/Threesizer'

// constants
import {
  HANDLE_NONE,
  HANDLE_HORIZONTAL,
  HANDLE_VERTICAL,
} from 'src/shared/constants/'

// Types
import {Host} from 'src/types'

// error
import {ErrorHandling} from 'src/shared/decorators/errors'

// css
import 'mxgraph/javascript/src/css/common.css'

export interface ITNodeInfo {
  id?: string
  name?: string
  label?: string
  href?: string
}

interface Props {
  hostsObject: {[x: string]: Host}
  autoRefresh: number
  manualRefresh: number
  onManualRefresh: () => void
}

interface State {
  screenProportions: number[]
  sidebarProportions: number[]
  hostList: string[]
}

@ErrorHandling
class InventoryTopology extends PureComponent<Props, State, customMxUtils> {
  // Creates a wrapper editor with a graph inside the given container.
  // The editor is used to create certain functionality for the
  // graph, such as the rubberband selection, but most parts
  // of the UI are custom in this example.
  private mx = mx()
  private editor: mxEditor = null
  private mxUtils: typeof mxUtils = null
  private mxConstants: typeof mxConstants = null
  private mxGraphHandler: typeof mxGraphHandler = null
  private mxGuide: typeof mxGuide = null
  private mxEvent: typeof mxEvent = null
  private mxEdgeHandler: typeof mxEdgeHandler = null
  private mxClient: typeof mxClient = null
  private mxDivResizer: typeof mxDivResizer = null
  private graph: mxGraph = null
  // private model: mxGraphModel = null

  private containerRef = createRef<HTMLDivElement>()
  private outlineRef = createRef<HTMLDivElement>()
  private sidebarRef = createRef<HTMLDivElement>()
  private toolbarRef = createRef<HTMLDivElement>()

  private container: HTMLDivElement = null
  private outline: HTMLDivElement = null
  private sidebar: HTMLDivElement = null
  private toolbar: HTMLDivElement = null

  constructor(props: Props) {
    super(props)

    this.state = {
      screenProportions: [0.1, 0.9],
      sidebarProportions: [0.333, 0.333, 0.333],
      hostList: null,
    }
  }

  public handleResize = (fieldName: string) => (proportions: number[]) => {
    this.setState((prevState: State) => ({
      ...prevState,
      [fieldName]: proportions,
    }))
  }

  public componentDidMount() {
    this.setting()
    this.topologyEditor()

    const hostList = _.keys(this.props.hostsObject)
    this.setState({hostList})
  }

  public componentDidUpdate(prevProps: Props) {
    const {hostsObject} = this.props
    if (prevProps.hostsObject !== hostsObject) {
      const hostList = _.keys(hostsObject)
      this.setState({hostList})
    }

    // SVG내부에서 update를 감지하여 DB로 저장(갱신)
  }

  public componentWillUnmount() {
    this.graph.destroy()
    this.graph = null

    this.editor.destroy()
    this.editor = null
  }

  render() {
    return (
      <div id="containerWrapper">
        {!this.mx.mxClient.isBrowserSupported() ? (
          <>this Browser Not Supported</>
        ) : (
          <Threesizer
            orientation={HANDLE_VERTICAL}
            divisions={this.threesizerDivisions}
            onResize={this.handleResize('screenProportions')}
          />
        )}
      </div>
    )
  }

  private addSidebarIcon(
    graph: mxGraph,
    sidebar: HTMLDivElement,
    label: string,
    image: string
  ) {
    // Function that is executed when the image is dropped on
    // the graph. The cell argument points to the cell under
    const funct = (
      graph: mxGraph,
      _event: Event,
      _cell: mxCell,
      x: number,
      y: number
    ) => {
      // the mousepointer if there is one.
      const parent = graph.getDefaultParent()
      const model = graph.getModel()

      let v1 = null

      model.beginUpdate()
      try {
        // NOTE: For non-HTML labels the image must be displayed via the style
        // rather than the label markup, so use 'image=' + image for the style.
        // as follows: v1 = graph.insertVertex(parent, null, label,
        // pt.x, pt.y, 120, 120, 'image=' + image);
        v1 = graph.insertVertex(parent, null, label, x, y, 120, 120)
        v1.setConnectable(true)

        // Presets the collapsed size
        v1.geometry.alternateBounds = new this.mx.mxRectangle(0, 0, 120, 40)

        // Adds the ports at various relative locations
        let port = graph.insertVertex(
          v1,
          null,
          'Trigger',
          0,
          0.25,
          16,
          16,
          'port;image=editors/images/overlays/flash.png;align=right;imageAlign=right;spacingRight=18',
          true
        )
        port.geometry.offset = new this.mx.mxPoint(-6, -8)

        port = graph.insertVertex(
          v1,
          null,
          'Input',
          0,
          0.75,
          16,
          16,
          'port;image=editors/images/overlays/check.png;align=right;imageAlign=right;spacingRight=18',
          true
        )
        port.geometry.offset = new this.mx.mxPoint(-6, -4)

        port = graph.insertVertex(
          v1,
          null,
          'Error',
          1,
          0.25,
          16,
          16,
          'port;image=editors/images/overlays/error.png;spacingLeft=18',
          true
        )
        port.geometry.offset = new this.mx.mxPoint(-8, -8)

        port = graph.insertVertex(
          v1,
          null,
          'Result',
          1,
          0.75,
          16,
          16,
          'port;image=editors/images/overlays/information.png;spacingLeft=18',
          true
        )
        port.geometry.offset = new this.mx.mxPoint(-8, -4)
      } finally {
        this.setState({}, () => {})
        model.endUpdate()
      }

      graph.setSelectionCell(v1)
    }

    // Creates the image which is used as the sidebar icon (drag source)
    const img = document.createElement('img')
    img.setAttribute('src', image)
    img.style.width = '48px'
    img.style.height = '48px'
    img.title = 'Drag this to the diagram to create a new vertex'
    sidebar.appendChild(img)

    const dragElt = document.createElement('div')
    dragElt.style.border = 'dashed black 1px'
    dragElt.style.width = '120px'
    dragElt.style.height = '120px'

    // Creates the image which is used as the drag icon (preview)
    const ds = this.mxUtils.makeDraggable(
      img,
      graph,
      funct,
      dragElt,
      0,
      0,
      true,
      true
    )
    ds.setGuidesEnabled(true)
  }
  private addToolbarButton = () => {
    const toolbarIcons = [
      {
        actionName: 'groupOrUngroup',
        label: '(Un)group',
        imgSrc: 'images/group.png',
      },
      {
        actionName: 'delete',
        label: 'Delete',
        imgSrc: 'images/delete2.png',
      },
      {
        actionName: 'cut',
        label: 'Cut',
        imgSrc: 'images/cut.png',
      },
      {
        actionName: 'copy',
        label: 'Copy',
        imgSrc: 'images/copy.png',
      },
      {
        actionName: 'paste',
        label: 'Paste',
        imgSrc: 'images/paste.png',
      },
      {
        actionName: 'undo',
        label: 'Undo',
        imgSrc: 'images/undo.png',
      },
      {
        actionName: 'redo',
        label: 'Redo',
        imgSrc: 'images/redo.png',
      },
      {
        actionName: 'show',
        label: 'Show',
        imgSrc: 'images/camera.png',
      },
      {
        actionName: 'print',
        label: 'Print',
        imgSrc: 'images/printer.png',
      },
      {
        actionName: 'export',
        label: 'Export',
        imgSrc: 'images/export1.png',
      },
      {
        actionName: 'collapseAll',
        label: 'Collapse All',
        imgSrc: 'images/navigate_minus.png',
        isTransparent: true,
      },
      {
        actionName: 'expandAll',
        label: 'Expand All',
        imgSrc: 'images/navigate_plus.png',
        isTransparent: true,
      },
      {
        actionName: 'enterGroup',
        label: 'Enter',
        imgSrc: 'images/view_next.png',
        isTransparent: true,
      },
      {
        actionName: 'exitGroup',
        label: 'Exit',
        imgSrc: 'images/view_previous.png',
        isTransparent: true,
      },
      {
        actionName: 'zoomIn',
        label: 'Zoon in',
        imgSrc: 'images/zoom_in.png',
        isTransparent: true,
      },
      {
        actionName: 'zoomOut',
        label: 'Zoom out',
        imgSrc: 'images/zoom_out.png',
        isTransparent: true,
      },
      {
        actionName: 'actualSize',
        label: 'Actual size',
        imgSrc: 'images/view_1_1.png',
        isTransparent: true,
      },
      {
        actionName: 'fit',
        label: 'Fit',
        imgSrc: 'images/fit_to_size.png',
        isTransparent: true,
      },
    ]

    _.forEach(toolbarIcons, icon => {
      const {actionName, label, imgSrc, isTransparent} = icon
      this.addToolbarIcon(
        this.editor,
        this.toolbar,
        actionName,
        label,
        imgSrc,
        isTransparent
      )
    })
  }

  private addToolbarIcon = (
    editor: mxEditor,
    toolbar: HTMLElement,
    action: string,
    label: string,
    imageSrc: string,
    isTransparent?: boolean
  ) => {
    const button = document.createElement('button')
    button.style.fontSize = '10'
    button.classList.add('button')
    button.classList.add('button-default')
    button.classList.add('button-square')

    if (imageSrc != null) {
      const img = document.createElement('img')
      img.setAttribute('src', imageSrc)
      img.style.width = '16px'
      img.style.height = '16px'
      img.style.verticalAlign = 'middle'
      img.style.marginRight = '2px'
      // button.appendChild(img)
    }
    if (isTransparent) {
      button.style.background = 'transparent'
      button.style.color = '#FFFFFF'
      button.style.border = 'none'
    }
    this.mxEvent.addListener(button, 'click', function() {
      editor.execute(action)
    })

    this.mxUtils.write(button, label)
    toolbar.appendChild(button)
  }

  private addSidebarButton = () => {
    const tools = [
      {
        htmlString:
          '<h1 style="margin:0px;">Website</h1><br>' +
          `<img src='./' width="48" height="48">` +
          '<br>' +
          '<a href="http://www.jgraph.com" target="_blank">Browse</a>',
        imgSrc: './*.png',
      },
    ]

    _.forEach(tools, tool => {
      const {htmlString, imgSrc} = tool
      this.addSidebarIcon(this.graph, this.sidebar, htmlString, imgSrc)
    })
  }

  private topologyEditor = () => {
    const graph = this.graph
    this.addSidebarButton()
    this.addToolbarButton()

    // To show the images in the outline, uncomment the following code
    const outln = new this.mx.mxOutline(graph, this.outline)

    // To show the images in the outline, uncomment the following code
    outln.outline.labelsVisible = true
    outln.outline.setHtmlLabels(true)
  }

  private get sidebarDivisions() {
    const {sidebarProportions, hostList} = this.state
    const [topSize, middleSize, bottomSize] = sidebarProportions

    return [
      {
        name: 'Host',
        headerOrientation: HANDLE_HORIZONTAL,
        headerButtons: [],
        menuOptions: [],
        size: topSize,
        render: () => <HostList hostList={hostList} />,
      },
      {
        name: 'Tools',
        headerOrientation: HANDLE_HORIZONTAL,
        headerButtons: [],
        menuOptions: [],
        size: middleSize,
        render: () => (
          <div ref={this.sidebarRef}>
            <img src="./" />
          </div>
        ),
      },
      {
        name: 'Properties',
        headerOrientation: HANDLE_HORIZONTAL,
        headerButtons: [],
        menuOptions: [],
        size: bottomSize,
        render: () => {
          return <>this is Properties area</>
          // return <Properties />
        },
      },
    ]
  }

  private get threesizerDivisions() {
    const {screenProportions} = this.state
    const [leftSize, rightSize] = screenProportions

    // 함수가 실행될 곳

    return [
      {
        name: '',
        handleDisplay: HANDLE_NONE,
        headerButtons: [],
        menuOptions: [],
        size: leftSize,
        render: () => (
          <Threesizer
            orientation={HANDLE_HORIZONTAL}
            divisions={this.sidebarDivisions}
            onResize={this.handleResize('sidebarProportions')}
          />
        ),
      },
      {
        name: '',
        headerOrientation: HANDLE_VERTICAL,
        headerButtons: [],
        menuOptions: [],
        size: rightSize,
        render: () => {
          return (
            <>
              <div id="contentHeaderSection">
                <div id="toolbarContainer" ref={this.toolbarRef}></div>
              </div>
              <div id="contentBodySection">
                <div id="graphContainer" ref={this.containerRef}>
                  <div id="outlineContainer" ref={this.outlineRef}></div>
                </div>
              </div>
            </>
          )
        },
      },
    ]
  }

  private setting = () => {
    const {
      mxEditor,
      mxGuide,
      mxDivResizer,
      mxEdgeHandler,
      mxEvent,
      mxGraphHandler,
      mxConstants,
      mxUtils,
      mxClient,
    } = this.mx

    this.editor = new mxEditor()
    this.mxUtils = mxUtils
    this.mxConstants = mxConstants
    this.mxGraphHandler = mxGraphHandler
    this.mxGuide = mxGuide
    this.mxEvent = mxEvent
    this.mxEdgeHandler = mxEdgeHandler
    this.mxClient = mxClient
    this.mxDivResizer = mxDivResizer

    this.graph = this.editor.graph
    // this.model = this.graph.getModel()

    this.addEditorAction(this.editor, this.graph)

    this.container = this.containerRef.current
    this.outline = this.outlineRef.current
    this.sidebar = this.sidebarRef.current
    this.toolbar = this.toolbarRef.current

    // Assigns some global constants for general behaviour, eg. minimum
    // size (in pixels) of the active region for triggering creation of
    // new connections, the portion (100%) of the cell area to be used
    // for triggering new connections, as well as some fading options for
    // windows and the rubberband selection.
    this.mxConstants.MIN_HOTSPOT_SIZE = 16
    this.mxConstants.DEFAULT_HOTSPOT = 1

    // Enables guides
    this.mxGraphHandler.prototype.guidesEnabled = true

    // Alt disables guides
    this.mxGuide.prototype.isEnabledForEvent = (evt: MouseEvent) => {
      return !this.mxEvent.isAltDown(evt)
    }

    // Enables snapping waypoints to terminals
    this.mxEdgeHandler.prototype.snapToTerminals = true

    // Workaround for Internet Explorer ignoring certain CSS directives
    if (this.mxClient.IS_QUIRKS) {
      document.body.style.overflow = 'hidden'
      new this.mxDivResizer(this.container)
      new this.mxDivResizer(this.outline)
      // new this.mxDivResizer(toolbar)
      new this.mxDivResizer(this.sidebar)
      // new this.mxDivResizer(status)
    }

    // Disable highlight of cells when dragging from toolbar
    this.graph.setDropEnabled(false)

    // Uses the port icon while connections are previewed
    this.graph.connectionHandler.getConnectImage = state => {
      return new this.mx.mxImage(
        state.style[this.mxConstants.STYLE_IMAGE],
        16,
        16
      )
    }

    // Centers the port icon on the target port
    this.graph.connectionHandler.targetConnectImage = true

    // Does not allow dangling edges
    this.graph.setAllowDanglingEdges(false)

    // Sets the graph container and configures the editor
    this.editor.setGraphContainer(this.container)
    // const config = this.mxUtils
    //   .load('/config/keyhandler-commons.xml')
    //   .getDocumentElement()
    // this.editor.configure(config)

    // Defines the default group to be used for grouping. The
    // default group is a field in the mxEditor instance that
    // is supposed to be a cell which is cloned for new cells.
    // The groupBorderSize is used to define the spacing between
    // the children of a group and the group bounds.
    const group = new this.mx.mxCell('Group', new this.mx.mxGeometry(), 'group')
    group.setVertex(true)
    group.setConnectable(false)
    this.editor.defaultGroup = group
    this.editor.groupBorderSize = 20

    // Disables drag-and-drop into non-swimlanes.
    this.graph.isValidDropTarget = function(cell) {
      return this.isSwimlane(cell)
    }

    // Disables drilling into non-swimlanes.
    this.graph.isValidRoot = function(cell) {
      return this.isValidDropTarget(cell)
    }

    // Does not allow selection of locked cells
    this.graph.isCellSelectable = function(cell) {
      return !this.isCellLocked(cell)
    }

    // Enables new connections
    this.graph.setConnectable(true)
  }

  private addEditorAction = (editor: mxEditor, graph?: mxGraph) => {
    // Defines a new action for deleting or ungrouping
    editor.addAction('groupOrUngroup', function(
      editor: mxEditor,
      cell: mxCell
    ) {
      cell = cell || editor.graph.getSelectionCell()
      if (cell != null && editor.graph.isSwimlane(cell)) {
        editor.execute('ungroup', cell)
      } else {
        editor.execute('group')
      }
    })

    // Defines a new export action
    editor.addAction('export', (editor: mxEditor) => {
      const textarea = document.createElement('textarea')
      textarea.style.width = '400px'
      textarea.style.height = '400px'

      const enc = new this.mx.mxCodec(this.mxUtils.createXmlDocument())
      console.log('enc:', enc)
      const node = enc.encode(editor.graph.getModel())
      console.log('get Model: ', editor.graph.getModel())
      console.log('node: ', node)

      // @ts-ignore
      textarea.value = this.mxUtils.getPrettyXml(node)
      this.showModalWindow(graph, 'XML', textarea, 410, 440)
    })
  }

  private showModalWindow = (
    graph: mxGraph,
    title: string,
    content: HTMLTextAreaElement,
    width: number,
    height: number
  ) => {
    const background = document.createElement('div')
    background.style.position = 'absolute'
    background.style.left = '0px'
    background.style.top = '0px'
    background.style.right = '0px'
    background.style.bottom = '0px'
    background.style.background = 'black'
    this.mxUtils.setOpacity(background, 50)
    this.container.appendChild(background)

    if (this.mxClient.IS_IE) {
      new this.mxDivResizer(background)
    }

    const x = Math.max(0, document.body.scrollWidth / 2 - width / 2)
    const y = Math.max(
      10,
      (document.body.scrollHeight || document.documentElement.scrollHeight) /
        2 -
        (height * 2) / 3
    )
    const wnd = new this.mx.mxWindow(
      title,
      content,
      x,
      y,
      width,
      height,
      false,
      true
    )
    wnd.setClosable(true)

    // Fades the background out after after the window has been closed
    wnd.addListener(this.mx.mxEvent.DESTROY, () => {
      graph.setEnabled(true)
      this.mx.mxEffects.fadeOut(background, 50, true, 10, 30, true)
    })

    graph.setEnabled(false)
    graph.tooltipHandler.hide()
    wnd.setVisible(true)
  }
}

export default connect(null, null)(InventoryTopology)
