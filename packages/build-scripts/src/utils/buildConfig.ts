import path from 'path';
import fs from 'fs';
import { build as esbuild, Plugin } from 'esbuild';

const buildConfig = async (fileName: string): Promise<string> => {
  const pluginExternalDeps: Plugin = {
    name: 'plugin-external-deps',
    setup(build) {
      build.onResolve({ filter: /.*/ }, (args) => {
        const id = args.path;
        if (id[0] !== '.' && !path.isAbsolute(id)) {
          return {
            external: true,
          };
        }
      });
    },
  };
  const pluginReplaceImport: Plugin = {
    name: 'plugin-replace-import-meta',
    setup(build) {
      build.onLoad({ filter: /\.[jt]s$/ }, (args) => {
        const contents = fs.readFileSync(args.path, 'utf8');
        return {
          loader: args.path.endsWith('.ts') ? 'ts' : 'js',
          contents: contents
            .replace(
              /\bimport\.meta\.url\b/g,
              JSON.stringify(`file://${args.path}`),
            )
            .replace(
              /\b__dirname\b/g,
              JSON.stringify(path.dirname(args.path)),
            )
            .replace(/\b__filename\b/g, JSON.stringify(args.path)),
        };
      });
    },
  };

  const result = await esbuild({
    entryPoints: [fileName],
    outfile: 'out.js',
    write: false,
    platform: 'node',
    bundle: true,
    format: 'esm',
    metafile: true,
    plugins: [pluginExternalDeps, pluginReplaceImport],
  });
  const { text } = result.outputFiles[0];

  return text;
};

export default buildConfig;
