import { uglify } from 'rollup-plugin-uglify'
import packageJson from './package.json'
import baseConfig from './rollup.config'

baseConfig.plugins.push(uglify())
baseConfig.output.file = `dist/${packageJson.name}.min.js`

export default baseConfig
