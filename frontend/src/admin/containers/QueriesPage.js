import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import flatten from 'lodash/flatten'
import uniqBy from 'lodash/uniqBy'

import {showDatabases, showQueries} from 'shared/apis/metaQuery'

import QueriesTable from 'src/admin/components/QueriesTable'
import showDatabasesParser from 'shared/parsing/showDatabases'
import showQueriesParser from 'shared/parsing/showQueries'
import {notifyQueriesError} from 'shared/copy/notifications'
import {ErrorHandling} from 'src/shared/decorators/errors'

import {
  loadQueries as loadQueriesAction,
  setQueryToKill as setQueryToKillAction,
  killQueryAsync,
} from 'src/admin/actions/influxdb'
import {eachRoleQueries} from 'src/admin/utils/eachRoleWorker'

import {notify as notifyAction} from 'shared/actions/notifications'

class QueriesPage extends Component {
  componentDidMount() {
    this.updateQueries()
    const updateInterval = 5000
    this.intervalID = setInterval(this.updateQueries, updateInterval)
  }

  componentWillUnmount() {
    clearInterval(this.intervalID)
  }

  render() {
    const {queries} = this.props

    return <QueriesTable queries={queries} onKillQuery={this.handleKillQuery} />
  }

  updateQueries = () => {
    const {source, notify, loadQueries, auth} = this.props
    showDatabases(source.links.proxy).then(resp => {
      const {databases, errors} = showDatabasesParser(resp.data)
      const checkDatabases = eachRoleQueries(databases, auth)

      if (errors.length) {
        errors.forEach(message => notify(notifyQueriesError(message)))
        return
      }

      const fetches = checkDatabases.map(db =>
        showQueries(source.links.proxy, db)
      )

      Promise.allSettled(fetches).then(results => {
        const allQueries = []
        results.forEach((settledResponse, i) => {
          if (!settledResponse.value) {
            console.error(
              `Unable to show queries on '${databases[i]}': `,
              settledResponse.reason
            )
            return
          }
          const result = showQueriesParser(settledResponse.value.data)
          if (result.errors.length) {
            result.errors.forEach(message =>
              notify(notifyQueriesError(message))
            )
          }

          allQueries.push(...result.queries)
        })

        const queries = uniqBy(flatten(allQueries), q => q.id)
        loadQueries(queries)
      })
    })
  }

  handleKillQuery = query => {
    const {source, killQuery} = this.props
    killQuery(source.links.proxy, query)
  }
}

const {arrayOf, func, string, shape} = PropTypes

QueriesPage.propTypes = {
  auth: shape().isRequired,
  source: shape({
    links: shape({
      proxy: string,
    }),
  }),
  queries: arrayOf(shape()),
  loadQueries: func,
  queryIDToKill: string,
  setQueryToKill: func,
  killQuery: func,
  notify: func.isRequired,
}

const mapStateToProps = ({adminInfluxDB: {queries, queryIDToKill}, auth}) => ({
  queries,
  queryIDToKill,
  auth,
})

const mapDispatchToProps = dispatch => ({
  loadQueries: bindActionCreators(loadQueriesAction, dispatch),
  setQueryToKill: bindActionCreators(setQueryToKillAction, dispatch),
  killQuery: bindActionCreators(killQueryAsync, dispatch),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ErrorHandling(QueriesPage))
