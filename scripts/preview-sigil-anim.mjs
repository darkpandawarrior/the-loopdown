#!/usr/bin/env node
// Capture a self-drawing sigil to an animated GIF, to check the inscription
// order actually reads outward-in.
//
//   node scripts/preview-sigil-anim.mjs CancellationException "#4ec9b0" /tmp/sigil.gif
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";
import { sigil } from "./design-kit.mjs";

const [name = "CancellationException", accent = "#4ec9b0", out = "/tmp/sigil.gif"] = process.argv.slice(2);
const DUR = 2.6, FPS = 25, FRAMES = Math.round(DUR * FPS) + 12;

const dir = mkdtempSync(join(tmpdir(), "sigil-"));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 420 }, deviceScaleFactor: 1.5 });
await page.setContent(
  `<style>html,body{margin:0;background:#06080B;display:grid;place-items:center;height:420px}
   svg{width:340px;height:340px}</style>${sigil(name, accent, { size: 340, stroke: 3, animate: true, duration: DUR })}`,
  { waitUntil: "load" }
);
// Drive CSS animations deterministically instead of sleeping, so the capture is
// reproducible rather than dependent on how busy this machine happens to be.
await page.evaluate(() => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = 0; }));
for (let f = 0; f < FRAMES; f++) {
  const t = (f / FPS) * 1000;
  await page.evaluate((ms) => document.getAnimations().forEach((a) => { a.currentTime = ms; }), t);
  writeFileSync(join(dir, `f${String(f).padStart(3, "0")}.png`), await page.screenshot({ type: "png" }));
}
await browser.close();

execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", join(dir, "f%03d.png"),
  "-vf", "scale=340:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=64[p];[b][p]paletteuse=dither=bayer",
  "-loop", "0", out]);
console.log(`${FRAMES} frames -> ${out}`);
