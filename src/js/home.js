/**
 * Home Page Entry Point
 * Loads header/footer and initializes home page functionality
 */

import { loadHeaderFooter } from "./utils.mjs";
import { authManager } from "./auth.js";
import { UIManager, uiManager } from "./ui.js";

// Load header and footer
document.addEventListener("DOMContentLoaded", async () => {
  // Load header and footer first
  await loadHeaderFooter();

  // Update greeting if user is authenticated
  if (authManager.isAuthenticated && authManager.currentUser) {
    const greetingDiv = document.getElementById("userGreeting");
    const greetingText = document.getElementById("greetingText");
    if (greetingDiv && greetingText) {
      greetingDiv.style.display = "block";
      greetingText.textContent = `Welcome back, ${authManager.currentUser.name}!`;
    }
  }
});
