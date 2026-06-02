import { EditorView, WidgetType, Decoration, DecorationSet, ViewPlugin, ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

class ColorSwatchWidget extends WidgetType {
  constructor(
    readonly color: string,
    readonly from: number,
    readonly to: number,
  ) {
    super();
  }

  toDOM(view: EditorView): HTMLElement {
    const input = document.createElement("input");
    input.type = "color";
    input.className = "cm-color-swatch";
    input.value = normalizeHex(this.color);
    input.title = this.color;

    input.addEventListener("change", () => {
      view.dispatch({ changes: { from: this.from, to: this.to, insert: input.value } });
    });

    // Prevent CodeMirror from consuming the mousedown and stealing focus from the input
    input.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    return input;
  }

  eq(other: ColorSwatchWidget): boolean {
    return other.color === this.color && other.from === this.from && other.to === this.to;
  }

  ignoreEvent(): boolean {
    return false;
  }
}

function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    return "#" + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
  }
  return hex;
}

function buildDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const doc = view.state.doc.toString();
  const re = /(["'])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\1/g;
  let m;
  while ((m = re.exec(doc)) !== null) {
    const from = m.index + 1;
    const to = m.index + m[0].length - 1;
    const color = m[0].slice(1, -1);
    builder.add(
      m.index,
      m.index,
      Decoration.widget({
        widget: new ColorSwatchWidget(color, from, to),
        side: -1,
      }),
    );
  }
  return builder.finish();
}

export const colorPickerExtension = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = buildDecorations(update.view);
      }
    }
  },
  { decorations: (v) => v.decorations },
);

export const colorPickerTheme = EditorView.baseTheme({
  ".cm-color-swatch": {
    "-webkit-appearance": "none",
    appearance: "none",
    width: "14px",
    height: "14px",
    border: "1px solid rgba(0, 0, 0, 0.35)",
    borderRadius: "2px",
    padding: "0",
    margin: "0 3px 0 1px",
    verticalAlign: "middle",
    cursor: "pointer",
  },
  ".cm-color-swatch::-webkit-color-swatch-wrapper": {
    padding: "0",
  },
  ".cm-color-swatch::-webkit-color-swatch": {
    border: "none",
    borderRadius: "1px",
  },
  ".cm-color-swatch::-moz-color-swatch": {
    border: "none",
    borderRadius: "1px",
  },
});
