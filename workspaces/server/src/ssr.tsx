import { createReadStream } from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import fastifyStatic from '@fastify/static';
import { createRoutes } from '@wsh-2025/client/src/app/createRoutes';
import { createStore } from '@wsh-2025/client/src/app/createStore';
import type { FastifyInstance } from 'fastify';
import { createStandardRequest } from 'fastify-standard-request-reply';
import htmlescape from 'htmlescape';
import { createStaticHandler } from 'react-router';

export function registerSsr(app: FastifyInstance): void {
  const clientDistDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
  const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../public');
  const publicImagesDir = path.resolve(publicDir, 'images');
  const renderHtml = (hydrationData: unknown) => {
    return `<!doctype html><html lang="ja"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><script defer src="/public/main.js"></script></head><body><script>window.__staticRouterHydrationData=${htmlescape(hydrationData)};</script></body></html>`;
  };

  app.register(fastifyStatic, {
    cacheControl: true,
    etag: true,
    preCompressed: true,
    prefix: '/public/',
    root: [clientDistDir, publicDir],
    setHeaders: (res, filePath) => {
      const ext = path.extname(filePath);
      if (filePath.includes('/client/dist/chunk-')) {
        res.setHeader('cache-control', 'public, max-age=31536000, immutable');
        return;
      }
      if (['.css', '.js', '.json', '.map', '.mjs', '.wasm'].includes(ext)) {
        res.setHeader('cache-control', 'public, max-age=3600');
        return;
      }
      if (['.svg', '.webp', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff2', '.woff', '.ttf'].includes(ext)) {
        res.setHeader('cache-control', 'public, max-age=86400');
      }
    },
  });

  app.get('/favicon.ico', (_, reply) => {
    return reply.status(404).send();
  });

  app.get<{ Params: { imageName: string } }>('/public/images/:imageName', async (req, reply) => {
    const imageName = path.basename(req.params.imageName);
    const ext = path.extname(imageName).toLowerCase();
    const requestedPath = path.join('images', imageName);
    if (!['.jpeg', '.jpg'].includes(ext)) {
      return reply.sendFile(requestedPath, publicDir);
    }

    const webpName = `${path.basename(imageName, ext)}.webp`;
    const webpPath = path.resolve(publicImagesDir, webpName);
    try {
      await fsp.access(webpPath);
      return reply
        .header('cache-control', 'public, max-age=3600')
        .header('vary', 'accept')
        .type('image/webp')
        .send(createReadStream(webpPath));
    } catch {
      return reply.sendFile(requestedPath, publicDir);
    }
  });

  app.get('/*', async (req, reply) => {
    // @ts-expect-error ................
    const request = createStandardRequest(req, reply);

    const store = createStore();
    const handler = createStaticHandler(createRoutes(store));
    const context = await handler.query(request);

    if (context instanceof Response) {
      return reply.send(context);
    }

    const hydrationData = {
      ...(context.actionData != null ? { actionData: context.actionData } : {}),
      loaderData: context.loaderData,
    };

    return reply.type('text/html').send(renderHtml(hydrationData));
  });
}
