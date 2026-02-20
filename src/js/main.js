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
      uiManager?.showNotification(
        "Falló al inicializar la aplicación",
        "error",
      );
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
      uiManager?.showNotification(
        "Falló al cargar los datos iniciales",
        "error",
      );
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
                    <strong>Inscripciones:</strong> ${enrollments.length}<br>
                    <strong>Pagos:</strong> ${payments.length}
                </p>
            `;

      // Load profile info tab
      loadProfileInfoTab();
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

      // Load profile info tab
      loadProfileInfoTab();
      // Load enrollments tab
      await loadEnrollmentsTab();
      // Load payments tab
      loadPaymentsTab();
      // Load attendance tab
      loadAttendanceTab();
    } else if (user.role === "admin") {
      userInfoDiv.innerHTML = `
                <div class="user-avatar">👨‍💼</div>
                <h3>${user.name}</h3>
                <p class="text-muted">${user.email}</p>
                <p style="margin-top: 15px;">Administrator</p>
            `;

      // Load profile info tab for admin too
      loadProfileInfoTab();
    }
  } catch {
    uiManager?.showNotification(
      "Falló al cargar el perfil del usuario",
      "error",
    );
  }
}

/**
 * Load profile info tab
 */
function loadProfileInfoTab() {
  try {
    const user = authManager.getCurrentUser();
    if (!user) return;

    const container = document.getElementById("profileInfoContainer");
    if (!container) return;

    let profileHTML = `
      <div style="background-color: #F9F9F9; padding: 20px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h4 style="margin: 0;">Profile Information</h4>
          <button class="btn btn-secondary" id="editProfileBtn" style="padding: 6px 12px; font-size: 12px;">Editar Perfil</button>
        </div>

        <div style="display: grid; grid-template-columns: 150px 1fr; gap: 20px; align-items: start;">
          <!-- Profile Picture -->
          <div style="text-align: center;">
            <div style="width: 150px; height: 150px; background-color: #E8E8E8; border-radius: 8px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              ${
                user.profilePicture
                  ? `<img src="${user.profilePicture}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover;">`
                  : `<span style="font-size: 48px;">📷</span>`
              }
            </div>
          </div>

          <!-- Profile Information -->
          <div>
            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Nombre:</label>
              <p style="margin: 5px 0 0 0;">${user.name}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Correo Electrónico:</label>
              <p style="margin: 5px 0 0 0;">${user.email}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Número de Teléfono:</label>
              <p style="margin: 5px 0 0 0;">${user.phoneNumber || "Sin proporcionar"}</p>
            </div>

            ${
              user.role === "student"
                ? `
              <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; color: #333;">Historial de Salud:</label>
                <p style="margin: 5px 0 0 0; color: ${user.healthHistory ? "#333" : "#999"};">
                  ${user.healthHistory ? user.healthHistory : "Sin proporcionar"}
                </p>
              </div>
            `
                : ""
            }

            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Tipo de Cuenta:</label>
              <p style="margin: 5px 0 0 0; text-transform: capitalize;">${user.role}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Miembro desde:</label>
              <p style="margin: 5px 0 0 0;">
                ${user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
              </p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = profileHTML;

    // Setup edit profile button
    const editBtn = container.querySelector("#editProfileBtn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        openEditProfileModal(user);
      });
    }
  } catch {
    uiManager?.showNotification(
      "Falló al cargar la información del perfil",
      "error",
    );
  }
}

/**
 * Open edit profile modal
 */
function openEditProfileModal(user) {
  const modal = document.getElementById("editProfileModal");
  const editHealthSection = document.getElementById("editHealthHistorySection");

  if (!modal) return;

  // Mostrar sección de historial de salud solo para estudiantes
  if (editHealthSection) {
    editHealthSection.style.display =
      user.role === "student" ? "block" : "none";
  }

  // Populate form with current data
  document.getElementById("editPhoneNumber").value = user.phoneNumber || "";
  if (user.role === "student") {
    document.getElementById("editHealthHistory").value =
      user.healthHistory || "";
  }

  // Manejar vista previa de foto de perfil
  const editPictureInput = document.getElementById("editProfilePicture");
  const editPicturePreview = document.getElementById(
    "editProfilePicturePreview",
  );
  const editPreviewImage = document.getElementById("editPreviewImage");
  const currentPreview = document.getElementById("currentProfileImage");

  if (user.profilePicture) {
    currentPreview.src = user.profilePicture;
    document.getElementById("currentProfilePicturePreview").style.display =
      "block";
  } else {
    document.getElementById("currentProfilePicturePreview").style.display =
      "none";
  }

  if (editPictureInput) {
    editPictureInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          uiManager?.showNotification(
            "Por favor selecciona un archivo de imagen válido",
            "error",
          );
          editPictureInput.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          uiManager?.showNotification(
            "El tamaño de la imagen no debe exceder 5MB",
            "error",
          );
          editPictureInput.value = "";
          return;
        }

        // eslint-disable-next-line no-undef
        const reader = new FileReader();
        reader.onload = (event) => {
          editPreviewImage.src = event.target.result;
          editPicturePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Handle form submission
  const editForm = document.getElementById("editProfileForm");
  if (editForm) {
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      await handleEditProfileSubmit();
    };
  }

  // Manejar botón cerrar
  const closeBtn = document.getElementById("closeEditProfileModal");
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  }

  // Manejar botón cancelar
  const cancelBtn = document.getElementById("cancelEditProfileBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.style.display = "flex";
}

/**
 * Handle edit profile form submission
 */
async function handleEditProfileSubmit() {
  try {
    const phoneNumber = document.getElementById("editPhoneNumber").value.trim();
    const editPictureInput = document.getElementById("editProfilePicture");
    const user = authManager.getCurrentUser();

    if (!phoneNumber) {
      uiManager?.showNotification(
        "El número de teléfono es requerido",
        "error",
      );
      return;
    }

    const profileData = {
      phoneNumber,
    };

    if (user.role === "student") {
      const healthHistory = document
        .getElementById("editHealthHistory")
        .value.trim();
      if (!healthHistory) {
        uiManager?.showNotification(
          "El historial de salud es requerido",
          "error",
        );
        return;
      }
      profileData.healthHistory = healthHistory;
    }

    // Only convert new picture if one was selected
    if (editPictureInput.files[0]) {
      profileData.profilePictureBase64 = await authManager.fileToBase64(
        editPictureInput.files[0],
      );
    }

    // Update profile
    await authManager.updateProfileInfo(profileData);

    uiManager?.showNotification("¡Perfil actualizado exitosamente!", "success");
    document.getElementById("editProfileModal").style.display = "none";
    document.getElementById("editProfileForm").reset();
    document.getElementById("editProfilePicturePreview").style.display = "none";

    // Reload profile info with updated user data
    loadProfileInfoTab();
  } catch (error) {
    uiManager?.showNotification(
      error.message || "Falló al actualizar el perfil",
      "error",
    );
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
      container.innerHTML =
        '<p class="text-muted">No hay inscripciones aún</p>';
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
                <p><strong>Estado:</strong> <span style="color: ${enrollment.status === "active" ? "#4CAF50" : "#f44336"}">${enrollment.status === "active" ? "Activo" : "Inactivo"}</span></p>
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
