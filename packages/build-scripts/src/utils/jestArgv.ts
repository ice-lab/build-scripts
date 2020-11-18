export function ensureTestMatchArray(argv) {
  const { testMatch } = argv;
  if (typeof testMatch === 'string') {
    if (/^\[.+\]$/.test(testMatch)) {
      argv.testMatch = JSON.parse(testMatch.replace(/'/g, '"'));
    } else {
      argv.testMatch = [testMatch];
    }
  }
}
