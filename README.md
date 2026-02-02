# 🧘 MOOD - Yoga Institute Platform

## Project Overview

MOOD is a comprehensive Yoga Institute management platform that streamlines class booking, attendance tracking, and administrative operations. The platform enables students to discover and enroll in yoga classes, instructors to manage their sessions, and administrators to oversee operations including payments and attendance records.

### Key Objectives
- Enable students to browse and enroll in yoga classes
- Track student attendance and manage enrollment records
- Calculate instructor payments based on attendance
- Provide administrators with operational dashboards and analytics
- Process payments and manage institute revenue

### Technology Stack
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: Google APIs / Firebase
- **Calendar Integration**: Google Calendar API
- **Payment Processing**: Manual payment tracking (future Stripe integration)

---

## 1. Major Functions

#### 1.1 User Authentication & Login
Secure authentication for students, instructors, and administrators to access the platform. Retrieves user data from Auth API and assigns appropriate role-based access, displaying relevant functions and dashboards for each user type.

#### 1.2 Class Catalog & Search
Browse and filter available yoga classes by date, difficulty level, and instructor. Displays essential class information including schedule, price, instructor details, and availability.

#### 1.3 Class Details
View comprehensive information about a selected class including full description, instructor biography, difficulty level, duration, price, and available spots for enrollment.

#### 1.4 Class Enrollment
Register students for classes and save enrollments to their profile. Enables students to view, manage, and track their enrolled classes in their personal dashboard.

#### 1.5 Check-in & Attendance Tracking
Records student attendance for each class session. Implements a 2-hour cancellation policy for refunds/rescheduling. Tracks attendance records and remaining class credits. Accessible to instructors and administrators.

#### 1.6 Instructor Payment Calculation
Automatically calculates instructor compensation based on actual student attendance, class pricing, and institute commission rates. Generates detailed payment reports and commission summaries.

#### 1.7 Student Payment Processing
Manages the payment workflow when students enroll in classes. Displays payment instructions for bank transfers and integrates WhatsApp contact option for payment verification. Administrators verify and confirm payments.

#### 1.8 Administrative Dashboard
Provides institute administrators with comprehensive operational metrics including total active classes, instructor count, total revenue, attendance statistics, student enrollment numbers, and enrollment periods. Includes management tools for classes and instructors.

---

## 2. Wireframes

### Login/Registration
- Simple form layout with email and password fields
- Buttons for login and account registration
- Mobile-first design with vertically stacked elements
- Registration process includes profile questions on health and personal information

### Class Catalog
- Displays all available classes with title, schedule, instructor, and price
- Single column layout on mobile devices
- Multi-column grid layout on larger devices
- Integrated filtering options for search and discovery

### Class Details
- Comprehensive class information including description and instructor biography
- Displays difficulty level, duration, price, and available spots
- Prominent enrollment button for easy registration
- Responsive design for both mobile and desktop views

### Student Dashboard
- List of enrolled classes with upcoming sessions
- Check-in functionality (to be defined by administrator)
- Payment status and transaction history display
- Mobile and desktop optimized layouts

### Admin Dashboard
- Comprehensive operational metrics and analytics
- Total classes, active students, and instructors overview
- Revenue summary and management tools
- Classes and instructors management interface
- Desktop-focused design with detailed tables and charts
- Simplified mobile version showing key metrics

---

## 3. External Data & Storage

### Data Sources
- **Authentication**: Firebase - stores User ID, email, and user role
- **Calendar Management**: Google Calendar API - manages class scheduling, instructor availability, and time management
- **Payment Data**: Manual payment tracking system (future Stripe integration)

### Stored Data
- User profiles with role assignments (student, instructor, admin)
- Class schedules and instructor assignments
- Student enrollment records and enrollment periods
- Attendance records and check-in logs
- Payment transactions: ID, amount, status, date/time
- Instructor commission calculations and payment history

---

## 4. Module List

| Module | Description |
|--------|-------------|
| **Authentication** | User login and registration, session management, role-based access |
| **User Management** | User profile management, role assignment, permissions, and user data storage |
| **Class Management** | Create, read, update, delete classes; assign instructors; manage class capacity |
| **Enrollment** | Student enrollment in classes; track enrollments per student |
| **Attendance** | Student check-in processing and attendance record tracking |
| **Payment** | Process class payments, calculate instructor and institute revenue, track payment history |
| **Dashboard** | Role-specific dashboards with analytics, summaries, and metrics |
| **Notification** | User notifications for class reminders and payment confirmations |
| **API Integration** | External API interactions and centralized fetch/error handling |
| **Layout & Navigation** | Reusable components, responsive design, navigation management |

---

## 5. Graphic Identity

### Color Scheme
Primary Palette: https://coolors.co/f2d7ee-a5668b-845a6d-1b1b1e-eddea4

| Color | Hex | Usage |
|-------|-----|-------|
| Light Purple | #F2D7EE | Backgrounds, highlights |
| Muted Purple | #A5668B | Secondary elements |
| Dark Purple | #845A6D | Text, borders |
| Almost Black | #1B1B1E | Primary text, dark background |
| Cream | #EDDEA4 | Accents, buttons |

### Typography
- To be defined based on project requirements

### Application Icon
- To be designed with spiritual yoga theme incorporating MOOD branding

---

## Project Status
- [x] Frontend setup and structure
- [ ] Authentication implementation
- [ ] Class management system
- [ ] Enrollment system
- [ ] Payment processing
- [ ] Admin dashboard
- [ ] Testing and deployment
