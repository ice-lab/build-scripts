import semver = require('semver');
import log = require('./log');

export = function checkNodeVersion(requireNodeVersion: string): void {
  if (!semver.satisfies(process.version, requireNodeVersion)) {
    log.error('ENV', `You are using Node ${process.version}`);
    log.error(
      'ENV',
      `build-scripts requires Node ${requireNodeVersion}, please update Node.`,
    );
    process.exit(1);
  }
};
