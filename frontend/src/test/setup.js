import "@testing-library/jest-dom/vitest";

// jsdom doesn't implement window.__APP_CONFIG__ (normally injected by config.js)
window.__APP_CONFIG__ = { API_URL: "http://localhost:8000" };
