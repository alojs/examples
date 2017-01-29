// @flow

import {el, list} from 'redom'
import {alo} from './lib.js'
import {todomvc} from './styles.js'
import _ from 'lodash'
import {appStore} from './app.js'
import {cl} from 'classlayer/lib/classlayer.js'

type List = { el: HTMLElement, update: Function }
type TodoState = { id: number, complete?: boolean, title?: string }

var todomvcStyles = todomvc

export var todosStore = alo.createStore([], 'todos')

todosStore.createComputedProperty('notCompleteCount', function(state) {
  var count = 0

  _.each(state, function(todo: TodoState) {
    if (!todo.complete) {
      count++
    }
  })

  return count
})

todosStore.createComputedProperty('completeCount', function(state) {
  var count = 0

  _.each(state, function(todo: TodoState) {
    if (todo.complete === true) {
      count++
    }
  })

  return count
})

todosStore.createReducer(function(state, action) {
  switch(action.type) {
    case 'addTodo':
      action.payload.id = action.payload.id || _.uniqueId()
      state.push(action.payload)
      break
    case 'removeTodo':
      var id = _.findIndex(state, function(todo: TodoState) {
        return (todo.id === action.payload.id)
      })
      state.splice(id, 1)
      break
    case 'toggleComplete':
      var id = _.findIndex(state, function(todo: TodoState) {
        return (todo.id === action.payload.id)
      })
      state[id].complete = !state[id].complete
      break
    case 'setTitle':
      var id = _.findIndex(state, function(todo: TodoState) {
        return (todo.id === action.payload.id)
      })
      state[id].title = action.payload.title
      break
    case 'setComplete':
      _.each(state, function(todo: TodoState) {
        todo.complete = action.payload.complete
      })
      break
    case 'removeCompletedTodos':
      state = _.filter(state, function(todo: TodoState) {
        return todo.complete != true
      })
      break
  }
  return state
})

export var addTodo = function addTodo(todo: TodoState) {
  return {
    type: 'addTodo',
    payload: todo
  }
}

export var removeTodo = function removeTodo(todo: TodoState) {
  return {
    type: 'removeTodo',
    payload: todo
  }
}

export var setTitle = function(todo: TodoState) {
  return {
    type: 'setTitle',
    payload: todo
  }
}

export var toggleComplete = function toggleComplete(todo: TodoState) {
  return {
    type: 'toggleComplete',
    payload: todo
  }
}

export var setComplete = function setComplete(todo: Object) {
  return {
    type: 'setComplete',
    payload: todo
  }
}

export var removeCompletedTodos = function removeCompletedTodos() {
  return { type: 'removeCompletedTodos' }
}

export class Todo {
  state: TodoState
  uiState: Object
  el: HTMLElement
  elView: HTMLElement
  elLabel: HTMLElement
  elTitleInput: HTMLInputElement
  elToggleInput: HTMLInputElement
  elDestroyBtn: HTMLButtonElement
  constructor () {
    var self = this

    this.uiState = {
      editing: false
    }
    this.el = el('li', [
      this.elView = el(`div.${todomvcStyles.view}`, [
        this.elToggleInput = el(`input.${todomvcStyles.toggle}`, { type: 'checkbox', onclick: function(e) {
          todosStore.dispatch(toggleComplete(self.state))
        } }),
        this.elLabel = el('label', {
          ondblclick: function() {
            self.uiState.editing = true
            self.update()
          }
        }),
        this.elDestroyBtn = el(`button.${todomvcStyles.destroy}`, {
          onclick: function(e) {
            todosStore.dispatch(removeTodo(self.state))
          }
        })
      ]),
      this.elTitleInput = el(`input.${todomvcStyles.edit}`, {
        onblur: (e) => {
          self.uiState.editing = false
          todosStore.dispatch(setTitle({
            id: self.state.id,
            title: e.target.value
          }))
        },
        onkeyup: (e) => {
          switch(e.keyCode) {
            case 27:
              self.uiState.editing = false
              self.update()
              break
            case 13:
              e.target.blur()
              break
          }
        }
      })
    ])
  }
  update (todo?: TodoState) {
    if (todo) {
      this.state = todo
    }
    if (this.state.title) {
      this.elLabel.textContent = `${this.state.title}`
      this.elTitleInput.value = this.state.title
    }
    this.el.className = cl(
      todomvcStyles.editing, this.uiState.editing,
      todomvcStyles.completed, !!this.state.complete)
    this.elToggleInput.checked = !!this.state.complete
    if (!!this.uiState.editing) {
      this.elTitleInput.focus()
      this.elTitleInput.setSelectionRange(0,0)
    }
  }
}

// export Todo


class Todos {
  /* :: el: HTMLElement */
  /* :: list: List */
  constructor () {
    var self = this
    this.list = list(`ul.${todomvcStyles['todo-list']}`, Todo, 'id')
    this.el = this.list.el
    var sub = todosStore.subscribe(function (stores, computed) {
      self.update(stores, computed)
    })
    sub.addStore(appStore)
    sub.createDependency({
      todosFilter: function(stores) {
        if (stores.app && stores.app.state) {
          return stores.app.state.todosFilter
        }
      },
      todos: function(stores) {
        return stores.todos
      },
      filteredTodos: [['todosFilter', 'todos'], function(stores, computed) {
        switch(computed.todosFilter) {
          case 'active':
            return _.filter(computed.todos.state, function(todo: TodoState) {
              return !todo.complete
            })
          case 'completed':
            return _.filter(computed.todos.state, function(todo: TodoState) {
              return !!todo.complete
            })
          case 'all':
          default:
            return computed.todos.state
        }
      }]
    })
  }
  update (stores: Object, computed: Object) {
    this.list.update(computed.filteredTodos)
  }
}

export default Todos
