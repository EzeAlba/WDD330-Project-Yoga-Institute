/**
 * Enrollment Module
 * Handles student enrollment in classes and enrollment tracking
 */
export default class EnrollmentManager {
  constructor(api, authManager, classManager) {
    this.authManager = authManager;
    this.classManager = classManager;
    this.enrollments = this.loadEnrollments();
  }

  /**
   * Enroll student in a class
   */
  async enrollStudent(classId) {
    try {
      const user = this.authManager.getCurrentUser();
      if (!user) {
        throw new Error("User must be logged in to enroll");
        //show an alert in the future instead of throwing an error, and redirect to login page
      }

      if (user.role !== "student") {
        throw new Error("Only students can enroll in classes");
        //show an alert in the future instead of throwing an error
      }

      const yogaClass = await this.classManager.getClassById(classId);
      if (!yogaClass) {
        throw new Error("Class not found");
      }

      if (this.classManager.isClassFull(classId)) {
        throw new Error("Class is full");
      }

      // Check if already enrolled
      if (this.isEnrolled(user.id, classId)) {
        throw new Error("You are already enrolled in this class");
      }

      const enrollment = {
        // Generate a unique ID for the enrollment
        id: "enrollment_" + Math.random().toString(36).substr(2, 9),
        studentId: user.id,
        classId: classId,
        enrollmentDate: new Date().toISOString(),
        status: "active",
        attended: false,
        paymentStatus: "pending",
      };

      this.enrollments.push(enrollment);

      // Add student to class
      yogaClass.enrolledStudents.push(user.id);
      this.classManager.saveClasses();

      this.saveEnrollments();
      return enrollment;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Drop/cancel enrollment
   */
  async dropClass(classId) {
    try {
      const user = this.authManager.getCurrentUser();
      if (!user) {
        throw new Error("User must be logged in");
      }

      const enrollmentIndex = this.enrollments.findIndex(
        (e) => e.studentId === user.id && e.classId === classId,
      );

      if (enrollmentIndex === -1) {
        throw new Error("Enrollment not found");
      }

      this.enrollments.splice(enrollmentIndex, 1);

      // Remove student from class
      const yogaClass = await this.classManager.getClassById(classId);
      yogaClass.enrolledStudents = yogaClass.enrolledStudents.filter(
        (id) => id !== user.id,
      );
      this.classManager.saveClasses();

      this.saveEnrollments();
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Get all enrollments for current student
   */
  getMyEnrollments() {
    const user = this.authManager.getCurrentUser();
    if (!user) {
      return [];
    }

    return this.enrollments.filter((e) => e.studentId === user.id);
  }

  /**
   * Get all students enrolled in a class
   */
  getClassEnrollments(classId) {
    return this.enrollments.filter((e) => e.classId === classId);
  }

  /**
   * Get all enrollments for a student (by ID)
   */
  getStudentEnrollments(studentId) {
    return this.enrollments.filter((e) => e.studentId === studentId);
  }

  /**
   * Check if student is enrolled in a class
   */
  isEnrolled(studentId, classId) {
    return this.enrollments.some(
      (e) => e.studentId === studentId && e.classId === classId,
    );
  }

  /**
   * Update enrollment status
   */
  async updateEnrollmentStatus(enrollmentId, status) {
    try {
      const enrollment = this.enrollments.find((e) => e.id === enrollmentId);
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      enrollment.status = status;
      this.saveEnrollments();
      return enrollment;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(enrollmentId, status) {
    try {
      const enrollment = this.enrollments.find((e) => e.id === enrollmentId);
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      enrollment.paymentStatus = status;
      this.saveEnrollments();
      return enrollment;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Mark attendance for an enrollment (Instructor/Admin)
   */
  async updateAttendance(enrollmentId, attended) {
    try {
      const user = this.authManager.getCurrentUser();
      if (!user) {
        throw new Error("User must be logged in");
      }

      const enrollment = this.enrollments.find((e) => e.id === enrollmentId);
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      if (user.role !== "admin") {
        if (user.role !== "instructor") {
          throw new Error("Only instructors and admins can update attendance");
        }

        const yogaClass = await this.classManager.getClassById(
          enrollment.classId,
        );
        if (
          !yogaClass ||
          (yogaClass.instructorId !== user.id &&
            yogaClass.instructorId !== user.uid)
        ) {
          throw new Error(
            "You can only update attendance for your own classes",
          );
        }
      }

      enrollment.attended = Boolean(attended);
      this.saveEnrollments();
      return enrollment;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Get enrollment details with class info
   */
  async getEnrollmentDetails(enrollmentId) {
    const enrollment = this.enrollments.find((e) => e.id === enrollmentId);
    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    const yogaClass = await this.classManager.getClassById(enrollment.classId);
    return {
      ...enrollment,
      classDetails: yogaClass,
    };
  }

  /**
   * Get all my enrollments with class details
   */
  async getMyEnrollmentsWithDetails() {
    const myEnrollments = this.getMyEnrollments();
    const enriched = [];

    for (const enrollment of myEnrollments) {
      const yogaClass = await this.classManager.getClassById(
        enrollment.classId,
      );
      enriched.push({
        ...enrollment,
        classDetails: yogaClass,
      });
    }

    return enriched;
  }

  /**
   * Load enrollments from localStorage
   */
  loadEnrollments() {
    const stored = localStorage.getItem("moodEnrollments");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save enrollments to localStorage
   */
  saveEnrollments() {
    localStorage.setItem("moodEnrollments", JSON.stringify(this.enrollments));
  }
}
