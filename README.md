# Task Manager

A full-stack learning project to teach myself **NestJS**, **Angular**, **PostgreSQL**, and **Docker**.

It's a Kanban-style task board where users manage their own tasks across three columns: To Do, In Progress, and Completed.

## Features

**For everyone**

- Authentication: Register an account and log in with JWT authentication, featuring secure access and refresh tokens.
- Task Management: Create and delete your own personal tasks.
- Organization: Drag and drop tasks across columns to manage your workflow.

**For project managers**

- Team Creation: Initiate and manage new project teams.
- Member Management: Assign and remove users from your specific teams.
- Full Oversight: See, Edit, Move, and Delete all tasks belonging to your teams.
- Task Delegation: Directly assign tasks to team members.

**For admins**

- User Management: Comprehensive control over all user accounts.
- Role Promotion: Elevate standard users to the Project Manager role.
- Global Visibility: Master view of all tasks across the entire platform.
- Development Tools: Seed example users and tasks to quickly populate the board for testing.
- System Hard Reset: Capability to delete all tasks or wipe the entire database.

## Stack

| Layer     | Tech                    |
|-----------|-------------------------|
| Frontend  | Angular 21 + nginx      |
| Backend   | NestJS                  |
| Database  | PostgreSQL 18 + TypeORM |
| Auth      | JWT (access + refresh)  |
| Container | Docker + Docker Compose |

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/leonAlb/task-manager.git
cd task-manager
```

### 2. Set up environment files

Copy the example env files and fill in your values:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

Open both files and set your own values for passwords, JWT secrets, and admin credentials.

> **Note:** The admin account is created automatically on first startup using the credentials in `backend/.env`.

### 3. Run it

```bash
docker compose up --build
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

## Useful commands

```bash
docker compose up --build    # rebuild images and start
docker compose up            # start without rebuilding
docker compose down          # stop and remove containers (data preserved)
docker compose down -v       # stop and wipe all data
docker compose logs -f       # tail logs for all services
```