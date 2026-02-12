/**
 * Main Application Entry Point
 * MOOD - Yoga Institute Platform
 *
 * This file initializes the application and coordinates between modules
 */
import APIHandler from "./api.js";
import AuthManager from "./auth.js";
import ClassManager from "./classes.js";
import EnrollmentManager from "./enrollment.js";
import PaymentManager from "./payment.js";
import DashboardManager from "./dashboard.js";
import UIManager from "./ui.js";
import { loadHeaderFooter } from "./utils.mjs";

// Make managers globally accessible for debugging
window.debugManagers = {};

let api;
let authManager;
let classManager;
let enrollmentManager;
let paymentManager;
let dashboardManager;
let uiManager;

class MoodApp {
  constructor() {
    this.version = "1.0.0";
    this.name = "MOOD - Yoga Institute Platform";
    this.initialized = false;
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize modules in order
      this.initializeModules();
      // Load initial data
      await this.loadInitialData();
      // Check if user is already logged in
      this.checkAuthStatus();
      this.initialized = true;
    } catch {
      uiManager?.showNotification("Failed to initialize application", "error");
    }
  }

  /**
   * Initialize all manager modules
   */
  initializeModules() {
    // Modules are already instantiated globally:
    //api (APIHandler)
    //authManager (AuthManager)
    //classManager (ClassManager)
    //enrollmentManager (EnrollmentManager)
    //paymentManager (PaymentManager)
    //dashboardManager (DashboardManager)
    //uiManager (UIManager)
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    try {
      // Load classes
      await classManager.getAllClasses();

      // Load enrollments if user is logged in
      if (authManager.checkAuth()) {
        enrollmentManager.getMyEnrollments();
      }
    } catch {
      uiManager?.showNotification("Failed to load initial data", "error");
    }
  }

  /**
   * Check authentication status
   */
  checkAuthStatus() {
    return authManager.checkAuth();
  }

  /**
   * Get application info
   */
  getInfo() {
    return {
      name: this.name,
      version: this.version,
      initialized: this.initialized,
      user: authManager.getCurrentUser(),
      isAuthenticated: authManager.checkAuth(),
    };
  }
}

// Create global app instance
const app = new MoodApp();

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();
  initializeManagers();
  setupNavigationHandlers();
  setupProfileLinkHandler();
  app.init();
});

function initializeManagers() {
  api = new APIHandler();
  authManager = new AuthManager();
  classManager = new ClassManager(api);
  enrollmentManager = new EnrollmentManager(api, authManager, classManager);
  paymentManager = new PaymentManager(
    api,
    authManager,
    classManager,
    enrollmentManager,
  );
  dashboardManager = new DashboardManager(api, authManager);
  uiManager = new UIManager(
    authManager,
    classManager,
    enrollmentManager,
    paymentManager,
    dashboardManager,
  );

  window.debugManagers = {
    api,
    authManager,
    classManager,
    enrollmentManager,
    paymentManager,
    dashboardManager,
    uiManager,
  };
}

function setupNavigationHandlers() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      const target = link.getAttribute("href");
      if (target && target.startsWith("#")) {
        const element = document.querySelector(target);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    });
  });
}

function setupProfileLinkHandler() {
  const profileLink = document.getElementById("profileLink");
  if (!profileLink) return;

  profileLink.addEventListener("click", () => {
    const user = authManager.getCurrentUser();
    if (user) {
      // Load user profile data
      loadUserProfile();
      document.getElementById("profile").style.display = "block";
      document.getElementById("home").style.display = "none";
      document.getElementById("classes").style.display = "none";
      document.getElementById("dashboard").style.display = "none";
    }
  });
}

/**
 * Load user profile data
 */
async function loadUserProfile() {
  try {
    const user = authManager.getCurrentUser();
    if (!user) return;

    const userInfoDiv = document.getElementById("userInfo");

    if (user.role === "student") {
      const enrollments = enrollmentManager.getMyEnrollments();
      const payments = paymentManager.getMyPaymentHistory();

      userInfoDiv.innerHTML = `
                <div class="user-avatar">👤</div>
                <h3>${user.name}</h3>
                <p class="text-muted">${user.email}</p>
                <p style="margin-top: 15px;">
                    <strong>Enrollments:</strong> ${enrollments.length}<br>
                    <strong>Payments:</strong> ${payments.length}
                </p>
            `;

      // Load enrollments tab
      await loadEnrollmentsTab();
      // Load payments tab
      loadPaymentsTab();
      // Load attendance tab
      loadAttendanceTab();
    } else if (user.role === "instructor") {
      const classes = classManager.getClassesByInstructor(user.id);

      userInfoDiv.innerHTML = `
                <div class="user-avatar">🧑‍🏫</div>
                <h3>${user.name}</h3>
                <p class="text-muted">${user.email}</p>
                <p style="margin-top: 15px;">
                    <strong>Classes:</strong> ${classes.length}
                </p>
            `;
    } else if (user.role === "admin") {
      userInfoDiv.innerHTML = `
                <div class="user-avatar">👨‍💼</div>
                <h3>${user.name}</h3>
                <p class="text-muted">${user.email}</p>
                <p style="margin-top: 15px;">Administrator</p>
            `;
    }
  } catch {
    uiManager?.showNotification("Failed to load user profile", "error");
  }
}

/**
 * Load enrollments tab
 */
async function loadEnrollmentsTab() {
  try {
    const enrollments = enrollmentManager.getMyEnrollments();
    const container = document.getElementById("enrollmentsContainer");
    container.innerHTML = "";

    if (enrollments.length === 0) {
      container.innerHTML = '<p class="text-muted">No enrollments yet</p>';
      return;
    }

    for (const enrollment of enrollments) {
      const yogaClass = await classManager.getClassById(enrollment.classId);
      const item = document.createElement("div");
      item.style.cssText =
        "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 10px;";
      item.innerHTML = `
                <h4>${yogaClass.title}</h4>
                <p><strong>Instructor:</strong> ${yogaClass.instructor}</p>
                <p><strong>Schedule:</strong> ${yogaClass.schedule.day} at ${yogaClass.schedule.time}</p>
                <p><strong>Status:</strong> <span style="color: ${enrollment.status === "active" ? "#4CAF50" : "#f44336"}">${enrollment.status}</span></p>
                <p><strong>Payment:</strong> ${enrollment.paymentStatus}</p>
                ${
                  enrollment.paymentStatus === "pending"
                    ? `
                    <button class="btn btn-primary" style="margin-top: 10px;">Pay Now</button>
                `
                    : ""
                }
            `;
      container.appendChild(item);
    }
  } catch {
    uiManager?.showNotification("Failed to load enrollments", "error");
  }
}

/**
 * Load payments tab
 */
function loadPaymentsTab() {
  const payments = paymentManager.getMyPaymentHistory();
  const container = document.getElementById("paymentsContainer");
  container.innerHTML = "";

  if (payments.length === 0) {
    container.innerHTML = '<p class="text-muted">No payment history</p>';
    return;
  }

  payments.forEach((payment) => {
    const item = document.createElement("div");
    item.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 10px;";
    item.innerHTML = `
            <h4>Payment ${payment.transactionId}</h4>
            <p><strong>Amount:</strong> $${payment.amount.toFixed(2)}</p>
            <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> <span style="color: ${payment.status === "confirmed" ? "#4CAF50" : "#FF9800"}">${payment.status.toUpperCase()}</span></p>
            <p><strong>Method:</strong> ${payment.paymentMethod}</p>
        `;
    container.appendChild(item);
  });
}

/**
 * Load attendance tab
 */
function loadAttendanceTab() {
  const enrollments = enrollmentManager.getMyEnrollments();
  const container = document.getElementById("attendanceContainer");
  container.innerHTML = "";

  const attended = enrollments.filter((e) => e.attended).length;
  const total = enrollments.length;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  container.innerHTML = `
        <div style="padding: 15px; background-color: #F5F5F5; border-radius: 8px;">
            <h4>Attendance Summary</h4>
            <p><strong>Attended:</strong> ${attended} / ${total} classes</p>
            <p><strong>Rate:</strong> ${attendanceRate}%</p>
            <div style="width: 100%; height: 10px; background-color: #E0E0E0; border-radius: 5px; overflow: hidden; margin-top: 10px;">
                <div style="width: ${attendanceRate}%; height: 100%; background-color: #4CAF50;"></div>
            </div>
        </div>
        <hr style="margin: 20px 0;">
    `;

  enrollments.forEach((enrollment) => {
    const item = document.createElement("div");
    item.style.cssText =
      "padding: 10px; border-left: 4px solid " +
      (enrollment.attended ? "#4CAF50" : "#f44336") +
      "; margin-bottom: 10px;";
    item.innerHTML = `
            <p><strong>Class ID:</strong> ${enrollment.classId}</p>
            <p><strong>Date:</strong> ${new Date(enrollment.enrollmentDate).toLocaleDateString()}</p>
            <p><strong>Attended:</strong> ${enrollment.attended ? "✓ Yes" : "✗ No"}</p>
        `;
    container.appendChild(item);
  });
}

// Navigation handler for showing/hiding sections
document.addEventListener("click", (e) => {
  // Show home on logo click
  if (e.target.closest(".navbar-brand")) {
    showSection("home");
  }
});

/**
 * Show a specific section and hide others
 */
function showSection(sectionId) {
  document.querySelectorAll(".section").forEach((sec) => {
    sec.style.display = "none";
  });
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = "block";
  }
}
