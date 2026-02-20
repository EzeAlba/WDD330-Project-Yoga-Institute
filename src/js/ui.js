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
    attachListener("closeLoginModal", "click", () =>
      this.closeModal("loginModal"),
    );

    // Register Form
    attachListener("registerForm", "submit", (e) => this.handleRegister(e));
    const googleRegisterBtn = document.getElementById("googleRegisterBtn");
    if (googleRegisterBtn) {
      googleRegisterBtn.addEventListener("click", () =>
        this.handleGoogleLogin(),
      );
    }
    attachListener("closeRegisterModal", "click", () =>
      this.closeModal("registerModal"),
    );

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
    const updateElement = (selector, display) => {
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
      // Ocultar botones de autenticación
      updateElement("authContainer", "none");
      updateElement("userGreeting", "block");
      updateText("greetingText", `¡Bienvenido, ${user.name}!`);
      updateElement("profileLink", "block");
      updateElement("logoutLink", "block");

      // Load classes
      this.loadClasses();
    } else {
      // Mostrar botones de autenticación
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
      this.showNotification("No se encontraron clases", "info");
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
        '<p class="text-center text-muted">No se encontraron clases</p>';
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
                <button class="btn btn-primary" data-class-id="${yogaClass.id}">Ver Detalles</button>
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
    } catch {
      this.showNotification(
        "No se pudo cargar los detalles de la clase",
        "error",
      );
    }
  }

  /**
   * Enroll student in class
   */
  async enrollInClass(classId) {
    try {
      await this.enrollmentManager.enrollStudent(classId);
      this.showNotification(
        "¡Se inscribió en la clase exitosamente!",
        "success",
      );
      this.closeModal("classModal");
      this.loadClasses();
    } catch (error) {
      this.showNotification(error.message || "Falló la inscripción", "error");
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
      this.showNotification("¡Inicio de sesión exitoso!", "success");
      this.closeModal("loginModal");
      document.getElementById("loginForm").reset();

      // Refrescar la página para mostrar el contenido correcto basado en el rol del usuario
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 500);
    } catch {
      this.showNotification(
        "Falló el inicio de sesión. Por favor intenta de nuevo.",
        "error",
      );
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
      this.showNotification("¡Registro exitoso!", "success");
      this.closeModal("registerModal");
      document.getElementById("registerForm").reset();

      // Mostrar modal de completamiento de perfil basado en el rol
      this.showProfileCompletionModal(role);
    } catch {
      this.showNotification(
        "Falló el registro. Por favor intenta de nuevo.",
        "error",
      );
    }
  }

  /**
   * Show profile completion modal
   */
  showProfileCompletionModal(role) {
    const modal = document.getElementById("profileCompletionModal");
    const healthSection = document.getElementById("healthHistorySection");

    if (!modal) return;

    // Show health history section only for students
    if (healthSection) {
      healthSection.style.display = role === "student" ? "block" : "none";
    }

    modal.style.display = "flex";
    this.setupProfileCompletionForm();
  }

  /**
   * Setup profile completion form handlers
   */
  setupProfileCompletionForm() {
    const form = document.getElementById("profileCompletionForm");
    const profilePictureInput = document.getElementById("profilePicture");
    const profilePicturePreview = document.getElementById(
      "profilePicturePreview",
    );
    const previewImage = document.getElementById("previewImage");
    const closeProfileModal = document.getElementById("closeProfileModal");

    if (profilePictureInput) {
      profilePictureInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          // Validate file type
          if (!file.type.startsWith("image/")) {
            this.showNotification(
              "Por favor selecciona un archivo de imagen válido",
              "error",
            );
            profilePictureInput.value = "";
            return;
          }

          // Validar tamaño de archivo (5MB)
          if (file.size > 5 * 1024 * 1024) {
            this.showNotification(
              "El tamaño de la imagen no debe exceder 5MB",
              "error",
            );
            profilePictureInput.value = "";
            return;
          }

          // Mostrar vista previa
          // eslint-disable-next-line no-undef
          const reader = new FileReader();
          reader.onload = (event) => {
            previewImage.src = event.target.result;
            profilePicturePreview.style.display = "block";
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleProfileCompletion();
      });
    }

    if (closeProfileModal) {
      closeProfileModal.addEventListener("click", () => {
        this.closeModal("profileCompletionModal");
      });
    }
  }

  /**
   * Handle profile completion form submission
   */
  async handleProfileCompletion() {
    const profilePictureInput = document.getElementById("profilePicture");
    const phoneNumber = document.getElementById("phoneNumber").value.trim();
    const healthHistory = document.getElementById("healthHistory").value.trim();
    const user = this.authManager.getCurrentUser();

    if (!phoneNumber) {
      this.showNotification("El número de teléfono es requerido", "error");
      return;
    }

    if (!profilePictureInput.files[0]) {
      this.showNotification("La foto de perfil es requerida", "error");
      return;
    }

    if (user.role === "student" && !healthHistory) {
      this.showNotification(
        "El historial de salud es requerido para estudiantes",
        "error",
      );
      return;
    }

    try {
      // Convert profile picture to base64
      const profilePictureBase64 = await this.authManager.fileToBase64(
        profilePictureInput.files[0],
      );

      // Update profile
      const profileData = {
        phoneNumber,
        profilePictureBase64,
      };

      if (user.role === "student") {
        profileData.healthHistory = healthHistory;
      }

      await this.authManager.updateProfileInfo(profileData);

      this.showNotification("¡Perfil completado exitosamente!", "success");
      this.closeModal("profileCompletionModal");
      document.getElementById("profileCompletionForm").reset();
      document.getElementById("profilePicturePreview").style.display = "none";

      // Refresh page to show updated user data
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1000);
    } catch (error) {
      this.showNotification(
        error.message || "No se pudo completar el perfil",
        "error",
      );
    }
  }

  /**
   * Handle logout
   */
  async handleLogout() {
    await this.authManager.logout();
    this.showNotification("Sesión cerrada exitosamente", "success");

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

      // Solo proceder si el inicio de sesión fue exitoso (no cancelado)
      if (!result) return;

      this.showNotification("¡Inicio de sesión exitoso!", "success");

      // Cerrar ambos modales en caso de que fueron abiertos desde cualquiera
      this.closeModal("loginModal");
      this.closeModal("registerModal");

      // Restablecer ambos formularios
      const loginForm = document.getElementById("loginForm");
      const registerForm = document.getElementById("registerForm");
      if (loginForm) loginForm.reset();
      if (registerForm) registerForm.reset();

      // Refrescar página para mostrar contenido correcto basado en el rol del usuario
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 500);
    } catch (error) {
      this.showNotification(
        error.message ||
          "Falló el inicio de sesión con Google. Por favor intenta de nuevo.",
        "error",
      );
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
      { title: "Total de Clases", value: dashboard.stats.totalClasses },
      {
        title: "Total de Inscripciones",
        value: dashboard.stats.totalEnrollments,
      },
      { title: "Total de Estudiantes", value: dashboard.stats.totalStudents },
      {
        title: "Total de Instructores",
        value: dashboard.stats.totalInstructors,
      },
      {
        title: "Ingresos Totales",
        value: `$${dashboard.stats.totalRevenue.toFixed(2)}`,
      },
      { title: "Pagos Pendientes", value: dashboard.stats.pendingPayments },
      {
        title: "Ocupación Promedio",
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
