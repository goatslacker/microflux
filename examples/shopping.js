import µFlux from '../'
import { observeAll, reducers } from '../addons'

const ShopActions = {
  addItem: item => item,
  taxPercentChanged: percent => percent
}

const ItemStore = {
  state: [],

  observe(context) {
    return {
      item: context.ShopActions.addItem
    }
  },

  reduce(context, state, signals) {
    return state.concat(signals.item)
  },

  output(context, state, nextState) {
    return nextState
  }
}

const TaxStore = {
  state: 0,

  observe(context) {
    return {
      taxPercent: context.ShopActions.taxPercentChanged
    }
  },

  reduce(context, state, signals) {
    return signals.taxPercent
  }
}

const SubtotalStore = {
  state: 0,

  observe(context) {
    return {
      items: context.ItemStore
    }
  },

  reduce(context, state, signals) {
    return signals.items.reduce(
      (total, item) => total + (item.price * item.quantity), 0
    )
  }
}

const TotalTaxStore = {
  state: 0,

  observe(context) {
    return {
      subtotal: context.SubtotalStore,
      taxPercent: context.TaxStore
    }
  },

  reduce(context, state, signals) {
    return signals.subtotal * (signals.taxPercent / 100)
  }
}

const TotalStore = {
  state: 0,

  observe(context) {
    return {
      subtotal: context.SubtotalStore,
      tax: context.TotalTaxStore
    }
  },

  reduce(context, state, signals) {
    return signals.subtotal + signals.tax
  }
}



// testing
class Flux extends µFlux {
  constructor() {
    super()

    this.registerActions({ ShopActions })
    this.registerStores({
      ItemStore,
      TaxStore,
      SubtotalStore,
      TotalTaxStore,
      TotalStore
    })
  }
}

function test() {
  const flux = new Flux()
  const { ShopActions, SubtotalStore, TotalStore } = flux


  TotalStore.subscribe(total => console.log('Total price', total))

  ShopActions.addItem({ name: 'Soap', price: 5, quantity: 2 })
  ShopActions.taxPercentChanged(10)
}

test()
