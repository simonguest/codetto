const ANSI_COLORS = [
  'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white',
];

const ANSI_BRIGHT_COLORS = [
  '#555', '#f55', '#5f5', '#ff5', '#55f', '#f5f', '#5ff', '#fff',
];

// Basic 256-color palette (first 16 + grayscale ramp; full cube omitted for brevity)
function color256(n: number): string {
  if (n < 8) return ANSI_COLORS[n];
  if (n < 16) return ANSI_BRIGHT_COLORS[n - 8];
  if (n >= 232) {
    const v = Math.round((n - 232) * 10.2);
    return `rgb(${v},${v},${v})`;
  }
  // 6x6x6 color cube
  n -= 16;
  const b = n % 6, g = Math.floor(n / 6) % 6, r = Math.floor(n / 36);
  const c = (x: number) => x === 0 ? 0 : 55 + x * 40;
  return `rgb(${c(r)},${c(g)},${c(b)})`;
}

function escape(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function ansiToHtml(input: string): string {
  const parts: string[] = [];
  let openSpans = 0;

  // Current state
  let fg: string | null = null;
  let bg: string | null = null;
  let bold = false;
  let italic = false;
  let underline = false;

  const applyStyle = () => {
    const styles: string[] = [];
    if (fg) styles.push(`color:${fg}`);
    if (bg) styles.push(`background:${bg}`);
    if (bold) styles.push('font-weight:bold');
    if (italic) styles.push('font-style:italic');
    if (underline) styles.push('text-decoration:underline');
    if (styles.length) {
      parts.push(`<span style="${styles.join(';')}">`);
      openSpans++;
    }
  };

  const closeSpans = () => {
    while (openSpans > 0) {
      parts.push('</span>');
      openSpans--;
    }
  };

  // Match ANSI escape sequences: ESC[ ... m
  const re = /\x1b\[([0-9;]*)m|([^\x1b]+)/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(input)) !== null) {
    if (m[2] !== undefined) {
      parts.push(escape(m[2]));
      continue;
    }

    // Parse CSI sequence
    const codes = m[1].split(';').map(Number);
    let i = 0;
    let changed = false;

    while (i < codes.length) {
      const code = codes[i++];
      if (code === 0) {
        fg = bg = null; bold = italic = underline = false; changed = true;
      } else if (code === 1) { bold = true; changed = true; }
      else if (code === 3) { italic = true; changed = true; }
      else if (code === 4) { underline = true; changed = true; }
      else if (code === 22) { bold = false; changed = true; }
      else if (code === 23) { italic = false; changed = true; }
      else if (code === 24) { underline = false; changed = true; }
      else if (code >= 30 && code <= 37) { fg = ANSI_COLORS[code - 30]; changed = true; }
      else if (code === 38 && codes[i] === 5) { i++; fg = color256(codes[i++]); changed = true; }
      else if (code === 39) { fg = null; changed = true; }
      else if (code >= 40 && code <= 47) { bg = ANSI_COLORS[code - 40]; changed = true; }
      else if (code === 48 && codes[i] === 5) { i++; bg = color256(codes[i++]); changed = true; }
      else if (code === 49) { bg = null; changed = true; }
      else if (code >= 90 && code <= 97) { fg = ANSI_BRIGHT_COLORS[code - 90]; changed = true; }
      else if (code >= 100 && code <= 107) { bg = ANSI_BRIGHT_COLORS[code - 100]; changed = true; }
    }

    if (changed) {
      closeSpans();
      applyStyle();
    }
  }

  closeSpans();
  return parts.join('');
}
