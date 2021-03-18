import chalk from 'chalk';

const MS_IN_MINUTE = 60000;
const MS_IN_SECOND = 1000;

const tagBg = (text: string) => chalk.bgBlack.green.bold(text);
const textWithColor = (text: string, time: number) => {
  let textModifier = chalk.bold;
  if (time > 10000) {
    textModifier = textModifier.red;
  } else if (time > 2000) {
    textModifier = textModifier.yellow;
  } else {
    textModifier = textModifier.green;
  }

  return textModifier(text);
};

// inspired by https://github.com/stephencookdev/speed-measure-webpack-plugin/blob/master/output.js#L8
const humanTime = (start: number, end: number) => {
  const ms = end - start;
  const minutes = Math.floor(ms / MS_IN_MINUTE);
  const secondsRaw = (ms - minutes * MS_IN_MINUTE) / MS_IN_SECOND;
  const secondsWhole = Math.floor(secondsRaw);
  const remainderPrecision = secondsWhole > 0 ? 2 : 3;
  const secondsRemainder = Math.min(secondsRaw - secondsWhole, 0.99);
  const seconds =
    secondsWhole +
    secondsRemainder
      .toPrecision(remainderPrecision)
      .replace(/^0/, '')
      .replace(/0+$/, '')
      .replace(/^\.$/, '');

  let time = '';

  if (minutes > 0) time += `${minutes  } min${  minutes > 1 ? 's' : ''  }, `;
  time += `${seconds  } secs`;

  return time;
};

export {
  tagBg,
  textWithColor,
  humanTime,
};