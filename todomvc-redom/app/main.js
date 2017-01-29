// @flow

import App, { InfoFooter } from './app.js'
import { mount, el } from 'redom'

var app = new App()

document.addEventListener('DOMContentLoaded', function (event) {
  mount(document.getElementById('app'), el('div', [
    app, new InfoFooter()
  ]))
})
