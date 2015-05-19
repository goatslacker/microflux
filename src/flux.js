import { Dispatcher } from 'flux'
import transmitter from 'transmitter'

const BOOTSTRAP = {}
const keys = Object.keys

function createActions(context, name, model) {
  return keys(model).reduce((actions, id) => {
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
  const signalKeys = keys(observables)

  // setup the dependencies and signals
  const dependencies = signalKeys.map((key) => {
    return observables[key].dispatchToken
  }).filter(Boolean)

  const dispatchToken = context.dispatcher.register((payload) => {
    const { action, data } = payload
    // bootstrap state
    if (action === BOOTSTRAP && data[name]) {
      return state = data[name]
    }

    // pull the signals from the action
    const signals = signalKeys.reduce((arr, key) => {
      const observable = observables[key]
      if (observable === action) arr.push([key, data])
      else if (observable.dispatchToken) arr.push([key, observable.get()])
      return arr
    }, [])

    const emitChange = signals.length

    // wait for any derived data
    context.dispatcher.waitFor(dependencies)

    // reduce and output
    if (emitChange) {
      const nextState = model.reduce(context, state, signals.reduce((o, x) => {
        return o[x[0]] = x[1], o
      }, {}))
      const output = model.output
        ? model.output(context, state, nextState)
        : nextState
      state = nextState
      // if no output, no push
      if (output !== undefined) bus.push(output)
    }
  })

  const statics = model.statics model.statics(context) : {}

  return keys(statics).reduce((obj, key) => {
    obj[key] = statics[key]
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
  keys(actions).forEach((name) => {
    this[name] = createActions(this, name, actions[name])
  })
}

MicroFlux.prototype.registerStores = function (stores) {
  keys(stores).forEach((name) => {
    this[name] = createStore(this, name, stores[name])
  })
}

MicroFlux.prototype.bootstrap = function (data) {
  this.dispatcher.dispatch({ action: BOOTSTRAP, data })
}

export default MicroFlux
