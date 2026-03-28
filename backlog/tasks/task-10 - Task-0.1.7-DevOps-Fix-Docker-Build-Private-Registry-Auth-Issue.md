---
id: TASK-10
title: 'Task 0.1.7: [DevOps] Fix Docker Build Private Registry Auth Issue'
status: Done
assignee: []
created_date: '2026-03-28 11:11'
updated_date: '2026-03-28 11:12'
labels:
  - devops
  - docker
  - bug-fix
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Context & Goal:** 
The Cloud Build fails during `npm ci` with an `E401` unauthorized error because the `package-lock.json` files contain private JFrog Artifactory registry URLs (`https://genuineparts.jfrog.io/...`) rather than the public npm registry. Since the Cloud Build environment lacks the enterprise credentials to access this registry, it fails to download the dependencies.

**Technical Details:**
We must ensure that the Docker build relies purely on the public npm registry, regardless of the local `package-lock.json` state. Since `npm ci` strictly enforces the URLs in the lockfile, we need to instruct Docker to remove the lockfiles, configure npm to use the public registry, and run `npm install` instead of `npm ci`.

1. Update the `Dockerfile` to configure the npm registry globally before installing dependencies: `RUN npm config set registry https://registry.npmjs.org/`
2. Change `npm ci` to `npm install` (or delete the lockfiles before running `npm install`) in both the frontend and backend build stages.
3. This ensures the container pulls dependencies directly from the public internet.

**Architectural Principle:**
- **Environment Parity:** Build artifacts must be reproducible in CI/CD without relying on local developer machine configurations or authenticated private proxies unless explicitly provisioned in the CI/CD pipeline.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 #1 `Dockerfile` configures `npm` to use `https://registry.npmjs.org/` explicitly.
- [x] #2 #2 `Dockerfile` removes `package-lock.json` and uses `npm install` instead of `npm ci` to bypass private registry URLs locked by local environments.
<!-- AC:END -->
