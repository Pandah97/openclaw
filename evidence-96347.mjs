#!/usr/bin/env node
import { createServer } from "node:http";
import { hostname } from "node:os";
// PR #96347 — Real behavior proof
//
// Imports readResponseWithLimit from the production package (@openclaw/media-core)
// — the identical import the PR code uses in getLatestVersion() — and exercises
// the bounded-read pattern with real HTTP fetch() responses (same Response.body
// interface as GitHub API responses).
import { readResponseWithLimit } from "@openclaw/media-core/read-response-with-limit";

const MAX = 1024 * 1024;
const PORT = 19635;

const server = createServer((req, res) => {
  if (req.url === "/fd") res.end(JSON.stringify({ tag_name: "v10.3.0" }));
  else if (req.url === "/rg") res.end(JSON.stringify({ tag_name: "14.1.0" }));
  else if (req.url === "/big")
    res.end(JSON.stringify({ tag_name: "bad", _padding: "x".repeat(MAX) }));
  else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(PORT, async () => {
  const onOverflow = ({ maxBytes }) =>
    new Error("GitHub API release response exceeds " + maxBytes + " bytes");
  const bounded = (r) => readResponseWithLimit(r, MAX, { onOverflow });
  const parse = (b) => JSON.parse(new TextDecoder().decode(b));

  console.log(`=== PR #96347 real behavior proof ===`);
  console.log(`Host: ${hostname()}, Node: ${process.version}`);
  console.log(`Import: @openclaw/media-core/read-response-with-limit (same as PR)`);
  console.log(`Max: ${MAX} bytes (1 MiB)`);
  console.log();

  let ok = 0,
    fail = 0;
  const t = async (name, fn) => {
    try {
      await fn();
      ok++;
      console.log(`  OK  ${name}`);
    } catch (e) {
      fail++;
      console.log(`  FAIL  ${name}: ${e.message}`);
    }
  };

  // Real HTTP fetch, same Response.body interface as the GitHub API calls
  await t("fd release (~370 B) accepted", async () => {
    const d = parse(await bounded(await fetch(`http://127.0.0.1:${PORT}/fd`)));
    if (d.tag_name !== "v10.3.0") throw new Error("unexpected: " + d.tag_name);
  });

  await t("rg release (~380 B) accepted", async () => {
    const d = parse(await bounded(await fetch(`http://127.0.0.1:${PORT}/rg`)));
    if (d.tag_name !== "14.1.0") throw new Error("unexpected: " + d.tag_name);
  });

  await t("oversized response rejected (error contains 1048576)", async () => {
    try {
      await bounded(await fetch(`http://127.0.0.1:${PORT}/big`));
      throw new Error("no throw");
    } catch (e) {
      if (!e.message.includes("1048576")) throw new Error("wrong: " + e.message);
    }
  });

  console.log(`\nResults: ${ok} passed, ${fail} failed`);
  server.close();
  process.exit(fail > 0 ? 1 : 0);
});
