"use strict";

const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8"
};

const server = http.createServer((request, response) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  } catch {
    response.writeHead(400).end("Bad request");
    return;
  }

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.resolve(root, "." + requestedPath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    response.writeHead(403).end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, contents) => {
    if (error) {
      response.writeHead(404).end("Not found");
      return;
    }
    response.writeHead(200, {
      "Content-Type": mime[path.extname(filePath)] || "application/octet-stream"
    });
    response.end(contents);
  });
});

async function main() {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto("http://127.0.0.1:" + address.port + "/tests/test.html");
    await page.getByRole("button", { name: "开始测试" }).click();
    await page.waitForFunction(
      () => document.getElementById("summary").textContent.includes("测试结束"),
      null,
      { timeout: 30000 }
    );

    const summary = await page.locator("#summary").textContent();
    const failures = await page.locator("#results .fail").allTextContents();
    console.log(summary.trim());
    if (failures.length) {
      console.error(failures.join("\n"));
      throw new Error("浏览器功能测试失败。");
    }
    if (pageErrors.length) {
      console.error(pageErrors.join("\n"));
      throw new Error("浏览器页面发生未处理异常。");
    }
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve())
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
