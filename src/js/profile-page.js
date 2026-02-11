/**
 * Profile Page Entry Point
 * Loads header/footer and initializes profile page functionality
 */

import { loadHeaderFooter } from "./utils.mjs";
import AuthManager from "./auth.js";
import UIManager from "./ui.js";
import EnrollmentManager from "./enrollment.js";
import PaymentManager from "./payment.js";
import APIHandler from "./api.js";

// Create manager instances
const api = new APIHandler();
const authManager = new AuthManager();
const enrollmentManager = new EnrollmentManager(api, authManager);
const paymentManager = new PaymentManager(api, authManager);
const uiManager = new UIManager(
  authManager,
  null,
  enrollmentManager,
  paymentManager,
  null,
);

// Load header and footer
document.addEventListener("DOMContentLoaded", async () => {
  // Load header and footer first
  await loadHeaderFooter();

  // Check if user is authenticated
  if (!authManager.isAuthenticated) {
    window.location.href = "../home/index.html";
    return;
  }

  // Load user profile data
  loadProfileData(authManager.currentUser);

  // Setup tab navigation
  const tabButtons = document.querySelectorAll(".profile-nav-btn");
  tabButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      const tabName = e.target.dataset.tab;
      switchTab(tabName);
    });
  });

  // Load enrollments and payments
  uiManager.loadClasses();
});

function loadProfileData(user) {
  const userInfo = document.getElementById("userInfo");
  if (userInfo) {
    userInfo.innerHTML = `
      <h3>${user.name}</h3>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Role:</strong> ${user.role}</p>
    `;
  }
}

function switchTab(tabName) {
  // Hide all tabs
  const tabs = document.querySelectorAll(".profile-tab");
  tabs.forEach((tab) => tab.classList.remove("active"));

  // Remove active class from all buttons
  const buttons = document.querySelectorAll(".profile-nav-btn");
  buttons.forEach((button) => button.classList.remove("active"));

  // Show selected tab
  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  // Add active class to clicked button
  const activeBtn = document.querySelector(
    `.profile-nav-btn[data-tab="${tabName}"]`,
  );
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
}
