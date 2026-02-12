/**
 * UI Module
 * Handles all user interface interactions and DOM manipulation
 */

import ClassManager from "./classes.js";
import EnrollmentManager from "./enrollment.js";
import PaymentManager from "./payment.js";
import DashboardManager from "./dashboard.js";

export default class UIManager {
  constructor(
    authManager,
    classManager,
    enrollmentManager,
    paymentManager,
    dashboardManager,
  ) {
    this.authManager = authManager;
    this.classManager = classManager;
    this.enrollmentManager = enrollmentManager;
    this.paymentManager = paymentManager;
    this.dashboardManager = dashboardManager;
    this.initializeEventListeners();
    this.updateUIState();
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Navigation
    document
      .getElementById("loginBtn")
      .addEventListener("click", () => this.showLoginModal());
    document
      .getElementById("registerBtn")
      .addEventListener("click", () => this.showRegisterModal());
    document
      .getElementById("logoutLink")
      .addEventListener("click", () => this.handleLogout());
    document
      .getElementById("menuToggle")
      .addEventListener("click", () => this.toggleMenu());

    // Login Form
    document
      .getElementById("loginForm")
      .addEventListener("submit", (e) => this.handleLogin(e));
    const googleLoginBtn = document.getElementById("googleLoginBtn");
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener("click", () => this.handleGoogleLogin());
    }
    document
      .getElementById("closeLoginModal")
      .addEventListener("click", () => this.closeModal("loginModal"));

    // Register Form
    document
      .getElementById("registerForm")
      .addEventListener("submit", (e) => this.handleRegister(e));
    const googleRegisterBtn = document.getElementById("googleRegisterBtn");
    if (googleRegisterBtn) {
      googleRegisterBtn.addEventListener("click", () =>
        this.handleGoogleLogin(),
      );
    }
    document
      .getElementById("closeRegisterModal")
      .addEventListener("click", () => this.closeModal("registerModal"));

    // Filters
    document
      .getElementById("searchInput")
      .addEventListener("input", () => this.filterClasses());
    document
      .getElementById("difficultyFilter")
      .addEventListener("change", () => this.filterClasses());
    document
      .getElementById("dayFilter")
      .addEventListener("change", () => this.filterClasses());

    // Profile tabs
    document.querySelectorAll(".profile-nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.switchProfileTab(e.target.dataset.tab),
      );
    });

    // Modal close
    document
      .getElementById("closeModal")
      .addEventListener("click", () => this.closeModal("classModal"));
    window.addEventListener("click", (e) => this.handleModalClick(e));
  }

  /**
   * Update UI based on authentication state
   */
  updateUIState() {
    const isAuthenticated = this.authManager.checkAuth();
    const user = this.authManager.getCurrentUser();

    if (isAuthenticated && user) {
      // Hide auth buttons
      document.getElementById("authContainer").style.display = "none";
      document.getElementById("userGreeting").style.display = "block";
      document.getElementById("greetingText").textContent =
        `Welcome, ${user.name}!`;
      document.getElementById("profileLink").style.display = "block";
      document.getElementById("logoutLink").style.display = "block";

      // Show admin dashboard if admin
      if (user.role === "admin") {
        document.getElementById("dashboard").style.display = "block";
        this.loadAdminDashboard();
      }

      // Load classes
      this.loadClasses();
    } else {
      // Show auth buttons
      document.getElementById("authContainer").style.display = "flex";
      document.getElementById("userGreeting").style.display = "none";
      document.getElementById("profileLink").style.display = "none";
      document.getElementById("logoutLink").style.display = "none";
    }
  }

  /**
   * Load and display classes
   */
  async loadClasses() {
    try {
      const classes = await this.classManager.getAllClasses();
      this.displayClasses(classes);
    } catch (error) {
      console.error("Failed to load classes:", error);
      this.showNotification("Failed to load classes", "error");
    }
  }

  /**
   * Display classes in grid
   */
  displayClasses(classes) {
    const container = document.getElementById("classesContainer");
    container.innerHTML = "";

    if (classes.length === 0) {
      container.innerHTML =
        '<p class="text-center text-muted">No classes found</p>';
      return;
    }

    classes.forEach((yogaClass) => {
      const card = this.createClassCard(yogaClass);
      container.appendChild(card);
    });
  }

  /**
   * Create class card element
   */
  createClassCard(yogaClass) {
    const card = document.createElement("div");
    card.className = "class-card";
    card.innerHTML = `
            <div class="class-card-header">
                <h3 class="class-card-title">${yogaClass.title}</h3>
                <p class="class-card-instructor">by ${yogaClass.instructor}</p>
            </div>
            <div class="class-card-body">
                <div class="class-info">
                    <div class="class-info-item">⏱️ ${yogaClass.duration} min</div>
                    <div class="class-info-item">📊 ${yogaClass.difficulty}</div>
                </div>
                <p>${yogaClass.description}</p>
            </div>
            <div class="class-card-footer">
                <span class="class-price">$${yogaClass.price}</span>
                <button class="btn btn-primary" data-class-id="${yogaClass.id}">View Details</button>
            </div>
        `;

    card.querySelector(".btn").addEventListener("click", () => {
      this.showClassDetails(yogaClass.id);
    });

    return card;
  }

  /**
   * Show class details in modal
   */
  async showClassDetails(classId) {
    try {
      const yogaClass = await this.classManager.getClassById(classId);
      const user = this.authManager.getCurrentUser();
      const isEnrolled =
        user && this.enrollmentManager.isEnrolled(user.id, classId);

      const detailsDiv = document.getElementById("classDetails");
      const availableSpots = this.classManager.getAvailableSpots(classId);

      detailsDiv.innerHTML = `
                <h2>${yogaClass.title}</h2>
                <p><strong>Instructor:</strong> ${yogaClass.instructor}</p>
                <p><strong>Difficulty:</strong> ${yogaClass.difficulty}</p>
                <p><strong>Duration:</strong> ${yogaClass.duration} minutes</p>
                <p><strong>Price:</strong> $${yogaClass.price}</p>
                <p><strong>Schedule:</strong> ${yogaClass.schedule.day.charAt(0).toUpperCase() + yogaClass.schedule.day.slice(1)} at ${yogaClass.schedule.time}</p>
                <p><strong>Available Spots:</strong> ${availableSpots} / ${yogaClass.maxStudents}</p>
                <p><strong>Description:</strong></p>
                <p>${yogaClass.description}</p>
                ${
                  user && user.role === "student"
                    ? `
                    <button class="btn btn-primary" id="enrollBtn" ${isEnrolled ? "disabled" : ""}>
                        ${isEnrolled ? "Already Enrolled" : "Enroll Now"}
                    </button>
                `
                    : ""
                }
            `;

      if (user && user.role === "student" && !isEnrolled) {
        document.getElementById("enrollBtn").addEventListener("click", () => {
          this.enrollInClass(classId);
        });
      }

      this.openModal("classModal");
    } catch (error) {
      console.error("Failed to load class details:", error);
      this.showNotification("Failed to load class details", "error");
    }
  }

  /**
   * Enroll student in class
   */
  async enrollInClass(classId) {
    try {
      const enrollment = await this.enrollmentManager.enrollStudent(classId);
      this.showNotification("Successfully enrolled in class!", "success");
      this.closeModal("classModal");
      this.loadClasses();
    } catch (error) {
      console.error("Enrollment failed:", error);
      this.showNotification(error.message || "Enrollment failed", "error");
    }
  }

  /**
   * Filter classes
   */
  filterClasses() {
    const search = document.getElementById("searchInput").value;
    const difficulty = document.getElementById("difficultyFilter").value;
    const day = document.getElementById("dayFilter").value;

    const filtered = this.classManager.searchClasses({
      search: search,
      difficulty: difficulty || undefined,
      day: day || undefined,
    });

    this.displayClasses(filtered);
  }

  /**
   * Handle login form submission
   */
  async handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    try {
      await this.authManager.login(email, password);
      this.showNotification("Login successful!", "success");
      this.closeModal("loginModal");
      this.updateUIState();
      document.getElementById("loginForm").reset();
    } catch (error) {
      console.error("Login error:", error);
      this.showNotification("Login failed. Please try again.", "error");
    }
  }

  /**
   * Handle registration form submission
   */
  async handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const name = document.getElementById("registerName").value.trim();
    const role = document.getElementById("registerRole").value;

    try {
      await this.authManager.register(email, password, name, role);
      this.showNotification("Registration successful!", "success");
      this.closeModal("registerModal");
      this.updateUIState();
      document.getElementById("registerForm").reset();
    } catch (error) {
      console.error("Registration error:", error);
      this.showNotification("Registration failed. Please try again.", "error");
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    await this.authManager.logout();
    this.showNotification("Logged out successfully", "success");
    this.updateUIState();
  }

  /**
   * Handle Google login
   */
  async handleGoogleLogin() {
    await this.authManager.loginWithGoogle();
    this.updateUIState();
  }

  /**
   * Load admin dashboard
   */
  loadAdminDashboard() {
    const dashboard = this.dashboardManager.getDashboard();
    if (!dashboard) return;

    const container = document.getElementById("dashboardGrid");
    container.innerHTML = "";

    const widgets = [
      { title: "Total Classes", value: dashboard.stats.totalClasses },
      { title: "Total Enrollments", value: dashboard.stats.totalEnrollments },
      { title: "Total Students", value: dashboard.stats.totalStudents },
      { title: "Total Instructors", value: dashboard.stats.totalInstructors },
      {
        title: "Total Revenue",
        value: `$${dashboard.stats.totalRevenue.toFixed(2)}`,
      },
      { title: "Pending Payments", value: dashboard.stats.pendingPayments },
      {
        title: "Average Occupancy",
        value: `${dashboard.stats.classOccupancy}%`,
      },
    ];

    widgets.forEach((widget) => {
      const widgetDiv = document.createElement("div");
      widgetDiv.className = "dashboard-widget";
      widgetDiv.innerHTML = `
                <div class="widget-title">${widget.title}</div>
                <div class="widget-value">${widget.value}</div>
            `;
      container.appendChild(widgetDiv);
    });
  }

  /**
   * Switch profile tab
   */
  switchProfileTab(tabName) {
    // Hide all tabs
    document.querySelectorAll(".profile-tab").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Remove active class from buttons
    document.querySelectorAll(".profile-nav-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

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

  /**
   * Show login modal
   */
  showLoginModal() {
    this.openModal("loginModal");
  }

  /**
   * Show register modal
   */
  showRegisterModal() {
    this.openModal("registerModal");
  }

  /**
   * Open modal
   */
  openModal(modalId) {
    document.getElementById(modalId).style.display = "flex";
  }

  /**
   * Close modal
   */
  closeModal(modalId) {
    document.getElementById(modalId).style.display = "none";
  }

  /**
   * Handle modal background click
   */
  handleModalClick(e) {
    if (e.target.classList.contains("modal")) {
      e.target.style.display = "none";
    }
  }

  /**
   * Show notification
   */
  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            background-color: ${type === "success" ? "#4CAF50" : type === "error" ? "#f44336" : "#2196F3"};
            color: white;
            z-index: 2000;
            animation: slideIn 0.3s ease;
        `;

    document.body.appendChild(notification);

    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  /**
   * Toggle menu on mobile
   */
  toggleMenu() {
    const menu = document.getElementById("navbarMenu");
    menu.classList.toggle("active");
  }
}
