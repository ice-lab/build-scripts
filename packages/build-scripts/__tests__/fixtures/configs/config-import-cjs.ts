import defineConfig from './defineConfig.cjs';
import * as path from 'path';

interface IConfig {
  entry: string;
}

const config: IConfig = defineConfig({
  entry: path.join('src', 'index.js'),
})

export default config;