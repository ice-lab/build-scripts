/* eslint-disable no-nested-ternary */
import consola from 'consola';
import picocolors from 'picocolors';

// copy from consola
enum LogLevel {
  Fatal= 0,
  Error= 0,
  Warn= 1,
  Log= 2,
  Info= 3,
  Success= 3,
  Debug= 4,
  Trace= 5,
  Silent= -Infinity,
  Verbose= Infinity,
}

const colorize = (type: LogLevel) => (msg: string) => {
  const color =
    type === LogLevel.Info
      ? 'blue'
      : type === LogLevel.Error
        ? 'red'
        : type === LogLevel.Warn
          ? 'yellow'
          : 'green';
  return picocolors[color](msg);
};

function colorizeNamespace(
  name: string,
  type: LogLevel,
) {
  return `${picocolors.dim('[')}${colorize(type)(name.toUpperCase())}${picocolors.dim(']')} `;
}

/**
 * create logger
 * @param name
 * @returns
 */
export function createLogger(namespace?: string) {
  return {
    info(...args: string[]) {
      consola.info(
        colorizeNamespace(namespace, LogLevel.Info),
        ...args.map((item) => colorize(LogLevel.Info)(item)),
      );
    },

    error(...args: string[]) {
      consola.error(
        colorizeNamespace(namespace, LogLevel.Error),
        ...args.map((item) => colorize(LogLevel.Error)(item)),
      );
    },

    warn(...args: string[]) {
      consola.warn(
        colorizeNamespace(namespace, LogLevel.Warn),
        ...args.map((item) => colorize(LogLevel.Warn)(item)),
      );
    },

    debug(...args: string[]) {
      consola.debug(
        colorizeNamespace(namespace, LogLevel.Debug),
        ...args.map((item) => colorize(LogLevel.Debug)(item)),
      );
    },
  };
}

export type CreateLoggerReturns = ReturnType<typeof createLogger>;
