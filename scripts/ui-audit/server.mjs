import {createServer} from 'node:http';
import {readFile, realpath, stat} from 'node:fs/promises';
import {resolve, sep, extname} from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2'
};

function requestPath(target) {
  if (!target?.startsWith('/') || target.startsWith('//')) throw new Error('Invalid path');
  const path = decodeURIComponent(target.split(/[?#]/, 1)[0]);
  if (path.includes('\0') || path.includes('\\') || path.split('/').includes('..')) {
    throw new Error('Invalid path');
  }
  return path.endsWith('/') ? `${path}index.html` : path;
}

function inside(root, file) {
  return file === root || file.startsWith(`${root}${sep}`);
}

async function serve(request, response, root) {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, {Allow: 'GET, HEAD'}).end();
    return;
  }
  let pathname;
  try {
    pathname = requestPath(request.url);
  } catch {
    response.writeHead(400).end('Invalid request path');
    return;
  }
  try {
    const file = await realpath(resolve(root, `.${pathname}`));
    if (!inside(root, file)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(file);
    if (!info.isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    const body = request.method === 'HEAD' ? null : await readFile(file);
    response.writeHead(200, {
      'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream',
      'Content-Length': info.size, 'Cache-Control': 'no-store'
    }).end(body);
  } catch (error) {
    const status = ['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code) ? 404 : 500;
    response.writeHead(status).end(status === 404 ? 'Not found' : 'Unable to read file');
  }
}

export async function startServer(root = 'dist') {
  const directory = await realpath(resolve(root));
  if (!(await stat(directory)).isDirectory()) throw new Error(`Not a directory: ${root}`);
  const server = createServer((request, response) => {
    void serve(request, response, directory);
  });
  await new Promise((accept, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      accept();
    });
  });
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    close: async () => {
      await new Promise((accept, reject) => {
        server.close((error) => error ? reject(error) : accept());
        server.closeAllConnections();
      });
    }
  };
}
