import express from "express";
import { createServer } from "http";
import type { IncomingMessage, ServerResponse } from "http";

import { registerRoutes } from "../server/routes";

// Vercel Serverless Function entrypoint.
// We create the Express app ONCE (cold start) and reuse it across invocations.

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

let handlerPromise: Promise<Handler> | null = null;

async function getHandler(): Promise<Handler> {
  if (handlerPromise) return handlerPromise;

  handlerPromise = (async () => {
    const app = express();
    const httpServer = createServer(app);

    // Match server/index.ts middleware (minimal + safe for serverless)
    app.use(
      express.json({
        verify: (req: any, _res, buf) => {
          req.rawBody = buf;
        },
      }),
    );
    app.use(express.urlencoded({ extended: false }));

    await registerRoutes(httpServer, app);

    // Important: don't call serveStatic() here; Vercel serves `dist/public` separately.
    return (req, res) => {
      // Express expects `req.url` to include querystring; Vercel provides it.
      app(req as any, res as any);
    };
  })();

  return handlerPromise;
}

export default async function vercelHandler(req: IncomingMessage, res: ServerResponse) {
  const handler = await getHandler();
  return handler(req, res);
}


