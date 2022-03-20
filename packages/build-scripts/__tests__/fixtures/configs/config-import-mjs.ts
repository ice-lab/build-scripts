import defineConfig from './defineConfig.mjs';
import path from 'path';

interface IConfig {
  entry: string;
}

const config: IConfig = defineConfig({
  entry: path.join('src', 'index.js'),
})

export default config;