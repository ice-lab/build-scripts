import Module = require('module');

interface IOptions {
  paths: string[];
}

function hijackWebpackResove(rootDir: string): void {
  // eslint-disable-next-line no-underscore-dangle
  const originalResolver = (Module as any)._resolveFilename;

  // eslint-disable-next-line no-underscore-dangle
  (Module as any)._resolveFilename = function (request: string, parent: string, isMain: boolean, options: IOptions): void {
    if (request.match(/^webpack/)) {
      const newOptions: IOptions = { paths: [] };
      if (options?.paths) {
        newOptions.paths = options?.paths.concat(rootDir);
      } else {
        newOptions.paths.push(rootDir);
      }
      return originalResolver(request, parent, isMain, newOptions);
    }
    return originalResolver(request, parent, isMain, options);
  };
}

export default hijackWebpackResove;