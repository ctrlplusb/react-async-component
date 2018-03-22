const babel = require('rollup-plugin-babel')
const changeCase = require('change-case')
const packageJson = require('./package.json')

process.env.BABEL_ENV = 'production'

module.exports = {
  external: ['react', 'prop-types'],
  input: 'src/index.js',
  output: {
    file: `dist/${packageJson.name}.js`,
    format: 'cjs',
    sourcemap: true,
    name: changeCase
      .titleCase(packageJson.name.replace(/-/g, ' '))
      .replace(/ /g, ''),
  },
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [['env', { modules: false }], 'stage-3', 'react'],
      plugins: ['transform-class-properties', 'external-helpers'],
    }),
  ],
}
