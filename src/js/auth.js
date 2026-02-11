/**
 * Authentication Module
 * Handles user login, registration, and session management
 */

//Adding Google Firebase for authentication (optional, can be replaced with custom backend)
import { auth, provider, db } from "./firebase";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import APIHandler from "./api";

export async function loginWithGoogle() {
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  // If user does NOT exist, create it
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      role: "student", // default role
      createdAt: new Date(),
    });
  }

  return user;
}

export async function logoutUser() {
  await signOut(auth);
}

const api = new APIHandler();

export default class AuthManager {
  constructor() {
    this.currentUser = this.loadUser();
    this.isAuthenticated = !!this.currentUser;
    this.initAuthListener();
  }

  /**
   * User login
   */
  async login(email, password) {
    try {
      // Transitioned to Firebase Google login
      const user = await this.loginWithGoogle();
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
      // Transitioned to Firebase Google login (no separate registration needed)
      const user = await this.loginWithGoogle();
      return user;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout() {
    await logoutUser();
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

  async loginWithGoogle() {
    const result = await signInWithPopup(auth, provider);
    const user = await this.getOrCreateUser(result.user);
    this.setSession(user);
    return user;
  }

  async getOrCreateUser(firebaseUser) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newUser = {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || firebaseUser.email?.split("@")[0],
        email: firebaseUser.email,
        role: "student",
        createdAt: new Date(),
      };
      await setDoc(userRef, newUser);
      return {
        id: firebaseUser.uid,
        ...newUser,
        loginTime: new Date().toISOString(),
      };
    }

    const data = userSnap.data();
    return {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name:
        data.name ||
        firebaseUser.displayName ||
        firebaseUser.email?.split("@")[0],
      email: data.email || firebaseUser.email,
      role: data.role || "student",
      loginTime: new Date().toISOString(),
    };
  }

  setSession(user) {
    this.currentUser = user;
    this.isAuthenticated = true;
    this.saveUser(user);
    api.setAuthToken(user.id);
  }

  initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const user = await this.getOrCreateUser(firebaseUser);
        this.setSession(user);
      } else {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.removeUser();
        api.setAuthToken(null);
      }
    });
  }
}
