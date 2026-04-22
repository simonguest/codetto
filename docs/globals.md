# Globals

Globals can be inserted into markdown or code cells. At runtime, globals are replaced with their respective values, localized if needed.

## Defining Globals

To define a global, add the value to the `globals` section under the notebook's metadata.

```json
"globals": {
  "FOOD": {
    "default": "Pizza",
    "hi-IN": "Puri",
    "ja-JP": "Sukiyaki"
  },
  "NAME": {
    "default": "Rylee",
    "hi-IN": "Aditi",
    "ja-JP": "Daichi"
  }
}
```

In the above example, two globals are defined: FOOD and NAME. The default value (or the localized value, if the locale is set) is inserted at runtime.

## Using a Global

To insert a global in a markdown or code cell, use the double handlebar format: For example `{{NAME}}`