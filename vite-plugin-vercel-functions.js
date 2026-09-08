import path from "node:path";
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";

/*
 * Runs the Vercel api/*.js serverless functions inside the Vite dev
 * server so `npm run dev` can exercise the same endpoints Vercel serves
 * in production ("/api/<name>" -> api/<name>.js).
 *
 * Dev-only: configureServer never runs during `vite build`.
 * Production behavior on Vercel is unchanged.
 */

function readBody(req) {
  return new Promise((resolve) => {
    if (req.body) {
      return resolve(req.body);
    }

    const chunks = [];

    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");

      if (!raw) {
        return resolve({});
      }

      try {
        return resolve(JSON.parse(raw));
      } catch {
        return resolve({});
      }
    });
    req.on("error", () => resolve({}));
  });
}

function buildRes(res) {
  let statusCode = res.statusCode || 200;

  return {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      res.statusCode = statusCode;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(payload));
    },
    send(payload) {
      res.statusCode = statusCode;
      res.end(payload);
    },
    end(payload) {
      res.statusCode = statusCode;
      res.end(payload);
    },
    setHeader(name, value) {
      res.setHeader(name, value);
      return this;
    },
  };
}

function sendPlain(res, status, message) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: message }));
}

function resolveHandlerFile(root, parts) {
  let absPath = path.join(root, "api", ...parts);

  if (existsSync(absPath)) {
    return absPath;
  }

  absPath += ".js";

  if (existsSync(absPath)) {
    return absPath;
  }

  return null;
}

export default function vercelFunctions() {
  return {
    name: "forsa-vercel-functions",
    configureServer(server) {
      const root = server.config.root || process.cwd();

      server.middlewares.use(async (req, res, next) => {
        const { pathname } = new URL(req.url || "", "http://localhost");

        if (!pathname.startsWith("/api/")) {
          return next();
        }

        const parts = pathname
          .slice("/api/".length)
          .split("/")
          .filter(Boolean);

        if (!parts.length) {
          return sendPlain(res, 404, "Not found.");
        }

        const unsafe = parts.some(
          (part) =>
            !/^[\w-]+$/.test(part) ||
            part.startsWith("_") ||
            part === ".."
        );

        if (unsafe) {
          return sendPlain(res, 404, "Not found.");
        }

        const absPath = resolveHandlerFile(root, parts);

        if (!absPath) {
          return sendPlain(res, 404, "Not found.");
        }

        try {
          const body = await readBody(req);
          Object.defineProperty(req, "body", {
            value: body,
            configurable: true,
            enumerable: true,
          });
        } catch {
          // Body parsing is best-effort; handlers use req.body ?? {}.
        }

        let handler;

        try {
          const module = await import(pathToFileURL(absPath).href);
          handler = module.default;
        } catch (error) {
          console.error(
            `[api] Failed to load ${path.relative(root, absPath)}:`,
            error.message
          );
          return sendPlain(res, 500, "Server function failed to load.");
        }

        if (typeof handler !== "function") {
          return sendPlain(res, 404, "Not found.");
        }

        try {
          await handler(req, buildRes(res));
        } catch (error) {
          console.error(
            `[api] ${path.relative(root, absPath)} failed:`,
            error.message
          );

          if (!res.headersSent) {
            sendPlain(res, 500, "Internal server error.");
          }
        }
      });
    },
  };
}