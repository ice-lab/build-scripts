const Config = require('webpack-chain');

module.exports = ({ registerTask, registerUserConfig, registerCliOption, modifyConfigRegistration, modifyCliRegistration}) => {
  registerTask('taskApi', (new Config().name('task')));
  registerUserConfig({
    name: 'target',
    validation: 'string',
    configWebpack: (chain) => {
      chain.name('taskigore');
    }
  });
  registerUserConfig({
    name: 'output',
    validation: 'string',
  });
  registerCliOption({
    name: 'slient',
    commands: ['build']
  });
  registerCliOption({
    name: 'disableLog',
    commands: ['build']
  });
  modifyConfigRegistration('target', (options) => {
    return {
      ...options,
      ignoreTasks: ['taskApi'],
      validation: 'object',
    };
  });
  modifyConfigRegistration((options) => {
    const outputRegistration = options.output;
    if (outputRegistration) {
      options.output = {
        ...outputRegistration,
        validation: 'boolean',
      }
    }
    return options;
  });
  modifyCliRegistration('slient', (options) => {
    return {
      ...options,
      commands: ['start']
    }
  });
  modifyCliRegistration((options) => {
    const registration = options.disableLog;
    if (registration) {
      options.disableLog = {
        ...registration,
        commands: ['start'],
      }
    }
    return options;
  });
};