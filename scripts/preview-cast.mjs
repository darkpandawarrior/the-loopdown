#!/usr/bin/env node
// Render every cast portrait to /tmp so the drawing can be iterated on without
// rebuilding a whole carousel.
//
//   node scripts/preview-cast.mjs [outDir]
import { writeFileSync } from "node:fs";
import { Resvg } from "@resvg/resvg-js";
import { defs, ground, specimenPlate } from "./design-kit.mjs";

const outDir = process.argv[2] || "/tmp";
const W = 1080, H = 1350;
const SUBJECTS = [
  ["the-messenger", "#4ec9b0", "07"],
  ["the-concussed-witness", "#7c5cff", "01"],
];

for (const [id, accent, exhibit] of SUBJECTS) {
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${defs(accent)}${ground(W, H)}
  ${specimenPlate(id, accent, { x: 120, y: 230, scale: 1.55, exhibit })}
  </svg>`;
  const p = `${outDir}/cast-${id}.png`;
  writeFileSync(p, new Resvg(svg, { fitTo: { mode: "width", value: W } }).render().asPng());
  console.log(`  ${p}`);
}
