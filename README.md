# Task Manager

A full-stack learning project to teach myself **NestJS**, **Angular**, and **PostgreSQL**.

It's a Kanban-style task board where users manage their own tasks across three columns: To Do, In Progress, and Completed. Admins can see and manage tasks for all users.

## What you can do

- Register an account and log in
- Create, delete, and drag tasks between columns
- **As admin:** view all users' tasks, seed example data, delete users, and manage all tasks

## Requirements

- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) running locally with a database named `taskmanager`

## Setup

### 1. Clone and install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure the backend

Create the `.env` file inside the `backend` folder by copying the example:

```bash
cp backend/.env.example backend/.env
```

Then open `backend/.env` and fill in your values — at minimum set `DATABASE_PASSWORD` to match your local PostgreSQL password and choose your own `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

> **Note:** The admin account is created automatically on first startup using these credentials. Keep them in mind — you'll need them to log in as admin once the app is running.

### 3. Create the database

In psql or pgAdmin, create a database named `taskmanager`:

```sql
CREATE DATABASE taskmanager;
```

### 4. Run it

```bash
# Backend (port 3000)
cd backend
npm run start:dev

# Frontend (port 4200)
cd frontend
npm start
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## Stack

| Layer    | Tech                  |
|----------|-----------------------|
| Frontend | Angular 19            |
| Backend  | NestJS                |
| Database | PostgreSQL + TypeORM  |
| Auth     | JWT (access + refresh)|
