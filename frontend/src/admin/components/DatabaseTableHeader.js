import React from 'react'
import PropTypes from 'prop-types'

import {connect} from 'react-redux'
import {bindActionCreators} from 'redux'

import {notify as notifyAction} from 'shared/actions/notifications'
import ConfirmOrCancel from 'shared/components/ConfirmOrCancel'
import {notifyDatabaseDeleteConfirmationRequired} from 'shared/copy/notifications'
import Dropdown from 'src/shared/components/Dropdown'

const DatabaseTableHeader = ({
  database,
  onEdit,
  notify,
  onKeyDown,
  onConfirm,
  onCancel,
  onDelete,
  onStartDelete,
  onRemoveDeleteCode,
  onDatabaseDeleteConfirm,
  onAddRetentionPolicy,
  isAddRPDisabled,
  organizations,
}) => {
  if (database.isEditing) {
    return (
      <EditHeader
        organizations={organizations}
        database={database}
        onEdit={onEdit}
        onKeyDown={onKeyDown}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
  }

  return (
    <Header
      notify={notify}
      database={database}
      onCancel={onRemoveDeleteCode}
      onConfirm={onConfirm}
      onDelete={onDelete}
      onStartDelete={onStartDelete}
      isAddRPDisabled={isAddRPDisabled}
      onAddRetentionPolicy={onAddRetentionPolicy}
      onDatabaseDeleteConfirm={onDatabaseDeleteConfirm}
    />
  )
}

const Header = ({
  notify,
  database,
  onCancel,
  onDelete,
  onStartDelete,
  isAddRPDisabled,
  onAddRetentionPolicy,
  onDatabaseDeleteConfirm,
}) => {
  const buttons = (
    <div className="db-manager-header--actions text-right">
      <button
        className="btn btn-xs btn-primary"
        disabled={isAddRPDisabled}
        onClick={onAddRetentionPolicy(database)}
      >
        <span className="icon plus" /> Add Retention Policy
      </button>
      {database.name === '_internal' ? null : (
        <button
          className="btn btn-xs btn-danger"
          onClick={onStartDelete(database)}
        >
          Delete
        </button>
      )}
    </div>
  )

  function onConfirm(db) {
    if (database.deleteCode !== `DELETE ${database.name}`) {
      return notify(notifyDatabaseDeleteConfirmationRequired(database.name))
    }

    onDelete(db)
  }

  const deleteConfirmation = (
    <div className="admin-table--delete-db">
      <input
        className="form-control input-xs"
        name="name"
        type="text"
        value={database.deleteCode || ''}
        placeholder={`DELETE ${database.name}`}
        onChange={onDatabaseDeleteConfirm(database)}
        onKeyDown={onDatabaseDeleteConfirm(database)}
        autoFocus={true}
        autoComplete="false"
        spellCheck={false}
      />
      <ConfirmOrCancel
        item={database}
        onConfirm={onConfirm}
        onCancel={onCancel}
        buttonSize="btn-xs"
      />
    </div>
  )

  // eslint-disable-next-line no-prototype-builtins
  const hasDeletCode = database.hasOwnProperty('deleteCode')
  return (
    <div className="db-manager-header">
      <h4>{database.name}</h4>
      {hasDeletCode ? deleteConfirmation : buttons}
    </div>
  )
}

const EditHeader = ({database, onEdit, onConfirm, onCancel, organizations}) => {
  organizations = organizations.map((org) => org.name)

  return (
    <div className="db-manager-header db-manager-header--edit">
      <Dropdown
        items={organizations}
        onChoose={onEdit(database)}
        selected={database.name}
        className="dropdown-stretch top"
      />
      <ConfirmOrCancel
        item={database}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  )
}

const {func, shape, bool, arrayOf} = PropTypes

DatabaseTableHeader.propTypes = {
  organizations: arrayOf(shape()),
  onEdit: func,
  notify: func.isRequired,
  database: shape(),
  onKeyDown: func,
  onCancel: func,
  onConfirm: func,
  onDelete: func,
  onStartDelete: func,
  onDatabaseDeleteConfirm: func,
  onRemoveDeleteCode: func,
  onAddRetentionPolicy: func,
  isAddRPDisabled: bool,
}

Header.propTypes = {
  notify: func.isRequired,
  onConfirm: func,
  onCancel: func,
  onDelete: func,
  database: shape(),
  onStartDelete: func,
  isAddRPDisabled: bool,
  onAddRetentionPolicy: func,
  onDatabaseDeleteConfirm: func,
}

EditHeader.propTypes = {
  organizations: arrayOf(shape()),
  database: shape(),
  onEdit: func,
  onKeyDown: func,
  onCancel: func,
  onConfirm: func,
  isRFDisplayed: bool,
}

const mapDispatchToProps = (dispatch) => ({
  notify: bindActionCreators(notifyAction, dispatch),
})

export default connect(null, mapDispatchToProps)(DatabaseTableHeader)
