import { writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { FIGURES } from "./design-kit.mjs";
const names = ["five-second-window","threshold-context"];
const acc = "#7c5cff";
const html = `<style>body{margin:0;background:#0D1219;font-family:-apple-system,sans-serif}
 .f{padding:26px 30px;border-bottom:1px solid #1E2733}
 .n{color:#7c5cff;font-family:'SF Mono',monospace;font-size:19px;margin-bottom:10px}
 svg{width:920px;height:auto;display:block}</style>` +
 names.map(n=>`<div class="f"><div class="n">${n}</div>${FIGURES[n](acc)}</div>`).join("");
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:990,height:900}});
await p.setContent(html,{waitUntil:"load"});
writeFileSync("/tmp/figures.png", await p.screenshot({fullPage:true}));
await b.close(); console.log("ok");
