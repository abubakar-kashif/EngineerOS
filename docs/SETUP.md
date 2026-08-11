# EngineerOS Development Setup

## 1. Overview

This document explains how to prepare the EngineerOS development environment.

EngineerOS currently uses:

- React
- TypeScript
- Vite
- Tailwind CSS
- Python
- FastAPI
- Pydantic
- SQLAlchemy
- SQLite
- Git
- GitHub

The exact setup instructions will evolve as the frontend and backend are initialized.

---

## 2. Required Software

Install the following:

- Git
- Node.js
- npm
- Python
- VS Code

The development environment should have working versions of all required tools.

---

## 3. Verify Installation

Open Git Bash and check:

```bash
git --version
node --version
npm --version
python --version
```

All commands should return installed versions.

---

## 4. Clone the Repository

If the repository has not already been cloned:

```bash
cd ~/Desktop
git clone https://github.com/abubakar-kashif/EngineerOS.git
cd EngineerOS
```

Verify the repository:

```bash
git status
```

---

## 5. Project Structure

The project is organized into:

```text
EngineerOS/
│
├── backend/
├── frontend/
├── docs/
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

## 6. Environment Variables

The repository contains:

```text
.env.example
```

Create a local environment file:

```bash
cp .env.example .env
```

The `.env` file is local and must not be committed.

Never store passwords, API keys, tokens, or other secrets in Git.

---

## 7. Frontend

The frontend will use:

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Lucide React

The frontend will eventually be located inside:

```text
frontend/
```

Frontend installation and running commands will be added when the React application is initialized.

Expected development URL:

```text
http://localhost:5173
```

---

## 8. Backend

The backend will use:

- Python
- FastAPI
- Pydantic
- SQLAlchemy

The backend will eventually be located inside:

```text
backend/
```

Backend installation and running commands will be added when the FastAPI application is initialized.

Expected development URL:

```text
http://127.0.0.1:8000
```

---

## 9. Python Virtual Environment

The backend should use a Python virtual environment.

The planned environment is:

```text
backend/.venv/
```

The virtual environment must not be committed to Git.

Backend environment setup instructions will be added when the backend is initialized.

---

## 10. Database

EngineerOS will use SQLite during the initial development phase.

SQLAlchemy will provide the database abstraction layer.

The database will eventually contain information related to:

- Experiments
- Quizzes
- Progress
- Reports
- Resources

Database files must remain local and must not be committed to Git.

---

## 11. Running the Project

During the initial foundation phase, frontend and backend applications will eventually run separately.

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://127.0.0.1:8000
```

The exact startup commands will be documented after both applications are initialized.

---

## 12. Git Development Workflow

Before beginning new work:

```bash
git checkout main
git pull origin main
```

Create a feature branch:

```bash
git checkout -b feature/example
```

Example:

```bash
git checkout -b frontend/experiments
```

After making changes:

```bash
git status
git add .
git commit -m "feat: add experiment page"
git push -u origin frontend/experiments
```

Then create a Pull Request on GitHub.

---

## 13. Files That Must Not Be Committed

Never commit:

```text
.env
node_modules/
.venv/
__pycache__/
*.pyc
*.db
dist/
build/
```

Also never commit:

- API keys
- Passwords
- Access tokens
- Private credentials
- Other secrets

The `.gitignore` file should handle common generated and sensitive files.

---

## 14. VS Code Workflow

VS Code is the primary development environment.

Use VS Code for:

- Writing code
- Editing documentation
- Managing project files
- Reviewing changes
- Debugging
- Running development commands

Use Git Bash for:

- Git commands
- Project navigation
- Installing dependencies
- Running applications
- Running tests
- Checking project status

Typical workflow:

```text
VS Code
   ↓
Write / Edit
   ↓
Git Bash
   ↓
Run / Test
   ↓
Git
   ↓
GitHub
```

---

## 15. Testing

Testing will be introduced as the project develops.

Frontend:

- Vitest
- React Testing Library

Backend:

- pytest

Tests should be run before creating a Pull Request.

---

## 16. Team Development

EngineerOS is developed by a five-member student team.

Each developer should:

- Work on a feature branch.
- Keep commits focused.
- Test changes before pushing.
- Avoid direct development on `main`.
- Pull the latest `main` before starting new work.
- Create Pull Requests for significant changes.
- Communicate changes that affect shared architecture.

---

## 17. Documentation

Important project documentation is stored inside:

```text
docs/
```

Current documentation:

```text
docs/
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── SETUP.md
└── GIT_WORKFLOW.md
```

Documentation should be updated when important project decisions or workflows change.

---

## 18. Future Setup

As EngineerOS develops, this document will be expanded to include:

- Frontend installation
- Backend installation
- Python environment setup
- Database initialization
- API startup
- Frontend startup
- Testing commands
- Production builds
- Deployment
- Environment configuration
- AI services
- Simulation services

The setup documentation should always reflect the actual project setup.
