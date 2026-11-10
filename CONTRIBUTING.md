# Working on Folio

## Edit in your browser

1. Sign in to your own GitHub account and accept the owner’s collaborator invitation.
2. Open `docs/index.html` and select the pencil icon.
3. Make your change, choose **Commit changes**, and write a meaningful description.
4. For a quick update, commit to `main`. For changes that need review, create a new branch and open a pull request; merge it into `main` when ready.
5. Wait for the Pages deployment in Actions, then refresh the published page.

People working at the same time should use separate branches and pull requests. Resolve any conflicts before merging. Unmerged branches do not change the published site.

## Edit on your computer

```sh
git clone https://github.com/jtq03/Folio.git
cd Folio
git switch -c your-name/describe-change
# Edit files in docs/ and preview docs/index.html in a browser.
git add docs/
git commit -m "Describe your change"
git push -u origin your-name/describe-change
```

Open a pull request on GitHub and merge it into `main` after review. Before starting another change, switch to `main` and pull the latest updates. Git authentication is required to push.

## View an older revision

Browse the repository’s Commits list and choose a revision, then Browse files. To preview a past page locally with Git installed, replace `COMMIT_SHA` with that revision’s full commit ID:

```sh
git fetch origin
git worktree add --detach ../Folio-preview COMMIT_SHA
```

Open `../Folio-preview/docs/index.html`. This leaves your current work intact. The initial starter supports this direct preview; future features using servers may require their own preview instructions.

## Restore the website to a previous revision

Start from an up-to-date, clean checkout. Replace `COMMIT_SHA` with the revision you want:

```sh
git switch main
git pull --ff-only
git switch -c restore-earlier-page
git restore --source=COMMIT_SHA --staged --worktree -- docs/
git commit -m "Restore website to an earlier revision"
git push -u origin restore-earlier-page
```

Open and merge a pull request. This restores the website files and creates a new history entry; previous commits stay available. The published page updates after a successful deployment.

To undo a specific commit instead, use `git revert COMMIT_SHA` on a new branch, push, and open a pull request. Merge commits need special handling; ask the project owner if unsure.

Keep private data and credentials out of this public project and website.
