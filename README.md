# Msmegriwthai_claude

This repository now runs as a **no-build static React app**.

## Run locally

```bash
python -m http.server 4173
```

Then open `http://localhost:4173` in your browser.

## Notes

- `index.html` is the page shell that loads React, ReactDOM, and Babel from CDN.
- `app.jsx` contains the app code.
- Lightweight chart fallback components are used so the app works without installing npm dependencies.
