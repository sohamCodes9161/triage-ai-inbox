// Fails if any component uses hardcoded palette classes or hex colors instead of semantic tokens.
import fs from "fs";
import path from "path";

const BAD = /\b(bg|text|border|ring|from|to|via|fill|stroke|divide|outline|shadow|decoration|accent|caret)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(-\d{2,3})?(\/\d+)?\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/;
let bad = 0;
const walk = (dir) => {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(jsx?|css)$/.test(f) && !p.endsWith("themes.css")) {
      fs.readFileSync(p, "utf8").split("\n").forEach((line, i) => {
        if (BAD.test(line)) { console.log(`${p}:${i + 1}: ${line.trim()}`); bad++; }
      });
    }
  }
};
walk("src");
if (bad) { console.error(`\n${bad} hardcoded color use(s). Use semantic tokens (bg-surface, text-primary, ...).`); process.exit(1); }
console.log("Token check passed: no hardcoded colors.");
