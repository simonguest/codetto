# Video Cells

Cells of type `raw` tagged with `video` will be rendered as video cells.

The source should contain a JSON payload with the `url` to the video to play and a boolean value for `controls` indicating whether the video player should include controls (restart, fast-forward, etc.)

## Example

```json
{
  "cell_type": "raw",
  "metadata": {
    "tags": [
      "video"
    ],
  },
  "source": [
    "{ \"url\": \"https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4\", \"controls\": true }"
  ]
}
```