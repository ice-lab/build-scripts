import { Context } from 'build-scripts';

const hello = new Context({
  command: 'build',
  commandArgs: {
    // 
  }
});

console.log('hello', hello)