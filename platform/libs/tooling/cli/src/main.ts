import { run } from './lib/run';

process.exitCode = run(process.argv.slice(2), {
  out: (line) => console.log(line),
  err: (line) => console.error(line),
});
