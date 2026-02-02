/**
 * Authentication Module
 * Handles user login, registration, and session management
 */

class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.isAuthenticated = !!this.currentUser;
  }

  /**
   * User login
   */
  async login(email, password) {
    try {
      // This will be replaced with actual API call
      // const response = await api.post('/auth/login', { email, password });

      // Mock authentication for development
      const user = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        email: email,
        name: email.split("@")[0],
        role: "student",
        loginTime: new Date().toISOString(),
      };

      this.currentUser = user;
      this.isAuthenticated = true;
      this.saveUser(user);

      // Update API token
      api.setAuthToken(user.id);

      return user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  /**
   * User registration
   */
  async register(email, password, name, role) {
    try {
      // This will be replaced with actual API call
      // const response = await api.post('/auth/register', { email, password, name, role });

      // Mock registration for development
      const user = {
        id: "user_" + Math.random().toString(36).substr(2, 9),
        email: email,
        name: name,
        role: role,
        registrationDate: new Date().toISOString(),
        profile: {
          healthInfo: "",
          personalInfo: "",
        },
      };

      this.currentUser = user;
      this.isAuthenticated = true;
      this.saveUser(user);

      // Update API token
      api.setAuthToken(user.id);

      return user;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  /**
   * User logout
   */
  logout() {
    this.currentUser = null;
    this.isAuthenticated = false;
    this.removeUser();
    api.setAuthToken(null);
  }

  /**
   * Check if user is authenticated
   */
  checkAuth() {
    return this.isAuthenticated && this.currentUser !== null;
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check user role
   */
  hasRole(role) {
    return this.currentUser && this.currentUser.role === role;
  }

  /**
   * Save user to localStorage
   */
  saveUser(user) {
    localStorage.setItem("moodUser", JSON.stringify(user));
  }

  /**
   * Load user from localStorage
   */
  loadUser() {
    const userData = localStorage.getItem("moodUser");
    return userData ? JSON.parse(userData) : null;
  }

  /**
   * Remove user from localStorage
   */
  removeUser() {
    localStorage.removeItem("moodUser");
  }

  /**
   * Update user profile
   */
  async updateProfile(data) {
    try {
      // This will be replaced with actual API call
      // const response = await api.put(`/users/${this.currentUser.id}`, data);

      this.currentUser = { ...this.currentUser, ...data };
      this.saveUser(this.currentUser);
      return this.currentUser;
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  }
}

// Create global auth manager instance
const authManager = new AuthManager();
