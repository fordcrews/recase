# Contributing to Recase

Thanks for helping catalog e-waste laptop rebuilds. The site is static HTML/CSS/JS with **no build step**. Almost every content change is a JSON edit.

## Add or fix a laptop model

1. Edit [`data/catalog.json`](data/catalog.json).
2. Copy an existing object under `models` and fill in:
   - `id` — lowercase kebab-case, unique (`dell-latitude-e6420`)
   - `brand`, `model`, `aka`, `year`
   - `screen_size_in`, `resolutions`, `panel_interface` (`LVDS` / `eDP` / `unknown`)
   - `panel_connector_notes`, `cpu`, `memory`, `power_adapter`, `battery`
   - `ports_notes`, `gutting_notes`
   - `unknowns` — **required** for anything you could not verify
   - `fits_projects` — ids from the `projects` array
   - `sources` — real URLs (Dell manuals, tear-downs, panel datasheets)
3. **Do not invent specs.** If a value is unclear, put it in `unknowns` and leave the field as a cautious string (or `"unknown"`).
4. Open a pull request. Describe which sources you used.

## Add a project guide

Add an object under `projects` with `id`, `title`, `summary`, `difficulty`, `fits_model_ids`, `parts`, `steps`, and `safety`. Every project must include battery / electrical safety notes.

## Add a link

Add under `links` with `title`, `url`, `notes`, and `tags`. Prefer primary sources. Note the date you verified the URL if it was flaky.

## Local preview

Serve the repo root over HTTP (GitHub Pages style paths):

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080/`.

## Code style

- Keep the UI dependency-free.
- Prefer editing JSON over hard-coding content in `js/app.js`.
- Mobile-friendly layout; test a phone-width viewport before merging.
