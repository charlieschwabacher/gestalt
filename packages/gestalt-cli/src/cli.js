// @flow
import fs from 'fs';
import childProcess from 'child_process';
import prompt from 'prompt';

export function get(property: Object): Promise<Object> {
  return new Promise((resolve, reject) =>
    prompt.get(property, (err, result) => err ? reject(err) : resolve(result))
  );
}

export function exec(command: string): Promise<mixed> {
  return new Promise((resolve, reject) =>
    childProcess.exec(command, (err, stdout) => err ? reject(err) : resolve(stdout))
  );
}

export function copy(source: string, target: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const read = fs.createReadStream(source);
    const write = fs.createWriteStream(target);
    read.on('error', reject);
    write.on('error', reject);
    write.on('close', resolve);
    read.pipe(write);
  });
}
