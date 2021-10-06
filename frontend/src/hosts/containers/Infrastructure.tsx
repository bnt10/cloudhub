// Libraries
import React, {PureComponent} from 'react'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'
import _ from 'lodash'

// Components
import AutoRefreshDropdown from 'src/shared/components/dropdown_auto_refresh/AutoRefreshDropdown'
import ManualRefresh, {
  ManualRefreshProps,
} from 'src/shared/components/ManualRefresh'
import {Button, ButtonShape, IconFont, Page, Radio} from 'src/reusable_ui'
import {ErrorHandling} from 'src/shared/decorators/errors'
import TimeRangeDropdown from 'src/shared/components/TimeRangeDropdown'
import GraphTips from 'src/shared/components/GraphTips'

import HostsPage from 'src/hosts/containers/HostsPage'
import VMHostPage from 'src/hosts/containers/VMHostsPage'
import InventoryTopology from 'src/hosts/containers/InventoryTopology'

// APIs
import {
  getCpuAndLoadForHosts,
  getLayouts,
  getAppsForHosts,
  getAppsForHost,
  getMeasurementsForHost,
  getCpuAndLoadForInstances,
  getAppsForInstances,
  paramsCreateCSP,
  paramsUpdateCSP,
  getAppsForInstance,
  getMeasurementsForInstance,
} from 'src/hosts/apis'
import {getEnv} from 'src/shared/apis/env'

// Actions
import {
  setAutoRefresh,
  delayEnablePresentationMode,
} from 'src/shared/actions/app'
import {notify as notifyAction} from 'src/shared/actions/notifications'

// Constants
import {
  notifyUnableToGetHosts,
  notifyUnableToGetApps,
} from 'src/shared/copy/notifications'
import {AddonType} from 'src/shared/constants'

// Types
import {Source, Links, TimeRange, RefreshRate, Layout} from 'src/types'
import {timeRanges} from 'src/shared/data/timeRanges'
import * as QueriesModels from 'src/types/queries'
import * as AppActions from 'src/types/actions/app'

import {
  loadCloudServiceProvidersAsync,
  getAWSInstancesAsync,
} from 'src/hosts/actions'

// Utils
import {generateForHosts} from 'src/utils/tempVars'
import {getDeep} from 'src/utils/wrappers'

interface Props extends ManualRefreshProps {
  source: Source
  links: Links
  autoRefresh: number
  inPresentationMode: boolean
  notify: NotificationAction
  onChooseAutoRefresh: (milliseconds: RefreshRate) => void
  handleClearTimeout: (key: string) => void
  handleClickPresentationButton: AppActions.DelayEnablePresentationModeDispatcher
  handleChooseAutoRefresh: AppActions.SetAutoRefreshActionCreator
}

interface State {
  timeRange: TimeRange
  activeTab: string
  // selected: QueriesModels.TimeRange
  isUsingVsphere: boolean
}

@ErrorHandling
class Infrastructure extends PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      timeRange: timeRanges.find(tr => tr.lower === 'now() - 1h'),
      // selected: {lower: '', upper: ''},
      activeTab: 'InventoryTopology',
      isUsingVsphere: false,
    }
  }

  public handleChooseAutoRefresh(option) {
    const {onChooseAutoRefresh} = this.props
    const {milliseconds} = option
    onChooseAutoRefresh(milliseconds)
  }

  public async componentDidMount() {
    const layoutResults = await getLayouts()
    const layouts = getDeep<Layout[]>(layoutResults, 'data.layouts', [])
    if (layouts) {
      await this.fetchHostsData(layouts)
    } else {
      return
    }
  }
  public async componentDidUpdate() {}

  public render() {
    const {
      autoRefresh,
      manualRefresh,
      onManualRefresh,
      inPresentationMode,
      source,
      handleClearTimeout,
    } = this.props
    const {isUsingVsphere, activeTab, timeRange} = this.state

    return (
      <Page className="hosts-list-page">
        <Page.Header inPresentationMode={inPresentationMode}>
          <Page.Header.Left>
            <Page.Title title={'Infrastructure'} />
          </Page.Header.Left>
          <Page.Header.Center widthPixels={220}>
            <div className="radio-buttons radio-buttons--default radio-buttons--sm radio-buttons--stretch">
              <Radio.Button
                id="hostspage-tab-InventoryTopology"
                titleText="InventoryTopology"
                value="InventoryTopology"
                active={activeTab === 'InventoryTopology'}
                onClick={this.onChooseActiveTab}
              >
                Topology
              </Radio.Button>
              <Radio.Button
                id="hostspage-tab-Host"
                titleText="Host"
                value="Host"
                active={activeTab === 'Host'}
                onClick={this.onChooseActiveTab}
              >
                Host
              </Radio.Button>
              {isUsingVsphere && (
                <Radio.Button
                  id="hostspage-tab-VMware"
                  titleText="VMware"
                  value="VMware"
                  active={activeTab === 'VMware'}
                  onClick={this.onChooseActiveTab}
                >
                  VMware
                </Radio.Button>
              )}
            </div>
          </Page.Header.Center>

          <Page.Header.Right showSourceIndicator={true}>
            {activeTab !== 'InventoryTopology' && <GraphTips />}
            <AutoRefreshDropdown
              selected={autoRefresh}
              onChoose={this.handleChooseAutoRefresh}
              onManualRefresh={onManualRefresh}
            />
            {/* {activeTab !== 'InventoryTopology' && (
              <TimeRangeDropdown
                //@ts-ignore
                onChooseTimeRange={this.handleChooseTimeRange.bind(selected)}
                selected={selected}
              />
            )} */}
            <TimeRangeDropdown
              //@ts-ignore
              onChooseTimeRange={timeRange => {
                console.log('timeRange: ', timeRange)
                this.handleChooseTimeRange(timeRange)
              }}
              selected={timeRange}
            />
            <Button
              icon={IconFont.ExpandA}
              onClick={this.handleClickPresentationButton}
              shape={ButtonShape.Square}
              titleText="Enter Full-Screen Presentation Mode"
            />
          </Page.Header.Right>
        </Page.Header>
        <Page.Contents scrollable={true} fullWidth={activeTab !== 'Host'}>
          <>
            {activeTab === 'Host' && (
              //@ts-ignore
              <HostsPage
                {...this.props}
                // this
                // auth={this.prop
                // thiss.auth}
                // source={source}
                // this
                // manualRefresh={manual
                // thisRefresh}
                // timeRange={timeRange}
              />
            )}
            {activeTab === 'VMware' && (
              //@ts-ignore
              <VMHostPage
                source={source}
                manualRefresh={manualRefresh}
                timeRange={timeRange}
                handleClearTimeout={handleClearTimeout}
              />
            )}
            {activeTab === 'InventoryTopology' && (
              //@ts-ignore
              <InventoryTopology
                source={source}
                manualRefresh={manualRefresh}
                autoRefresh={autoRefresh}
              />
            )}
          </>
        </Page.Contents>
      </Page>
    )
  }

  private handleChooseTimeRange = ({lower, upper}) => {
    if (upper) {
      this.setState({timeRange: {lower, upper}})
    } else {
      const timeRange = timeRanges.find(range => range.lower === lower)
      this.setState({timeRange})
    }
  }

  private handleClickPresentationButton = (): void => {
    this.props.handleClickPresentationButton()
  }

  private onChooseActiveTab = (activeTab: string): void => {
    this.setState({
      activeTab,
    })
  }

  private fetchHostsData = async (layouts: Layout[]): Promise<void> => {
    const {source, links, notify} = this.props
    const {addons} = links

    const envVars = await getEnv(links.environment)
    const telegrafSystemInterval = getDeep<string>(
      envVars,
      'telegrafSystemInterval',
      ''
    )

    const hostsError = notifyUnableToGetHosts().message
    const tempVars = generateForHosts(source)

    try {
      const hostsObject = await getCpuAndLoadForHosts(
        source.links.proxy,
        source.telegraf,
        telegrafSystemInterval,
        tempVars
      )
      if (!hostsObject) {
        throw new Error(hostsError)
      }

      const newHosts = await getAppsForHosts(
        source.links.proxy,
        hostsObject,
        layouts,
        source.telegraf,
        tempVars
      )

      const isUsingVsphere = Boolean(
        _.find(addons, addon => {
          return addon.name === 'vsphere' && addon.url === 'on'
        }) &&
          _.find(newHosts, v => {
            return _.includes(v.apps, 'vsphere')
          })
      )

      this.setState({
        isUsingVsphere,
      })
    } catch (error) {
      console.error(error)
      //   notify(notifyUnableToGetHosts())
      this.setState({
        isUsingVsphere: false,
      })
    }
  }
}

const mstp = state => {
  const {
    app: {
      persisted: {autoRefresh},
      ephemeral: {inPresentationMode},
    },
    links,
  } = state
  return {
    links,
    autoRefresh,
    inPresentationMode,
  }
}

const mdtp = dispatch => ({
  onChooseAutoRefresh: bindActionCreators(setAutoRefresh, dispatch),
  handleClickPresentationButton: bindActionCreators(
    delayEnablePresentationMode,
    dispatch
  ),
  notify: bindActionCreators(notifyAction, dispatch),
  handleLoadCspsAsync: bindActionCreators(
    loadCloudServiceProvidersAsync,
    dispatch
  ),
  handleGetAWSInstancesAsync: bindActionCreators(
    getAWSInstancesAsync,
    dispatch
  ),
})

export default connect(mstp, mdtp, null)(ManualRefresh<Props>(Infrastructure))
