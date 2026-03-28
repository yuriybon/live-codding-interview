---
id: TASK-8
title: 'Task 0.1.6: [DevOps] Fix Cloud Build Service Account Logging Issue'
status: Done
assignee: []
created_date: '2026-03-28 10:53'
updated_date: '2026-03-28 10:55'
labels:
  - devops
  - cloud-build
dependencies: []
priority: high
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**Context & Goal:** 
When deploying using Google Cloud Build with a specified custom Service Account (`build.service_account`), Cloud Build enforces stricter logging configurations. The build failed with:
`Your build failed to run: if 'build.service_account' is specified, the build must either (a) specify 'build.logs_bucket', (b) use the REGIONAL_USER_OWNED_BUCKET build.options.default_logs_bucket_behavior option, or (c) use either CLOUD_LOGGING_ONLY / NONE logging options: invalid argument`

**Technical Details:**
We need to provide a `cloudbuild.yaml` file (or update the existing configuration) that configures the build environment to explicitly use `CLOUD_LOGGING_ONLY` to bypass the bucket requirement while still retaining logs in Cloud Logging.

**Architectural Principle:**
- **Explicit Cloud Configurations:** Infrastructure as Code (IaC) files should be explicit about security and logging boundaries to ensure reproducible deployments in Google Cloud Platform (GCP).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 #1 Provide a `cloudbuild.yaml` template configured with the correct logging options.
<!-- AC:END -->
