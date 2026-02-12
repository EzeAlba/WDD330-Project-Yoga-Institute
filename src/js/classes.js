/**
 * Classes Management Module
 * Handles class CRUD with Firestore and local fallback
 */

import { db } from "./firebase.js";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";

const MOCK_CLASSES = [
  {
    id: "class_1",
    title: "Beginner Hatha Yoga",
    instructor: "Sarah Johnson",
    instructorId: "instructor_1",
    difficulty: "beginner",
    description:
      "A gentle introduction to yoga focusing on basic poses and breathing.",
    price: 15,
    duration: 60,
    schedule: { day: "monday", time: "09:00" },
    maxStudents: 20,
    enrolledStudents: [],
  },
  {
    id: "class_2",
    title: "Intermediate Vinyasa",
    instructor: "Mike Chen",
    instructorId: "instructor_2",
    difficulty: "intermediate",
    description: "Dynamic flow connecting breath with movement.",
    price: 20,
    duration: 75,
    schedule: { day: "wednesday", time: "18:00" },
    maxStudents: 25,
    enrolledStudents: [],
  },
  {
    id: "class_3",
    title: "Advanced Power Yoga",
    instructor: "Emma Davis",
    instructorId: "instructor_3",
    difficulty: "advanced",
    description: "Challenging asanas and intense breathing practices.",
    price: 25,
    duration: 90,
    schedule: { day: "friday", time: "17:00" },
    maxStudents: 15,
    enrolledStudents: [],
  },
];

class ClassManager {
  constructor(api, authManager = null) {
    this.api = api;
    this.authManager = authManager;
    this.classes = this.loadClasses();
  }

  async getAllClasses() {
    try {
      const snapshot = await getDocs(collection(db, "classes"));
      const classes = snapshot.docs.map((classDoc) => ({
        id: classDoc.id,
        ...classDoc.data(),
      }));

      if (classes.length > 0) {
        this.classes = classes;
        this.saveClasses();
        return this.classes;
      }

      // Firestore empty: use local fallback so UI keeps working
      this.classes = this.loadClasses();
      return this.classes;
    } catch (error) {
      this.lastError = error;
      this.classes = this.loadClasses();
      return this.classes;
    }
  }

  async migrateLocalClassesToFirestore() {
    this.requireAdmin();
    const snapshot = await getDocs(collection(db, "classes"));
    if (!snapshot.empty) {
      return 0;
    }

    const localClasses = this.loadClasses();
    for (const yogaClass of localClasses) {
      const payload = this.normalizeClassData(yogaClass);
      delete payload.id;
      await addDoc(collection(db, "classes"), payload);
    }

    await this.getAllClasses();
    return localClasses.length;
  }

  async getClassById(classId) {
    try {
      if (!this.classes.length) {
        await this.getAllClasses();
      }
      return this.classes.find((yogaClass) => yogaClass.id === classId) || null;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  async createClass(classData) {
    try {
      this.requireAdmin();
      const payload = this.normalizeClassData(classData);
      const ref = await addDoc(collection(db, "classes"), payload);
      const created = { id: ref.id, ...payload };
      this.classes.push(created);
      this.saveClasses();
      return created;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  async updateClass(classId, updates) {
    try {
      this.requireAdmin();
      const updatePayload = this.normalizeClassData(updates, true);
      await updateDoc(doc(db, "classes", classId), updatePayload);

      const classIndex = this.classes.findIndex((c) => c.id === classId);
      if (classIndex !== -1) {
        this.classes[classIndex] = {
          ...this.classes[classIndex],
          ...updatePayload,
        };
        this.saveClasses();
      }

      return this.classes[classIndex] || { id: classId, ...updatePayload };
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  async deleteClass(classId) {
    try {
      this.requireAdmin();
      await deleteDoc(doc(db, "classes", classId));
      this.classes = this.classes.filter((c) => c.id !== classId);
      this.saveClasses();
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  searchClasses(filters = {}) {
    let filtered = [...this.classes];

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (yogaClass) =>
          yogaClass.title?.toLowerCase().includes(searchLower) ||
          yogaClass.instructor?.toLowerCase().includes(searchLower),
      );
    }

    if (filters.difficulty) {
      filtered = filtered.filter(
        (yogaClass) => yogaClass.difficulty === filters.difficulty,
      );
    }

    if (filters.day) {
      filtered = filtered.filter(
        (yogaClass) => yogaClass.schedule?.day === filters.day,
      );
    }

    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(
        (yogaClass) => yogaClass.price >= filters.minPrice,
      );
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(
        (yogaClass) => yogaClass.price <= filters.maxPrice,
      );
    }

    if (filters.availableOnly) {
      filtered = filtered.filter(
        (yogaClass) =>
          (yogaClass.maxStudents || 0) >
          (Array.isArray(yogaClass.enrolledStudents)
            ? yogaClass.enrolledStudents.length
            : 0),
      );
    }

    return filtered;
  }

  getAvailableSpots(classId) {
    const yogaClass = this.classes.find((c) => c.id === classId);
    if (!yogaClass) {
      return 0;
    }
    const enrolled = Array.isArray(yogaClass.enrolledStudents)
      ? yogaClass.enrolledStudents.length
      : 0;
    return (yogaClass.maxStudents || 0) - enrolled;
  }

  isClassFull(classId) {
    return this.getAvailableSpots(classId) <= 0;
  }

  getClassesByInstructor(instructorId) {
    return this.classes.filter(
      (yogaClass) => yogaClass.instructorId === instructorId,
    );
  }

  loadClasses() {
    const stored = localStorage.getItem("moodClasses");
    if (stored) {
      return JSON.parse(stored);
    }
    return [...MOCK_CLASSES];
  }

  saveClasses() {
    localStorage.setItem("moodClasses", JSON.stringify(this.classes));
  }

  requireAdmin() {
    if (!this.authManager) {
      throw new Error("Auth manager is required for admin actions");
    }
    if (!this.authManager.hasRole("admin")) {
      throw new Error("Only administrators can manage classes");
    }
  }

  normalizeClassData(classData, partial = false) {
    const normalized = {
      ...classData,
    };

    if (!partial || normalized.title !== undefined) {
      normalized.title = String(normalized.title || "").trim();
    }
    if (!partial || normalized.instructor !== undefined) {
      normalized.instructor = String(normalized.instructor || "").trim();
    }
    if (!partial || normalized.instructorId !== undefined) {
      normalized.instructorId = String(normalized.instructorId || "").trim();
    }
    if (!partial || normalized.description !== undefined) {
      normalized.description = String(normalized.description || "").trim();
    }
    if (!partial || normalized.difficulty !== undefined) {
      normalized.difficulty = String(
        normalized.difficulty || "beginner",
      ).toLowerCase();
    }
    if (!partial || normalized.price !== undefined) {
      normalized.price = Number(normalized.price || 0);
    }
    if (!partial || normalized.duration !== undefined) {
      normalized.duration = Number(normalized.duration || 60);
    }
    if (!partial || normalized.maxStudents !== undefined) {
      normalized.maxStudents = Number(normalized.maxStudents || 0);
    }

    if (!partial || normalized.schedule !== undefined) {
      const day = normalized.schedule?.day || "monday";
      const time = normalized.schedule?.time || "09:00";
      normalized.schedule = {
        day: String(day).toLowerCase(),
        time: String(time),
      };
    }

    if (!partial || normalized.enrolledStudents !== undefined) {
      normalized.enrolledStudents = Array.isArray(normalized.enrolledStudents)
        ? normalized.enrolledStudents
        : [];
    }

    if (!partial && !normalized.createdAt) {
      normalized.createdAt = new Date().toISOString();
    }

    return normalized;
  }
}

export default ClassManager;
