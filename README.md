# EngineerOS

> **AI-Powered Electrical Engineering Learning Platform**

EngineerOS is an AI-powered electrical engineering learning platform designed to bridge the gap between engineering theory and practical experimentation.

The platform brings together **theory, circuit building, simulation, validation, results analysis, AI assistance, quizzes, lab reports, and learning progress** into one integrated environment.

---

## Vision

Traditional engineering learning often separates theory from practical experimentation.

EngineerOS aims to create a unified learning workflow:

```text
Theory
   ↓
Experiment
   ↓
Circuit Building
   ↓
Simulation
   ↓
Validation
   ↓
Results
   ↓
Graphs
   ↓
AI Explanation
   ↓
Quiz
   ↓
Lab Report
   ↓
Progress
```

The long-term goal is to provide engineering students with an interactive environment where they can learn concepts, build circuits, experiment with parameters, validate their results, understand mistakes, and document their work.

---

## Project Status

🚧 **Currently under active development**

The project is being developed incrementally.

### Current Phase

The current development phase focuses on building the complete website foundation:

* Frontend application
* Backend API
* Database
* API contracts
* Documentation
* Engineering experiments
* Dashboard and workspace interfaces
* Testing infrastructure
* GitHub collaboration workflow

Advanced AI systems and real circuit simulation will be implemented in later development phases.

---

## Core Features

EngineerOS is planned around several major areas.

### 1. Engineering Experiments

Students will be able to explore electrical engineering experiments including:

* Ohm's Law
* Series Circuits
* Parallel Circuits
* Kirchhoff's Voltage Law
* Kirchhoff's Current Law
* Voltage Divider
* Current Divider
* RC Circuits
* Diode Characteristics
* LED Circuits

Each experiment is designed to connect theoretical concepts with practical experimentation.

---

### 2. Circuit Workspace

The platform will provide an interactive workspace where students can:

* Build circuits
* Configure components
* Modify circuit parameters
* Connect components
* Inspect circuit values
* Prepare circuits for simulation
* Validate circuit configurations

---

### 3. Circuit Simulation

Future versions will provide circuit simulation capabilities including:

* Circuit execution
* Voltage calculations
* Current calculations
* Waveform generation
* Parameter sweeps
* Simulation results
* Graph visualization
* Result validation

---

### 4. AI Engineering Mentor

EngineerOS will eventually include an AI engineering mentor capable of helping students understand and troubleshoot engineering problems.

Planned capabilities include:

* Concept explanations
* Step-by-step guidance
* Circuit explanations
* Error diagnosis
* Troubleshooting assistance
* Result interpretation
* Engineering questions and answers
* Personalized learning assistance

---

### 5. AI Circuit Assistance

Future AI capabilities may allow students to describe a desired circuit using natural language.

For example:

```text
"Create a voltage divider using a 10V source
with an output of approximately 5V."
```

The AI system could eventually assist with:

* Circuit generation
* Component selection
* Circuit modification
* Parameter suggestions
* Circuit validation
* Troubleshooting

---

### 6. Quizzes

Each experiment will eventually include quizzes designed to test understanding.

Planned quiz functionality:

* Concept questions
* Multiple-choice questions
* Experiment-based questions
* Results interpretation
* Instant feedback
* Progress tracking

---

### 7. Lab Reports

EngineerOS will provide tools to help students document their experiments.

Planned report sections include:

* Experiment title
* Objective
* Theory
* Components
* Circuit diagram
* Procedure
* Observations
* Calculations
* Simulation results
* Graphs
* Discussion
* Conclusion

AI assistance may later help students organize and explain their results.

---

### 8. Learning Progress

The platform will track student progress across experiments and learning activities.

Planned progress features include:

* Completed experiments
* Quiz scores
* Learning history
* Experiment progress
* Performance statistics
* Reports
* Overall learning progress

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide React

## Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy

## Database

* SQLite

## Testing

* Vitest
* React Testing Library
* pytest

## Development

* Git
* GitHub
* VS Code

---

# Architecture

EngineerOS is being developed as a **modular monolith** rather than a collection of microservices.

The initial architecture is:

```text
┌──────────────────────────┐
│     React Frontend       │
│   TypeScript + Vite      │
└────────────┬─────────────┘
             │
             │ REST API / JSON
             ↓
┌──────────────────────────┐
│      FastAPI Backend     │
│   Python + Pydantic      │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│       SQLAlchemy         │
└────────────┬─────────────┘
             │
             ↓
┌──────────────────────────┐
│          SQLite          │
└──────────────────────────┘
```

Future components will integrate into this architecture:

```text
                 ┌─────────────────┐
                 │  React Frontend │
                 └────────┬────────┘
                          │
                          ↓
                 ┌─────────────────┐
                 │  FastAPI API    │
                 └───────┬─┬───────┘
                         │ │
              ┌──────────┘ └──────────┐
              ↓                       ↓
      ┌───────────────┐       ┌───────────────┐
      │ Simulation    │       │ AI Services   │
      │ Engine        │       │               │
      └───────────────┘       └───────────────┘
```

Detailed architectural decisions will be documented in:

```text
docs/ARCHITECTURE.md
```

---

# API

The backend exposes a REST API.

Development base URL:

```text
http://127.0.0.1:8000
```

Initial API endpoints include:

```text
GET  /api/health

GET  /api/experiments
GET  /api/experiments/{experiment_id}

GET  /api/quizzes/{experiment_id}
POST /api/quizzes/{experiment_id}/submit

GET  /api/progress
POST /api/progress

GET  /api/reports
POST /api/reports

GET  /api/resources
GET  /api/resources/{resource_id}
```

Simulation and AI endpoints will be introduced in later development phases.

Detailed API contracts will be maintained in:

```text
docs/API_CONTRACT.md
```

---

# Project Structure

The project is organized as follows:

```text
EngineerOS/
│
├── backend/
│   ├── app/
│   ├── tests/
│   └── ...
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── SETUP.md
│   └── GIT_WORKFLOW.md
│
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

The structure will evolve as development progresses.

---

# Development Workflow

EngineerOS uses Git and GitHub for collaborative development.

The main branch is protected from direct development.

The general workflow is:

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

Example branches:

```text
frontend/home
frontend/experiments
frontend/workspace

backend/experiments
backend/quiz
backend/progress
backend/reports

docs/api-contract
test/api
```

---

# Team

EngineerOS is being developed by a **5-member student team**.

The project follows a collaborative development model where responsibilities are divided across:

* Project architecture
* Frontend development
* Backend development
* API integration
* Testing
* Documentation
* GitHub collaboration

---

# Development Roadmap

## Phase 1 — Website Foundation

* Project setup
* React frontend
* FastAPI backend
* SQLite database
* API foundation
* Routing
* Shared UI
* Experiment pages
* Dashboard
* Workspace
* Documentation
* Testing foundation

## Phase 2 — Engineering Experiment System

* Experiment data
* Experiment details
* Components
* Procedures
* Calculations
* Results
* Experiment progress

## Phase 3 — Interactive Circuit Workspace

* Circuit components
* Circuit connections
* Circuit configuration
* Circuit validation
* Workspace interaction

## Phase 4 — Simulation Engine

* Circuit simulation
* Electrical calculations
* Simulation execution
* Waveforms
* Graphs
* Results analysis

## Phase 5 — AI Engineering Layer

* AI engineering mentor
* AI explanations
* AI troubleshooting
* AI circuit generation
* AI circuit modification
* AI result interpretation

## Phase 6 — Learning Intelligence

* AI quizzes
* Personalized learning
* Lab report assistance
* Progress analytics
* Engineering knowledge retrieval

---

# Development Philosophy

EngineerOS is being built with the following principles:

### Build incrementally

Features are implemented in stages rather than attempting to build the entire platform at once.

### Keep the architecture simple

The initial system uses a modular monolith instead of unnecessary microservices.

### Separate responsibilities

Frontend, backend, database, simulation, AI, and documentation should have clear boundaries.

### Use contracts

Frontend and backend communicate through clearly defined API contracts.

### Test important functionality

Core backend logic and frontend functionality will be tested as the project develops.

### Build for real engineering learning

The platform should connect theoretical knowledge with practical engineering experimentation rather than simply presenting static educational content.

---

# Documentation

Detailed project documentation will be maintained inside the `docs/` directory.

Planned documentation:

```text
docs/
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── SETUP.md
└── GIT_WORKFLOW.md
```

---

# Local Development

Detailed setup instructions will be provided in:

```text
docs/SETUP.md
```

The project will eventually require:

* Node.js
* npm
* Python
* Git

---

# License

This project is licensed under the terms specified in the `LICENSE` file.
