/**
 * Dashboard Module
 * Handles role-specific dashboards and analytics
 */

class DashboardManager {
  constructor() {
    this.dashboards = {
      student: this.getStudentDashboard.bind(this),
      instructor: this.getInstructorDashboard.bind(this),
      admin: this.getAdminDashboard.bind(this),
    };
  }

  /**
   * Get dashboard based on user role
   */
  getDashboard() {
    const user = authManager.getCurrentUser();
    if (!user || !this.dashboards[user.role]) {
      return null;
    }

    return this.dashboards[user.role]();
  }

  /**
   * Student Dashboard
   */
  getStudentDashboard() {
    const user = authManager.getCurrentUser();
    if (!user) return null;

    const myEnrollments = enrollmentManager.getMyEnrollments();
    const myPayments = paymentManager.getMyPaymentHistory();

    const stats = {
      enrolledClasses: myEnrollments.length,
      totalSpent: myPayments
        .filter((p) => p.status === "confirmed")
        .reduce((sum, p) => sum + p.amount, 0),
      pendingPayments: myPayments.filter((p) => p.status === "pending").length,
      attendanceRate: this.calculateStudentAttendanceRate(user.id),
      upcomingClasses: this.getUpcomingClasses(myEnrollments),
      recentPayments: myPayments.slice(-5),
    };

    return {
      role: "student",
      user: user,
      stats: stats,
      enrollments: myEnrollments,
    };
  }

  /**
   * Instructor Dashboard
   */
  getInstructorDashboard() {
    const user = authManager.getCurrentUser();
    if (!user || user.role !== "instructor") return null;

    const myClasses = classManager.getClassesByInstructor(user.id);
    const totalStudents = myClasses.reduce(
      (sum, c) => sum + c.enrolledStudents.length,
      0,
    );

    const stats = {
      totalClasses: myClasses.length,
      totalStudents: totalStudents,
      revenue: paymentManager.getInstructorRevenue(user.id),
      averageClassSize: totalStudents / myClasses.length || 0,
      upcomingClasses: myClasses.slice(0, 5),
      attendanceByClass: this.getInstructorAttendanceStats(myClasses),
    };

    return {
      role: "instructor",
      user: user,
      stats: stats,
      classes: myClasses,
    };
  }

  /**
   * Admin Dashboard
   */
  getAdminDashboard() {
    const user = authManager.getCurrentUser();
    if (!user || user.role !== "admin") return null;

    const allClasses = classManager.classes;
    const totalEnrollments = enrollmentManager.enrollments.length;
    const paymentStats = paymentManager.getPaymentStats();

    const stats = {
      totalClasses: allClasses.length,
      totalEnrollments: totalEnrollments,
      totalStudents: new Set(
        enrollmentManager.enrollments.map((e) => e.studentId),
      ).size,
      totalInstructors: new Set(allClasses.map((c) => c.instructorId)).size,
      totalRevenue: paymentStats.totalRevenue,
      pendingPayments: paymentStats.pending,
      confirmingPayments: paymentStats.confirmed,
      classOccupancy: this.calculateAverageOccupancy(allClasses),
      topClasses: this.getTopClasses(),
      revenueByClass: this.getRevenueByClass(),
      pendingPaymentsList: paymentManager.getPendingPayments(),
    };

    return {
      role: "admin",
      user: user,
      stats: stats,
      classes: allClasses,
      enrollments: enrollmentManager.enrollments,
    };
  }

  /**
   * Calculate student attendance rate
   */
  calculateStudentAttendanceRate(studentId) {
    const enrollments = enrollmentManager.getStudentEnrollments(studentId);
    if (enrollments.length === 0) return 0;

    const attended = enrollments.filter((e) => e.attended).length;
    return Math.round((attended / enrollments.length) * 100);
  }

  /**
   * Get upcoming classes for student
   */
  getUpcomingClasses(enrollments) {
    return enrollments.slice(0, 3);
  }

  /**
   * Get instructor attendance statistics
   */
  getInstructorAttendanceStats(classes) {
    const stats = {};

    classes.forEach((c) => {
      const enrollments = enrollmentManager.getClassEnrollments(c.id);
      const attended = enrollments.filter((e) => e.attended).length;
      stats[c.id] = {
        classTitle: c.title,
        enrolled: enrollments.length,
        attended: attended,
        attendanceRate:
          enrollments.length > 0
            ? Math.round((attended / enrollments.length) * 100)
            : 0,
      };
    });

    return stats;
  }

  /**
   * Calculate average class occupancy
   */
  calculateAverageOccupancy(classes) {
    if (classes.length === 0) return 0;

    const occupancy = classes.reduce((sum, c) => {
      return sum + c.enrolledStudents.length / c.maxStudents;
    }, 0);

    return Math.round((occupancy / classes.length) * 100);
  }

  /**
   * Get top performing classes
   */
  getTopClasses() {
    return classManager.classes
      .sort((a, b) => b.enrolledStudents.length - a.enrolledStudents.length)
      .slice(0, 5)
      .map((c) => ({
        title: c.title,
        enrollments: c.enrolledStudents.length,
        capacity: c.maxStudents,
        occupancy: Math.round(
          (c.enrolledStudents.length / c.maxStudents) * 100,
        ),
      }));
  }

  /**
   * Get revenue by class
   */
  getRevenueByClass() {
    const revenue = {};

    paymentManager.payments
      .filter((p) => p.status === "confirmed")
      .forEach((p) => {
        if (!revenue[p.classId]) {
          revenue[p.classId] = 0;
        }
        revenue[p.classId] += p.amount;
      });

    return Object.entries(revenue)
      .map(([classId, amount]) => {
        const yogaClass = classManager.classes.find((c) => c.id === classId);
        return {
          classId: classId,
          className: yogaClass?.title || "Unknown",
          revenue: amount,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }
}

// Create global dashboard manager instance
const dashboardManager = new DashboardManager();
