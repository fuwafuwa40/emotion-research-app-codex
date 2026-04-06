#!/usr/bin/env node
import net from "node:net";
import { spawn } from "node:child_process";

const args = new Set(process.argv.slice(2));
const shouldOpenBrowser = !args.has("--no-open");
const preferredPort = Number.parseInt(process.env.EXPO_PORT ?? "", 10);
const portCandidates = [
  Number.isFinite(preferredPort) ? preferredPort : null,
  8081,
  11000,
  8082,
  8083,
  8084,
  8085,
].filter((value, index, array) => value !== null && array.indexOf(value) === index);

function openBrowser(url) {
  if (process.platform === "win32") {
    const child = spawn("cmd", ["/c", "start", "", url], {
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    return;
  }

  const command = process.platform === "darwin" ? "open" : "xdg-open";
  const child = spawn(command, [url], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once("error", () => {
      resolve(false);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

async function findAvailablePort() {
  for (const port of portCandidates) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  throw new Error("No available port found for Expo web preview.");
}

const port = await findAvailablePort();
const url = `http://localhost:${port}`;
console.log(`[web] Starting Expo web on ${url}`);

const child =
  process.platform === "win32"
    ? spawn(`npx expo start --web --port ${port}`, {
        shell: true,
        stdio: ["inherit", "pipe", "pipe"],
      })
    : spawn("npx", ["expo", "start", "--web", "--port", String(port)], {
        stdio: ["inherit", "pipe", "pipe"],
      });

let browserOpened = false;

const forwardOutput = (stream, writer) => {
  stream.on("data", (chunk) => {
    const text = chunk.toString();
    writer.write(text);

    if (!browserOpened && shouldOpenBrowser && text.includes(`Waiting on ${url}`)) {
      browserOpened = true;
      console.log(`[web] Opening ${url}`);
      openBrowser(url);
    }
  });
};

forwardOutput(child.stdout, process.stdout);
forwardOutput(child.stderr, process.stderr);

const shutdown = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
