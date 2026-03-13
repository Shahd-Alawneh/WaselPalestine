#  Wasel Palestine Backend

Backend system for **Wasel Palestine** – Advanced Software Engineering Project.

This project provides a scalable and modular backend system for managing:
- Incidents & Checkpoints
- Crowdsourced Reports
- Route Estimation
- Alerts & Subscriptions
- Authentication & Authorization

Built with modern backend best practices.

---

#  Tech Stack

- **Node.js**
- **Express**
- **TypeScript**
- **MySQL (Dockerized)**
- **Redis (Dockerized)**
- **JWT Authentication**
- **Modular Architecture**

---

#  Project Architecture

The project follows a modular structure for scalability and maintainability.

```
src/
  config/        → environment & app configuration
  db/            → database connection & queries
  common/        → middlewares, error handling, utilities
  modules/       → feature-based modules (auth, incidents, etc.)
  integrations/  → external APIs (weather, routing)
  jobs/          → background tasks
  tests/         → unit & e2e tests
```

Each module contains:
- routes
- controller
- service
- repository

This ensures clean separation of concerns.

---

#  Getting Started

##  Requirements

Make sure you have installed:

- Node.js (v20 or higher)
- Git
- Docker Desktop
- VS Code (recommended)

---

##  Clone the Repository

```bash
git clone https://github.com/Shahd-Alawneh/WaselPalestine.git
cd WaselPalestine
```

---

##  Install Dependencies

```bash
npm install
```

---

##  Setup Environment Variables

Create a `.env` file in the root directory and copy the contents from `.env.example`.

Example:

```
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=13306
DB_USER=wasel
DB_PASSWORD=waselpass
DB_NAME=wasel_db

JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

---

##  Start Docker Services

```bash
docker compose up -d
```

This will start:
- MySQL database
- Redis server

To verify:

```bash
docker ps
```

---

##  Run the Development Server

```bash
npm run dev
```

Server runs at:

```
http://localhost:5000
```

Health check endpoint:

```
GET /api/v1/health
```

---

#  Authentication System (Planned)

- Register
- Login
- JWT Access & Refresh tokens
- Role-based authorization

---

#  Core Modules (Planned)

- Auth Module
- Users Module
- Incidents & Checkpoints
- Crowdsourced Reports
- Route Estimation
- Alerts & Subscriptions
- External Integrations (Weather & Routing APIs)

---

#  Docker Setup

Services included:

- MySQL 8.0
- Redis 7

Database runs on:

```
localhost:13306
```

Redis runs on:

```
localhost:6379
```

---

#  Team Workflow

We follow a feature-branch workflow.

### Do NOT push directly to `main`.

Create a branch:

```bash
git checkout -b feature/feature-name
```

Commit clearly:

```bash
git commit -m "Add register endpoint"
```

Push branch:

```bash
git push origin feature/feature-name
```

Then create a Pull Request.

---

#  Current Status

 Project structure initialized  
 Docker environment configured  
 MySQL & Redis running  
 Database connection verified  

---

#  Engineering Practices

- Modular architecture
- Environment-based configuration
- Dockerized services
- Centralized error handling
- Secure JWT authentication
- Scalable structure for future microservices expansion

---

#  Contributors

- Shahd Alawneh
- Yasmeen Khaleel
- Sewar Diab
- Loay Suwwan

---

#  License

Academic project for Advanced Software Engineering course.
