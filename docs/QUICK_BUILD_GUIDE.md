# Quick Build Guide

Fast reference for building and deploying with optimized caching.

## Initial Setup (Once)

```bash
# Run the setup script
./setup-artifact-registry.sh
```

## Deploy to Cloud Run

```bash
# Deploy with optimized caching (fast after first build)
gcloud builds submit --config=cloudbuild.yaml
```

**Build times:**
- First build: ~5-8 minutes
- Subsequent builds: ~1-3 minutes ⚡

## Local Development

```bash
# Build locally (fast with cache)
DOCKER_BUILDKIT=1 docker build -f Dockerfile.optimized -t ai-interview:local .

# Run locally
docker run -p 8080:8080 -p 8081:8081 ai-interview:local

# Test the app
curl http://localhost:8080/health
```

## Common Commands

### View recent builds
```bash
gcloud builds list --limit=5
```

### Check build logs
```bash
gcloud builds log $(gcloud builds list --limit=1 --format='value(id)')
```

### View cached images
```bash
gcloud artifacts docker images list \
  --repository=docker-cache \
  --location=europe-west1
```

### Force rebuild (no cache)
```bash
# Delete cache image
gcloud artifacts docker images delete \
  europe-west1-docker.pkg.dev/$(gcloud config get-value project)/docker-cache/ai-interview-cache:latest

# Next build will be slow but fresh
gcloud builds submit --config=cloudbuild.yaml
```

## Troubleshooting

### "Permission denied" error
```bash
# Fix permissions
./setup-artifact-registry.sh
```

### Build is slow
```bash
# Check if cache exists
gcloud artifacts docker images list --repository=docker-cache --location=europe-west1

# If empty, first build creates cache (slow)
# Second build will be fast
```

### Docker login issues
```bash
gcloud auth configure-docker europe-west1-docker.pkg.dev
```

## Performance Tips

✅ **DO:**
- Keep `package.json` stable
- Use the optimized Dockerfile
- Let Cloud Build handle caching

❌ **DON'T:**
- Change dependencies frequently
- Edit `package-lock.json` manually
- Skip the setup script

## Migration from Old Dockerfile

The original `Dockerfile` still works, but `Dockerfile.optimized` is faster:

```bash
# Old way (slow)
gcloud builds submit --config=cloudbuild-old.yaml

# New way (fast)
gcloud builds submit --config=cloudbuild.yaml
```

## Build Performance Comparison

| Change Type | Old Build | New Build | Time Saved |
|-------------|-----------|-----------|------------|
| Code only | 5-8 min | 1-2 min | **~75%** |
| Dependencies | 5-8 min | 2-3 min | **~60%** |
| No changes | 5-8 min | 30-60s | **~90%** |

## Cost Savings

- **Old:** ~$0.024 per build
- **New:** ~$0.006 per build + ~$0.10/month cache storage
- **Savings:** ~$0.26/month for 20 deploys/month

---

📚 **Detailed docs:** See [BUILD_OPTIMIZATION.md](BUILD_OPTIMIZATION.md)
