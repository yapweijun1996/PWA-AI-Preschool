import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

export async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  const listeners = new Set();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id) return listeners.forEach(fn => fn(message));
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    clearTimeout(request.timer);
    if (message.error) request.reject(new Error(JSON.stringify(message.error)));
    else request.resolve(message.result);
  });
  socket.addEventListener('close', () => {
    for (const request of pending.values()) {
      clearTimeout(request.timer);
      request.reject(new Error('Chrome CDP connection closed'));
    }
    pending.clear();
  });
  return {
    on: fn => listeners.add(fn),
    close: () => socket.close(),
    send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++sequence;
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }, 30000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
  };
}

export async function launchChrome() {
  const directory = await mkdtemp(join(tmpdir(), 'ui-audit-'));
  const executable = process.env.CHROME_PATH
    || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const child = spawn(executable, ['--headless=new', '--remote-debugging-port=0',
    `--user-data-dir=${directory}`, '--no-first-run', '--disable-gpu'],
  { stdio: ['ignore', 'ignore', 'pipe'] });
  let failure;
  let stderr = '';
  child.on('error', error => { failure = error; });
  child.stderr.on('data', chunk => { stderr = (stderr + chunk).slice(-4000); });
  const close = async () => {
    if (child.exitCode === null && !failure) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await Promise.race([exited, delay(3000)]);
      if (child.exitCode === null) { child.kill('SIGKILL'); await exited; }
    }
    await rm(directory, { recursive: true, force: true, maxRetries: 5 });
  };
  try {
    for (let attempt = 0; attempt < 150; attempt++) {
      if (failure) throw failure;
      if (child.exitCode !== null) throw new Error(`Chrome exited: ${stderr}`);
      const port = await readFile(join(directory, 'DevToolsActivePort'), 'utf8').catch(() => '');
      if (port) return { endpoint: `http://127.0.0.1:${port.split('\n')[0]}`, close };
      await delay(100);
    }
    throw new Error(`Chrome did not expose DevToolsActivePort: ${stderr}`);
  } catch (error) { await close(); throw error; }
}

export async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression, awaitPromise: true, returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
}
