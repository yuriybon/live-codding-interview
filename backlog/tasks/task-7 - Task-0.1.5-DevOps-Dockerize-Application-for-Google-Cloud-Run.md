---
id: TASK-7
title: 'Task 0.1.5: [DevOps] Dockerize Application for Google Cloud Run'
status: Done
assignee: []
created_date: '2026-03-28 10:26'
updated_date: '2026-03-28 10:28'
labels:
  - devops
  - docker
  - cloud-run
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Context & Goal:** 
In order to deploy the `ai-interview-simulator` to Google Cloud Run, we need a containerization strategy that bundles both the Node.js Express backend and the built React frontend into a single manageable artifact.

**Technical Details:**
1. Update `src/server/index.ts` to serve static files from the `frontend/dist` directory when running in production (`NODE_ENV === 'production'`).
2. Add a catch-all route to `src/server/index.ts` to serve the `index.html` file for any unknown paths to support client-side routing (React Router).
3. Create a multi-stage `Dockerfile` in the project root:
   - **Stage 1 (Frontend Build):** Install frontend dependencies and run `npm run build`.
   - **Stage 2 (Backend Build):** Install backend dependencies and run `tsc` to compile TypeScript to JavaScript.
   - **Stage 3 (Production Runner):** Copy compiled backend and frontend build artifacts into a lean Node.js Alpine image. Ensure it listens on `process.env.PORT` (usually 8080 for Cloud Run).
4. Create a `.dockerignore` file to prevent unnecessary files from inflating the build context.

**Architectural Principle:**
- **Immutable Artifacts & Single Container Deployment:** Cloud Run prefers a single container listening on a specific port. Bundling the static frontend with the backend simplifies the deployment pipeline and operational footprint.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 #1 A `Dockerfile` exists in the root directory using a multi-stage build strategy.
- [x] #2 #2 A `.dockerignore` file exists to prevent local node_modules from being copied into the container context.
- [x] #3 #3 The Express backend is updated to serve frontend static files in production.
<!-- AC:END -->
