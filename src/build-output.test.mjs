import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";

const projectRoot = new URL("../", import.meta.url);

test("build emits a publishable static QW Page", async () => {
  const html = await readFile(new URL("dist/index.html", projectRoot), "utf8");
  const assets = await readdir(new URL("dist/assets/", projectRoot));

  assert.match(html, /<div id="root"><\/div>/);
  assert.doesNotMatch(html, /\/src\/main\.tsx/);
  assert.ok(assets.some((file) => file.endsWith(".js")));
  assert.ok(assets.some((file) => file.endsWith(".css")));
});
