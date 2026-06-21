# Content repo + submodule setup

Your content now lives in a **separate repository** (`thesportfanalyst/content`)
and is pulled into the website as a **git submodule** at `content/`. This keeps
content separate from app code, so contributors open PRs against content only and
content maintainers can be given access to just that repo.

Do these steps once. They involve GitHub actions only you can do (creating and
pushing repos), so they can't be done for you in advance.

---

## 1. Create the content repo on GitHub

1. Go to https://github.com/organizations/thesportfanalyst/repositories/new
   (or your org's "New repository" page).
2. Name it **`content`**. Make it public. **Do not** initialize with a README
   (we have one). Create the repository.

## 2. Push the content into it

Unpack `thesportfanalyst-content.tar.gz` somewhere separate from the app, then:

```bash
cd path/to/unpacked-content
git init
git add .
git commit -m "Initial content"
git branch -M main
git remote add origin https://github.com/thesportfanalyst/content.git
git push -u origin main
```

The content repo is now live.

## 3. Add it as a submodule in the app repo

In your **app** repo (the website), remove the placeholder `content/` folder and
add the submodule in its place:

```bash
cd path/to/app-repo
rm -rf content              # remove the empty placeholder
git submodule add https://github.com/thesportfanalyst/content.git content
git commit -m "Add content as submodule"
git push
```

This creates a `.gitmodules` file and links `content/` to the content repo.

## 4. Confirm Netlify pulls it

`netlify.toml` already sets `GIT_SUBMODULE_STRATEGY = "recursive"`, so Netlify
fetches the submodule on every build. Just trigger a deploy and confirm the site
still shows all sports/projects. (If content ever goes missing, the build fails
early with a clear message — see `scripts/check-content.mjs`.)

---

## Working locally afterwards

When you clone the app fresh, also pull the submodule:

```bash
git clone --recurse-submodules https://github.com/thesportfanalyst/<app-repo>.git
# or, in an existing clone:
git submodule update --init --recursive
```

To pull the latest content into your local copy later:

```bash
git submodule update --remote content
```

## How updates flow

- A contributor's submission (via the site's **Submit** page) opens a PR against
  the **content** repo.
- A maintainer reviews and merges it there.
- To publish, bump the submodule pointer in the app repo:
  ```bash
  git submodule update --remote content
  git commit -am "Update content"
  git push
  ```
  That triggers a Netlify rebuild with the new content.

> Tip: you can automate that last bump with a scheduled Netlify build or a small
> GitHub Action, so merges to content publish automatically. Optional — manual
> works fine to start.

## Giving maintainers access

Add content maintainers as collaborators on the **content** repo only (Settings →
Collaborators). They get full PR-review power over content without any access to
the app's source or deploy settings.
