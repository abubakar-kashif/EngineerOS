# EngineerOS Git Workflow

## 1. Overview

EngineerOS uses Git and GitHub for version control and team collaboration.

The project uses a feature-branch workflow to keep the `main` branch stable.

The basic workflow is:

```text
main
  ↓
feature branch
  ↓
development
  ↓
testing
  ↓
commit
  ↓
push
  ↓
Pull Request
  ↓
review
  ↓
merge
  ↓
main
```

---

## 2. Repository

EngineerOS uses the following GitHub repository:

```text
https://github.com/abubakar-kashif/EngineerOS
```

---

## 3. Main Branch

The primary branch is:

```text
main
```

The `main` branch represents the stable project state.

Developers should normally not develop directly on `main`.

---

## 4. Feature Branches

Every developer should create a feature branch before starting development.

Examples:

```text
frontend/home
frontend/experiments
frontend/workspace
frontend/dashboard

backend/experiments
backend/quiz
backend/progress
backend/reports

docs/architecture
docs/api-contract

test/frontend
test/backend
```

Branch names should clearly describe the work.

---

## 5. Start New Work

First switch to `main`:

```bash
git checkout main
```

Get the latest version:

```bash
git pull origin main
```

Create a feature branch:

```bash
git checkout -b feature/example
```

Examples:

```bash
git checkout -b frontend/experiments
```

```bash
git checkout -b backend/experiments
```

```bash
git checkout -b docs/api-contract
```

---

## 6. Check Current Branch

Run:

```bash
git branch
```

The current branch will be marked with:

```text
*
```

Example:

```text
* frontend/experiments
  main
```

---

## 7. Check Project Status

Run:

```bash
git status
```

This shows:

- Current branch
- Modified files
- New files
- Deleted files
- Untracked files

---

## 8. Review Changes

Before committing, review the changes.

Use:

```bash
git status
```

For detailed changes:

```bash
git diff
```

---

## 9. Stage Changes

After completing and testing the work:

```bash
git add .
```

Then check:

```bash
git status
```

The files should now appear under changes ready to be committed.

---

## 10. Commit Changes

Commit messages should clearly describe the change.

Recommended format:

```text
type: description
```

Common types:

```text
feat:
fix:
docs:
test:
refactor:
chore:
```

Examples:

```bash
git commit -m "feat: add experiment library"
```

```bash
git commit -m "fix: handle missing experiment"
```

```bash
git commit -m "docs: update API contract"
```

```bash
git commit -m "test: add experiment API tests"
```

```bash
git commit -m "refactor: simplify experiment service"
```

---

## 11. Push Feature Branch

For the first push of a new branch:

```bash
git push -u origin feature/example
```

Example:

```bash
git push -u origin frontend/experiments
```

After the upstream branch has been configured:

```bash
git push
```

can normally be used.

---

## 12. Pull Requests

After pushing a feature branch:

1. Open the EngineerOS GitHub repository.
2. Open the Pull Request section.
3. Select the feature branch.
4. Review the changed files.
5. Write a clear description.
6. Request review from the relevant teammate.
7. Address review comments.
8. Merge after approval.

---

## 13. Updating Before New Work

Before starting another feature:

```bash
git checkout main
```

Update local `main`:

```bash
git pull origin main
```

Create a new feature branch:

```bash
git checkout -b feature/example
```

This helps ensure the new branch starts from the latest project state.

---

## 14. Keeping a Feature Branch Updated

If the `main` branch changes while you are working, first make sure your work is committed.

Then update `main`:

```bash
git checkout main
git pull origin main
```

Return to your feature branch:

```bash
git checkout feature/example
```

The exact team strategy for merging or rebasing `main` into active feature branches will be agreed upon by the team as development becomes more advanced.

---

## 15. Merge Conflicts

If Git reports a merge conflict:

1. Do not panic.
2. Open the conflicted file in VS Code.
3. Review the conflicting sections.
4. Decide which changes should remain.
5. Remove the conflict markers.
6. Save the file.
7. Test the project.
8. Stage the resolved files.
9. Complete the merge or rebase operation.

Conflict markers look like:

```text
<<<<<<< HEAD
Current version
=======
Incoming version
>>>>>>> branch-name
```

---

## 16. Important Rules

### Rule 1 — Do not normally develop directly on `main`

Use feature branches.

### Rule 2 — Never commit secrets

Never commit:

```text
.env
API keys
Passwords
Tokens
Private credentials
```

### Rule 3 — Do not commit generated dependencies

Never commit:

```text
node_modules/
.venv/
```

### Rule 4 — Keep commits focused

A commit should represent one logical change whenever practical.

### Rule 5 — Test before pushing

Run the relevant tests before creating a Pull Request.

### Rule 6 — Keep documentation updated

Important architecture, API, and workflow changes should be reflected in the documentation.

---

## 17. Recommended Commit Types

Use:

```text
feat:
```

For new functionality.

```text
fix:
```

For bug fixes.

```text
docs:
```

For documentation changes.

```text
test:
```

For tests.

```text
refactor:
```

For code restructuring without changing intended behavior.

```text
chore:
```

For tooling, configuration, and maintenance.

---

## 18. Branch Naming Convention

Use:

```text
area/feature
```

Examples:

```text
frontend/home
frontend/experiments
frontend/workspace
frontend/dashboard

backend/experiments
backend/quiz
backend/progress
backend/reports

docs/architecture
docs/api-contract
docs/setup

test/frontend
test/backend
```

---

## 19. Team Collaboration

EngineerOS is developed by a five-member team.

Team members should coordinate work to reduce conflicts.

Example division:

```text
Frontend
    ↓
Frontend features and UI

Backend
    ↓
API and business logic

Database
    ↓
Models and persistence

Testing
    ↓
Frontend and backend tests

Documentation / Integration
    ↓
Architecture, API contracts, integration
```

Actual responsibilities may change as the project develops.

---

## 20. Pull Request Guidelines

A Pull Request should explain:

- What was changed.
- Why it was changed.
- What files were affected.
- How the change was tested.
- Whether any architectural or API changes were introduced.

Example:

```text
Title:
feat: add experiment library

Description:

Added the initial experiment library page.

Changes:
- Added experiment list UI.
- Added experiment card component.
- Added frontend API service.
- Added loading state.
- Added error state.

Testing:
- Tested locally.
- Verified experiment list rendering.
```

---

## 21. Goal

The purpose of this workflow is to keep the project organized while allowing all five team members to work independently.

The standard process is:

```text
Create branch
      ↓
Develop
      ↓
Test
      ↓
Review changes
      ↓
Commit
      ↓
Push
      ↓
Pull Request
      ↓
Review
      ↓
Merge
```

The `main` branch should remain stable and usable throughout development.
