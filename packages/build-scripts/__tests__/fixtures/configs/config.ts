import * as path from 'path';

interface IConfig {
  entry: string;
}

const config: IConfig = {
  entry: path.join('src', 'index.js'),
};

export default config;
