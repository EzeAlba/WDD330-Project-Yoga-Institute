/**
 * Classes Page Entry Point
 * Loads header/footer and initializes classes page functionality
 */

import { loadHeaderFooter } from "./utils.mjs";
import { AuthManager, authManager } from "./auth.js";
import { UIManager, uiManager } from "./ui.js";
import { ClassManager, classManager } from "./classes.js";

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
