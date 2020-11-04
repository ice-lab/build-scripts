#!/usr/bin/env node
const packageInfo = require('../package.json');
const createCli = require('../lib/apis/create-cli');

const scriptPath = require.resolve('./child-process-start.js');

(() => {
  createCli(() => [], scriptPath, packageInfo);
})();
