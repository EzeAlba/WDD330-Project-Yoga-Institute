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
    <p><strong>Email:</strong> ${user.email}</p>
    <p><strong>Role:</strong> ${user.role}</p>
  `;
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
    if (enrollmentsBtn) enrollmentsBtn.textContent = "My Classes";
    if (paymentsBtn) paymentsBtn.textContent = "Students";
    if (attendanceBtn) attendanceBtn.textContent = "Attendance";
    if (enrollmentsTitle) enrollmentsTitle.textContent = "Classes I Teach";
    if (paymentsTitle) paymentsTitle.textContent = "Enrolled Students";
    if (attendanceTitle) attendanceTitle.textContent = "Attendance Management";
  } else {
    if (enrollmentsBtn) enrollmentsBtn.textContent = "My Enrollments";
    if (paymentsBtn) paymentsBtn.textContent = "Payments";
    if (attendanceBtn) attendanceBtn.textContent = "Attendance";
    if (enrollmentsTitle) enrollmentsTitle.textContent = "My Enrolled Classes";
    if (paymentsTitle) paymentsTitle.textContent = "Payment History";
    if (attendanceTitle) attendanceTitle.textContent = "Attendance Records";
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
    container.innerHTML = '<p class="text-muted">No enrollments yet</p>';
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
        <p><strong>Schedule:</strong> ${yogaClass.schedule.day} at ${yogaClass.schedule.time}</p>
        <p><strong>Status:</strong> ${enrollment.status}</p>
        <p><strong>Payment:</strong> ${enrollment.paymentStatus}</p>
      `;
    } else {
      item.innerHTML = `
        <h4>Class Unavailable</h4>
        <p><strong>Class ID:</strong> ${enrollment.classId}</p>
        <p><strong>Status:</strong> ${enrollment.status}</p>
        <p><strong>Payment:</strong> ${enrollment.paymentStatus}</p>
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
    container.innerHTML = '<p class="text-muted">No payment history</p>';
    return;
  }

  payments.forEach((payment) => {
    const item = document.createElement("div");
    item.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 10px;";
    item.innerHTML = `
      <h4>Payment ${payment.transactionId}</h4>
      <p><strong>Amount:</strong> $${Number(payment.amount).toFixed(2)}</p>
      <p><strong>Date:</strong> ${new Date(payment.createdAt).toLocaleDateString()}</p>
      <p><strong>Status:</strong> ${payment.status}</p>
      <p><strong>Method:</strong> ${payment.paymentMethod}</p>
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
      <h4>Attendance Summary</h4>
      <p><strong>Attended:</strong> ${attended} / ${total} classes</p>
      <p><strong>Rate:</strong> ${attendanceRate}%</p>
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
      '<p class="text-muted">No classes assigned to this instructor yet.</p>';
    return;
  }

  myClasses.forEach((yogaClass) => {
    const item = document.createElement("div");
    item.style.cssText =
      "padding: 15px; border: 1px solid #E0E0E0; border-radius: 8px; margin-bottom: 10px;";
    item.innerHTML = `
      <h4>${yogaClass.title}</h4>
      <p><strong>Schedule:</strong> ${yogaClass.schedule.day} at ${yogaClass.schedule.time}</p>
      <p><strong>Enrolled Students:</strong> ${yogaClass.enrolledStudents.length} / ${yogaClass.maxStudents}</p>
      <p><strong>Difficulty:</strong> ${yogaClass.difficulty}</p>
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
      '<p class="text-muted">No student list available until classes are assigned.</p>';
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
        <p class="text-muted">No enrolled students yet.</p>
      `;
      container.appendChild(section);
      return;
    }

    hasStudents = true;
    const rows = classEnrollments
      .map(
        (enrollment) => `
          <li>
            Student: <strong>${enrollment.studentId}</strong> | Payment: ${enrollment.paymentStatus} | Status: ${enrollment.status}
          </li>
        `,
      )
      .join("");

    section.innerHTML = `
      <h4>${yogaClass.title}</h4>
      <p><strong>Total Students:</strong> ${classEnrollments.length}</p>
      <ul>${rows}</ul>
    `;
    container.appendChild(section);
  });

  if (!hasStudents) {
    container.insertAdjacentHTML(
      "beforeend",
      '<p class="text-muted">Students will appear here once they enroll.</p>',
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
      '<p class="text-muted">No attendance records available yet.</p>';
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
        <p class="text-muted">No students enrolled yet.</p>
      `;
      container.appendChild(section);
      return;
    }

    const rows = classEnrollments
      .map(
        (enrollment) => `
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #E0E0E0; padding:8px 0;">
            <span>Student: <strong>${enrollment.studentId}</strong></span>
            <button
              class="btn btn-secondary attendance-toggle-btn"
              data-enrollment-id="${enrollment.id}"
              data-attended="${enrollment.attended ? "true" : "false"}"
              style="padding:6px 10px; font-size:12px;"
            >
              ${enrollment.attended ? "Present" : "Absent"}
            </button>
          </div>
        `,
      )
      .join("");

    section.innerHTML = `
      <h4>${yogaClass.title}</h4>
      <p><strong>Tap to update attendance:</strong></p>
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
      console.error("Failed to update attendance:", error);
    }
  });
}
