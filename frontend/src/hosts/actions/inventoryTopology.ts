import {Dispatch} from 'redux'
import {errorThrown} from 'src/shared/actions/errors'
import _ from 'lodash'

// APIs
import {
  loadInventoryTopology,
  createInventoryTopology,
  updateInventoryTopology,
} from 'src/hosts/apis'

// Types
import {Links} from 'src/types'

export enum ActionTypes {
  LoadInventoryTopology = 'LOAD_INVENTORY_TOPOLOGY',
  CreateInventoryTopology = 'CREATE_INVENTORY_TOPOLOGY',
  UpdateInventoryTopology = 'UPDATE_INVENTORY_TOPOLOGY',
}

export type Action =
  | LoadInventoryTopologyAction
  | CreateInventoryTopologyAction
  | UpdateInventoryTopologyAction

interface LoadInventoryTopologyAction {
  type: ActionTypes.LoadInventoryTopology
}

interface CreateInventoryTopologyAction {
  type: ActionTypes.CreateInventoryTopology
}

interface UpdateInventoryTopologyAction {
  type: ActionTypes.UpdateInventoryTopology
}

export const loadInventoryTopologyAction = (): LoadInventoryTopologyAction => ({
  type: ActionTypes.LoadInventoryTopology,
})

export const createInventoryTopologyAction = (): CreateInventoryTopologyAction => ({
  type: ActionTypes.CreateInventoryTopology,
})

export const updateInventoryTopologyAction = (): UpdateInventoryTopologyAction => ({
  type: ActionTypes.UpdateInventoryTopology,
})

export const loadInventoryTopologyAsync = (links: Links) => async (
  dispatch: Dispatch<Action>
) => {
  try {
    const resultLoadInventoryTopology = await loadInventoryTopology(links)

    return resultLoadInventoryTopology
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error))
  }
}

export const createInventoryTopologyAsync = (
  links: Links,
  cells: string
) => async (dispatch: Dispatch<Action>) => {
  try {
    const resultCreateInventoryTopology = await createInventoryTopology(
      links,
      cells
    )

    return resultCreateInventoryTopology
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error))
  }
}

export const updateInventoryTopologyAsync = (
  links: Links,
  cellsId: string,
  cells: string
) => async (dispatch: Dispatch<Action>) => {
  try {
    const resultUpdateInventoryTopology = await updateInventoryTopology(
      links,
      cellsId,
      cells
    )

    return resultUpdateInventoryTopology
  } catch (error) {
    console.error(error)
    dispatch(errorThrown(error))
  }
}
