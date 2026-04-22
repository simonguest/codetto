# Form Fields

To maintain compatibility with Google Colab, the following form fields are supported:

- **Integer and string values** denoted by @param
- **Sliders** with type:"slider", a min, max, and step values
- **Dropdowns** with arrays of valid values
- **Booleans** with type:"boolean"

## Example

```python
AGE = 51 #@param
TEMPERATURE = 1 #@param {type:"slider", min:0, max:2, step:0.1}
MODEL = "small" #@param ["small", "medium", "large"]
IS_ENABLED = True #@param {type:"boolean"}
```
 