// @flow

import { el, setChildren } from 'redom'
import { alo, thunkMiddleware } from './lib.js'
import { routerStore, setRoute } from './router.js'

/*
 * Setup core app store
 */
/**
 * Holds the initial state for the app store
 */
const initialState: { version: number } = {
  /**
   * Holds a version number of this app, this is essential if you want to store the state in the localStorage
   * So you can check if the localStorage has an old, invalid state
   */
  version: 1
}
export var appStore = alo.createStore(initialState, 'app')

/*
 * Setup the thunkMiddleware on the app store.
 */
appStore.addMiddleware(thunkMiddleware)

/**
 * The app class, its main purpose is to be the centralized point for the app rendering'
 */
class App {
  /* :: el: HTMLElement */
  /* :: sub: Object */
  constructor () {
    var self = this

    this.el = el('div.todoApp')
    this.sub = routerStore.createSubscription()
    this.sub.createMember(function (stores, computed) {
      self.update(stores.router.state)
    })
    self.update({ route: 'loading' })
    setTimeout(function () {
      console.log('dispatch')
      routerStore.dispatch(setRoute('todos'))
    }, 5000)
  }
  update (routerState: Object) {
    switch (routerState.route) {
      case 'loading':
        setChildren(this.el, [el('span', 'loading')])
        break
      case 'todos':
        setChildren(this.el, [el('span', 'todos')])
    }
  }
  destroy () {
    this.sub.stop()
    delete this.el
  }
}
export default App
