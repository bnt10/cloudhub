import React from 'react'
import PropTypes from 'prop-types'

import LayoutRenderer from 'src/shared/components/LayoutRenderer'
import DashboardEmpty from 'src/dashboards/components/DashboardEmpty'
import {Page} from 'src/reusable_ui'

const Dashboard = ({
  source,
  sources,
  onZoom,
  dashboard,
  timeRange,
  manualRefresh,
  onDeleteCell,
  onCloneCell,
  onPositionChange,
  inPresentationMode,
  templatesIncludingDashTime,
  onSummonOverlayTechnologies,
  setScrollTop,
  inView,
  onPickTemplate,
}) => {
  const cells = dashboard.cells.map(cell => {
    const dashboardCell = {
      ...cell,
      inView: inView(cell),
    }
    dashboardCell.queries = dashboardCell.queries.map(q => ({
      ...q,
      database: q.db,
      text: q.query,
      queryConfig: {
        ...q.queryConfig,
        rawText: q.query,
      },
    }))
    return dashboardCell
  })

  return (
    <Page.Contents
      fullWidth={true}
      inPresentationMode={inPresentationMode}
      setScrollTop={setScrollTop}
    >
      <div className="dashboard container-fluid full-width">
        {cells.length ? (
          <LayoutRenderer
            cells={cells}
            onZoom={onZoom}
            source={source}
            sources={sources}
            isEditable={true}
            isStatusPage={false}
            isStaticPage={false}
            timeRange={timeRange}
            manualRefresh={manualRefresh}
            onDeleteCell={onDeleteCell}
            onCloneCell={onCloneCell}
            onPositionChange={onPositionChange}
            templates={templatesIncludingDashTime}
            onSummonOverlayTechnologies={onSummonOverlayTechnologies}
            onPickTemplate={onPickTemplate}
          />
        ) : (
          <DashboardEmpty dashboard={dashboard} />
        )}
      </div>
    </Page.Contents>
  )
}

// tslint:disable-next-line: variable-name
const {arrayOf, bool, func, shape, string, number} = PropTypes

Dashboard.propTypes = {
  dashboard: shape({
    templates: arrayOf(
      shape({
        type: string.isRequired,
        tempVar: string.isRequired,
        query: shape({
          db: string,
          rp: string,
          influxql: string,
        }),
        values: arrayOf(
          shape({
            type: string.isRequired,
            value: string.isRequired,
            selected: bool,
          })
        ).isRequired,
      })
    ).isRequired,
  }),
  templatesIncludingDashTime: arrayOf(shape()).isRequired,
  inPresentationMode: bool,
  onPositionChange: func,
  onDeleteCell: func,
  onCloneCell: func,
  onSummonOverlayTechnologies: func,
  onPickTemplate: func,
  source: shape({
    links: shape({
      proxy: string,
    }).isRequired,
  }).isRequired,
  sources: arrayOf(shape({})).isRequired,
  manualRefresh: number,
  timeRange: shape({}).isRequired,
  onZoom: func,
  setScrollTop: func,
  inView: func,
}

export default Dashboard
