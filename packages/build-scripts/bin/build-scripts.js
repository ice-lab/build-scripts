#!/usr/bin/env node
const packageInfo = require('../package.json');
const scriptPath = require.resolve('./child-process-start.js');

const createCli = require('../lib/apis/create-cli');

(async () => {
  createCli(() => { }, scriptPath, packageInfo);
})();
