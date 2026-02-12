/**
 * Classes Page Entry Point
 * Loads header/footer and initializes classes page functionality
 */

import { loadHeaderFooter } from "./utils.mjs";
import AuthManager from "./auth.mjs";
import UIManager from "./ui.mjs";
import ClassManager from "./classes.mjs";
import APIHandler from "./api.mjs";

// Create manager instances
const api = new APIHandler();
const authManager = new AuthManager();
const classManager = new ClassManager(api);
const uiManager = new UIManager(authManager, classManager, null, null, null);

// Load header and footer
document.addEventListener("DOMContentLoaded", async () => {
  // Load header and footer first
  await loadHeaderFooter();

  // Setup filter listeners
  const searchInput = document.getElementById("searchInput");
  const difficultyFilter = document.getElementById("difficultyFilter");
  const dayFilter = document.getElementById("dayFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => uiManager.filterClasses());
  }
  if (difficultyFilter) {
    difficultyFilter.addEventListener("change", () =>
      uiManager.filterClasses(),
    );
  }
  if (dayFilter) {
    dayFilter.addEventListener("change", () => uiManager.filterClasses());
  }

  // Load initial classes
  uiManager.loadClasses();
});
