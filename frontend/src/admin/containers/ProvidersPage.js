import React, {Component} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import * as adminCMPActionCreators from 'src/admin/actions/cmp'
import {notify as notifyAction} from 'shared/actions/notifications'

import ProvidersTable from 'src/admin/components/cmp/ProvidersTable'
import {ErrorHandling} from 'src/shared/decorators/errors'

class ProvidersPage extends Component {
  constructor(props) {
    super(props)

    this.state = {isLoading: true}
  }

  async componentDidMount() {
    const {
      links,
      actions: {loadOrganizationsAsync, loadMappingsAsync},
    } = this.props

    await Promise.all([
      loadOrganizationsAsync(links.organizations),
      loadMappingsAsync(links.mappings),
    ])

    this.setState({isLoading: false})
  }

  handleCreateMap = mapping => {
    this.props.actions.createMappingAsync(this.props.links.mappings, mapping)
  }

  handleUpdateMap = (staleMap, updatedMap) => {
    this.props.actions.updateMappingAsync(staleMap, updatedMap)
  }

  handleDeleteMap = mapping => {
    this.props.actions.deleteMappingAsync(mapping)
  }

  render() {
    const {organizations, mappings = []} = this.props
    const {isLoading} = this.state

    return (
      <ProvidersTable
        mappings={mappings}
        organizations={organizations}
        onCreateMap={this.handleCreateMap}
        onUpdateMap={this.handleUpdateMap}
        onDeleteMap={this.handleDeleteMap}
        isLoading={isLoading}
      />
    )
  }
}

const {arrayOf, func, shape, string} = PropTypes

ProvidersPage.propTypes = {
  links: shape({
    organizations: string.isRequired,
  }),
  organizations: arrayOf(
    shape({
      id: string.isRequired,
      name: string.isRequired,
    })
  ),
  mappings: arrayOf(
    shape({
      id: string,
      scheme: string,
      provider: string,
      providerOrganization: string,
      organizationId: string,
    })
  ),
  actions: shape({
    loadOrganizationsAsync: func.isRequired,
  }),
  notify: func.isRequired,
}

const mapStateToProps = ({
  links,
  adminCMP: {organizations, mappings},
}) => ({
  links,
  organizations,
  mappings,
})

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(adminCMPActionCreators, dispatch),
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  ErrorHandling(ProvidersPage)
)
