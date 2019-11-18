import React, {PureComponent} from 'react'
import _ from 'lodash'

// Components
import Threesizer from 'src/shared/components/threesizer/Threesizer'
import AgentConfigurationTable from 'src/agent_admin/components/AgentConfigurationTable'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import FluxEditor from 'src/flux/components/FluxEditor'
import AgentToolbarFunction from 'src/agent_admin/components/AgentToolbarFunction'

import {ErrorHandling} from 'src/shared/decorators/errors'

// APIs
import {
  getMinionAcceptKeyListAll,
  getMinionsIP,
  getMinionsOS,
  getTelegrafInstalled,
  getTelegrafServiceStatus,
  runLocalServiceStartTelegraf,
  runLocalServiceStopTelegraf,
} from 'src/agent_admin/apis'

//const
import {HANDLE_HORIZONTAL, HANDLE_VERTICAL} from 'src/shared/constants'

// Types
import {Minion} from 'src/types'
interface Props {
  currentUrl: string
}

interface State {
  // minions: Readonly<[]>
  MinionsObject: {[x: string]: Minion}
  // proportions: number[]
  measurements: string[]
  horizontalProportions: number[]
  verticalProportions: number[]
  focusedMeasure: Readonly<{}>
  focusedMeasurePosition: Readonly<{}>
  refresh: boolean
}

@ErrorHandling
class AgentConfiguration extends PureComponent<Props, State> {
  constructor(props) {
    super(props)
    this.state = {
      MinionsObject: {},
      measurements: [],
      horizontalProportions: [0.43, 0.57],
      verticalProportions: [0.43, 0.57],
      //suggestions: [],
      //draftScriptStatus: {type: 'none', text: ''},
      //isWizardActive: false,
      focusedMeasure: '',
      focusedMeasurePosition: {},
      refresh: false,
    }

    this.measurementsTemp = this.measurementsTemp.bind(this)
  }

  getWheelKeyListAll = async () => {
    const response = await getMinionAcceptKeyListAll()

    const updateMinionsIP = await getMinionsIP(response)

    const updateMinionsOS = await getMinionsOS(updateMinionsIP)

    //this.setState({MinionsObject: updateMinionsOS})

    const updateInstalled = await getTelegrafInstalled(updateMinionsOS)

    //this.setState({MinionsObject: updateInstalled})

    const updateServiceStatus = await getTelegrafServiceStatus(updateInstalled)

    this.setState({MinionsObject: updateServiceStatus})
  }

  // public onClickTableRowCall() {
  //   console.log('row Called', this)
  // }

  onClickTableRowCall = (host: string) => () => {
    this.setState({
      measurements: [
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
        'tomcat',
      ],
    })
  }

  public onClickActionCall = (host: string, isRunning: boolean) => () => {
    if (isRunning === false) {
      const getLocalServiceStartTelegrafPromise = runLocalServiceStartTelegraf(
        host
      )

      getLocalServiceStartTelegrafPromise.then(
        pLocalServiceStartTelegrafData => {
          console.log(pLocalServiceStartTelegrafData)
          // this.setState({
          //   minionLog: JSON.stringify(
          //     pLocalServiceStartTelegrafData.data.return[0],
          //     null,
          //     4
          //   ),
          // })
          this.getWheelKeyListAll()
        }
      )
    } else {
      const getLocalServiceStopTelegrafPromise = runLocalServiceStopTelegraf(
        host
      )

      getLocalServiceStopTelegrafPromise.then(pLocalServiceStopTelegrafData => {
        console.log(pLocalServiceStopTelegrafData)
        // this.setState({
        //   minionLog: JSON.stringify(
        //     pLocalServiceStopTelegrafData.data.return[0],
        //     null,
        //     4
        //   ),
        // })
        this.getWheelKeyListAll()
      })
    }
    // return console.log('action Called', host, isRunning)
  }

  public onClickSaveCall() {
    return console.log('Save Called', this)
  }

  public onClickTestCall() {
    return console.log('Test Called', this)
  }

  public onClickApplyCall() {
    return console.log('Apply Called', this)
  }

  // public componentDidMount() {
  //   this.setState({
  //     measurements: [
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //       'tomcat',
  //     ],
  //   })
  // }

  public async componentDidMount() {
    this.getWheelKeyListAll()

    console.debug('componentDidMount')
  }

  render() {
    const {isUserAuthorized} = this.props
    return (
      <>
        {isUserAuthorized ? (
          <div className="panel panel-solid">
            <Threesizer
              orientation={HANDLE_HORIZONTAL}
              divisions={this.horizontalDivisions}
              onResize={this.horizontalHandleResize}
            />
          </div>
        ) : (
          <div
            className="generic-empty-state"
            style={{backgroundColor: '#292933'}}
          >
            <h4>Not Allowed User</h4>
          </div>
        )}
      </>
    )
  }

  private handleFocusedMeasure = ({clickPosition, refresh}) => {
    if (clickPosition) {
      this.setState({
        focusedMeasure: event.target,
        focusedMeasurePosition: clickPosition,
        refresh: true,
      })
    }

    if (refresh === false) {
      this.setState({
        refresh,
      })
      return
    }
  }

  private horizontalHandleResize = (horizontalProportions: number[]) => {
    this.setState({horizontalProportions})
  }

  private verticalHandleResize = (verticalProportions: number[]) => {
    this.setState({verticalProportions})
  }

  private renderAgentPageTop = () => {
    const {MinionsObject} = this.state

    return (
      <AgentConfigurationTable
        minions={_.values(MinionsObject)}
        onClickTableRow={this.onClickTableRowCall}
        onClickAction={this.onClickActionCall}
      />
    )
  }

  private renderAgentPageBottom = () => {
    return (
      <Threesizer
        orientation={HANDLE_VERTICAL}
        divisions={this.verticalDivisions}
        onResize={this.verticalHandleResize}
      />
    )
  }

  private measurementsTemp() {
    const {
      measurements,
      focusedMeasure,
      focusedMeasurePosition,
      refresh,
    } = this.state
    return (
      <div className="panel">
        <div className="panel-heading">
          <h2
            className="panel-title"
            style={{
              width: '100%',
            }}
          >
            measurements
            <div
              style={{
                color: '#f58220',
                fontSize: '12px',
                background: '#232323',
                padding: '10px',
                margin: '5px 0px',
                width: '100%',
              }}
            >
              host1-minion1-192.168.0.1
            </div>
          </h2>
        </div>
        <div className="panel-body">
          <FancyScrollbar>
            <div className="query-builder--list">
              {measurements.map((v, i) => {
                return (
                  <AgentToolbarFunction
                    name={v}
                    key={i}
                    idx={i}
                    handleFocusedMeasure={this.handleFocusedMeasure.bind(this)}
                    focusedMeasure={focusedMeasure}
                    focusedPosition={focusedMeasurePosition}
                    refresh={refresh}
                  />
                )
              })}
            </div>
          </FancyScrollbar>
        </div>
      </div>
    )
  }

  private collectorConfigTemp() {
    return (
      <div className="panel">
        <div className="panel-heading">
          <h2 className="panel-title">collector.conf</h2>
          <div>
            <button
              className="btn btn-inline_block btn-default"
              style={{
                marginLeft: '5px',
              }}
              onClick={this.onClickApplyCall}
            >
              APPLY
            </button>
          </div>
        </div>

        <div className="panel-body">
          <div
            style={{
              width: '100%',
              height: '100%',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <FluxEditor
              status={{type: 'none', text: ''}}
              script={'string'}
              visibility={true}
              // suggestions={suggestions}
              // onChangeScript={this.handleChangeDraftScript}
              // onSubmitScript={this.handleSubmitScript}
              // onShowWizard={this.handleShowWizard}
              // onCursorChange={this.handleCursorPosition}
            />
          </div>
        </div>
      </div>
    )
  }

  private get horizontalDivisions() {
    const {horizontalProportions} = this.state
    const [topSize, bottomSize] = horizontalProportions

    return [
      {
        name: '',
        handleDisplay: 'none',
        headerButtons: [],
        menuOptions: [],
        render: this.renderAgentPageTop,
        headerOrientation: HANDLE_HORIZONTAL,
        size: topSize,
      },
      {
        name: '',
        handlePixels: 8,
        headerButtons: [],
        menuOptions: [],
        render: this.renderAgentPageBottom,
        headerOrientation: HANDLE_HORIZONTAL,
        size: bottomSize,
      },
    ]
  }

  private get verticalDivisions() {
    const {verticalProportions} = this.state
    const [rightSize, leftSize] = verticalProportions

    return [
      {
        name: '',
        handleDisplay: 'none',
        headerButtons: [],
        menuOptions: [],
        render: this.measurementsTemp,
        headerOrientation: HANDLE_VERTICAL,
        size: rightSize,
      },
      {
        name: '',
        handlePixels: 8,
        headerButtons: [],
        menuOptions: [],
        render: this.collectorConfigTemp.bind(this),
        headerOrientation: HANDLE_VERTICAL,
        size: leftSize,
      },
    ]
  }
}

export default AgentConfiguration
