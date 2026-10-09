#!/usr/bin/env node

import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../out/", import.meta.url)));
const portIndex = process.argv.indexOf("--port");
const port = Number(process.env["PORT"] ?? (portIndex < 0 ? 3100 : process.argv[portIndex + 1]));
const basePath = (process.env["NEXT_PUBLIC_BASE_PATH"] ?? "").replace(/\/+$/, "");
const types = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".wasm", "application/wasm"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

if (!existsSync(root)) {
  throw new Error(`Static export directory not found at ${root}; run npm run build first.`);
}

createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  if (basePath) {
    if (pathname === basePath) pathname = "/";
    else if (pathname.startsWith(`${basePath}/`)) pathname = pathname.slice(basePath.length);
    else {
      response.writeHead(404).end("Not found");
      return;
    }
  }

  let file = resolve(root, `.${pathname}`);
  if (file !== root && !file.startsWith(`${root}${sep}`)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  if (existsSync(file) && statSync(file).isDirectory()) file = resolve(file, "index.html");
  if (!existsSync(file) || !statSync(file).isFile()) {
    response.writeHead(404).end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": types.get(extname(file)) ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  if (request.method === "HEAD") response.end();
  else createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`Serving ${root} at http://127.0.0.1:${port}\n`);
});
