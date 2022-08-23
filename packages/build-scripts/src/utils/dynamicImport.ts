import { pathToFileURL } from 'url';
import path from 'path';

export default async function dynamicImport(filePath: string, timestamp?: boolean) {
  const isWin32 = process.platform === 'win32';
  let importPath = filePath;

  if (isWin32) {
    const importUrl = pathToFileURL(importPath.split(path.sep).join('/'));
    if (timestamp) {
      importUrl.search = `t=${Date.now()}`;
    }
    importPath = importUrl.toString();
  } else if (timestamp) {
    importPath += `t=${Date.now()}`;
  }
  return await import(importPath);
}
