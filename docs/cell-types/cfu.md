# CFU (Check for Understanding) Cells

Cells of type `raw` tagged with `cfu` are rendered as interactive questions that students answer to demonstrate their understanding of a topic.

## Behavior

- The student reads the question and submits an answer using the **Submit** button.
- If the answer is **correct**, a confetti animation plays and a success message is shown.
- If the answer is **incorrect**, the correct answer is shown immediately.
- The student can click **Try again** at any time to clear their submission and try again.
- The submitted answer is persisted to notebook storage. If the student reloads the notebook, their prior answer and result are restored.

## Question types

| `question_type` | Description |
|---|---|
| `freeform` | Free-text input. Comparison is case-insensitive and whitespace-trimmed. |
| `multiple_choice` | Radio buttons, one per option. The `answer` field holds the matching key (e.g. `"c"`). |
| `true_false` | Two radio buttons labelled True and False. The `answer` field is `"True"` or `"False"`. |

## Schema

```json
{
  "question_type": "multiple_choice",
  "question": "Which of the following is not a Python package?",
  "options": [
    { "key": "a", "text": "pandas" },
    { "key": "b", "text": "matplotlib" },
    { "key": "c", "text": "ubuntu" },
    { "key": "d", "text": "openai" }
  ],
  "answer": "c",
  "submitted_answer": "",
  "animation": true,
  "i18n": {
    "hi-IN": {
      "question": "निम्नलिखित में से कौन सा Python पैकेज नहीं है?",
      "options": [
        { "key": "a", "text": "pandas" },
        { "key": "b", "text": "matplotlib" },
        { "key": "c", "text": "ubuntu" },
        { "key": "d", "text": "openai" }
      ],
      "answer": "c"
    }
  }
}
```

### Top-level fields

| Field | Type | Required | Description |
|---|---|---|---|
| `question_type` | `"freeform"` \| `"multiple_choice"` \| `"true_false"` | Yes | Determines the input widget. |
| `question` | string | Yes | The question text shown to the student. |
| `options` | `{ key, text }[]` | Only for `multiple_choice` | The answer choices in display order. |
| `answer` | string | Yes | The correct answer. For `multiple_choice`, use the option key (e.g. `"c"`). For `true_false`, use `"True"` or `"False"`. |
| `submitted_answer` | string | Yes | Stores the student's last submission. Set to `""` initially; updated automatically on submit/reset. |
| `animation` | boolean | No | Whether to show the confetti animation on a correct answer. Defaults to `true`. |
| `i18n` | object | No | Per-locale overrides for `question`, `options`, and `answer` (see below). |

### i18n overrides

The `i18n` field maps locale codes (e.g. `"hi-IN"`, `"ja-JP"`) to an object that can override any of `question`, `options`, and `answer`. Fields not present in the override fall back to the top-level value.

`submitted_answer`, `animation`, and `question_type` are locale-invariant and live at the top level only.

## Example notebook cell

```json
{
  "cell_type": "raw",
  "metadata": {
    "tags": ["cfu"]
  },
  "source": [
    "{\n",
    "  \"question_type\": \"true_false\",\n",
    "  \"question\": \"Python source files are designated as .py\",\n",
    "  \"answer\": \"True\",\n",
    "  \"submitted_answer\": \"\"\n",
    "}"
  ]
}
```

## Notes

- The confetti animation uses `canvas-confetti` and fires from both sides of the screen for 1.5 seconds.
- Set `"animation": false` to suppress the animation — useful for quiet assessment contexts or notebooks with many CFU cells close together.
- CFU cells do not require Pyodide and render immediately on page load.
