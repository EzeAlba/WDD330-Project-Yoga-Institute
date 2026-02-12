/**
 * Authentication Module
 * Handles user login, registration, and session management
 */

//Adding Google Firebase for authentication (optional, can be replaced with custom backend)
import { auth, provider, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as updateAuthProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import APIHandler from "./api";

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
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = await this.getOrCreateUser(result.user);
      this.setSession(user);
      return user;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * User registration
   */
  async register(email, password, name, role) {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      if (name) {
        await updateAuthProfile(result.user, { displayName: name });
      }

      await this.upsertUserProfile(result.user, {
        name,
        role: role || "student",
      });

      const user = await this.getOrCreateUser(result.user);
      this.setSession(user);
      return user;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * User logout
   */
  async logout() {
    await signOut(auth);
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
      this.lastError = error;
      throw error;
    }
  }

  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = await this.getOrCreateUser(result.user);
      this.setSession(user);
      return user;
    } catch (error) {
      // Ignore COOP/popup warnings - they're browser console warnings, not actual errors
      // Only handle actual Firebase auth errors
      if (error.code === "auth/popup-blocked") {
        throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
      }
      if (error.code === "auth/cancelled-popup-request") {
        // User cancelled - don't show error notification, just return
        return null;
      }
      // Re-throw other actual errors
      throw error;
    }
  }

  async upsertUserProfile(firebaseUser, overrides = {}) {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        name:
          overrides.name ||
          firebaseUser.displayName ||
          firebaseUser.email?.split("@")[0],
        email: firebaseUser.email,
        role: overrides.role || "student",
        createdAt: new Date(),
      });
      return;
    }

    const updates = {
      name:
        overrides.name ||
        userSnap.data().name ||
        firebaseUser.displayName ||
        firebaseUser.email?.split("@")[0],
      role: overrides.role || userSnap.data().role || "student",
      email: firebaseUser.email,
    };

    await setDoc(userRef, updates, { merge: true });
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
