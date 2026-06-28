#!/usr/bin/env node
// Converts one or more TTF/OTF/WOFF font files to a single facetype.js JSON.
// When multiple input files are provided their glyphs are merged (useful for
// subset fonts that split Unicode ranges across separate files).
//
// Usage:
//   node scripts/font-to-typeface.js <out.typeface.json> <font1.woff> [font2.woff ...]
//
// Character ranges extracted:
//   U+0020–U+007E  Basic Latin (printable ASCII)
//   U+00A0–U+024F  Latin Supplement + Extended-A/B
//   U+0400–U+04FF  Cyrillic

const fs = require("fs");
const opentype = require("opentype.js");

const RANGES = [
  [0x0020, 0x007e],
  [0x00a0, 0x024f],
  [0x0400, 0x04ff],
];

function getChars() {
  const chars = new Set();
  for (const [start, end] of RANGES) {
    for (let cp = start; cp <= end; cp++) {
      chars.add(String.fromCodePoint(cp));
    }
  }
  return chars;
}

function glyphToOutline(glyph) {
  const cmds = glyph.path?.commands;
  if (!cmds || !cmds.length) return "";
  const parts = [];
  for (const cmd of cmds) {
    switch (cmd.type) {
      case "M":
        parts.push(`m ${Math.round(cmd.x)} ${Math.round(cmd.y)}`);
        break;
      case "L":
        parts.push(`l ${Math.round(cmd.x)} ${Math.round(cmd.y)}`);
        break;
      case "Q":
        // facetype order: endpoint first, then control point
        parts.push(`q ${Math.round(cmd.x)} ${Math.round(cmd.y)} ${Math.round(cmd.x1)} ${Math.round(cmd.y1)}`);
        break;
      case "C":
        // facetype order: endpoint first, then control points
        parts.push(`b ${Math.round(cmd.x)} ${Math.round(cmd.y)} ${Math.round(cmd.x1)} ${Math.round(cmd.y1)} ${Math.round(cmd.x2)} ${Math.round(cmd.y2)}`);
        break;
      case "Z":
        break; // contour close is implicit in facetype.js format
    }
  }
  return parts.join(" ");
}

function extractGlyphs(font, chars, existing) {
  const glyphs = { ...existing };
  for (const char of chars) {
    if (glyphs[char]) continue; // already covered by an earlier font
    const glyph = font.charToGlyph(char);
    if (!glyph || glyph.index === 0) continue; // 0 = .notdef (missing)

    const bb = glyph.getBoundingBox();
    const entry = {
      x_min: Math.round(bb.x1),
      x_max: Math.round(bb.x2),
      ha: Math.round(glyph.advanceWidth),
    };
    const outline = glyphToOutline(glyph);
    if (outline) entry.o = outline;
    glyphs[char] = entry;
  }
  return glyphs;
}

function convert(outPath, fontPaths) {
  const chars = getChars();
  let glyphs = {};
  let meta = null;

  for (const fontPath of fontPaths) {
    const buf = fs.readFileSync(fontPath);
    const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const font = opentype.parse(ab);

    // Use metadata from the first font file
    if (!meta) {
      const os2 = font.tables.os2;
      const post = font.tables.post;
      const head = font.tables.head;
      meta = {
        cssFontWeight: "normal",
        ascender: Math.round(font.ascender),
        underlinePosition: Math.round(post?.underlinePosition ?? -100),
        cssFontStyle: "normal",
        boundingBox: {
          yMin: Math.round(head.yMin),
          xMin: Math.round(head.xMin),
          yMax: Math.round(head.yMax),
          xMax: Math.round(head.xMax),
        },
        resolution: font.unitsPerEm,
        descender: Math.round(font.descender),
        familyName: "Noto Sans",
        lineHeight: Math.round(font.ascender - font.descender + (os2?.sTypoLineGap ?? 0)),
        underlineThickness: Math.round(post?.underlineThickness ?? 50),
      };
    }

    glyphs = extractGlyphs(font, chars, glyphs);
    console.log(`  ${fontPath}: ${Object.keys(glyphs).length} glyphs so far`);
  }

  const result = { glyphs, ...meta };
  fs.writeFileSync(outPath, JSON.stringify(result));
  const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
  console.log(`✓ ${outPath}  (${Object.keys(glyphs).length} glyphs, ${kb} KB)`);
}

const [, , outArg, ...fontArgs] = process.argv;
if (!outArg || !fontArgs.length) {
  console.error("Usage: node scripts/font-to-typeface.js <out.typeface.json> <font1.woff> [font2.woff ...]");
  process.exit(1);
}
convert(outArg, fontArgs);
