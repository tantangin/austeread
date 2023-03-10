import { NextFunction, Request, Response } from "express";
import fsp from "fs/promises";
import path from "path";
import express from "express";
import { createServer as createViteServer } from "vite";
import compression from "compression";
import { installGlobals } from "@remix-run/node";

// Polyfill Web Fetch API
installGlobals();

let root = process.cwd();
let isProduction = process.env.NODE_ENV === "production";

function resolve(p: string) {
  return path.resolve(__dirname, p);
}

const getStyleSheets = async () => {
  try {
    const assetpath = resolve("dist/assets");
    const files = await fsp.readdir(assetpath);
    const cssAssets = files.filter((l) => l.endsWith(".css"));
    const allContent: any[] = [];
    for (const asset of cssAssets) {
      const content = await fsp.readFile(path.join(assetpath, asset), "utf-8");
      allContent.push(`<style type="text/css">${content}</style>`);
    }
    return allContent.join("\n");
  } catch {
    return "";
  }
};

async function createServer(isProd = process.env.NODE_ENV === "production") {
  let app = express();
  /**
   * @type {import('vite').ViteDevServer}
   */

  // Create Vite server in middleware mode and configure the app type as
  // 'custom', disabling Vite's own HTML serving logic so parent server
  // can take control
  const vite = await createViteServer({
    root,
    server: { middlewareMode: "ssr" },
  });

  // use vite's connect instance as middleware
  // if you use your own express router (express.Router()), you should use router.use
  app.use(vite.middlewares);

  // file static asset
  const requestHandler = express.static(resolve("assets"));
  app.use(requestHandler);
  app.use("/assets", requestHandler);

  if (isProd) {
    app.use(compression());
    app.use(express.static(resolve("dist/client")));
  }

  const stylesheets = getStyleSheets();

  app.use("*", async (req: Request, res: Response, next: NextFunction) => {
    const url = req.originalUrl;
    try {
      // 1. Read index.html
      let template = await fsp.readFile(isProd ? resolve("dist/client/index.html") : resolve("index.html"), "utf-8");

      // 2. Apply Vite HTML transforms. This injects the Vite HMR client, and
      //    also applies HTML transforms from Vite plugins, e.g. global preambles
      //    from @vitejs/plugin-react
      template = await vite.transformIndexHtml(url, template);

      // 3. Load the server entry. vite.ssrLoadModule automatically transforms
      //    your ESM source code to be usable in Node.js! There is no bundling
      //    required, and provides efficient invalidation similar to HMR.
      let productionBuildPath = path.join(__dirname, "./dist/server/entry-server.mjs");
      let devBuildPath = path.join(__dirname, "./src/client/entry-server.tsx");

      const { render } = await vite.ssrLoadModule(isProd ? productionBuildPath : devBuildPath);

      // 4. render the app HTML. This assumes entry-server.js's exported `render`
      //    function calls appropriate framework SSR APIs,
      //    e.g. ReactDOMServer.renderToString()
      const appHtml = await render(req);
      const cssAssets = isProd ? "" : await stylesheets;

      // 5. Inject the app-rendered HTML into the template.
      const html = template.replace(`<!--app-html-->`, appHtml).replace(`<!--head-->`, cssAssets);

      // 6. Send the rendered HTML back.
      res.status(200).set({ npm: "text/html", "Content-Type": "text/html" }).end(html);
    } catch (error: any) {
      if (!isProduction) {
        vite.ssrFixStacktrace(error);
      }
      console.error(error.stack);
      res.status(500).end(error.stack);
    }
  });

  return app;
}

createServer().then((app) => {
  app.listen(3000, () => {
    console.log("HTTP server is running at http://localhost:3000");
  });
});
