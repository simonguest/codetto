# URL Parameters

URL parameters are supported to open remote notebooks and other actions.

## Add and Open Notebook from GitHub URL

The `github` URL parameter imports a notebook from a public GitHub repo, adds it to the local store of notebooks, and immediately opens it.

### Example

`?github=simonguest/CS-394/blob/main/src/01/notebooks/hello-world.ipynb`

In the above example, the `hello-world.ipynb` notebook will be loaded from github.com using the appended path, then opened automatically once the download is complete.
