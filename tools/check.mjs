import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("..", import.meta.url));
let count = 0;
async function walk(dir) {
  for (let e of await fs.readdir(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    let p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (/\.(m?js)$/.test(p)) {
      let r = spawnSync(process.execPath, ["--check", p], { encoding: "utf8" });
      if (r.status !== 0) throw Error(r.stderr);
      let text = await fs.readFile(p, "utf8");
      for (let m of text.matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g))
        await fs.access(path.resolve(path.dirname(p), m[1]));
      count++;
    }
  }
}
await walk(root);
console.log(`Syntax and relative imports verified: ${count} modules.`);
