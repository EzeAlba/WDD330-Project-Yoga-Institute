/**
 * Dashboard Page Entry Point
 * Loads header/footer and initializes dashboard page functionality
 */

import { loadHeaderFooter } from "./utils.mjs";
import AuthManager from "./auth.js";
import UIManager from "./ui.js";
import DashboardManager from "./dashboard.js";
import APIHandler from "./api.js";

// Create manager instances
const api = new APIHandler();
const authManager = new AuthManager();
const dashboardManager = new DashboardManager(api, authManager);
const uiManager = new UIManager(
  authManager,
  null,
  null,
  null,
  dashboardManager,
);

// Load header and footer
document.addEventListener("DOMContentLoaded", async () => {
  // Load header and footer first
  await loadHeaderFooter();

  // Check if user is authenticated and has instructor role
  if (
    !authManager.isAuthenticated ||
    authManager.currentUser.role !== "instructor"
  ) {
    window.location.href = "../home/index.html";
    return;
  }

  // Load dashboard data
  uiManager.loadAdminDashboard();
});
