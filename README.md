# Wasel Palestine Backend

Backend system for **Wasel Palestine** – Advanced Software Engineering Project.

This project provides a scalable and modular backend system for managing:

* Incidents & Checkpoints
* Crowdsourced Reports
* Route Estimation
* Alerts & Subscriptions
* Authentication & Authorization

Built using modern backend engineering practices with a focus on scalability, modularity, and maintainability.

---

# Tech Stack

* **Node.js**
* **Express**
* **TypeScript**
* **MySQL (Dockerized)**
* **Redis (Dockerized)**
* **JWT Authentication**
* **Modular Architecture**

---

# Project Architecture

The project follows a **feature-based modular architecture**:

```
src/
  config/        → environment & app configuration
  db/            → database connection & queries
  common/        → middlewares, error handling, utilities
  modules/       → feature-based modules (auth, incidents, reports, etc.)
  integrations/  → external APIs (weather, routing)
  scripts/       → setup & helper scripts
```

Each module contains:

* routes
* controller
* service
* repository

This ensures clear separation of concerns and scalability.

---

# Features Implemented

* JWT Authentication (Access & Refresh Tokens)
* Role-Based Authorization (Admin / Moderator / User)
* Incidents & Checkpoints APIs
* Reports System (Voting + Moderation)
* External API Integrations (Weather & Routing)
* Pagination, Filtering, and Sorting
* Redis Integration
* MySQL Database with Docker
* RESTful Versioned APIs (`/api/v1/...`)

---

# Getting Started

## Requirements

Make sure you have installed:

* Node.js (v20 or higher)
* Git
* Docker Desktop

---

## Clone the Repository

```bash
git clone https://github.com/Shahd-Alawneh/WaselPalestine.git
cd WaselPalestine
```

---

## Install Dependencies

```bash
npm install
```

---

## Setup Environment Variables

Create a `.env` file in the root directory:

```
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3307
DB_USER=wasel
DB_PASSWORD=waselpass
DB_NAME=wasel_db

REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT_ACCESS_SECRET=change_me_access
JWT_REFRESH_SECRET=change_me_refresh
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
```

---

## Start Docker Services

```bash
docker compose up -d mysql redis
```

This will start:

* MySQL database (port 3307)
* Redis server (port 6379)

Verify:

```bash
docker ps
```

---

## Run the Development Server

```bash
npm run dev
```

Server runs at:

```
http://localhost:5000
```

---

# API Example

### Login

```
POST /api/v1/auth/login
```

Body:

```json
{
  "email": "user@email.com",
  "password": "Password1234"
}
```

---

# Docker Notes

* MySQL runs on: `localhost:3307`
* Redis runs on: `localhost:6379`
* Backend can run:

  * Locally via `npm run dev`
  * Or via Docker container

---

# Security

* JWT-based authentication
* Refresh token support
* Role-based access control (RBAC)
* Protected routes using middleware

---

# Current Status

* Backend fully functional
* Database connected and stable
* Authentication working
* Core APIs tested using Postman
* Docker environment configured

---

# Engineering Practices

* Modular architecture
* Clean separation of layers
* Environment-based configuration
* Dockerized infrastructure
* Scalable backend design

---

# Contributors

* Shahd Alawneh
* Yasmeen Khaleel
* Sewar Diab
* Loay Suwwan

---

# License

Academic project for Advanced Software Engineering course.
