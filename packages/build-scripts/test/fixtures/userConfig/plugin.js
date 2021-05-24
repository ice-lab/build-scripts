module.exports = ({ registerUserConfig }) => {
  registerUserConfig({
    name: 'targets',
    validation: 'object|string',
  });

  registerUserConfig({
    name: 'output',
    validation: 'string',
  });
}