#!/bin/bash

# Ensure errors stop the script
set -e

echo "========================================================="
echo "🚀 STITCH FREE DEPLOYMENT WIZARD 🚀"
echo "========================================================="
echo ""
echo "This script will deploy your application for completely free!"
echo "- Backend (FastAPI + SQLite) -> Fly.io"
echo "- Frontend (Next.js) -> Vercel"
echo ""
echo "Press Enter to begin..."
read -r

# --- BACKEND (Fly.io) ---
echo ""
echo "---------------------------------------------------------"
echo "STEP 1: HOSTING THE BACKEND (API + Database)"
echo "---------------------------------------------------------"
cd backend

# Check if logged in
if ! ~/.fly/bin/flyctl auth whoami >/dev/null 2>&1; then
    echo "You need to log into Fly.io. A browser window will open."
    ~/.fly/bin/flyctl auth login
fi

echo "Deploying Backend to Fly.io..."
if [ ! -f "fly.toml" ]; then
    echo "Initializing new Fly.io app. Please accept the defaults during setup."
    ~/.fly/bin/flyctl launch --copy-config
else
    ~/.fly/bin/flyctl deploy
fi

# Get the URL of the deployed backend
BACKEND_URL=$(~/.fly/bin/flyctl status --json | grep -o '"Hostname": "[^"]*' | cut -d'"' -f4 | head -n 1)
BACKEND_URL="https://${BACKEND_URL}"
echo "✅ Backend successfully deployed to: $BACKEND_URL"

# --- FRONTEND (Vercel) ---
echo ""
echo "---------------------------------------------------------"
echo "STEP 2: HOSTING THE FRONTEND (Website)"
echo "---------------------------------------------------------"
cd ../frontend

echo "Setting the API URL to point to your new backend..."
export NEXT_PUBLIC_API_URL=$BACKEND_URL

echo "Deploying Frontend to Vercel."
echo "If this is your first time, a Vercel login prompt will appear."
# Use npx to run Vercel CLI so we don't need global admin install
npx vercel --prod --env NEXT_PUBLIC_API_URL=$BACKEND_URL

echo ""
echo "========================================================="
echo "🎉 DEPLOYMENT COMPLETE! 🎉"
echo "Your app is now live on the internet, 100% free."
echo "========================================================="
