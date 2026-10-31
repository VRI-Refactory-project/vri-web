# vri-web

VRI frontend

# VRI Web Frontend (`vri-web`)

The official Web Frontend application for the **Video Relay Interpreting (VRI) Platform in Uganda**, serving institutions (healthcare, justice, education), sign language interpreters, and system administrators.

Built with **React 18**, **TypeScript**, and **Vite**, fully containerised via **Docker**, and integrated with an automated **GitHub Actions CI Pipeline**.

---

## Tech Stack & Architecture

- **Framework**: React (Vite + TypeScript)
- **Runtime**: Node.js v20 (Docker) / v22 (CI Pipeline)
- **Containerisation**: Docker & Docker Compose (`node:20-alpine`)
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)
- **Backend API**: Django REST API (`vri-api`) on `http://localhost:8000`
- **Code Quality & Hooks**: ESLint, Husky (`HUSKY=0` in CI)

---

## Quick Start with Docker (Recommended)

Docker ensures line-ending consistency (`LF`) across Windows, macOS, and Linux environments.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```
