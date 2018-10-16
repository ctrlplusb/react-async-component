import babel from 'rollup-plugin-babel'
import changeCase from 'change-case'
import packageJson from './package.json'

process.env.BABEL_ENV = 'production'

export default {
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
  plugins: [babel()],
}
