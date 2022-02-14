module.exports = ({
  registerUserConfig,
  registerCliOption,
}) => {
  registerUserConfig([
    {
      name: 'entry',
      validation: 'string'
    }
  ]);

  registerCliOption([
    {
      name: 'https',
      commands: ['start', 'build']
    }
  ])
}