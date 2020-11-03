#!/usr/bin/env node
const start = require('../lib/apis/start');
const scriptPath = require.resolve('./child-process-start.js');

module.exports = () => {
  start(scriptPath);
};
