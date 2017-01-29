// @flow

import Alo from 'alo'

/**
 * Alo instance for this app
 */
export var alo = new Alo()

/**
 * This middleware allows to dispatch functions
 */
export var thunkMiddleware = alo.extras.middlewares.createThunk()
