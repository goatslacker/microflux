function copy(source, target) {
  return Object.keys(target).reduce((obj, key) => {
    obj[key] = target[key]
    return obj
  }, source)
}

export function observeAll(...manyActions) {
  return manyActions.reduce((signals, actions) => {
    return Object.keys(actions).reduce((obj, action) => {
      obj[action] = actions[action]
      return obj
    }, {})
  }, {})
}

export function reducers(listeners) {
  return (context, state, signals) => {
    return Object.keys(signals)
      .filter(x => signals[x] != null)
      .reduce((nextState, signal) => {
        return listeners[signal]
          ? copy(state, listeners[signal](context, nextState, signals[signal]))
          : nextState
      }, state)
  }
}
