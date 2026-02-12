/**
 * Payment Module
 * Handles class payment processing and payment tracking
 */
export default class PaymentManager {
  constructor(api, authManager, classManager, enrollmentManager) {
    this.authManager = authManager;
    this.classManager = classManager;
    this.enrollmentManager = enrollmentManager;
    this.payments = this.loadPayments();
  }

  /**
   * Process payment for class enrollment
   */
  async processPayment(enrollmentId, paymentMethod = "bank_transfer") {
    try {
      const enrollment = this.enrollmentManager.enrollments.find(
        (e) => e.id === enrollmentId,
      );
      if (!enrollment) {
        throw new Error("Enrollment not found");
      }

      const yogaClass = await this.classManager.getClassById(
        enrollment.classId,
      );
      if (!yogaClass) {
        throw new Error("Class not found");
      }

      const payment = {
        id: "payment_" + Math.random().toString(36).substr(2, 9),
        enrollmentId: enrollmentId,
        studentId: enrollment.studentId,
        classId: enrollment.classId,
        amount: yogaClass.price,
        currency: "USD",
        paymentMethod: paymentMethod,
        status: "pending",
        createdAt: new Date().toISOString(),
        transactionId: this.generateTransactionId(),
        paymentDetails: {
          bankName: "Main Bank",
          accountNumber: "****1234",
          routingNumber: "****5678",
        },
      };

      this.payments.push(payment);
      await this.enrollmentManager.updatePaymentStatus(enrollmentId, "pending");
      this.savePayments();

      return payment;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Confirm payment received (Admin only)
   */
  async confirmPayment(paymentId) {
    try {
      const user = this.authManager.getCurrentUser();
      if (!user || user.role !== "admin") {
        throw new Error("Only administrators can confirm payments");
      }

      const payment = this.payments.find((p) => p.id === paymentId);
      if (!payment) {
        throw new Error("Payment not found");
      }

      payment.status = "confirmed";
      payment.confirmedAt = new Date().toISOString();
      payment.confirmedBy = user.id;

      await this.enrollmentManager.updatePaymentStatus(
        payment.enrollmentId,
        "completed",
      );

      this.savePayments();
      return payment;
    } catch (error) {
      this.lastError = error;
      throw error;
    }
  }

  /**
   * Get payment history for current user
   */
  getMyPaymentHistory() {
    const user = this.authManager.getCurrentUser();
    if (!user) {
      return [];
    }

    return this.payments.filter((p) => p.studentId === user.id);
  }

  /**
   * Get all pending payments (Admin only)
   */
  getPendingPayments() {
    const user = this.authManager.getCurrentUser();
    if (!user || user.role !== "admin") {
      return [];
    }

    return this.payments.filter((p) => p.status === "pending");
  }

  /**
   * Get payment by ID
   */
  getPaymentById(paymentId) {
    return this.payments.find((p) => p.id === paymentId);
  }

  /**
   * Get payments for student
   */
  getStudentPayments(studentId) {
    return this.payments.filter((p) => p.studentId === studentId);
  }

  /**
   * Calculate total revenue
   */
  getTotalRevenue() {
    return this.payments
      .filter((p) => p.status === "confirmed")
      .reduce((sum, p) => sum + p.amount, 0);
  }

  /**
   * Calculate instructor revenue
   */
  getInstructorRevenue(instructorId) {
    // Get all classes taught by instructor
    const instructorClasses =
      this.classManager.getClassesByInstructor(instructorId);
    const classIds = instructorClasses.map((c) => c.id);

    // Get all confirmed payments for those classes
    const revenue = this.payments
      .filter((p) => p.status === "confirmed" && classIds.includes(p.classId))
      .reduce((sum, p) => sum + p.amount, 0);

    // Assuming 70% goes to instructor, 30% to institute
    return revenue * 0.7;
  }

  /**
   * Get payment statistics
   */
  getPaymentStats() {
    const stats = {
      totalPayments: this.payments.length,
      confirmed: this.payments.filter((p) => p.status === "confirmed").length,
      pending: this.payments.filter((p) => p.status === "pending").length,
      failed: this.payments.filter((p) => p.status === "failed").length,
      totalRevenue: this.getTotalRevenue(),
      averagePayment: this.getTotalRevenue() / this.payments.length || 0,
    };

    return stats;
  }

  /**
   * Generate transaction ID
   */
  generateTransactionId() {
    return (
      "TXN" + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase()
    );
  }

  /**
   * Load payments from localStorage
   */
  loadPayments() {
    const stored = localStorage.getItem("moodPayments");
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Save payments to localStorage
   */
  savePayments() {
    localStorage.setItem("moodPayments", JSON.stringify(this.payments));
  }
}
