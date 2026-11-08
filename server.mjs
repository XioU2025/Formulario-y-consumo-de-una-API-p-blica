// Servidor estático local sin dependencias externas.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('.', import.meta.url)));
const PORT = Number(process.env.PORT) || 3000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const ALLOWED_TOP_LEVEL = new Set(['index.html', 'css', 'dist', 'src']);

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
    const requested = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
    const filePath = normalize(join(ROOT, requested));

    // Evita salir de la carpeta del proyecto y exponer archivos internos.
    const relative = filePath.slice(ROOT.length + 1);
    const topLevel = relative.split(sep)[0] ?? '';
    if (!filePath.startsWith(ROOT + sep) || !ALLOWED_TOP_LEVEL.has(topLevel)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 - No encontrado');
      return;
    }

    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('No es un archivo');

    const body = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[extname(filePath)] ?? 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 - No encontrado');
  }
});

server.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});
