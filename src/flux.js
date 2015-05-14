import { Dispatcher } from 'flux'
import transmitter from 'transmitter'

const BOOTSTRAP = {}

function createActions(context, name, model) {
  return Object.keys(model).reduce((actions, id) => {
    const action = (...args) => {
      const data = model[id](...args)
      context.dispatcher.dispatch({ action, data })
    }
    actions[id] = action
    return actions
  }, {})
}

function createStore(context, name, model) {
  let state = model.state
  const bus = transmitter()

  const observables = model.observe(context, state)

  // setup the dependencies and signals
  const dependencies = Object.keys(observables).map((key) => {
    return observables[key].dispatchToken
  }).filter(Boolean)

  const dispatchToken = context.dispatcher.register((payload) => {
    // bootstrap state
    if (payload.action === BOOTSTRAP && payload.data[name]) {
      return state = payload.data[name]
    }

    let shouldReduce = false

    // pull the signals from the action
    const signals = Object.keys(observables).reduce((obj, key) => {
      const observable = observables[key]
      if (observable === payload.action) {
        obj[key] = payload.data
        shouldReduce = true
      } else if (observable.dispatchToken) {
        obj[key] = observable.get()
        shouldReduce = true
      }
      return obj
    }, {})

    // wait for any derived data
    context.dispatcher.waitFor(dependencies)

    // reduce and output
    if (shouldReduce) {
      const nextState = model.reduce(context, state, signals)
      const output = model.output
        ? model.output(context, state, nextState)
        : nextState
      state = nextState
      // if no output, no push
      if (output !== undefined) bus.push(output)
    }
  })

  const exports = model.exports ? model.exports(context) : {}

  return Object.keys(exports).reduce((obj, key) => {
    obj[key] = exports[key]
    return obj
  }, {
    dispatchToken,
    subscribe: bus.subscribe,
    get: () => state
  })
}

function MicroFlux() {
  this.dispatcher = new Dispatcher()
}

MicroFlux.prototype.registerActions = function (actions) {
  Object.keys(actions).forEach((name) => {
    this[name] = createActions(this, name, actions[name])
  })
}

MicroFlux.prototype.registerStores = function (stores) {
  Object.keys(stores).forEach((name) => {
    this[name] = createStore(this, name, stores[name])
  })
}

MicroFlux.prototype.bootstrap = function (data) {
  this.dispatcher.dispatch({ action: BOOTSTRAP, data })
}

export default MicroFlux
