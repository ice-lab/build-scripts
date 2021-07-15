import Module = require('module');

interface IOptions {
  paths: string[];
}

function hijackWebpackResolve(webpack: any, rootDir: string): void {
  const webpackRegex = /^webpack\//;
  // eslint-disable-next-line no-underscore-dangle
  const originalResolver = (Module as any)._resolveFilename;

  // eslint-disable-next-line no-underscore-dangle
  (Module as any)._resolveFilename = function(
    request: string,
    parent: string,
    isMain: boolean,
    options: IOptions,
  ): void {
    if (request.match(webpackRegex)) {
      const newOptions: IOptions = { paths: [] };
      if (options?.paths) {
        newOptions.paths = options.paths?.includes(rootDir)
          ? options.paths
          : options.paths?.concat(rootDir);
      } else {
        newOptions.paths.push(rootDir);
      }
      return originalResolver.apply(this, [
        request,
        parent,
        isMain,
        newOptions,
      ]);
    }
    return originalResolver.apply(this, [request, parent, isMain, options]);
  };
  // eslint-disable-next-line no-underscore-dangle
  const originalLoader = (Module as any)._load;
  // eslint-disable-next-line no-underscore-dangle
  (Module as any)._load = function(request: string, parent: object) {
    let moduleRequest = request;
    // ignore case which pass parent
    if (parent) {
      if (request === 'webpack') {
        return webpack;
      } else if (request.match(webpackRegex)) {
        try {
          moduleRequest = require.resolve(request, { paths: [rootDir] });
        } catch (e) {
          // ignore error
        }
      }
    }
    return originalLoader.apply(this, [moduleRequest, parent]);
  };
}

export default hijackWebpackResolve;
