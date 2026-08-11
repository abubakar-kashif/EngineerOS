# EngineerOS Architecture

## 1. Overview

EngineerOS uses a modular monolith architecture designed to connect electrical engineering theory with practical experimentation, circuit building, simulation, validation, analysis, and AI-assisted learning.

The system is divided into several clear layers:

- Frontend
- Backend API
- Business logic
- Database
- Future simulation engine
- Future AI services

The initial goal is to keep the architecture simple, maintainable, and suitable for a student development team while allowing the platform to grow into a more advanced engineering system later.

---

## 2. High-Level Architecture

The initial system follows this structure:

```text
┌──────────────────────────────┐
│       React Frontend         │
│   TypeScript + Vite          │
│   Tailwind CSS               │
└──────────────┬───────────────┘
               │
               │ REST API / JSON
               ↓
┌──────────────────────────────┐
│       FastAPI Backend        │
│   Python + Pydantic          │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│       Service Layer          │
│      Business Logic          │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│         SQLAlchemy           │
│      Database Access         │
└──────────────┬───────────────┘
               │
               ↓
┌──────────────────────────────┐
│            SQLite            │
│       Development DB         │
└──────────────────────────────┘
````

---

## 3. Frontend Architecture

The frontend is responsible for the user interface and interaction with the EngineerOS platform.

Technology:

* React
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Lucide React

The frontend follows a simple separation of responsibilities:

```text
Page
  ↓
Component
  ↓
Service
  ↓
API
```

### Frontend Responsibilities

The frontend will handle:

* Application layout
* Navigation
* Routing
* Engineering experiment pages
* Experiment details
* Circuit workspace
* Dashboard
* Quiz interface
* Lab report interface
* Progress interface
* Learning resources
* API communication
* Loading states
* Error states
* User interaction

### Planned Frontend Areas

```text
Home
Experiments
Experiment Details
Workspace
Dashboard
Quiz
Reports
Resources
Progress
```

---

## 4. Backend Architecture

The backend provides the REST API and contains the main application logic.

Technology:

* Python
* FastAPI
* Pydantic
* SQLAlchemy

The backend follows this request flow:

```text
HTTP Request
     ↓
Router
     ↓
Schema Validation
     ↓
Service Layer
     ↓
Database
     ↓
Response Schema
     ↓
JSON Response
```

### Backend Responsibilities

The backend will handle:

* REST API
* Experiment data
* Quiz data
* Progress tracking
* Lab reports
* Resources
* Database operations
* Validation
* Business logic
* API error handling

---

## 5. Backend Module Structure

The backend will be organized into logical modules rather than one large file.

Planned structure:

```text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   └── routes/
│   │
│   ├── core/
│   │
│   ├── models/
│   │
│   ├── schemas/
│   │
│   ├── services/
│   │
│   └── database/
│
└── tests/
```

The exact structure may evolve as development progresses.

---

## 6. API Layer

The API layer exposes backend functionality to the frontend through REST endpoints.

Development base URL:

```text
http://127.0.0.1:8000
```

Example endpoint:

```text
GET /api/health
```

The API uses JSON for communication between frontend and backend.

The frontend should communicate with the backend through API services rather than directly accessing the database.

---

## 7. Database Architecture

SQLite will be used as the initial development database.

SQLAlchemy will provide the database abstraction layer.

The database layer is responsible for:

* Storing experiments
* Storing quizzes
* Storing progress
* Storing reports
* Storing resources
* Managing database relationships
* Providing database access to backend services

The SQLite database file will remain local during development and will be excluded from Git.

---

## 8. Data Flow

A typical request will follow this pattern:

```text
User
 ↓
React Page
 ↓
React Component
 ↓
Frontend API Service
 ↓
HTTP Request
 ↓
FastAPI Router
 ↓
Pydantic Validation
 ↓
Backend Service
 ↓
SQLAlchemy
 ↓
SQLite
 ↓
Response Schema
 ↓
JSON
 ↓
Frontend API Service
 ↓
React Component
 ↓
User Interface
```

This separation keeps frontend, backend, and database responsibilities independent.

---

## 9. Experiment System

Experiments are one of the core features of EngineerOS.

Initial experiments include:

```text
Ohm's Law
Series Circuit
Parallel Circuit
Kirchhoff's Voltage Law
Kirchhoff's Current Law
Voltage Divider
Current Divider
RC Circuit
Diode Characteristics
LED Circuit
```

Each experiment can eventually contain:

* Title
* Description
* Difficulty
* Category
* Learning objectives
* Theory
* Components
* Circuit diagram
* Procedure
* Calculations
* Simulation
* Results
* Graphs
* Quiz
* Lab report
* Progress

The initial website phase will focus on the structure and presentation of experiments.

Advanced simulation will be implemented later.

---

## 10. Circuit Workspace

The future circuit workspace will allow students to interact with electrical circuits.

Planned capabilities include:

* Circuit components
* Component configuration
* Circuit connections
* Parameter modification
* Circuit inspection
* Circuit validation
* Simulation preparation

The initial website foundation does not require a real circuit simulation engine.

---

## 11. Future Simulation Engine

A simulation engine will be introduced in a later development phase.

Its responsibilities may include:

* Circuit validation
* Electrical calculations
* Circuit execution
* Voltage calculations
* Current calculations
* Waveform generation
* Parameter sweeps
* Graph generation
* Simulation results
* Result validation

Future architecture:

```text
React Frontend
       ↓
FastAPI Backend
       ↓
Simulation Service
       ↓
Circuit Simulation Engine
       ↓
Simulation Results
       ↓
Graphs / Analysis
       ↓
Frontend
```

The simulation engine is intentionally separated from the initial application foundation.

---

## 12. Future AI Layer

AI functionality will be integrated later through the backend.

The AI layer may provide:

* AI engineering mentor
* Concept explanations
* Step-by-step guidance
* Circuit explanations
* Troubleshooting
* Error diagnosis
* Result interpretation
* Personalized learning assistance
* AI-generated quizzes
* Lab report assistance

Future architecture:

```text
React Frontend
       ↓
FastAPI Backend
       ↓
AI Service
       ↓
AI Model / AI Provider
       ↓
AI Response
       ↓
FastAPI Backend
       ↓
React Frontend
```

The AI layer should not be tightly coupled to frontend components.

---

## 13. Future AI + Simulation Architecture

The long-term architecture may evolve into:

```text
                         ┌──────────────────────┐
                         │    React Frontend    │
                         └──────────┬───────────┘
                                    │
                                    ↓
                         ┌──────────────────────┐
                         │     FastAPI API      │
                         └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ↓               ↓               ↓
             ┌────────────┐  ┌────────────┐  ┌────────────┐
             │ Experiment │  │ Simulation │  │ AI Service │
             │  Services  │  │   Engine   │  │            │
             └──────┬─────┘  └──────┬─────┘  └──────┬─────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    ↓
                            ┌──────────────┐
                            │   Database   │
                            └──────────────┘
```

This is a future design. It does not mean all these components need to be implemented immediately.

---

## 14. Authentication

Authentication is not part of the initial website foundation.

The first development phase will focus on:

* Website structure
* Experiments
* Dashboard
* Workspace
* Backend API
* Database
* Documentation
* Testing

Authentication can be introduced later when it becomes necessary.

---

## 15. Testing Architecture

Testing will be introduced throughout development.

Frontend testing:

* Vitest
* React Testing Library

Backend testing:

* pytest

Testing will focus on important functionality such as:

* API endpoints
* Business logic
* Experiment data
* Quiz functionality
* Progress functionality
* Critical frontend components

---

## 16. Configuration

Environment-specific configuration will be stored through environment variables.

The repository contains:

```text
.env.example
```

Developers can create their local environment file from the example.

Actual `.env` files must not be committed to Git.

Secrets and sensitive configuration must never be stored directly in source code.

---

## 17. Git and Collaboration

EngineerOS uses a shared GitHub repository.

The main branch is:

```text
main
```

Development should normally happen through feature branches.

Example:

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

This allows the five-member team to work on different parts of the system without directly modifying the stable branch.

---

## 18. Architectural Principles

EngineerOS follows these principles:

### Build Incrementally

The platform will be developed in stages.

The website foundation comes before advanced AI and simulation.

### Keep the Architecture Simple

The initial system uses a modular monolith.

Microservices should only be introduced when there is a genuine engineering requirement.

### Separate Responsibilities

Frontend, backend, database, simulation, and AI responsibilities should remain clearly separated.

### Use API Contracts

Frontend and backend communication should follow clearly defined API contracts.

### Avoid Premature Complexity

Features should not be added simply because they are technically possible.

The architecture should remain understandable to the entire development team.

### Design for Future Expansion

Although the initial system is simple, the architecture should allow simulation and AI capabilities to be integrated later without rebuilding the entire platform.

---

## 19. Current Development Architecture

During the initial website foundation phase, the active architecture is:

```text
┌──────────────────────────┐
│      React Frontend      │
│ TypeScript + Vite        │
│ Tailwind CSS             │
└────────────┬─────────────┘
             │
             │ REST API / JSON
             ↓
┌──────────────────────────┐
│     FastAPI Backend      │
│ Python + Pydantic        │
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

AI and simulation are **future layers** and are not part of the current implementation.

---

## 20. Summary

EngineerOS starts with a simple modular monolith architecture:

```text
React
  ↓
FastAPI
  ↓
Services
  ↓
SQLAlchemy
  ↓
SQLite
```

The architecture is intentionally designed to support future expansion into:

```text
Engineering Experiments
        +
Interactive Circuit Workspace
        +
Simulation Engine
        +
AI Engineering Mentor
        +
Learning Intelligence
```

The goal is to build the foundation correctly first and progressively introduce advanced engineering and AI capabilities.