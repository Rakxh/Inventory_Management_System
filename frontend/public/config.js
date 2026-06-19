// Read at runtime by the app (see src/api.js). In Docker, this file is
// regenerated from the API_URL environment variable when the frontend
// container starts (see frontend/docker-entrypoint.sh), so the same built
// image can point at different backends without a rebuild.
window.__APP_CONFIG__ = {
  API_URL: "http://localhost:8000",
};
