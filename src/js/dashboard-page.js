/**
 * Dashboard Page Entry Point
 * Admin class management with Firestore-backed classes
 */

import { loadHeaderFooter } from "./utils.mjs";
import AuthManager from "./auth.js";
import APIHandler from "./api.js";
import ClassManager from "./classes.js";

const api = new APIHandler();
const authManager = new AuthManager();
const classManager = new ClassManager(api, authManager);

document.addEventListener("DOMContentLoaded", async () => {
  await loadHeaderFooter();
  bindHeaderActions();

  const user = authManager.getCurrentUser();
  if (!user || user.role !== "admin") {
    window.location.href = "../index.html";
    return;
  }

  revealAuthenticatedNav();
  bindClassForm();
  bindClassTableActions();
  await renderAdminDashboard();
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

function bindClassForm() {
  const form = document.getElementById("classForm");
  const cancelEditBtn = document.getElementById("cancelEditBtn");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const classId = document.getElementById("classId").value;
    const payload = getClassFormPayload();

    try {
      if (classId) {
        await classManager.updateClass(classId, payload);
      } else {
        await classManager.createClass(payload);
      }
      resetClassForm();
      await renderAdminDashboard();
    } catch (error) {
      alert(error.message || "Failed to save class");
    }
  });

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", () => {
      resetClassForm();
    });
  }
}

function bindClassTableActions() {
  const table = document.getElementById("adminClassesTable");
  if (!table) return;

  table.addEventListener("click", async (event) => {
    const editBtn = event.target.closest("[data-action='edit-class']");
    const deleteBtn = event.target.closest("[data-action='delete-class']");

    if (editBtn) {
      const classId = editBtn.dataset.classId;
      const yogaClass = await classManager.getClassById(classId);
      if (yogaClass) {
        populateClassForm(yogaClass);
      }
      return;
    }

    if (deleteBtn) {
      const classId = deleteBtn.dataset.classId;
      if (!classId) return;
      const confirmed = window.confirm("Delete this class?");
      if (!confirmed) return;

      try {
        await classManager.deleteClass(classId);
        if (document.getElementById("classId").value === classId) {
          resetClassForm();
        }
        await renderAdminDashboard();
      } catch (error) {
        alert(error.message || "Failed to delete class");
      }
    }
  });
}

async function renderAdminDashboard() {
  const classes = await classManager.getAllClasses();
  renderStats(classes);
  renderClassesTable(classes);
}

function renderStats(classes) {
  const totalStudents = classes.reduce(
    (sum, yogaClass) => sum + (yogaClass.enrolledStudents?.length || 0),
    0,
  );
  const totalCapacity = classes.reduce(
    (sum, yogaClass) => sum + (yogaClass.maxStudents || 0),
    0,
  );

  const widgets = [
    { title: "Total Classes", value: classes.length },
    { title: "Total Enrolled", value: totalStudents },
    { title: "Total Capacity", value: totalCapacity },
  ];

  const dashboardGrid = document.getElementById("dashboardGrid");
  if (!dashboardGrid) return;
  dashboardGrid.innerHTML = widgets
    .map(
      (widget) => `
        <div class="dashboard-widget">
          <div class="widget-title">${widget.title}</div>
          <div class="widget-value">${widget.value}</div>
        </div>
      `,
    )
    .join("");
}

function renderClassesTable(classes) {
  const container = document.getElementById("adminClassesTable");
  if (!container) return;

  if (!classes.length) {
    container.innerHTML = '<p class="text-muted">No classes yet.</p>';
    return;
  }

  const rows = classes
    .map(
      (yogaClass) => `
        <tr>
          <td>${yogaClass.title}</td>
          <td>${yogaClass.instructor}</td>
          <td>${yogaClass.schedule?.day || "-"}</td>
          <td>${yogaClass.schedule?.time || "-"}</td>
          <td>${yogaClass.enrolledStudents?.length || 0}/${yogaClass.maxStudents || 0}</td>
          <td>
            <button class="btn btn-secondary" data-action="edit-class" data-class-id="${yogaClass.id}" style="padding: 6px 10px; font-size: 12px;">Edit</button>
            <button class="btn btn-primary" data-action="delete-class" data-class-id="${yogaClass.id}" style="padding: 6px 10px; font-size: 12px;">Delete</button>
          </td>
        </tr>
      `,
    )
    .join("");

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Instructor</th>
          <th>Day</th>
          <th>Time</th>
          <th>Seats</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function getClassFormPayload() {
  return {
    title: document.getElementById("classTitle").value.trim(),
    instructor: document.getElementById("classInstructor").value.trim(),
    instructorId: document.getElementById("classInstructorId").value.trim(),
    difficulty: document.getElementById("classDifficulty").value,
    description: document.getElementById("classDescription").value.trim(),
    price: Number(document.getElementById("classPrice").value),
    duration: Number(document.getElementById("classDuration").value),
    maxStudents: Number(document.getElementById("classMaxStudents").value),
    schedule: {
      day: document.getElementById("classDay").value,
      time: document.getElementById("classTime").value,
    },
  };
}

function populateClassForm(yogaClass) {
  document.getElementById("classId").value = yogaClass.id;
  document.getElementById("classTitle").value = yogaClass.title || "";
  document.getElementById("classInstructor").value = yogaClass.instructor || "";
  document.getElementById("classInstructorId").value =
    yogaClass.instructorId || "";
  document.getElementById("classDifficulty").value =
    yogaClass.difficulty || "beginner";
  document.getElementById("classDescription").value =
    yogaClass.description || "";
  document.getElementById("classPrice").value = yogaClass.price ?? "";
  document.getElementById("classDuration").value = yogaClass.duration ?? "";
  document.getElementById("classMaxStudents").value =
    yogaClass.maxStudents ?? "";
  document.getElementById("classDay").value =
    yogaClass.schedule?.day || "monday";
  document.getElementById("classTime").value =
    yogaClass.schedule?.time || "09:00";
  document.getElementById("saveClassBtn").textContent = "Update Class";
}

function resetClassForm() {
  const form = document.getElementById("classForm");
  if (form) {
    form.reset();
  }
  document.getElementById("classId").value = "";
  document.getElementById("saveClassBtn").textContent = "Save Class";
}
