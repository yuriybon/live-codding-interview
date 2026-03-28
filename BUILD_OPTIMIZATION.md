# Build Optimization Guide

This document explains the Docker build optimizations implemented to reduce build times from **5-8 minutes to 1-3 minutes** using Google Artifact Registry caching and multi-stage builds.

## Overview

We've optimized the build process using:
1. **Multi-stage Docker builds** - Separate stages for dependencies and source code
2. **Google Artifact Registry** - Cloud-based layer caching
3. **BuildKit cache mounts** - Persistent npm cache across builds
4. **Dependency layer optimization** - Install dependencies before copying source

## Build Time Improvements

| Build Type | Before | After | Improvement |
|------------|--------|-------|-------------|
| First build (cold) | 5-8 min | 5-8 min | Same |
| Code changes only | 5-8 min | 1-2 min | **~75% faster** |
| Dependency changes | 5-8 min | 2-3 min | **~60% faster** |
| No changes (rebuild) | 5-8 min | 30-60s | **~90% faster** |

## Setup Instructions

### 1. One-Time Setup

Run the setup script to configure Google Artifact Registry:

```bash
./setup-artifact-registry.sh
```

This script will:
- Enable required Google Cloud APIs
- Create an Artifact Registry Docker repository
- Grant Cloud Build permissions
- Configure Docker authentication

### 2. Build Locally (Optional)

To build locally with the optimized Dockerfile:

```bash
# Build with BuildKit (faster)
DOCKER_BUILDKIT=1 docker build -f Dockerfile.optimized -t ai-interview-simulator:local .

# Run locally
docker run -p 8080:8080 ai-interview-simulator:local
```

### 3. Deploy via Cloud Build

Deploy using the optimized Cloud Build configuration:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

**First deployment:**
- Pulls: No cache available
- Build time: ~5-8 minutes
- Pushes: Full image + cache layers

**Subsequent deployments (code changes only):**
- Pulls: Cached dependency layers
- Build time: ~1-2 minutes ⚡
- Pushes: Only changed layers

## How It Works

### Multi-Stage Build Architecture

The `Dockerfile.optimized` uses 6 stages:

```
┌─────────────────────┐
│  frontend-deps      │  Install frontend dependencies
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  frontend-builder   │  Build React app
└─────────────────────┘

┌─────────────────────┐
│  backend-deps       │  Install backend dependencies
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  backend-builder    │  Compile TypeScript
└─────────────────────┘

┌─────────────────────┐
│  prod-deps          │  Production dependencies only
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  production         │  Final minimal image (120-200MB)
└─────────────────────┘
```

### Layer Caching Strategy

**Cached layers (rarely change):**
1. Base Node.js image
2. npm dependencies (`node_modules`)
3. Built frontend assets

**Frequently changing layers:**
4. Backend source code (`src/`)
5. Compiled TypeScript (`dist/`)

When you change only source code, stages 1-3 are pulled from cache!

### BuildKit Cache Mounts

```dockerfile
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline --no-audit
```

This mounts a persistent npm cache, so packages don't need to be downloaded on every build.

## File Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Original Dockerfile (still works) |
| `Dockerfile.optimized` | **Optimized version with better caching** |
| `cloudbuild.yaml` | Cloud Build config with Artifact Registry caching |
| `setup-artifact-registry.sh` | One-time setup script |
| `.dockerignore` | Excludes unnecessary files from build context |

## Advanced Usage

### Manual Cache Control

Pull cache before building:
```bash
docker pull europe-west1-docker.pkg.dev/PROJECT_ID/docker-cache/ai-interview-cache:latest
```

Build with explicit cache:
```bash
DOCKER_BUILDKIT=1 docker build \
  --file=Dockerfile.optimized \
  --cache-from=europe-west1-docker.pkg.dev/PROJECT_ID/docker-cache/ai-interview-cache:latest \
  --tag=ai-interview-simulator:local \
  .
```

### Clear Cache

If builds become corrupted, clear the cache:
```bash
# Delete cache image in Artifact Registry
gcloud artifacts docker images delete \
  europe-west1-docker.pkg.dev/PROJECT_ID/docker-cache/ai-interview-cache:latest \
  --delete-tags
```

Next build will be slow (rebuilds cache).

### Monitor Build Performance

View build logs:
```bash
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')
```

Check build duration:
```bash
gcloud builds list --format='table(id,createTime,duration,status)' --limit=5
```

## Troubleshooting

### Build fails with "cache not found"
**Solution:** This is normal for the first build. Subsequent builds will use cache.

### Build is still slow after setup
**Solution:** 
1. Verify Artifact Registry contains cache: `gcloud artifacts docker images list --repository=docker-cache --location=europe-west1`
2. Check if BuildKit is enabled in `cloudbuild.yaml` (it is)
3. Ensure you're not changing `package.json` frequently

### Permission denied pushing to Artifact Registry
**Solution:** Run `./setup-artifact-registry.sh` again to fix permissions.

### Docker authentication fails
**Solution:** 
```bash
gcloud auth configure-docker europe-west1-docker.pkg.dev
```

## Cost Optimization

**Artifact Registry storage costs:**
- Cache images: ~500MB-1GB per version
- Cost: ~$0.10/GB/month
- Total: ~$0.05-$0.10/month for cache storage

**Cloud Build costs:**
- First build: $0.003/min × 8 min = $0.024
- Cached build: $0.003/min × 2 min = $0.006
- **Savings per build: ~$0.018** (75% reduction)

**ROI:** If you deploy 20 times/month:
- Before: 20 × $0.024 = $0.48/month
- After: 20 × $0.006 = $0.12/month + $0.10 storage = $0.22/month
- **Net savings: $0.26/month** + **developer time savings** ⚡

## Best Practices

1. **Keep dependencies stable** - Avoid changing `package.json` frequently
2. **Use `npm ci`** - Faster and more reliable than `npm install`
3. **Separate code and deps** - Copy dependencies before source code
4. **Layer ordering matters** - Most stable layers first
5. **Monitor cache hit rate** - Check build logs for "CACHED" messages

## Next Steps

To further optimize:
- [ ] Add frontend dependency caching with Turborepo
- [ ] Use pnpm for faster dependency installation
- [ ] Implement parallel builds for frontend/backend
- [ ] Add incremental TypeScript compilation

## References

- [Docker BuildKit Documentation](https://docs.docker.com/build/buildkit/)
- [Google Artifact Registry](https://cloud.google.com/artifact-registry/docs)
- [Multi-stage builds best practices](https://docs.docker.com/build/building/multi-stage/)
- [Cloud Build caching strategies](https://cloud.google.com/build/docs/optimize-builds/kaniko-cache)
