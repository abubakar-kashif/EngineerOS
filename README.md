# EngineerOS

> **AI-Powered Electrical Engineering Learning Platform**

🌐 Live Website: https://engineeros.vercel.app
EngineerOS is an AI-powered electrical engineering learning platform designed to bridge the gap between **engineering theory and practical experimentation**.

It brings together **experiments, circuit building, simulation, validation, results, graphs, AI assistance, quizzes, lab reports, and learning progress** into one integrated learning environment.

---

## Overview

Engineering education often separates theoretical concepts from practical experimentation.

EngineerOS is designed around a connected learning workflow:

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

The goal is to give engineering students an environment where they can learn a concept, experiment with it, build and simulate circuits, inspect results, understand mistakes, and document what they learned.

---

## Current Status

🚧 **Actively under development**

EngineerOS is being developed incrementally as a full-stack engineering learning platform.

The current system includes the core website, authentication, engineering experiments, quizzes, reports, resources, AI Mentor functionality, simulation workspace functionality, result visualization, learning progress, and a public landing experience.

The platform continues to evolve as additional engineering and learning capabilities are developed.

---

# Key Features

## 🌐 Public Landing Experience

EngineerOS includes a public landing page that introduces the platform before authentication.

The landing experience provides:

* Platform overview
* Engineering-focused product presentation
* Feature highlights
* Learning workflow
* AI Mentor introduction
* Calls to action for Login and Registration
* Responsive design
* Animated/reveal-based visual elements

The public landing page is separate from the authenticated application.

---

## 🔐 Authentication

EngineerOS provides an authentication flow for accessing the learning environment.

The authentication system includes:

* User registration
* Login
* Email verification
* Protected application routes
* Verification-required handling
* Password reset flow
* Authenticated sessions
* Secure backend-side credential handling

Authentication and verification are integrated with the existing application rather than being handled directly by the frontend.

---

## ⚡ Engineering Experiments

EngineerOS is built around interactive electrical engineering experiments.

The initial experiment library includes:

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

Experiments are designed to connect theoretical concepts with practical circuit experimentation.

Each experiment can provide engineering context such as:

* Objective
* Theory
* Components
* Circuit configuration
* Procedure
* Results
* Calculations
* Learning activities

---

## 🔌 Interactive Circuit Workspace

The simulation workspace provides an environment for working with circuit components and connections.

Students can work with:

* Circuit components
* Component parameters
* Circuit connections
* Circuit configuration
* Circuit validation
* Simulation controls
* Measurements
* Simulation results

The workspace is designed around an engineering-tool workflow rather than a static diagram.

---

## 📊 Circuit Simulation & Results

EngineerOS includes simulation-oriented functionality for analyzing circuit behavior.

The simulation layer is responsible for determining what happens in the circuit, including engineering measurements and simulation results.

The system supports concepts such as:

* Voltage measurements
* Current measurements
* Circuit results
* Simulation state
* Result validation
* Graph visualization
* Result selection
* Simulation-to-AI context

A core architectural principle is:

> **Simulation determines what happened. AI determines what it means.**

This separation keeps engineering calculations and simulation evidence independent from AI interpretation.

---

## 🤖 AI Engineering Mentor

EngineerOS includes an AI Mentor designed specifically around the engineering learning workflow.

The AI Mentor can assist with:

* Engineering concept explanations
* Step-by-step guidance
* Circuit interpretation
* Simulation-result interpretation
* Troubleshooting guidance
* Error explanation
* Experiment-specific assistance
* Context-aware conversations

The AI layer can use relevant application context such as:

* Experiment context
* Simulation context
* Quiz context
* Report context
* User context
* Conversation context

AI responses are generated through the backend rather than exposing AI provider credentials or direct provider communication to the frontend.

### AI Architecture

```text
React Frontend
      ↓
FastAPI API
      ↓
Mentor Service
      ↓
Context Engine
      ↓
Prompt Builder
      ↓
AI Provider
      ↓
AI Response
```

This provider abstraction allows the AI layer to remain independent from a specific model provider.

---

## 🧠 Context-Aware AI

The AI Mentor is designed to understand the context of the student's current activity rather than functioning only as a generic chatbot.

For example, when working with a simulation, the AI can receive relevant simulation evidence and explain what those results mean.

This creates a separation between:

```text
Simulation
    ↓
Engineering Evidence
    ↓
AI Interpretation
```

The AI layer should not independently invent circuit measurements, simulation results, or engineering state.

---

## 📝 Quizzes

EngineerOS includes experiment-oriented quizzes designed to reinforce engineering understanding.

Quiz functionality includes:

* Multiple-choice questions
* Experiment-specific questions
* Engineering concept questions
* Result interpretation
* Answer evaluation
* Explanations
* Progress tracking
* Configurable quiz behavior

Mathematical and engineering content can be presented using formatted mathematical notation where appropriate.

---

## 📄 Lab Reports

EngineerOS provides functionality for documenting engineering experiments.

Reports can incorporate information such as:

* Experiment information
* Observations
* Results
* Conclusions
* Engineering analysis

The report system is designed to connect practical experimentation with formal engineering documentation.

Future iterations can expand report generation and AI-assisted documentation capabilities.

---

## 📈 Graphs & Data Visualization

Simulation and experiment results can be visualized through graphs.

The graph system is designed to work with actual available result data rather than fabricated values.

Users can select relevant simulation/result data for visualization and inspect the behavior of engineering quantities.

This helps connect:

```text
Circuit
   ↓
Simulation
   ↓
Measurements
   ↓
Graph
   ↓
Engineering Interpretation
```

---

## 📚 Learning Resources

EngineerOS includes a resources area for supporting engineering learning.

Resources can be associated with the platform's experiments and learning workflow, allowing students to access supporting educational material alongside practical experimentation.

---

## 📊 Learning Progress

The platform tracks learning activity across the application.

Progress functionality can be used for areas such as:

* Experiment progress
* Quiz performance
* Completed activities
* Learning history
* Reports
* Overall progress

The long-term goal is to provide students with a clear view of their engineering learning journey.

---

# Technology Stack

## Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide React
* Framer Motion

## Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy

## Database

* SQLite

## AI

* Provider-abstracted AI architecture
* Gemini provider integration
* Context-aware AI Mentor system

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

EngineerOS follows a **modular monolith architecture**.

The primary application architecture is:

```text
┌──────────────────────────────┐
│       React Frontend         │
│     TypeScript + Vite        │
└──────────────┬───────────────┘
               │
               │ REST API / JSON
               ↓
┌──────────────────────────────┐
│       FastAPI Backend        │
│        Python + Pydantic     │
└──────────────┬───────────────┘
               │
       ┌───────┴────────┐
       ↓                ↓
┌──────────────┐  ┌──────────────┐
│ Application  │  │ AI Services  │
│ Services     │  │              │
└──────┬───────┘  └──────────────┘
       │
       ↓
┌──────────────┐
│  SQLAlchemy  │
└──────┬───────┘
       ↓
┌──────────────┐
│    SQLite    │
└──────────────┘
```

The application also contains dedicated simulation functionality:

```text
                 ┌──────────────────┐
                 │  React Frontend  │
                 └────────┬─────────┘
                          │
                          ↓
                 ┌──────────────────┐
                 │   FastAPI API    │
                 └───────┬──┬───────┘
                         │  │
              ┌──────────┘  └──────────┐
              ↓                        ↓
      ┌────────────────┐       ┌────────────────┐
      │ Simulation     │       │ AI Engineering │
      │ Layer          │       │ Layer          │
      └───────┬────────┘       └───────┬────────┘
              │                        │
              │ Engineering Evidence   │
              └───────────→────────────┘
```

Detailed architectural decisions are maintained in:

```text
docs/ARCHITECTURE.md
```

---

# API

The backend exposes a REST API for communication with the frontend.

Development base URL:

```text
http://127.0.0.1:8000
```

The API is organized around application domains including:

```text
Authentication
Experiments
Quizzes
Progress
Reports
Resources
AI Mentor
Simulation
```

Representative endpoints include:

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

Detailed API contracts are maintained in:

```text
docs/API_CONTRACT.md
```

---

# Project Structure

The repository follows a frontend/backend/docs organization:

```text
EngineerOS/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── data/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   └── services/
│   └── tests/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── routes/
│   │   └── ...
│   └── public/
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

The repository structure may evolve as the platform grows.

---

# Application Routes

The application separates the public experience from the authenticated learning environment.

### Public

```text
/                    Public landing page
/login               Login
/register            Registration
/verify              Email verification
/forgot-password     Password recovery
/reset-password      Password reset
```

### Authenticated

```text
/home
/dashboard
/experiments
/quiz
/reports
/resources
/simulation
/ai-mentor
/tools
/settings
/about
```

The public landing page is intentionally **not part of the authenticated application sidebar**.

---

# Development Workflow

EngineerOS uses Git and GitHub for collaborative development.

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

The `main` branch is treated as the shared stable branch, while feature development is performed through dedicated branches and pull requests.

Detailed Git conventions are maintained in:

```text
docs/GIT_WORKFLOW.md
```

---

# Testing

Testing is an important part of the development workflow.

### Frontend

The frontend uses:

* Vitest
* React Testing Library
* ESLint
* TypeScript validation
* Vite production builds

### Backend

The backend uses:

* pytest
* API tests
* Service-level tests
* Backend logic tests

The project maintains automated tests across core frontend and backend functionality as development progresses.

---

# Development Roadmap

EngineerOS is being developed incrementally.

## Phase 1 — Foundation

* Project architecture
* Frontend application
* Backend API
* Database
* Routing
* Authentication
* Documentation
* Testing infrastructure

## Phase 2 — Engineering Learning System

* Engineering experiments
* Experiment details
* Components
* Procedures
* Calculations
* Quiz system
* Progress tracking
* Reports
* Learning resources

## Phase 3 — Interactive Circuit Workspace

* Circuit components
* Component configuration
* Circuit connections
* Workspace interaction
* Circuit validation
* Simulation workflow

## Phase 4 — Simulation & Results

* Circuit simulation
* Electrical calculations
* Measurements
* Simulation execution
* Result validation
* Graph visualization
* Parameter experimentation
* Simulation context

## Phase 5 — AI Engineering Layer

* AI Engineering Mentor
* Context-aware assistance
* Engineering explanations
* Simulation-result interpretation
* Troubleshooting guidance
* AI provider abstraction
* Prompt and context systems
* Streaming AI responses

## Phase 6 — Learning Intelligence

* Personalized learning
* Advanced AI-assisted learning
* Knowledge retrieval
* Intelligent quizzes
* Lab-report assistance
* Learning analytics
* Deeper experiment intelligence

---

# Development Principles

### 1. Engineering First

EngineerOS is designed around real engineering concepts and experimentation rather than generic educational content.

### 2. Separation of Responsibilities

Different system layers have clear responsibilities.

```text
Frontend
    ↓
Application/API
    ↓
Simulation / Services
    ↓
AI Interpretation
```

### 3. Simulation Determines What Happened

The simulation layer owns engineering state, circuit behavior, calculations, measurements, and simulation evidence.

The AI layer interprets that evidence.

### 4. AI Determines What It Means

AI is responsible for explanation, guidance, interpretation, troubleshooting assistance, and educational interaction.

It should not independently invent simulation measurements or circuit state.

### 5. Contract-Driven Development

Frontend and backend communicate through defined API contracts.

### 6. Build Incrementally

EngineerOS is developed in controlled phases rather than attempting to implement the entire platform simultaneously.

### 7. Test Before Integration

Important functionality is tested before changes are merged into the main development branch.

### 8. Keep the Architecture Practical

The project uses a modular monolith because it provides clear separation without introducing unnecessary microservice complexity.

---

# Documentation

Project documentation is maintained in the `docs/` directory.

```text
docs/
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── SETUP.md
└── GIT_WORKFLOW.md
```

These documents contain more detailed information about:

* System architecture
* API contracts
* Local setup
* Development workflow

---

# Local Development

Typical development requirements include:

* Node.js
* npm
* Python
* Git

Frontend and backend setup instructions are maintained in:

```text
docs/SETUP.md
```

The backend development server runs on:

```text
http://127.0.0.1:8000
```

---

# Team

EngineerOS is being developed by a **5-member student engineering team**.

The project follows a collaborative development model with responsibilities distributed across areas such as:

* Project architecture
* Frontend engineering
* Backend engineering
* AI engineering
* Simulation engineering
* API integration
* Testing
* Documentation
* GitHub collaboration

---

# Vision

The long-term vision of EngineerOS is to create a complete digital engineering laboratory where students can move naturally from understanding a concept to experimenting with it.

```text
Learn
  ↓
Build
  ↓
Simulate
  ↓
Measure
  ↓
Analyze
  ↓
Understand
  ↓
Practice
  ↓
Document
  ↓
Improve
```

EngineerOS aims to make electrical engineering learning more **interactive, practical, measurable, and intelligent**.

---

# License

This project is licensed under the terms specified in the [`LICENSE`](LICENSE) file.
