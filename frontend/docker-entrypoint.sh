#!/bin/sh
set -e

# Regenerate config.js from the API_URL environment variable so the same
# built image can be pointed at a different backend without rebuilding —
# useful since the frontend and backend are typically deployed separately
# (e.g. Vercel/Netlify + Render/Railway) and the backend's URL is only
# known after that service is deployed.
#
# This runs as a hook in /docker-entrypoint.d/ (see Dockerfile), which the
# official nginx image executes automatically before starting nginx itself —
# so this script just needs to do its setup and exit normally.
: "${API_URL:=http://localhost:8000}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL}"
};
EOF
