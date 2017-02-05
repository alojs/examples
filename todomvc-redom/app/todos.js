// @flow

import {el, list} from 'redom'
import {alo} from './lib.js'
import {todomvc} from './styles.js'
import _ from 'lodash'
import {appStore} from './app.js'
import {cl} from 'classlayer/lib/classlayer.js'
import interact from 'interactjs'

type List = { el: HTMLElement, update: Function }
type TodoState = { id: number, complete?: boolean, title?: string }
type TodoHTMLElement = HTMLElement & {
  __state: Object;
}

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
    case 'move':
      console.log(action)
      var id = _.findIndex(state, (todo: TodoState) => {
        return (todo.id === action.payload.todo.id)
      })
      var todo = state[id]
      state.splice(id, 1)
      var targetId = _.findIndex(state, (todo: TodoState) => {
        return (todo.id === action.payload.target.id)
      })
      var newId = targetId
      if (action.payload.place == 'after') {
        newId++
      }
      state.splice(newId, 0, todo)
      console.log(state)
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

export var move = function move(todo: TodoState, place: string, targetTodo: TodoState) {
  return {
    type: 'move',
    payload: {
      todo,
      place,
      target: targetTodo
    }
  }
}

export var removeCompletedTodos = function removeCompletedTodos() {
  return { type: 'removeCompletedTodos' }
}

export class Todo {
  state: TodoState
  uiState: Object
  interact: Object
  el: TodoHTMLElement
  elView: HTMLElement
  elLabel: HTMLElement
  elTitleInput: HTMLInputElement
  elToggleInput: HTMLInputElement
  elDestroyBtn: HTMLButtonElement
  elDropBefore: HTMLElement
  elDropAfter: HTMLElement
  constructor () {
    var self = this

    this.uiState = {
      editing: false,
      position: {
        x: 0,
        y: 0
      }
    }

    var dropStyle = {
      'height': '1px',
      'width': '100%',
      'transition-property': 'height',
      'transition-duration': '0.2s'
    }

    this.el = el('li', [
      this.elDropBefore = el(`div`, { style: dropStyle }),
      this.elView = el(`div.${todomvcStyles.view}`, {
        style: {
          position: 'relative'
        }
      }, [
        this.elToggleInput = el(`input.${todomvcStyles.toggle}`, { type: 'checkbox', onclick: function(e) {
          todosStore.dispatch(toggleComplete(self.state))
        } }),
        this.elLabel = el('label', {
          style: {
            cursor: 'inherit'
          },
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
          self.state.title = e.target.value
          self.update()
          todosStore.dispatch(setTitle(self.state))
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
      }),
      this.elDropAfter = el(`div`, { style: dropStyle })
    ])
    this.el.style['background-color'] = 'white'
    self.interact = {
      dropBefore: interact(this.elDropBefore),
      dropAfter: interact(this.elDropAfter),
      item: interact(this.el),
    }
  }
  mounted () {
    var self = this

    self.interact.item
      .styleCursor(false)
      .draggable({ inertia: true, snap: { endOnly: true } })
      .on('dragstart', (e) => {
        e.target.style.cursor = 'move'
        var rect = e.target.getBoundingClientRect()
        var parentRect = e.target.parentElement.getBoundingClientRect()
        e.target.style.position = 'absolute'
        e.target.style.top = `${rect.top - parentRect.top}px`
        e.target.style['z-index'] = 1
        e.target.style.width = '100%'
      })
      .on('dragmove', (e) => {
        var target = e.target
        var x = self.uiState.position.x + e.dx
        var y = self.uiState.position.y + e.dy

        // translate the element
        target.style.webkitTransform =
        target.style.transform =
          'translate(' + x + 'px, ' + y + 'px)';

        self.uiState.position.x = x
        self.uiState.position.y = y
      })
      .on('dragend', (e) => {
        e.target.style.cursor = 'default'
        if (e.dropzone) {
          return
        }
        self.interact.item.draggable({
          enabled: false
        })
        e.target.style.position = null
        e.target.style.top = null
        e.target.style['transition-property'] = 'transform'
        e.target.style['transition-duration'] = '0.5s'
        e.target.style.transform = ''
        setTimeout(function() {
          self.interact.item.draggable({
            enabled: true
          })
          e.target.style['z-index'] = null
          e.target.style['transition-property'] = null
          e.target.style['transition-duration'] = null
          self.uiState.position.x = 0
          self.uiState.position.y = 0
        }, 500)
      })

    var dropConfig = {
      checker: (de, e, dropped, dropzone, dropEl, draggable, dragEl) => {
        var result = dropped && dragEl != self.el
        return result
      },
      overlap: 0.01,
      accept: '.li',
      ondragenter: (e) => {
        var rect = e.target.getBoundingClientRect()
        e.target.style.height = '65px'
        var borderStyle = '1px solid #ededed'
        if (e.target == self.elDropBefore) {
          e.target.style.borderBottom = borderStyle
        } else {
          e.target.style.borderTop = borderStyle
        }
      },
      ondragleave: (e) => {
        e.target.style.height = '1px'
        e.target.style.borderTop = null
        e.target.style.borderBottom = null
      },
      ondrop: (e) => {
        e.target.style.height = '1px'
        e.target.style.borderTop = null
        e.target.style.borderBottom = null
        if (e.relatedTarget.__state) {
          var todo = e.relatedTarget.__state
          var place = (e.target == self.elDropBefore)? 'before': 'after'
          todosStore.dispatch(move(todo, place, self.state)).then(() => {
            e.relatedTarget.style.transform = ''
            e.relatedTarget.style['z-index'] = null
            e.relatedTarget.style['transition-property'] = null
            e.relatedTarget.style['transition-duration'] = null
            e.relatedTarget.style.position = null
            e.relatedTarget.style.top = null
          })
        }

      }
    }
    this.interact.dropBefore.dropzone(dropConfig)
    this.interact.dropAfter.dropzone(dropConfig)
  }
  update (todo?: TodoState, i?: number) {
    if (todo) {
      this.state = todo
      this.el.__state = todo
      this.uiState.position.x = 0
      this.uiState.position.y = 0
    }
    this.elDropBefore.style.display = (i !== undefined && i !== 0)? 'none': 'block'
    if (this.state.title) {
      this.elLabel.textContent = `${this.state.title}`
      this.elTitleInput.value = this.state.title
    }
    this.el.className = cl(
      'li', true,
      todomvcStyles.editing, this.uiState.editing,
      todomvcStyles.completed, !!this.state.complete)
    this.elToggleInput.checked = !!this.state.complete
    if (!!this.uiState.editing) {
      this.interact.item.draggable({
        enabled: false
      })
      this.elTitleInput.focus()
      this.elTitleInput.setSelectionRange(0,0)
    } else {
      this.interact.item.draggable({
        enabled: true
      })
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
