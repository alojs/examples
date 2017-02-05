// @flow

import { el, setChildren, setAttr, text, list } from 'redom'
import { alo, thunkMiddleware } from './lib.js'
import { routerStore, setRoute } from './router.js'
import { todosStore, addTodo, setComplete, removeCompletedTodos } from './todos.js'
import { cl } from 'classlayer/lib/classlayer.js'
import Todos from './todos.js'
import _ from 'lodash'

import app, {todomvc} from './styles.js'
var appStyles = app;
var todomvcStyles = todomvc;

/*
 * Setup core app store
 */
/**
 * Holds the initial state for the app store
 */
const initialState: { version: number, todosFilter: string } = {
  /**
   * Holds a version number of this app, this is essential if you want to store the state in the localStorage
   * So you can check if the localStorage has an old, invalid state
   */
  version: 1,
  todosFilter: 'all'
}
export var appStore = alo.createStore(initialState, 'app')

/*
 * Setup the thunkMiddleware on the app store.
 */
appStore.addMiddleware(thunkMiddleware)

appStore.createReducer(function(state, action) {
  switch(action.type) {
    case 'setNewTodoTitle':
      if (!state.newTodo) {
        state.newTodo = {}
      }
      state.newTodo.title = action.payload
      break
    case 'resetNewTodo':
      state.newTodo = {
        title: ''
      }
      break
    case 'setTodosFilter':
      state.todosFilter = action.payload
      break
  }
  return state
})

var setNewTodoTitle = function(title: string) {
  return {
    type: 'setNewTodoTitle',
    payload: title
  }
}

var resetNewTodo = function() {
  return {
    type: 'resetNewTodo'
  }
}

var setTodosFilter = function(filterName) {
  return {
    type: 'setTodosFilter',
    payload: filterName
  }
}

class Header {
  el: HTMLElement
  elTitle: HTMLElement
  elNewTodoInput: HTMLInputElement
  constructor () {
    var self = this

    var onNewTodoInput = function() {
      var self: HTMLInputElement = this
      appStore.dispatch(setNewTodoTitle(self.value))
    }

    this.el = el(`header.header`)
    this.elNewTodoInput = el(`input.${todomvcStyles['new-todo']}`, {
      placeholder: "What needs to be done?",
      autofocus: true,
      oninput: onNewTodoInput,
      onchange: onNewTodoInput,
      onkeypress: function(e) {
        if (e.keyCode == 13) {
          var appState = appStore.getState()
          if (appState.newTodo && appState.newTodo.title) {
            todosStore.dispatch(addTodo(appState.newTodo)).then(() => {
              appStore.dispatch(resetNewTodo())
            })
          }
        }
      }
    })
    this.elTitle = el('h1')
    this.update()
  }
  update (state) {
    this.elTitle.textContent = 'todos'

    if (state) {
      if (state.newTodo) {
        setAttr(this.elNewTodoInput, {
          value: state.newTodo.title
        })
      }
    }

    setChildren(this.el, [
      this.elTitle,
      this.elNewTodoInput
    ])
  }
}

class TodosFilter {
  el: HTMLElement
  elLink: HTMLElement
  state: Object
  constructor() {
    var self = this

    this.el = el('li',
      this.elLink = el('a', {
        onclick: function() {
          appStore.dispatch(setTodosFilter(self.state.name))
        }
      })
    )
  }
  update(data) {
    this.state = data
    this.elLink.textContent = data.name
    this.elLink.className = cl(todomvcStyles.selected, data.active)
  }
}

class Footer {
  el: HTMLElement
  elTodoCount: HTMLElement
  elFilterList: Object
  elClearCompletedBtn: HTMLButtonElement
  sub: Object
  constructor () {
    var self = this

    this.el = el(`footer.${todomvcStyles.footer}`, [
      el(`span.${todomvcStyles['todo-count']}`, [
        this.elTodoCount = el('strong'),
        text(' item left')
      ]),
      this.elFilterList = list(`ul.${todomvcStyles.filters}`, TodosFilter, 'name'),
      this.elClearCompletedBtn = el(`button`, {
        onclick: function() {
          todosStore.dispatch(removeCompletedTodos())
        }
      }, 'Clear completed')
    ])
    this.sub = alo.createSubscription()
    this.sub.addStore(appStore)
    this.sub.addStore(todosStore)
    this.sub.createDependency({
      'todosFilter': function(stores) {
        return stores.app.state.todosFilter
      },
      'todosCount': function(stores) {
        var count = 0
        if (stores.todos && stores.todos.computed.notCompleteCount) {
          count = stores.todos.computed.notCompleteCount
        }
        return count
      },
      'completedTodosCount': function(stores) {
        var count = 0
        if (stores.todos && stores.todos.computed.completeCount) {
          count = stores.todos.computed.completeCount
        }
        return count

      }
    })
    this.sub.createMember(function(stores, computed) {
      self.update(stores, computed)
    })
  }
  update (stores: Object, computed: Object) {
    this.elTodoCount.textContent = computed.todosCount
    this.elFilterList.update(_.map(['all', 'active', 'completed'], function(filterName) {
      return {
        name: filterName,
        active: (computed.todosFilter === filterName)
      }
    }))
    this.elClearCompletedBtn.className = cl(
      todomvcStyles['clear-completed'], true,
      todomvcStyles.hidden, (computed.completedTodosCount == 0))
  }
}

export class InfoFooter {
  el: HTMLElement
  constructor () {
    this.el = el(`footer.${todomvcStyles.info}`, [
      el('p', 'Double-click to edit a todo'),
      el('p', [
        text('Created by '),
        el('a', { href: 'https://github.com/katywings' }, 'Katja Lutz')
      ]),
      el('p', [
        text('Part of '),
        el('a', { href: 'http://todomvc.com' }, 'TodoMVC')
      ])
    ])
  }
}

/**
 * The app class, its main purpose is to be the centralized point for the app rendering'
 */
class App {
  sub: Object
  el: HTMLElement
  elMain: HTMLElement
  elToggleAll: HTMLInputElement
  elTodos: Object
  elHeader: Header
  elFooter: Footer
  constructor () {
    var self = this
    this.el = el(`section.${todomvcStyles.todoapp}`)
    this.elHeader = new Header()
    this.elMain = el(`section.${todomvcStyles.main}`, [
      this.elToggleAll = el(`input#toggle-all.${todomvcStyles['toggle-all']}`, {
        type: 'checkbox',
        onclick: function(e) {
          todosStore.dispatch(setComplete({
            complete: e.currentTarget.checked
          }))
        }
      }),
      el('label', {
        for: 'toggle-all'
      }, 'Mark all as complete'),
      this.elTodos = new Todos()
    ])
    this.elFooter = new Footer()
    this.sub = alo.createSubscription()
    this.sub.addStore([routerStore, appStore, todosStore])
    this.sub.createDependency({
      'router': function(stores) {
        return stores.router
      },
      'app': function(stores) {
        return stores.app
      },
      'hasTodos': function(stores) {
        if (stores.todos.state && stores.todos.state.length > 0) {
          return true
        }
      },
      'allCompleted': function(stores) {
        if (stores.todos.computed.notCompleteCount) {
          return stores.todos.computed.notCompleteCount == 0
        } else {
          return true
        }
      }
    })
    this.sub.createMember(function (stores, computed) {
      self.update(stores, computed)
    })
    routerStore.dispatch(setRoute({route: 'todos'}))
  }
  update (stores: Object, computed: Object) {
    var routerState = computed.router.state
    var appState = computed.app.state
    switch (routerState.route) {
      case 'loading':
        setChildren(this.el, [el('span', 'loading')])
        break
      case 'todos':
        this.elHeader.update(appState)
        this.elToggleAll.checked = !!computed.allCompleted
        setChildren(this.el, [
          this.elHeader,
          this.elMain,
          (computed.hasTodos)? this.elFooter: null
        ])
        break
    }
  }
  destroy () {
    this.sub.stop()
    delete this.el
  }
}
export default App
