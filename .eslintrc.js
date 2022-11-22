const { getESLintConfig } = require('@iceworks/spec');

module.exports = getESLintConfig('react-ts', {
  rules: {
    'no-async-promise-executor': 'off',
    '@iceworks/best-practices/recommend-polyfill': 'off',
    '@typescript-eslint/no-invalid-void-type': 'off',
  },
});
