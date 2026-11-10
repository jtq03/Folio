# Working on Folio

## Suggested split (four people, few merge conflicts)

| Area | Files | 
|---|---|
| Design system and shared UI | `docs/shared/css/*`, `docs/shared/js/ui.js` |
| Portal clinical pages | `docs/portal/pages/home.js`, `patients.js`, `profile.js`, `visit.js`, `add.js` |
| Portal admin pages | `docs/portal/pages/cards.js`, `program.js`, `admin.js`, `docs/portal/portal.js` |
| Patient app and adult view | `docs/app/*`, `docs/card/*` |

Data and store (`docs/shared/js/data.js`, `store.js`) are shared. Tell the group before changing their shape.

## Flow

```sh
git clone https://github.com/jtq03/Folio.git && cd Folio
git switch -c your-name/what-you-changed
cd docs && python3 -m http.server 8000     # edit, refresh the browser
git add -A && git commit -m "Say what and why"
git push -u origin your-name/what-you-changed   # open a pull request
```

You can also edit in the browser on GitHub. Use branches and pull requests so unreviewed work never changes the published site. Merge into `main` to publish.

## Rules of thumb

- Use CSS variables from `shared/css/tokens.css`. No new hex values, no white.
- Interpolate with the `h` template tag (it escapes user text). Never build HTML from raw strings with user input.
- Every control needs a text label (use `.sr` for visually hidden labels) and a 44px target.
- Status uses text plus colour, never colour alone.
- When you change files in `docs/app/` or the shared files it caches, bump `VERSION` in `docs/app/sw.js` so phones pick up the update.
- Keep private data out of this public repo. Demo data only.

## Restore an older version

Browse Commits on GitHub, pick a revision, then Browse files. To restore, `git restore --source=COMMIT_SHA --staged --worktree -- docs/` on a new branch and open a pull request.
