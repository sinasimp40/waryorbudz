import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";
import { injectThemeIntoHtml } from "./themeInjector";

const viteLogger = createLogger();

let _viteInstance: Awaited<ReturnType<typeof createViteServer>> | null = null;

export async function createVite(server: Server) {
  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: {
      ...((viteConfig.server as object) || {}),
      middlewareMode: true,
      hmr: false,
      allowedHosts: true as const,
    },
    appType: "custom",
  });
  _viteInstance = vite;
  return vite;
}

export async function setupVite(server: Server, app: Express) {
  const vite = _viteInstance || await createVite(server);

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      // Inject theme colors from database directly into HTML
      template = await injectThemeIntoHtml(template);
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
