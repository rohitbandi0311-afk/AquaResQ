# GitHub publication setup

These commands initialize Git and prepare a first push. They do not create a
GitHub repository or push automatically. Choose public/private visibility and
create an empty repository manually on GitHub first. Do not paste passwords,
personal access tokens, or other credentials into a remote URL or source file;
use Git Credential Manager's browser sign-in when Git prompts for
authentication.

Run PowerShell from the project root:

```powershell
Set-Location 'D:\AquaResQ_Milestone1_Starter\aquaresq_starter\aquaresq'
```

## 1. Initialize Git (only if this folder is not already a repository)

```powershell
git init
git branch -M main
```

If Git reports that the folder is already a repository, do not reinitialize it;
continue by checking its current branch and status.

## 2. Review files before staging

```powershell
git status --short
git status --short --ignored
git diff --check
```

Confirm `.env` and `.env.local` files, `node_modules`, `dist`, Python caches,
temporary files, and credentials are not staged. `.env.example` contains only
the public local API URL and should be safe to publish.

Stage and inspect the initial submission:

```powershell
git add -A
git diff --cached --check
git status --short
git diff --cached --stat
git diff --cached
```

If anything sensitive or unintended appears in the staged diff, unstage those
specific paths with `git restore --staged <path>` and inspect again before
committing. Do not proceed until the staged contents are appropriate to
publish.

## 3. Create the first commit

If Git has no author identity configured, set one for this repository first
(use your preferred public identity or GitHub-provided noreply email):

```powershell
git config --local user.name 'Your Name'
git config --local user.email 'you@example.com'
```

Then commit:

```powershell
git commit -m "Prepare AquaResQ hackathon submission"
```

## 4. Connect the GitHub repository

On GitHub, create an empty repository and copy its HTTPS URL. Replace the
placeholder values below with the URL for that repository:

```powershell
$GitHubUrl = 'https://github.com/<USERNAME>/<REPOSITORY>.git'
git remote add origin $GitHubUrl
git remote -v
```

If an `origin` remote already exists, inspect it with `git remote -v` and update
it only if it points to the wrong repository. Never include a token in the URL.

## 5. Push manually when ready

The following command publishes the committed branch. Run it yourself only
after reviewing the repository visibility and staged/committed contents:

```powershell
git push -u origin main
```

No Git initialization, repository creation, commit, credential setup, or push
is performed by this guide.
