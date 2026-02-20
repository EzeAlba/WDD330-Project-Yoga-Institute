/**
 * Profile Page Entry Point
 * Loads header/footer and initializes profile-specific functionality
 */

import { loadHeaderFooter } from "./utils.mjs";
import APIHandler from "./api.js";
import AuthManager from "./auth.js";
import ClassManager from "./classes.js";
import EnrollmentManager from "./enrollment.js";
import PaymentManager from "./payment.js";

const api = new APIHandler();
const authManager = new AuthManager();
const classManager = new ClassManager(api);
const enrollmentManager = new EnrollmentManager(api, authManager, classManager);
const paymentManager = new PaymentManager(
  api,
  authManager,
  classManager,
  enrollmentManager,
);

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();

  bindHeaderActions();

  const user = authManager.getCurrentUser();
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  if (user.role === "admin") {
    window.location.href = "../dashboard/index.html";
    return;
  }

  revealAuthenticatedNav();
  loadProfileData(user);
  configureTabsForRole(user);
  setupTabNavigation(user);
  loadProfileInfoTab(user);

  if (user.role === "instructor") {
    await loadInstructorClassesTab(user);
    await loadInstructorStudentsTab(user);
    await loadInstructorAttendanceTab(user);
    bindInstructorAttendanceActions(user);
    return;
  }

  await loadStudentEnrollmentsTab();
  loadStudentPaymentsTab();
  loadStudentAttendanceTab();
});

function bindHeaderActions() {
  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      const menu = document.getElementById("navbarMenu");
      if (menu) {
        menu.classList.toggle("active");
      }
    });
  }

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", async (event) => {
      event.preventDefault();
      await authManager.logout();
      window.location.href = "../index.html";
    });
  }
}

function revealAuthenticatedNav() {
  const profileLink = document.getElementById("profileLink");
  if (profileLink) {
    profileLink.style.display = "block";
  }

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.style.display = "block";
  }
}

function loadProfileData(user) {
  const userInfo = document.getElementById("userInfo");
  if (!userInfo) {
    return;
  }

  userInfo.innerHTML = `
    <h3>${user.name}</h3>
    <p><strong>Correo electrónico:</strong> ${user.email}</p>
    <p><strong>Tipo de cuenta:</strong> ${user.role}</p>
  `;
}

function loadProfileInfoTab(user) {
  try {
    const container = document.getElementById("profileInfoContainer");
    if (!container) return;

    let profileHTML = `
      <div style="background-color: #F9F9F9; padding: 20px; border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h4 style="margin: 0;">Información del perfil</h4>
          <button class="btn btn-secondary" id="editProfileBtn" style="padding: 6px 12px; font-size: 12px;">Editar perfil</button>
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
              <label style="font-weight: 600; color: #333;">Correo electrónico:</label>
              <p style="margin: 5px 0 0 0;">${user.email}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Número de teléfono:</label>
              <p style="margin: 5px 0 0 0;">${user.phoneNumber || "No proporcionado"}</p>
            </div>

            ${
              user.role === "student"
                ? `
              <div style="margin-bottom: 15px;">
                <label style="font-weight: 600; color: #333;">Historial de salud:</label>
                <p style="margin: 5px 0 0 0; color: ${user.healthHistory ? "#333" : "#999"};">
                  ${user.healthHistory ? user.healthHistory : "No proporcionado"}
                </p>
              </div>
            `
                : ""
            }

            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Tipo de cuenta:</label>
              <p style="margin: 5px 0 0 0; text-transform: capitalize;">${user.role}</p>
            </div>

            <div style="margin-bottom: 15px;">
              <label style="font-weight: 600; color: #333;">Miembro desde:</label>
              <p style="margin: 5px 0 0 0;">
                ${user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-ES") : "Desconocido"}
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error al cargar la información del perfil", error);
  }
}

function openEditProfileModal(user) {
  const modal = document.getElementById("editProfileModal");
  const editHealthSection = document.getElementById("editHealthHistorySection");

  if (!modal) return;

  // Show health history section only for students
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

  // Handle profile picture preview
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
          alert("Por favor, selecciona un archivo de imagen válido");
          editPictureInput.value = "";
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          alert("El tamaño de la imagen no debe exceder 5MB");
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
      await handleEditProfileSubmit(user);
    };
  }

  // Handle close button
  const closeBtn = document.getElementById("closeEditProfileModal");
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.style.display = "none";
    };
  }

  // Handle cancel button
  const cancelBtn = document.getElementById("cancelEditProfileBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
    });
  }

  modal.style.display = "flex";
}

async function handleEditProfileSubmit(user) {
  try {
    const phoneNumber = document.getElementById("editPhoneNumber").value.trim();
    const editPictureInput = document.getElementById("editProfilePicture");

    if (!phoneNumber) {
      alert("Número de teléfono es requerido");
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
        alert("Historial de salud es requerido para estudiantes");
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

    alert("¡Perfil actualizado con éxito!");
    document.getElementById("editProfileModal").style.display = "none";
    document.getElementById("editProfileForm").reset();
    document.getElementById("editProfilePicturePreview").style.display = "none";

    // Get the updated user and reload profile info
    const updatedUser = authManager.getCurrentUser();
    loadProfileInfoTab(updatedUser);
  } catch (error) {
    alert(error.message || "Error al actualizar el perfil");
  }
}

function setupTabNavigation(user) {
  const tabButtons = document.querySelectorAll(".profile-nav-btn");
  tabButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const tabName = event.currentTarget.dataset.tab;
      if (tabName) {
        switchTab(tabName);
        if (user.role === "instructor" && tabName === "attendance") {
          loadInstructorAttendanceTab(user);
        }
      }
    });
  });
}

function switchTab(tabName) {
  document.querySelectorAll(".profile-tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  document.querySelectorAll(".profile-nav-btn").forEach((button) => {
    button.classList.remove("active");
  });

  const selectedTab = document.getElementById(tabName);
  if (selectedTab) {
    selectedTab.classList.add("active");
  }

  const activeButton = document.querySelector(
    `.profile-nav-btn[data-tab="${tabName}"]`,
  );
  if (activeButton) {
    activeButton.classList.add("active");
  }
}

function configureTabsForRole(user) {
  const enrollmentsBtn = document.querySelector(
    '.profile-nav-btn[data-tab="enrollments"]',
  );
  const paymentsBtn = document.querySelector(
    '.profile-nav-btn[data-tab="payments"]',
  );
  const attendanceBtn = document.querySelector(
    '.profile-nav-btn[data-tab="attendance"]',
  );
  const enrollmentsTitle = document.querySelector("#enrollments h3");
  const paymentsTitle = document.querySelector("#payments h3");
  const attendanceTitle = document.querySelector("#attendance h3");

  if (user.role === "instructor") {
    if (enrollmentsBtn) enrollmentsBtn.textContent = "Mis Clases";
    if (paymentsBtn) paymentsBtn.textContent = "Estudiantes";
    if (attendanceBtn) attendanceBtn.textContent = "Asistencia";
    if (enrollmentsTitle) enrollmentsTitle.textContent = "Clases que Imparto";
    if (paymentsTitle) paymentsTitle.textContent = "Estudiantes Inscritos";
    if (attendanceTitle) attendanceTitle.textContent = "Gestión de Asistencia";
  } else {
    if (enrollmentsBtn) enrollmentsBtn.textContent = "Mis Inscripciones";
    if (paymentsBtn) paymentsBtn.textContent = "Pagos";
    if (attendanceBtn) attendanceBtn.textContent = "Asistencia";
    if (enrollmentsTitle) enrollmentsTitle.textContent = "Mis Clases Inscritas";
    if (paymentsTitle) paymentsTitle.textContent = "Historial de Pagos";
    if (attendanceTitle)
      attendanceTitle.textContent = "Registros de Asistencia";
  }
}

async function loadStudentEnrollmentsTab() {
  const container = document.getElementById("enrollmentsContainer");
  if (!container) {
    return;
  }

  const enrollments = enrollmentManager.getMyEnrollments();
  container.innerHTML = "";

  if (enrollments.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay inscripciones aún</p>';
    return;
  }

  for (const enrollment of enrollments) {
    const yogaClass = await classManager.getClassById(enrollment.classId);
    const item = document.createElement("div");
    item.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 10px;";

    if (yogaClass) {
      item.innerHTML = `
        <h4>${yogaClass.title}</h4>
        <p><strong>Instructor:</strong> ${yogaClass.instructor}</p>
        <p><strong>Horario:</strong> ${yogaClass.schedule.day} a las ${yogaClass.schedule.time}</p>
        <p><strong>Estado:</strong> ${enrollment.status}</p>
        <p><strong>Pago:</strong> ${enrollment.paymentStatus}</p>
      `;
    } else {
      item.innerHTML = `
        <h4>Clase No Disponible</h4>
        <p><strong>ID de la Clase:</strong> ${enrollment.classId}</p>
        <p><strong>Estado:</strong> ${enrollment.status}</p>
        <p><strong>Pago:</strong> ${enrollment.paymentStatus}</p>
      `;
    }

    container.appendChild(item);
  }
}

function loadStudentPaymentsTab() {
  const container = document.getElementById("paymentsContainer");
  if (!container) {
    return;
  }

  const payments = paymentManager.getMyPaymentHistory();
  container.innerHTML = "";

  if (payments.length === 0) {
    container.innerHTML = '<p class="text-muted">No hay historial de pagos</p>';
    return;
  }

  payments.forEach((payment) => {
    const item = document.createElement("div");
    item.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 10px;";
    item.innerHTML = `
      <h4>Pago ${payment.transactionId}</h4>
      <p><strong>Monto:</strong> $${Number(payment.amount).toFixed(2)}</p>
      <p><strong>Fecha:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
      <p><strong>Estado:</strong> ${payment.status}</p>
      <p><strong>Método:</strong> ${payment.paymentMethod}</p>
    `;
    container.appendChild(item);
  });
}

function loadStudentAttendanceTab() {
  const container = document.getElementById("attendanceContainer");
  if (!container) {
    return;
  }

  const enrollments = enrollmentManager.getMyEnrollments();
  const attended = enrollments.filter(
    (enrollment) => enrollment.attended,
  ).length;
  const total = enrollments.length;
  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  container.innerHTML = `
    <div style="padding: 15px; background-color: #F5F5F5; border-radius: 8px;">
      <h4>Resumen de Asistencia</h4>
      <p><strong>Asistidas:</strong> ${attended} / ${total} clases</p>
      <p><strong>Porcentaje:</strong> ${attendanceRate}%</p>
    </div>
  `;
}

async function getInstructorClasses(user) {
  const allClasses = await classManager.getAllClasses();
  return allClasses.filter(
    (yogaClass) =>
      yogaClass.instructorId === user.id || yogaClass.instructorId === user.uid,
  );
}

async function loadInstructorClassesTab(user) {
  const container = document.getElementById("enrollmentsContainer");
  if (!container) {
    return;
  }

  const myClasses = await getInstructorClasses(user);
  container.innerHTML = "";

  if (myClasses.length === 0) {
    container.innerHTML =
      '<p class="text-muted">No hay clases asignadas a este instructor aún.</p>';
    return;
  }

  myClasses.forEach((yogaClass) => {
    const item = document.createElement("div");
    item.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 10px;";
    item.innerHTML = `
      <h4>${yogaClass.title}</h4>
      <p><strong>Horario:</strong> ${yogaClass.schedule.day} a las ${yogaClass.schedule.time}</p>
      <p><strong>Estudiantes Inscritos:</strong> ${yogaClass.enrolledStudents.length} / ${yogaClass.maxStudents}</p>
      <p><strong>Dificultad:</strong> ${yogaClass.difficulty}</p>
    `;
    container.appendChild(item);
  });
}

async function loadInstructorStudentsTab(user) {
  const container = document.getElementById("paymentsContainer");
  if (!container) {
    return;
  }

  const myClasses = await getInstructorClasses(user);
  container.innerHTML = "";

  if (myClasses.length === 0) {
    container.innerHTML =
      '<p class="text-muted">No hay lista de estudiantes disponible hasta que se asignen clases.</p>';
    return;
  }

  let hasStudents = false;

  myClasses.forEach((yogaClass) => {
    const classEnrollments = enrollmentManager.getClassEnrollments(
      yogaClass.id,
    );

    const section = document.createElement("div");
    section.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 12px;";

    if (classEnrollments.length === 0) {
      section.innerHTML = `
        <h4>${yogaClass.title}</h4>
        <p class="text-muted">No hay estudiantes inscritos aún.</p>
      `;
      container.appendChild(section);
      return;
    }

    hasStudents = true;
    const rows = classEnrollments
      .map(
        (enrollment) => `
          <li>
            Estudiante: <strong>${enrollment.studentId}</strong> | Pago: ${enrollment.paymentStatus} | Estado: ${enrollment.status}
          </li>
        `,
      )
      .join("");

    section.innerHTML = `
      <h4>${yogaClass.title}</h4>
      <p><strong>Total de Estudiantes:</strong> ${classEnrollments.length}</p>
      <ul>${rows}</ul>
    `;
    container.appendChild(section);
  });

  if (!hasStudents) {
    container.insertAdjacentHTML(
      "beforeend",
      '<p class="text-muted">Los estudiantes aparecerán aquí una vez que se inscriban.</p>',
    );
  }
}

async function loadInstructorAttendanceTab(user) {
  const container = document.getElementById("attendanceContainer");
  if (!container) {
    return;
  }

  const myClasses = await getInstructorClasses(user);
  container.innerHTML = "";

  if (myClasses.length === 0) {
    container.innerHTML =
      '<p class="text-muted">No hay registros de asistencia disponibles aún.</p>';
    return;
  }

  myClasses.forEach((yogaClass) => {
    const classEnrollments = enrollmentManager.getClassEnrollments(
      yogaClass.id,
    );

    const section = document.createElement("div");
    section.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 12px;";

    if (classEnrollments.length === 0) {
      section.innerHTML = `
        <h4>${yogaClass.title}</h4>
        <p class="text-muted">No hay estudiantes inscritos aún.</p>
      `;
      container.appendChild(section);
      return;
    }

    const rows = classEnrollments
      .map(
        (enrollment) => `
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #E0E0E0; padding:8px 0;">
            <span>Estudiante: <strong>${enrollment.studentId}</strong></span>
            <button
              class="btn btn-secondary attendance-toggle-btn"
              data-enrollment-id="${enrollment.id}"
              data-attended="${enrollment.attended ? "true" : "false"}"
              style="padding:6px 10px; font-size:12px;"
            >
              ${enrollment.attended ? "Presente" : "Ausente"}
            </button>
          </div>
        `,
      )
      .join("");

    section.innerHTML = `
      <h4>${yogaClass.title}</h4>
      <p><strong>Toca para actualizar la asistencia:</strong></p>
      <div>${rows}</div>
    `;
    container.appendChild(section);
  });
}

function bindInstructorAttendanceActions(user) {
  const container = document.getElementById("attendanceContainer");
  if (!container) {
    return;
  }

  container.addEventListener("click", async (event) => {
    const button = event.target.closest(".attendance-toggle-btn");
    if (!button) {
      return;
    }

    const enrollmentId = button.dataset.enrollmentId;
    const attended = button.dataset.attended === "true";

    if (!enrollmentId) {
      return;
    }

    try {
      await enrollmentManager.updateAttendance(enrollmentId, !attended);
      await loadInstructorAttendanceTab(user);
      await loadInstructorStudentsTab(user);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to update attendance:", error);
    }
  });
}
