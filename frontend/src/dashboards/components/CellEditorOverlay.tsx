// Libraries
import React, {Component} from 'react'
import _ from 'lodash'

// Components
import {ErrorHandling} from 'src/shared/decorators/errors'
import TimeMachine from 'src/shared/components/TimeMachine/TimeMachine'
import CEOHeader from 'src/dashboards/components/CEOHeader'

// Utils
import {getDeep} from 'src/utils/wrappers'
import {
  TimeMachineContainer,
  TimeMachineContextConsumer,
} from 'src/shared/utils/TimeMachineContext'
import {initialStateFromCell} from 'src/shared/utils/timeMachine'

// Actions
import {editCellQueryStatus} from 'src/dashboards/actions'

// Constants
import {getCellTypeColors} from 'src/dashboards/constants/cellEditor'
import {
  GET_STATIC_LEGEND_POSITION,
  IS_STATIC_LEGEND,
} from 'src/shared/constants'
import {STATIC_LEGEND} from 'src/dashboards/constants/cellEditor'

// Types
import * as QueriesModels from 'src/types/queries'
import * as SourcesModels from 'src/types/sources'
import {
  NotificationAction,
  TimeRange,
  RefreshRate,
  CellType,
  Me,
} from 'src/types'
import {Template} from 'src/types/tempVars'
import {
  Cell,
  Legend,
  CellQuery,
  NewDefaultCell,
  QueryType,
  DecimalPlaces,
  FieldOption,
  ThresholdType,
  TableOptions,
  NoteVisibility,
  Axes,
  StaticLegendPositionType,
} from 'src/types/dashboards'
import {Links, ScriptStatus} from 'src/types/flux'
import {ColorString, ColorNumber} from 'src/types/colors'
import {createTimeRangeTemplates} from 'src/shared/utils/templates'

interface ConnectedProps {
  queryType: QueryType
  queryDrafts: CellQuery[]
  script: string
  draftScript: string
  onChangeScript: (script: string) => void
  type: CellType
  axes: Axes | null
  tableOptions: TableOptions
  fieldOptions: FieldOption[]
  timeFormat: string
  decimalPlaces: DecimalPlaces
  note: string
  noteVisibility: NoteVisibility
  thresholdsListColors: ColorNumber[]
  thresholdsListType: ThresholdType
  gaugeColors: ColorNumber[]
  lineColors: ColorString[]
  onResetTimeMachine: TimeMachineContainer['reset']
  ceoTimeRange: TimeRange
}

interface PassedProps {
  fluxLinks: Links
  sources: SourcesModels.Source[]
  notify: NotificationAction
  editQueryStatus: typeof editCellQueryStatus
  onCancel: () => void
  onSave: (cell: Cell | NewDefaultCell) => void
  source: SourcesModels.Source
  dashboardID: string
  queryStatus: QueriesModels.QueryStatus
  dashboardTemplates: Template[]
  cell: Cell | NewDefaultCell
  dashboardTimeRange: TimeRange
  dashboardRefresh: RefreshRate
}

interface Auth {
  me: Me
  isUsingAuth: boolean
}

type Props = PassedProps & ConnectedProps & Auth

interface State {
  isStaticLegend: boolean
  scriptStatus: ScriptStatus
  draftCellName: string
  staticLegendPosition: StaticLegendPositionType
}

@ErrorHandling
class CellEditorOverlay extends Component<Props, State> {
  private overlayRef: React.RefObject<HTMLDivElement> = React.createRef()

  public constructor(props: Props) {
    super(props)

    const legend = getDeep<Legend | null>(props, 'cell.legend', null)

    this.state = {
      isStaticLegend: IS_STATIC_LEGEND(legend),
      scriptStatus: {type: 'none', text: ''},
      draftCellName: props.cell.name,
      staticLegendPosition: GET_STATIC_LEGEND_POSITION(legend),
    }
  }

  public componentDidMount() {
    const {
      cell,
      dashboardRefresh,
      dashboardTimeRange,
      onResetTimeMachine,
    } = this.props

    const initialState = {
      ...initialStateFromCell(cell),
      timeRange: dashboardTimeRange,
      refresh: dashboardRefresh,
    }

    onResetTimeMachine(initialState)

    this.handleResetFocus()
  }

  public render() {
    const {
      cell,
      editQueryStatus,
      fluxLinks,
      notify,
      source,
      sources,
      queryStatus,
      me,
      isUsingAuth,
      dashboardRefresh,
    } = this.props

    const {isStaticLegend, staticLegendPosition} = this.state

    return (
      <div
        className="deceo--overlay"
        onKeyDown={this.handleKeyDown}
        tabIndex={0}
        ref={this.overlayRef}
      >
        <TimeMachine
          notify={notify}
          source={source}
          isInCEO={true}
          sources={sources}
          fluxLinks={fluxLinks}
          templates={this.ceoTemplates}
          editQueryStatus={editQueryStatus}
          onResetFocus={this.handleResetFocus}
          onToggleStaticLegend={this.handleToggleStaticLegend}
          onToggleStaticLegendPosition={this.handleToggleStaticLegendPosition}
          isStaticLegend={isStaticLegend}
          staticLegendPosition={staticLegendPosition}
          queryStatus={queryStatus}
          onUpdateScriptStatus={this.handleUpdateScriptStatus}
          me={me}
          isUsingAuth={isUsingAuth}
          refresh={dashboardRefresh}
        >
          {(activeEditorTab, onSetActiveEditorTab) => (
            <CEOHeader
              title={_.get(cell, 'name', '')}
              renameCell={this.handleRenameCell}
              onSave={this.handleSaveCell}
              onCancel={this.handleCancel}
              activeEditorTab={activeEditorTab}
              onSetActiveEditorTab={onSetActiveEditorTab}
              isSaveable={this.isSaveable}
            />
          )}
        </TimeMachine>
      </div>
    )
  }

  private get ceoTemplates() {
    const {dashboardTemplates, ceoTimeRange} = this.props
    const {dashboardTime, upperDashboardTime} = createTimeRangeTemplates(
      ceoTimeRange
    )
    return [...dashboardTemplates, dashboardTime, upperDashboardTime]
  }

  private get isSaveable(): boolean {
    const {queryDrafts, type} = this.props

    if (type === 'note' || this.isFluxQuery) {
      return true
    }

    return queryDrafts.every(queryDraft => {
      const queryConfig = getDeep<QueriesModels.QueryConfig | null>(
        queryDraft,
        'queryConfig',
        null
      )

      return (
        (!!queryConfig.measurement &&
          !!queryConfig.database &&
          !!queryConfig.fields.length) ||
        !!queryConfig.rawText
      )
    })
  }

  private get isFluxQuery(): boolean {
    const {queryType} = this.props

    return queryType === QueryType.Flux
  }

  private handleUpdateScriptStatus = (scriptStatus: ScriptStatus): void => {
    this.setState({scriptStatus})
  }

  private handleRenameCell = (draftCellName: string): void => {
    this.setState({draftCellName})
  }

  private collectCell = (): Cell | NewDefaultCell => {
    const {
      cell,
      draftScript,
      queryDrafts,
      type,
      axes,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
      thresholdsListColors,
      gaugeColors,
      lineColors,
    } = this.props
    const {isStaticLegend, staticLegendPosition, draftCellName} = this.state

    let queries: CellQuery[] = queryDrafts

    if (this.isFluxQuery) {
      queries = [
        {
          query: draftScript,
          queryConfig: null,
          source: getDeep<string>(queryDrafts, '0.source', ''),
          type: QueryType.Flux,
        },
      ]
    }

    const colors = getCellTypeColors({
      cellType: type,
      gaugeColors,
      thresholdsListColors,
      lineColors,
    })

    const newCell = {
      ...cell,
      name: draftCellName,
      queries,
      colors,
      axes,
      tableOptions,
      fieldOptions,
      timeFormat,
      decimalPlaces,
      note,
      noteVisibility,
      type,
      legend: isStaticLegend
        ? {...STATIC_LEGEND, orientation: staticLegendPosition}
        : {orientation: staticLegendPosition},
    }

    return newCell
  }

  private handleSaveCell = () => {
    const {onSave, onResetTimeMachine} = this.props
    const cell = this.collectCell()

    onSave(cell)
    onResetTimeMachine()
  }

  private handleCancel = () => {
    const {onCancel, onResetTimeMachine} = this.props

    onCancel()
    onResetTimeMachine()
  }

  private handleKeyDown = e => {
    switch (e.key) {
      case 'Enter':
        if (!e.metaKey) {
          return
        } else if (e.target === this.overlayRef) {
          this.handleSaveCell()
        } else {
          e.target.blur()
          setTimeout(this.handleSaveCell, 50)
        }
        break
      case 'Escape':
        if (e.target === this.overlayRef) {
          this.props.onCancel()
        } else {
          const targetIsDropdown = e.target.classList[0] === 'dropdown'
          const targetIsButton = e.target.tagName === 'BUTTON'

          if (targetIsDropdown || targetIsButton) {
            return this.props.onCancel()
          }

          e.target.blur()
          this.handleResetFocus()
        }
        break
    }
  }

  private handleToggleStaticLegendPosition = (
    staticLegendPosition: StaticLegendPositionType
  ): void => {
    this.setState({staticLegendPosition})
  }

  private handleToggleStaticLegend = (isStaticLegend: boolean): void => {
    this.setState({isStaticLegend})
  }

  private handleResetFocus = () => {
    if (this.overlayRef.current) {
      this.overlayRef.current.focus()
    }
  }
}

const ConnectedCellEditorOverlay = (props: PassedProps & Auth) => {
  return (
    <TimeMachineContextConsumer>
      {(container: TimeMachineContainer) => {
        const {state} = container
        return (
          <CellEditorOverlay
            {...props}
            queryType={state.queryType}
            queryDrafts={state.queryDrafts}
            script={state.script}
            draftScript={state.draftScript}
            onChangeScript={container.handleChangeScript}
            type={state.type}
            axes={state.axes}
            tableOptions={state.tableOptions}
            fieldOptions={state.fieldOptions}
            timeFormat={state.timeFormat}
            decimalPlaces={state.decimalPlaces}
            note={state.note}
            noteVisibility={state.noteVisibility}
            thresholdsListColors={state.thresholdsListColors}
            thresholdsListType={state.thresholdsListType}
            gaugeColors={state.gaugeColors}
            lineColors={state.lineColors}
            onResetTimeMachine={container.reset}
            ceoTimeRange={state.timeRange}
          />
        )
      }}
    </TimeMachineContextConsumer>
  )
}

export default ConnectedCellEditorOverlay
