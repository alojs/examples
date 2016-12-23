(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var process;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};
require.register("app.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appStore = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _redom = require('redom');

var _lib = require('./lib.js');

var _router = require('./router.js');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Setup core app store
 */
/**
 * Holds the initial state for the app store
 */
var initialState = {
  /**
   * Holds a version number of this app, this is essential if you want to store the state in the localStorage
   * So you can check if the localStorage has an old, invalid state
   */
  version: 1
};
var appStore = exports.appStore = _lib.alo.createStore(initialState, 'app');

/*
 * Setup the thunkMiddleware on the app store.
 */
appStore.addMiddleware(_lib.thunkMiddleware);

/**
 * The app class, its main purpose is to be the centralized point for the app rendering'
 */

var App = function () {
  /* :: el: HTMLElement */
  /* :: sub: Object */
  function App() {
    _classCallCheck(this, App);

    var self = this;

    this.el = (0, _redom.el)('div.todoApp');
    this.sub = _router.routerStore.createSubscription();
    this.sub.createMember(function (stores, computed) {
      self.update(stores.router.state);
    });
    self.update({ route: 'loading' });
    setTimeout(function () {
      console.log('dispatch');
      _router.routerStore.dispatch((0, _router.setRoute)('todos'));
    }, 5000);
  }

  _createClass(App, [{
    key: 'update',
    value: function update(routerState) {
      switch (routerState.route) {
        case 'loading':
          (0, _redom.setChildren)(this.el, [(0, _redom.el)('span', 'loading')]);
          break;
        case 'todos':
          (0, _redom.setChildren)(this.el, [(0, _redom.el)('span', 'todos')]);
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      this.sub.stop();
      delete this.el;
    }
  }]);

  return App;
}();

exports.default = App;
});

;require.register("lib.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.thunkMiddleware = exports.alo = undefined;

var _aloFullDev = require('alo/dist/alo.full.dev.js');

var _aloFullDev2 = _interopRequireDefault(_aloFullDev);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Alo instance for this app
 */
var alo = exports.alo = new _aloFullDev2.default();

/**
 * This middleware allows to dispatch functions
 */


var thunkMiddleware = exports.thunkMiddleware = alo.extras.middlewares.createThunk();
});

;require.register("main.js", function(exports, require, module) {
'use strict';

var _app = require('./app.js');

var _app2 = _interopRequireDefault(_app);

var _redom = require('redom');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = new _app2.default();

document.addEventListener('DOMContentLoaded', function (event) {
  (0, _redom.mount)(document.getElementById('app'), app);
});
});

;require.register("router.js", function(exports, require, module) {
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.routeReducer = exports.setRoute = exports.routerStore = undefined;

var _lib = require('./lib.js');

/**
 * Holds the initial state for the router store
 */
var initialState = {
  /**
   * Holds just the name of the current route
   */
  route: ''
};

var routerStore = exports.routerStore = _lib.alo.createStore(initialState, 'router');
// routerStore.addMiddleware(thunkMiddleware)

/**
 * Returns an action object, which can be dispatched on the router to set a specific route
 */
var setRoute = exports.setRoute = function setRoute(route) {
  return {
    type: 'setRoute',
    payload: route
  };
};

/*
 * Route reducer
 */
var routeReducer = exports.routeReducer = routerStore.createReducer(function (state, action) {
  console.log('dispatch', action);
  switch (action.type) {
    case 'setRoute':
      state.route = action.payload;
      break;
  }

  return state;
});

console.log('router');
routerStore.dispatch(setRoute('loading')).catch(function (err) {
  console.error(err);
}).then(function () {
  console.log('dispatch done');
});

window.routerStore = routerStore;
window.alo = _lib.alo;
});

;require.alias("buffer/index.js", "buffer");
require.alias("process/browser.js", "process");process = require('process');require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');


//# sourceMappingURL=app.js.map