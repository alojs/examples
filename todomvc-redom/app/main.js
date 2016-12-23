// @flow

import App from './app.js'
import { mount } from 'redom'

var app = new App()

document.addEventListener('DOMContentLoaded', function (event) {
  mount(document.getElementById('app'), app)
})
