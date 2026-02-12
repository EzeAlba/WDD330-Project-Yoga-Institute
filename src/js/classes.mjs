/**
 * Classes Management Module
 * Handles class creation, reading, updating, deletion, and search
 */

class ClassManager {
  constructor() {
    this.classes = this.loadClasses();
  }

  /**
   * Fetch all classes
   */
  async getAllClasses() {
    try {
      // This will be replaced with actual API call
      // return await api.get('/classes');
      // For now, return local data, in the future the classes would be stored
      // in a cloud database and fetched via API.

      return this.classes;
    } catch (error) {
      console.error("Failed to fetch classes:", error);
      throw error;
    }
  }

  /**
   * Get class by ID
   */
  async getClassById(classId) {
    try {
      // This will be replaced with actual API call
      // return await api.get(`/classes/${classId}`);

      return this.classes.find((c) => c.id === classId);
    } catch (error) {
      console.error("Failed to fetch class:", error);
      throw error;
    }
  }

  /**
   * Create new class (Admin)
   */
  async createClass(classData) {
    try {
      // Check if user is admin
      if (!authManager.hasRole("admin")) {
        throw new Error("Only administrators can create classes");
      }

      // This will be replaced with actual API call
      // return await api.post('/classes', classData);

      const newClass = {
        id: "class_" + Math.random().toString(36).substr(2, 9),
        ...classData,
        createdAt: new Date().toISOString(),
        enrolledStudents: [],
      };

      this.classes.push(newClass);
      this.saveClasses();
      return newClass;
    } catch (error) {
      console.error("Failed to create class:", error);
      throw error;
    }
  }

  /**
   * Update class (Admin)
   */
  async updateClass(classId, updates) {
    try {
      if (!authManager.hasRole("admin")) {
        throw new Error("Only administrators can update classes");
      }

      // This will be replaced with actual API call
      // return await api.put(`/classes/${classId}`, updates);

      const classIndex = this.classes.findIndex((c) => c.id === classId);
      if (classIndex === -1) {
        throw new Error("Class not found");
      }

      this.classes[classIndex] = { ...this.classes[classIndex], ...updates };
      this.saveClasses();
      return this.classes[classIndex];
    } catch (error) {
      console.error("Failed to update class:", error);
      throw error;
    }
  }

  /**
   * Delete class (Admin)
   */
  async deleteClass(classId) {
    try {
      if (!authManager.hasRole("admin")) {
        throw new Error("Only administrators can delete classes");
      }

      // This will be replaced with actual API call
      // return await api.delete(`/classes/${classId}`);

      this.classes = this.classes.filter((c) => c.id !== classId);
      this.saveClasses();
    } catch (error) {
      console.error("Failed to delete class:", error);
      throw error;
    }
  }

  /**
   * Search and filter classes
   */
  searchClasses(filters = {}) {
    let filtered = [...this.classes];

    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(searchLower) ||
          c.instructor.toLowerCase().includes(searchLower),
      );
    }

    // Filter by difficulty level
    if (filters.difficulty) {
      filtered = filtered.filter((c) => c.difficulty === filters.difficulty);
    }

    // Filter by day of week
    if (filters.day) {
      filtered = filtered.filter((c) => c.schedule.day === filters.day);
    }

    // Filter by price range
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter((c) => c.price >= filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((c) => c.price <= filters.maxPrice);
    }

    // Filter by availability
    if (filters.availableOnly) {
      filtered = filtered.filter(
        (c) => c.maxStudents > c.enrolledStudents.length,
      );
    }

    return filtered;
  }

  /**
   * Get available spots for a class
   */
  getAvailableSpots(classId) {
    const yogaClass = this.classes.find((c) => c.id === classId);
    if (!yogaClass) {
      return 0;
    }
    return yogaClass.maxStudents - yogaClass.enrolledStudents.length;
  }

  /**
   * Check if class is full
   */
  isClassFull(classId) {
    return this.getAvailableSpots(classId) <= 0;
  }

  /**
   * Get classes by instructor
   */
  getClassesByInstructor(instructorId) {
    return this.classes.filter((c) => c.instructorId === instructorId);
  }

  /**
   * Load classes from localStorage (mock data)
   */
  loadClasses() {
    const stored = localStorage.getItem("moodClasses");
    if (stored) {
      return JSON.parse(stored);
    }

    // Mock data for development
    return [
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
        schedule: {
          day: "monday",
          time: "09:00",
        },
        maxStudents: 20,
        enrolledStudents: [],
        image: "🧘‍♀️",
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
        schedule: {
          day: "wednesday",
          time: "18:00",
        },
        maxStudents: 25,
        enrolledStudents: [],
        image: "🧘",
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
        schedule: {
          day: "friday",
          time: "17:00",
        },
        maxStudents: 15,
        enrolledStudents: [],
        image: "💪",
      },
    ];
  }

  /**
   * Save classes to localStorage
   */
  saveClasses() {
    localStorage.setItem("moodClasses", JSON.stringify(this.classes));
  }
}

export default ClassManager;
