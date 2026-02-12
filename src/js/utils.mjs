/**
 * Utility Module
 * Shared utilities used across all pages
 */

// Wrapper for querySelector
export function qs(selector, parent = document) {
  return parent.querySelector(selector);
}

// Retrieve data from localStorage
export function getLocalStorage(key) {
  return JSON.parse(localStorage.getItem(key));
}

// Save data to localStorage
export function setLocalStorage(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Get parameter from URL query string
export function getParam(param) {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams.get(param);
}

// Load a template from a file path
async function loadTemplate(path) {
  const res = await fetch(path);
  const template = await res.text();
  return template;
}

// Render template to parent element
function renderWithTemplate(template, parentElement) {
  parentElement.innerHTML = template;
}

// Load header and footer on every page
export async function loadHeaderFooter() {
  try {
    const basePath = `${import.meta.env.BASE_URL || "/"}`.replace(/\/+$/, "");

    // Load header
    const headerTemplate = await loadTemplate(
      `${basePath}/partials/header.html`,
    );
    const headerElement = qs("#dy-header");
    if (headerElement) {
      renderWithTemplate(headerTemplate, headerElement);
    }

    // Load footer
    const footerTemplate = await loadTemplate(
      `${basePath}/partials/footer.html`,
    );
    const footerElement = qs("#dy-footer");
    if (footerElement) {
      renderWithTemplate(footerTemplate, footerElement);
    }
  } catch (error) {
    console.error("Error loading header/footer:", error);
  }
}

// Alert user with message
export function alertMessage(message, type = "info") {
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type}`;
  alertDiv.textContent = message;
  alertDiv.style.cssText = `
    padding: 12px;
    margin: 10px;
    border-radius: 4px;
    background-color: ${type === "error" ? "#f8d7da" : "#d1ecf1"};
    color: ${type === "error" ? "#721c24" : "#0c5460"};
    border: 1px solid ${type === "error" ? "#f5c6cb" : "#bee5eb"};
  `;

  const main = qs("main");
  if (main) {
    main.prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
  }
}

// Set event listener for both click and touch
export function setClick(selector, callback) {
  const element = qs(selector);
  if (element) {
    element.addEventListener("touchend", (event) => {
      event.preventDefault();
      callback();
    });
    element.addEventListener("click", callback);
  }
}
