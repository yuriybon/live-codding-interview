# Deployment Instructions

## Quick Deploy

Run this command to trigger a Cloud Build deployment:

```bash
gcloud builds submit --config=cloudbuild.yaml
```

This will:
1. Build a new Docker image with the latest code
2. Push to Artifact Registry
3. Deploy to Cloud Run automatically

## What's Being Deployed

The latest changes include:
- ✅ Fixed Gemini Live API configuration (camelCase fields)
- ✅ All latency optimizations
- ✅ Visual UI improvements
- ✅ Complete boxing-coach parity

## Verify Deployment

After deployment completes (5-10 minutes), check:
1. Visit: https://live-coding-interview-782821497295.europe-west1.run.app/
2. Page should now be visible
3. Check browser console for any errors

## Alternative: Quick Restart

If you just want to restart the current deployment:

```bash
gcloud run services update ai-interview-simulator \
  --region=europe-west1 \
  --platform=managed
```

## Check Current Deployment Status

```bash
gcloud run services describe ai-interview-simulator \
  --region=europe-west1 \
  --format="value(status.url,status.latestCreatedRevisionName)"
```
