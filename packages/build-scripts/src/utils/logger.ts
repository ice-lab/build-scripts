/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-nested-ternary */
import picocolors from 'picocolors';

export type LOG_LEVEL = 'info' | 'success' | 'error' | 'warn';

let silent = false;

const colorize = (type: LOG_LEVEL) => (msg: string) => {
  const color =
    type === 'info'
      ? 'blue'
      : type === 'error'
        ? 'red'
        : type === 'warn'
          ? 'yellow'
          : 'green';
  return picocolors[color](msg);
};

function colorizeLabel(
  name: string | undefined,
  label: string,
  type: LOG_LEVEL,
) {
  return [
    name && `${picocolors.dim('[')}${name.toUpperCase()}${picocolors.dim(']')}`,
    colorize(type)(label.toUpperCase()),
  ]
    .filter(Boolean)
    .join(' ');
}

export function setSlient() {
  silent = true;
}

/**
 * create logger
 * @param name
 * @returns
 */
export function createLogger(name?: string) {
  return {
    log(
      type: LOG_LEVEL,
      label: string,
      msg: string,
    ) {
      switch (type) {
        case 'error':
          console.error(
            colorizeLabel(name, label, 'error'),
            colorize('error')(msg),
          );
          break;
        default:
          if (!silent) {
            console.log(
              colorizeLabel(name, label, type),
              colorize(type)(msg),
            );
          }
      }
    },
    success(label: string, msg: string) {
      this.log('success', label, msg);
    },
    info(label: string, msg: string) {
      this.log('info', label, msg);
    },
    warn(label: string, msg: string) {
      this.log('warn', label, msg);
    },
    error(label: string, msg: string) {
      this.log('error', label, msg);
    },
  };
}

export type CreateLoggerReturns = ReturnType<typeof createLogger>;
