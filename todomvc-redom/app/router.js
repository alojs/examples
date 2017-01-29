// @flow

import { thunkMiddleware, alo } from './lib.js'

/**
 * Holds the initial state for the router store
 */
const initialState: { route: string } = {
  /**
   * Holds just the name of the current route
   */
  route: 'loading'
}

export var routerStore = alo.createStore(initialState, 'router')
routerStore.addMiddleware(thunkMiddleware)

/**
 * Returns an action object, which can be dispatched on the router to set a specific route
 */
export var setRoute = function (options: { route: string }): { type: string, payload: string } {
  return {
    type: 'setRoute',
    payload: options.route
  }
}

/*
 * Route reducer
 */
export var routeReducer = routerStore.createReducer(function (state, action) {
  switch (action.type) {
    case 'setRoute':
      state.route = action.payload
      break
  }

  return state
})
