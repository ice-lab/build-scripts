interface Config {
  entry: string;
  plugins: string[];
}

const config: Config = {
  entry: 'src/index',
  plugins: ['./plugin.js']
};

export default config;