var path = require('path')

module.exports = {
  paths: {
    public: path.join(__dirname, 'dist')
  },

  files: {
    javascripts: {
      joinTo: {
        'vendor.js': /^(?!app)/,
        'app.js': /^app/
      }
    },
    stylesheets: {joinTo: 'app.css'}
  },

  plugins: {
    eslint: {
      pattern: /^app\/.*\.js?$/,
      warnOnly: true,
      config: {rules: {'array-callback-return': 'warn'}}
    },
    flowtype: {statusDelay: 250, warnOnly: true},
    babel: {presets: ['es2015']}
  }
};
