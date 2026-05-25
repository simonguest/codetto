# Journal Cells

Cells of type `markdown` tagged with `journal` are rendered as editable journal cells. They are intended for students to write personal notes and observations as they work through a notebook.

## Behavior

- **Preview mode** (default): the cell source is rendered as markdown in a post-it note style. The cell is read-only.
- **Edit mode**: entered by double-clicking the cell body, or single-clicking the pencil icon in the top-right corner. The raw source is shown in an editable textarea. Clicking **Close** saves the changes and returns to preview mode.

Changes are saved to the notebook's storage automatically (via the same auto-save path as all other cell edits).

## Example

```json
{
  "cell_type": "markdown",
  "metadata": {
    "tags": [
      "journal"
    ]
  },
  "source": [
    "Write your thoughts here..."
  ]
}
```

## Notes

- The cell source is plain text or markdown. Students can use any markdown syntax.
- Journal cells respect locale overrides (`cell.metadata.i18n`) and global variable substitution (`{{VARIABLE}}`), but editing always writes back to the base source — not to a locale override.
- Journal cells are intentionally excluded from the regular markdown cell rendering path in `Renderer.vue`.
