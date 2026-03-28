# JoinEazy

[![Demo Video](https://img.shields.io/badge/YouTube-Watch%20Demo-red?style=for-the-badge&logo=youtube)](https://youtu.be/Q-T3hWM4b6M)

![JoinEazy Application Screenshot](./frontend/src/assets/joineazy-ss.png)

A role-based full-stack web application for managing student groups, assignments, and submissions. Students form groups, manage members, and confirm assignment submissions through a secure multi-step verification flow. Professors create assignments, track group progress, and evaluate student work with per-student granularity.

## Overview of Implementation

- **Frontend**: Built with React (Vite) and Tailwind CSS for a responsive, modular UI.
- **Backend**: Node.js and Express RESTful API with route-level middleware for authentication and authorization.
- **Database**: PostgreSQL with raw SQL queries via the `pg` driver, enforcing complex constraints and triggers at the database level.
- **Auth**: JWT-based authentication using HttpOnly cookies to prevent XSS.

## Architecture Overview

![System Architecture](./frontend/src/assets/architecture.png)

## Database Schema

![Database Schema ER Diagram](./frontend/src/assets/schema.png)
