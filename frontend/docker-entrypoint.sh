#!/bin/sh
set -e

: "${API_URL:=http://localhost:8000}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = {
  API_URL: "${API_URL}"
};
EOF
