# Folder Support

Notebooks can be organised into a pseudo folder hierarchy. Folders are not stored as independent objects — they are derived at runtime from the `folder` field in each notebook's metadata.

## Metadata field

```json
{
  "metadata": {
    "folder": "/lessons/unit3"
  }
}
```

The value is a Unix-style path. A leading slash is recommended but not required — the app normalises paths to always have one. Notebooks with no `folder` field (or an empty string) appear at the root level.

## How the tree is built

`NotebookIndex.vue` reads the current folder from the `?folder=` URL query parameter and computes the visible items for that level:

- **Folders** — any notebook whose path starts with `<current>/<child>/` contributes the immediate child segment as a folder card. Duplicate child names are deduplicated, so a single folder card appears regardless of how many notebooks live beneath it.
- **Notebooks** — any notebook whose `folder` exactly matches the current path appears as a notebook card.

Folders are sorted alphabetically and rendered before notebook cards.

## Navigation

- Clicking a folder card pushes `?folder=/lessons/unit3` to the router.
- Breadcrumbs at the top of the page show the full path and are clickable.
- Tapping the **Notebooks** icon in the bottom navigation always returns to the root (clears the query parameter).
- The back button inside a notebook returns the student to the folder the notebook belongs to, not to the root.

## Importing into a folder

When the user imports a notebook (from file or URL) while inside a folder, the app automatically stamps the current folder path into the imported notebook's `metadata.folder`. This means the notebook appears in the correct place immediately after import.

## Limitations

- Empty folders cannot exist — a folder only appears if at least one notebook lives under it.
- Renaming or moving folders requires updating the `folder` field in every affected notebook (no folder management UI yet).
- Folder names are derived from the path string; there is no separate display name or metadata per folder.
