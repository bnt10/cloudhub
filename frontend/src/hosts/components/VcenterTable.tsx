import React from 'react'
import {
  CellName,
  HeadingBar,
  PanelHeader,
  Panel,
  PanelBody,
  Table,
  TableHeader,
  TableBody,
  TableBodyRowItem,
} from 'src/addon/128t/reusable/layout'
import FancyScrollbar from 'src/shared/components/FancyScrollbar'
import {ProgressDisplay} from 'src/shared/components/ProgressDisplay'

interface Props {
  isEditable: boolean
  cellTextColor: string
  cellBackgroundColor: string
}

const VcenterTable = (props: Props): JSX.Element => {
  const {isEditable, cellTextColor, cellBackgroundColor} = props

  const Header = (): JSX.Element => {
    return (
      <>
        <div
          className={'hosts-table--th sortable-header'}
          style={{width: '16.6%'}}
        >
          CPU
        </div>
        <div
          className={'hosts-table--th sortable-header'}
          style={{width: '16.6%'}}
        >
          Memory
        </div>
        <div
          className={'hosts-table--th sortable-header'}
          style={{width: '16.6%'}}
        >
          Storage
        </div>
        <div
          className={'hosts-table--th sortable-header'}
          style={{width: '16.6%'}}
        >
          Datacenter
        </div>
        <div
          className={'hosts-table--th sortable-header'}
          style={{width: '16.6%'}}
        >
          Host(ESXi)
        </div>
        <div
          className={'hosts-table--th sortable-header'}
          style={{width: '16.6%'}}
        >
          Virtaul Machine
        </div>
      </>
    )
  }

  const Body = (): JSX.Element => {
    return (
      <FancyScrollbar>
        <div className="hosts-table--tr">
          <TableBodyRowItem
            title={
              <ProgressDisplay
                unit={'CPU'}
                use={80}
                available={800}
                total={880}
              />
            }
            width={'16.6%'}
            className={'align--center'}
          />
          <TableBodyRowItem
            title={
              <ProgressDisplay
                unit={'Memory'}
                use={12000}
                available={12000}
                total={24000}
              />
            }
            width={'16.6%'}
            className={'align--center'}
          />
          <TableBodyRowItem
            title={
              <ProgressDisplay
                unit={'Storage'}
                use={78000}
                available={10000}
                total={88000}
              />
            }
            width={'16.6%'}
            className={'align--center'}
          />
          <TableBodyRowItem
            title={'30'}
            width={'16.6%'}
            className={'align--end'}
          />
          <TableBodyRowItem
            title={'30'}
            width={'16.6%'}
            className={'align--end'}
          />
          <TableBodyRowItem
            title={'30'}
            width={'16.6%'}
            className={'align--end'}
          />
        </div>
      </FancyScrollbar>
    )
  }

  return (
    <Panel>
      <PanelHeader isEditable={isEditable}>
        <CellName
          cellTextColor={cellTextColor}
          cellBackgroundColor={cellBackgroundColor}
          value={[]}
          name={'vCenter'}
          sizeVisible={false}
        />
        <HeadingBar
          isEditable={isEditable}
          cellBackgroundColor={cellBackgroundColor}
        />
      </PanelHeader>
      <PanelBody>
        <Table>
          <TableHeader>
            <Header />
          </TableHeader>
          <TableBody>
            <Body />
          </TableBody>
        </Table>
      </PanelBody>
    </Panel>
  )
}

export default VcenterTable
