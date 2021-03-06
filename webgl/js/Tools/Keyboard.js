import EventEmitter from '/webgl/js/Tools/EventEmitter'

import { Store } from '/webgl/js/Tools/Store'

export default class Keyboard extends EventEmitter {
  constructor () {
    super()

    // Resize event
    window.addEventListener('keydown', this.getKey.bind(this))
  }

  getKey (e) {
    const key = e.key

    this.trigger('keyPressed', [key])
  }
}
