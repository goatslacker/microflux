import MicroFlux from '../'
import { observeAll, reducers } from '../addons'

const TodoActions = {
  create: text => text,
  updateText: obj => obj,
  toggleComplete: id => id,
  toggleCompleteAll: () => true,
  destroy: id => id,
  destroyCompleted: () => true
}

function uid() {
  return Math.random().toString(36).substr(2, 16)
}

function areAllComplete(state) {
  for (let id in state.todos) {
    if (!state.todos[id].complete) {
      return false
    }
  }
  return true
}

const TodoStore = {
  state: {
    todos: {}
  },

  statics(context) {
    return {
      areAllComplete() {
        const state = context.TodoStore.get()
        return areAllComplete(state)
      }
    }
  },

  observe(context, state) {
    return observeAll(context.TodoActions)
  },

  reduce: reducers({
    create(context, state, todoText) {
      const id = uid()
      const text = todoText.trim()

      if (text === '') {
        // shorthand for not returning
        return null
      }

      state.todos[id] = {
        id,
        complete: false,
        text
      }

      return state
    },

    updateText(context, state, { id, text }) {
      text = text ? text.trim() : ''
      if (text === '') {
        return null
      }

      if (state.todos[id]) {
        state.todos[id].text = text
      }
      return state
    },

    toggleComplete(context, state, id) {
      state.todos[id].complete = !state.todos[id].complete
      return state
    },

    toggleCompleteAll(context, state) {
      const complete = !areAllComplete(state);
      for (let id in state.todos) {
        state.todos[id].complete = complete;
      }
      return state
    },

    destroy(context, state, id) {
      delete state.todos[id]
      return state
    },

    destroyCompleted(context, state) {
      for (let id in state.todos) {
        if (state.todos[id].complete) {
          delete state.todos[id]
        }
      }
      return state
    }
  })
}

class Flux extends MicroFlux {
  constructor() {
    super()

    this.registerActions({ TodoActions })
    this.registerStores({ TodoStore })
  }
}

function test() {
  const flux = new Flux()
  const { TodoActions, TodoStore } = flux

  TodoStore.subscribe(todos => console.log('Todos', todos))


  TodoActions.create('tape mirror')
  TodoActions.create('write docs')
  TodoActions.create('fix tests')

  TodoActions.toggleCompleteAll()
}

test()
