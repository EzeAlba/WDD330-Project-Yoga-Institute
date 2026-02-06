/**
 * Dashboard Page Entry Point
 * Loads header/footer and initializes dashboard page functionality
 */

import { loadHeaderFooter } from "./utils.mjs";
import { AuthManager, authManager } from "./auth.js";
import { UIManager, uiManager } from "./ui.js";
import { DashboardManager, dashboardManager } from "./dashboard.js";

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
