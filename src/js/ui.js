/**
 * UI Module
 * Handles all user interface interactions and DOM manipulation
 */

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
    // Helper function to safely attach listeners
    const attachListener = (selector, event, handler) => {
      const element = document.getElementById(selector);
      if (element) {
        element.addEventListener(event, handler);
      }
    };

    // Navigation
    attachListener("loginBtn", "click", () => this.showLoginModal());
    attachListener("registerBtn", "click", () => this.showRegisterModal());
    attachListener("logoutLink", "click", () => this.handleLogout());
    attachListener("menuToggle", "click", () => this.toggleMenu());

    // Login Form
    attachListener("loginForm", "submit", (e) => this.handleLogin(e));
    const googleLoginBtn = document.getElementById("googleLoginBtn");
    if (googleLoginBtn) {
      googleLoginBtn.addEventListener("click", () => this.handleGoogleLogin());
    }
    attachListener("closeLoginModal", "click", () => this.closeModal("loginModal"));

    // Register Form
    attachListener("registerForm", "submit", (e) => this.handleRegister(e));
    const googleRegisterBtn = document.getElementById("googleRegisterBtn");
    if (googleRegisterBtn) {
      googleRegisterBtn.addEventListener("click", () =>
        this.handleGoogleLogin(),
      );
    }
    attachListener("closeRegisterModal", "click", () => this.closeModal("registerModal"));

    // Filters
    attachListener("searchInput", "input", () => this.filterClasses());
    attachListener("difficultyFilter", "change", () => this.filterClasses());
    attachListener("dayFilter", "change", () => this.filterClasses());

    // Profile tabs
    document.querySelectorAll(".profile-nav-btn").forEach((btn) => {
      btn.addEventListener("click", (e) =>
        this.switchProfileTab(e.target.dataset.tab),
      );
    });

    // Modal close
    attachListener("closeModal", "click", () => this.closeModal("classModal"));
    window.addEventListener("click", (e) => this.handleModalClick(e));
  }

  /**
   * Update UI based on authentication state
   */
  updateUIState() {
    const isAuthenticated = this.authManager.checkAuth();
    const user = this.authManager.getCurrentUser();

    // Helper to safely update element visibility
    const updateElement = (selector, display, property = "style") => {
      const element = document.getElementById(selector);
      if (element) {
        element.style.display = display;
      }
    };

    // Helper to safely set text content
    const updateText = (selector, text) => {
      const element = document.getElementById(selector);
      if (element) {
        element.textContent = text;
      }
    };

    if (isAuthenticated && user) {
      // Hide auth buttons
      updateElement("authContainer", "none");
      updateElement("userGreeting", "block");
      updateText("greetingText", `Welcome, ${user.name}!`);
      updateElement("profileLink", "block");
      updateElement("logoutLink", "block");

      // Load classes
      this.loadClasses();
    } else {
      // Show auth buttons
      updateElement("authContainer", "flex");
      updateElement("userGreeting", "none");
      updateElement("profileLink", "none");
      updateElement("logoutLink", "none");
    }
  }

  /**
   * Load and display classes
   */
  async loadClasses() {
    try {
      const classes = await this.classManager.getAllClasses();
      this.displayClasses(classes);
    } catch {
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
                ${user && user.role === "student"
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
    } catch {
      this.showNotification("Failed to load class details", "error");
    }
  }

  /**
   * Enroll student in class
   */
  async enrollInClass(classId) {
    try {
      await this.enrollmentManager.enrollStudent(classId);
      this.showNotification("Successfully enrolled in class!", "success");
      this.closeModal("classModal");
      this.loadClasses();
    } catch (error) {
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
      document.getElementById("loginForm").reset();

      // Refresh page to show correct content based on user role
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 500);
    } catch {
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
      document.getElementById("registerForm").reset();

      // Refresh page to show correct content based on user role
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 500);
    } catch {
      this.showNotification("Registration failed. Please try again.", "error");
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    await this.authManager.logout();
    this.showNotification("Logged out successfully", "success");

    // Navigate to home and refresh the page to clear all cached content
    setTimeout(() => {
      window.location.href = "/index.html";
    }, 500); // Small delay to let the notification show
  }

  /**
   * Handle Google login
   */
  async handleGoogleLogin() {
    try {
      const result = await this.authManager.loginWithGoogle();

      // Only proceed if login was successful (not cancelled)
      if (!result) return;

      this.showNotification("Login successful!", "success");

      // Close both modals in case they were opened from either
      this.closeModal("loginModal");
      this.closeModal("registerModal");

      // Reset both forms
      const loginForm = document.getElementById("loginForm");
      const registerForm = document.getElementById("registerForm");
      if (loginForm) loginForm.reset();
      if (registerForm) registerForm.reset();

      // Refresh page to show correct content based on user role
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 500);
    } catch (error) {
      this.showNotification(error.message || "Google login failed. Please try again.", "error");
    }
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
