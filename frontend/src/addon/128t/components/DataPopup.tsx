// Libraries
import React, {PureComponent, MouseEvent, CSSProperties, createRef} from 'react'

// Components
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import OncueServiceTable from 'src/addon/128t/components/OncueServiceTable'
import ProtocolModulesTable from 'src/addon/128t/components/ProtocolModulesTable'
import DeviceConnectionsTable from 'src/addon/128t/components/DeviceConnectionsTable'
import ConnectionsTable from 'src/addon/128t/components/ConnectionsTable'

// Type
import {OncueData} from 'src/addon/128t/types'

// Decorators
import {ErrorHandling} from 'src/shared/decorators/errors'

interface Props {
  hanldeOnDismiss: () => void
  handleOnClickProtocolModulesRow: (name: string) => void
  handleOnClickDeviceConnectionsRow: (url: string) => void
  popupPosition: {top: number; right: number}
  oncueData: OncueData
}

interface State {
  bottomPosition: number | null
}

const MAX_HEIGHT = 400

@ErrorHandling
class DataPopup extends PureComponent<Props, State> {
  private tooltipRef = createRef<HTMLDivElement>()

  public constructor(props: Props) {
    super(props)
    this.state = {bottomPosition: null}
  }

  public componentDidMount() {}

  public render() {
    const {oncueData} = this.props
    return (
      <div className="data-popup-container">
        <div
          style={this.stylePosition}
          className={this.handleToolTipClassName}
          ref={this.tooltipRef}
          onBlur={this.props.hanldeOnDismiss}
        >
          <button className="data-popup-dismiss" onClick={this.handleDismiss} />{' '}
          <div className="data-popup-contents">
            <FancyScrollbar
              autoHeight={true}
              maxHeight={MAX_HEIGHT}
              autoHide={false}
            >
              <div className="datapopup-table--container">
                <div className="datapopup-table--section">
                  <div className="datapopup-table--section--full">
                    <OncueServiceTable oncueData={oncueData} />
                  </div>
                </div>
                <div className="datapopup-table--section">
                  <div className="datapopup-table--section--half width-40">
                    <ProtocolModulesTable
                      oncueData={oncueData}
                      onClickRow={this.props.handleOnClickProtocolModulesRow}
                    />
                  </div>
                  <div className="datapopup-table--section--half width-60">
                    <DeviceConnectionsTable
                      oncueData={oncueData}
                      onClickRow={this.props.handleOnClickDeviceConnectionsRow}
                    />
                  </div>
                </div>
                <div className="datapopup-table--section">
                  <div className="datapopup-table--section--full">
                    <ConnectionsTable oncueData={oncueData} />
                  </div>
                </div>
              </div>
            </FancyScrollbar>
          </div>
        </div>
      </div>
    )
  }

  private get handleToolTipClassName() {
    return 'data-popup-item'
  }

  private get stylePosition(): CSSProperties {
    const {
      popupPosition: {top, right}
    } = this.props

    const position = {
      top: `${top}px`,
      left: `${right}px`
    }
    return position
  }

  private handleDismiss = (e: MouseEvent<HTMLElement>) => {
    const {hanldeOnDismiss} = this.props

    hanldeOnDismiss()
    e.preventDefault()
    e.stopPropagation()
  }
}

export default DataPopup
