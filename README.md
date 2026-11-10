# Folio

A shared project with a published page and Git revision history.

## Publish

In Settings → Pages, choose **Deploy from a branch**, select **main** and **/docs**, and Save. The expected address is https://jtq03.github.io/Folio/ after the first successful deployment. Subsequent pushes affecting `docs/` on `main` automatically update the page, usually after a short build delay. Check the Actions tab if a deployment fails.

## Share and collaborate

The owner can invite GitHub usernames in Settings → Collaborators → Add people. Invited people must accept before pushing. A public repository is readable by anyone; only authorized collaborators can push. Everyone should use their own account so commits retain individual attribution.

See [CONTRIBUTING.md](CONTRIBUTING.md) for editing and restoration instructions. The website lives in `docs/index.html`; place images and other website assets in `docs/` and use relative links.

## Revision history

Every committed update records its author, date, message and changes. Use the repository’s **Commits** link to browse revisions; select a commit and **Browse files** to inspect the entire project at that point. A file’s **History** button shows its earlier revisions.

GitHub Pages serves the current deployment. Old commits remain inspectable as source; they do not automatically get separate live website URLs. To see an old page visually, check out that revision locally and open `docs/index.html`, or restore it to main to republish it.

Restore by adding a new commit rather than rewriting history. Avoid force-pushes and deleting the repository, which can remove access to revisions. Keep an independent clone as a backup.

## Local preview

Open `docs/index.html` in your browser. This starter has no dependencies or build step.
