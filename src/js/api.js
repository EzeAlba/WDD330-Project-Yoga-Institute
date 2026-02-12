/*
 API Module
 Handles all external API interactions and centralized fetch/error handling
 */

export default class APIHandler {
  constructor() {
    this.baseURL = "https://api.example.com"; //This will be replaced with actual API endpoint
    this.timeout = 5000;
    this.headers = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Set authentication token for API requests
   */
  setAuthToken(token) {
    if (token) {
      this.headers["Authorization"] = `Bearer ${token}`;
    } else {
      delete this.headers["Authorization"];
    }
  }

  /**
   * Generic fetch wrapper with error handling
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: { ...this.headers },
      ...options,
    };

    try {
      const response = await Promise.race([
        fetch(url, config),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), this.timeout),
        ),
      ]);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get(endpoint) {
    return this.request(endpoint, { method: "GET" });
  }

  /**
   * POST request
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * DELETE request
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: "DELETE" });
  }

  /**
   * Error handling
   */
  handleError(error) {
    if (error.message === "Request timeout") {
      this.lastError = "Request timed out";
    } else if (error instanceof TypeError) {
      this.lastError = "Network error";
    } else {
      this.lastError = "API error";
    }
  }
}
