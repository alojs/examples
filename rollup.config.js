import serve from 'rollup-plugin-serve'
import path from 'path'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import flow from 'rollup-plugin-flow'
import stylus from 'rollup-plugin-stylus'
import modularcss from 'modular-css/rollup'

export default {
  entry: 'app/main.js',
  dest: './dist/app.js',
  plugins: [
    modularcss({
      css: './dist/lib.css',
    }),
    stylus({
      output: './dist/app.css',
    }),
    flow(),
    nodeResolve({
      jsnext: true,
      main: true
    }),
    commonjs(),
    serve({
      contentBase: path.join(__dirname, 'dist')
    })
  ],
  format: 'umd'
};
