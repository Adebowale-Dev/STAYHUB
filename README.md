# StayHub: Smart Hostel Management System

## Chapter 4: Complete Implementation Documentation

A comprehensive web and mobile platform for managing student hostel accommodations, reservations, payments, and operations. Built with a robust three-tier architecture spanning backend, frontend, and mobile applications.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Mobile Implementation](#mobile-implementation)
7. [Key Features](#key-features)
8. [Database Schema](#database-schema)
9. [Authentication & Authorization](#authentication--authorization)
10. [API Documentation](#api-documentation)
11. [Setup & Installation](#setup--installation)
12. [Deployment Guide](#deployment-guide)

---

## Project Overview

**StayHub** is a complete hostel management solution designed for university accommodation systems. It streamlines the process of managing multiple hostels, rooms, student reservations, payments, and administrative operations.

### Project Goals
- Simplify hostel reservation processes for students
- Provide administrative tools for hostel managers
- Enable real-time payment processing
- Support multi-tier user roles (Admin, Porter, Student)
- Deliver seamless experience across web and mobile platforms
- Implement automated reservation cleanup and management

### Use Cases
- **Students**: Browse hostels, reserve rooms, pay fees, view reservations
- **Admins**: Manage hostels, rooms, students, departments, view analytics
- **Porters**: Check-in/out students, verify reservations
- **System**: Automated payment processing, notification delivery, reservation management

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                              │
├──────────────────────────┬──────────────────────────────────┤
│  StayHub Frontend        │    StayHub Mobile                │
│  (Next.js + React)       │    (React Native + Expo)         │
│  - Admin Dashboard       │    - Student App                 │
│  - Web Portal            │    - Push Notifications          │
│  - Responsive UI         │    - Offline Support             │
└──────────┬───────────────┴──────────────┬────────────────────┘
           │                              │
           └──────────────┬───────────────┘
                          │ (HTTP/REST API)
           ┌──────────────▼───────────────┐
           │   API Gateway / Server       │
           │   (Express.js)               │
           │   - Route Management         │
           │   - Middleware               │
           │   - Rate Limiting            │
           │   - CORS Handling            │
           └──────────────┬───────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
    ┌───▼────┐      ┌─────▼────┐    ┌──────▼──────┐
    │ Auth   │      │ Business │    │ Integration │
    │Service │      │ Logic    │    │ Services    │
    │        │      │ Layer    │    │             │
    └───┬────┘      └─────┬────┘    └──────┬──────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
           ┌──────────────▼───────────────┐
           │   Data Layer                 │
           │   - MongoDB Database         │
           │   - Collections              │
           │   - Indexes                  │
           └──────────────────────────────┘
```

### Architecture Principles
- **Separation of Concerns**: Controllers, Services, Models clearly separated
- **RESTful API Design**: Standard HTTP methods and status codes
- **Middleware Pattern**: Centralized authentication and validation
- **Database Abstraction**: Mongoose ODM for MongoDB
- **Cross-Platform**: Shared API for web and mobile clients

---

## Technology Stack

### Backend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Runtime** | Node.js | LTS | JavaScript runtime |
| **Framework** | Express.js | 4.18.2 | REST API server |
| **Database** | MongoDB | 6.21.0 | NoSQL document database |
| **ODM** | Mongoose | 8.0.0 | Data modeling & validation |
| **Authentication** | JWT | 9.0.2 | Token-based auth |
| **Password** | bcryptjs | 2.4.3 | Password hashing |
| **Security** | Helmet | 7.1.0 | Security headers |
| **Rate Limiting** | express-rate-limit | 7.1.5 | DDoS protection |
| **Email** | @getbrevo/brevo | 4.0.1 | Email service provider |
| **File Upload** | Multer | 1.4.5 | Multipart form data |
| **Validation** | express-validator | 7.0.1 | Request validation |
| **Documentation** | Swagger/OpenAPI | 6.2.8 | API documentation |
| **Dev Tools** | Nodemon | 1.0.2 | Auto-restart on changes |

### Frontend
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | Next.js | 16.2.4 | React meta-framework |
| **UI Library** | React | 19.2.0 | Component library |
| **Language** | TypeScript | Latest | Type safety |
| **Styling** | Tailwind CSS | 4 | Utility-first CSS |
| **UI Components** | Radix UI | Latest | Unstyled components |
| **Form Handling** | React Hook Form | 7.66.0 | Efficient forms |
| **Validation** | Zod | 4.1.12 | Schema validation |
| **State Management** | Zustand | 5.0.8 | Lightweight store |
| **HTTP Client** | Axios | 1.13.2 | HTTP requests |
| **Theme** | next-themes | 0.4.6 | Dark mode support |
| **Notifications** | Sonner | 2.0.7 | Toast notifications |
| **Icons** | Lucide React | 0.553.0 | Icon library |

### Mobile
| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| **Framework** | React Native | 0.81.5 | Cross-platform mobile |
| **Build** | Expo | 54.0.0 | React Native tooling |
| **Navigation** | Expo Router | 6.0.23 | File-based routing |
| **UI Library** | React Native Paper | 5.12.3 | Material Design |
| **Language** | TypeScript | 5.8.0 | Type safety |
| **State Management** | Zustand | 4.5.2 | Lightweight store |
| **HTTP Client** | Axios | 1.7.2 | HTTP requests |
| **Form Handling** | React Hook Form | 7.52.0 | Forms |
| **Notifications** | Push Notifications | Latest | Native alerts |
| **Storage** | AsyncStorage | 2.2.0 | Local persistence |
| **Navigation Tabs** | React Navigation | 7.10.1 | Bottom tabs |
| **Icons** | Expo Vector Icons | 15.0.2 | Icon sets |

---

## Backend Implementation

### Project Structure

```
StayHub-Backend/
├── src/
│   ├── server.js                 # Express app initialization
│   ├── config/
│   │   ├── db.js                # MongoDB connection
│   │   ├── env.js               # Environment variables
│   │   ├── paystackConfig.js    # Payment gateway config
│   │   └── swagger.js           # API documentation
│   ├── constants/
│   │   └── studentNotificationPreferences.js
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── adminController.js   # Admin operations
│   │   ├── studentController.js # Student operations
│   │   ├── porterController.js  # Porter operations
│   │   └── paymentController.js # Payment handling
│   ├── middlewares/
│   │   ├── authMiddleware.js    # JWT verification
│   │   └── reservationStateMiddleware.js
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Hostel.js            # Hostel schema
│   │   ├── Room.js              # Room schema
│   │   └── Reservation.js       # Reservation schema
│   ├── routes/
│   │   ├── authRoutes.js        # Auth endpoints
│   │   ├── adminRoutes.js       # Admin endpoints
│   │   ├── studentRoutes.js     # Student endpoints
│   │   ├── porterRoutes.js      # Porter endpoints
│   │   └── paymentRoutes.js     # Payment endpoints
│   ├── services/
│   │   ├── reservationCleanupService.js
│   │   ├── emailService.js
│   │   └── paymentService.js
│   └── utils/
│       ├── fileUpload.js        # File handling
│       └── validators.js        # Input validation
├── seed.js                       # Database seeding
├── package.json                  # Dependencies
└── .env                         # Environment config
```

### Key Backend Features

#### 1. **Authentication & Authorization**
```javascript
// JWT-based authentication with role-based access control
// Routes protected with authMiddleware verifying JWT tokens
// Passwords hashed with bcryptjs (salt rounds: 10)
// Token expiration: 7 days (configurable)
```

#### 2. **Database Connection**
- MongoDB Atlas support for cloud hosting
- Connection pooling (maxPoolSize: 10)
- Fallback URI support for redundancy
- Environment-based configuration

#### 3. **API Security**
- Helmet.js for security headers
- CORS configuration for cross-origin requests
- Rate limiting to prevent abuse
- Input validation with express-validator
- SQL injection prevention via Mongoose ODM

#### 4. **Request/Response Logging**
```javascript
// Structured logging of all incoming requests
// Body logging with size limit (>500 bytes truncated)
// Timestamp tracking for debugging
```

#### 5. **Error Handling**
- Centralized error middleware
- Consistent error response format
- HTTP status code mapping
- Validation error aggregation

#### 6. **File Upload Handling**
```javascript
// Multer configuration for CSV and image uploads
// File size limits
// MIME type validation
// Secure file storage
```

### Controllers Overview

#### **AuthController**
Handles user registration, login, password reset, and token refresh.
- `register()`: Create new user account
- `login()`: Authenticate and return JWT
- `logout()`: Clear authentication
- `resetPassword()`: Change user password

#### **AdminController**
Manages hostels, rooms, departments, and analytics.
- `createHostel()`: Add new hostel
- `editHostel()`: Update hostel details
- `deleteHostel()`: Remove hostel
- `manageRooms()`: CRUD operations on rooms
- `viewAnalytics()`: Generate reports

#### **StudentController**
Student-specific operations and preferences.
- `getAvailableRooms()`: Browse accommodations
- `searchHostels()`: Filter hostels
- `updatePreferences()`: Set notification settings
- `viewReservationHistory()`: Past and current bookings

#### **PaymentController**
Payment processing and transaction management.
- `initializePayment()`: Start payment process
- `verifyPayment()`: Confirm transaction
- `generateReceipt()`: Create proof of payment

#### **PorterController**
Check-in/out operations for students.
- `checkInStudent()`: Mark arrival
- `checkOutStudent()`: Mark departure
- `viewReservationDetails()`: Get booking info

### Services Layer

#### **ReservationCleanupService**
```javascript
// Automatic cleanup job running on schedule
// Cancels unpaid reservations after grace period
// Frees up reserved rooms for other students
// Sends email notifications to affected users
```

#### **EmailService**
```javascript
// Brevo (formerly Sendinblue) integration
// Transactional emails:
//   - Reservation confirmations
//   - Payment receipts
//   - Password reset links
//   - Check-in/out notifications
```

#### **PaymentService**
```javascript
// Paystack integration for payment processing
// Payment initiation and verification
// Transaction logging
// Refund handling
```

---

## Frontend Implementation

### Project Structure

```
StayHub-Frontend/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── admin/                  # Admin dashboard
│   │   ├── page.tsx
│   │   ├── hostels/
│   │   ├── students/
│   │   └── rooms/
│   ├── login/                  # Authentication
│   ├── forgot-password/
│   └── student/                # Student dashboard
├── components/
│   ├── AddHostelDialog.tsx     # Dialog components
│   ├── AddRoomDialog.tsx
│   ├── AddStudentDialog.tsx
│   ├── EditHostelDialog.tsx
│   ├── EditRoomDialog.tsx
│   ├── EditStudentDialog.tsx
│   ├── app-sidebar.tsx         # Navigation
│   ├── auth/                   # Auth components
│   ├── colleges/               # College management
│   ├── layout/                 # Layout components
│   └── ui/                     # Base UI components
├── hooks/
│   └── useAuthCheck.ts         # Auth verification
├── lib/
│   ├── auth-cookies.ts         # Cookie management
│   ├── media.ts               # Media utilities
│   └── utils.ts               # Helper functions
├── services/
│   └── api.ts                 # API client
├── store/
│   ├── useAdminStore.ts       # Admin state
│   ├── useAuthStore.ts        # Auth state
│   └── useCollegeStore.ts     # College state
├── package.json
└── tsconfig.json
```

### Key Frontend Features

#### 1. **Authentication System**
- JWT token storage in secure cookies
- `useAuthCheck()` hook for route protection
- Automatic logout on token expiration
- Login/Register forms with validation

#### 2. **State Management with Zustand**
```typescript
// Admin Store
useAdminStore: {
  hostels, rooms, students,
  addHostel(), editHostel(), deleteHostel()
}

// Auth Store
useAuthStore: {
  user, token, isAuthenticated,
  login(), logout(), register()
}

// College Store
useCollegeStore: {
  colleges, departments,
  addCollege(), editCollege()
}
```

#### 3. **UI Components Library**
- Radix UI base components (accessible, unstyled)
- Tailwind CSS styling for rapid development
- Dark mode support via next-themes
- Custom dialog components for CRUD operations

#### 4. **Form Handling**
```typescript
// React Hook Form + Zod validation
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});

// Automatic validation and error display
// Efficient field-level rendering
```

#### 5. **API Integration**
```typescript
// Axios instance with interceptors
// Automatic token injection in headers
// Request/response transformation
// Error handling with user feedback
```

#### 6. **Dashboard Features**
- **Admin Dashboard**:
  - Hostel management (CRUD)
  - Room allocation and pricing
  - Student enrollment management
  - Department and college setup
  - Occupancy analytics

- **Student Dashboard** (if implemented):
  - Browse available hostels
  - View room details and prices
  - Make reservations
  - Payment status tracking
  - Reservation history

#### 7. **Responsive Design**
- Mobile-first approach
- Sidebar navigation with collapse
- Responsive grid layouts
- Touch-friendly UI elements

---

## Mobile Implementation

### Project Structure

```
StayHub-Mobile/
├── app/
│   ├── _layout.tsx             # Root layout with theme
│   ├── index.tsx               # App entry
│   ├── (auth)/                 # Auth screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   └── (student)/              # Student screens
│       ├── _layout.tsx
│       ├── dashboard.tsx
│       ├── hostels.tsx
│       ├── reservations.tsx
│       ├── profile.tsx
│       └── [details].tsx
├── components/
│   ├── AlertsCard.tsx          # Reusable cards
│   ├── EmptyState.tsx
│   ├── HostelCard.tsx
│   ├── LoadingSpinner.tsx
│   ├── ReservationCard.tsx
│   ├── RoomCard.tsx
│   └── ui/                     # Base components
├── constants/
│   └── config.ts               # App configuration
├── hooks/
│   └── useAsync.ts             # Async data fetching
├── services/
│   ├── api.ts                  # API client
│   └── pushNotifications.ts    # FCM integration
├── store/
│   ├── authStore.ts            # Auth state
│   └── themeStore.ts           # Theme state
├── types/
│   └── index.ts                # TypeScript types
├── utils/
│   └── notificationRoutes.ts   # Navigation helpers
├── app.config.js               # Expo config
├── eas.json                    # EAS Build config
├── babel.config.js             # Babel configuration
├── tsconfig.json               # TypeScript config
└── package.json
```

### Key Mobile Features

#### 1. **Navigation Structure**
```typescript
// File-based routing with Expo Router
(auth)/ - Authentication screens (login, register, forgot password)
(student)/ - Protected student screens (dashboard, hostels, reservations)
```

#### 2. **Authentication Flow**
```
Launch App
    ↓
Check Auth Store for token
    ↓
No Token? → Show Auth Screens
    ↓
Valid Token? → Show Student Dashboard
    ↓
Login → Set Token → Redirect to Dashboard
```

#### 3. **State Management**
```typescript
// Auth Store (Zustand)
- user: User info
- token: JWT token
- isAuthenticated: Boolean flag
- login(credentials): Authenticate
- logout(): Clear session
- checkAuth(): Verify token

// Theme Store
- isDarkMode: Boolean
- toggleTheme(): Switch theme
```

#### 4. **Push Notifications**
```typescript
// FCM integration via Expo
- registerForPushNotificationsAsync()
- configureForegroundNotifications()
- addNotificationResponseListener()
- toMobileNotificationRoute(): Handle deep linking

Use Cases:
- Reservation confirmations
- Payment reminders
- Check-in/out notifications
- Admin announcements
```

#### 5. **Data Fetching Hook**
```typescript
// useAsync hook for API calls
const { data, loading, error } = useAsync(
  () => api.getHostels(),
  []
);

// Automatic loading state management
// Error boundary support
```

#### 6. **UI Components**
- **HostelCard**: Display hostel info with image
- **RoomCard**: Room details and availability
- **ReservationCard**: Booking status and actions
- **AlertsCard**: Important notifications
- **EmptyState**: Placeholder when no data
- **LoadingSpinner**: Loading indicator

#### 7. **Android Build Configuration**
```javascript
// Expo Android integration
- Gradle configuration
- Build variant management
- Development APK generation
```

---

## Key Features

### 1. **Multi-Role Access Control**
| Role | Capabilities | Platform |
|------|-------------|----------|
| **Admin** | Manage hostels, rooms, students, view analytics | Web |
| **Student** | Browse hostels, make reservations, pay fees, track bookings | Web + Mobile |
| **Porter** | Check-in/out students, verify reservations | Web + Mobile |

### 2. **Hostel Management**
- Create and manage multiple hostels
- Set hostel location, contact, capacity
- Upload hostel images and documents
- Track occupancy rates
- Bulk room creation via CSV

### 3. **Room Management**
- Categorize rooms by type (single, double, ensuite)
- Set room pricing dynamically
- Track room status (available, reserved, occupied)
- Manage room amenities and features

### 4. **Reservation System**
- Browse and filter available hostels
- Make reservations with selected date range
- Automatic reservation state management
- Cancel reservations with refund processing
- Reservation history tracking

### 5. **Payment Processing**
- Paystack integration for secure payments
- Multiple payment methods (card, bank transfer)
- Automatic receipt generation
- Transaction logging and history
- Payment status tracking

### 6. **Student Check-in/out**
- Porter confirmation workflow
- Digital check-in process
- Room assignment verification
- Move-out documentation
- Stay duration tracking

### 7. **Email Notifications**
- Reservation confirmations
- Payment receipts and reminders
- Password reset emails
- Check-in/check-out confirmations
- Admin alerts

### 8. **Push Notifications (Mobile)**
- Real-time reservation updates
- Payment confirmations
- Check-in reminders
- Administrative announcements
- Deep linking support

### 9. **Data Import/Export**
- CSV upload for bulk student enrollment
- CSV upload for hostel data
- CSV upload for room configuration
- Report generation and export

### 10. **Analytics & Reporting**
- Occupancy dashboard
- Revenue tracking
- Student enrollment metrics
- Reservation trends
- Payment statistics

---

## Database Schema

### Core Collections

#### **Users**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: Enum['admin', 'student', 'porter'],
  college: ObjectId (ref: College),
  department: ObjectId (ref: Department),
  profileImage: String (URL),
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Hostels**
```javascript
{
  _id: ObjectId,
  name: String,
  location: String,
  address: String,
  contact: String,
  capacity: Number,
  gender: Enum['male', 'female', 'mixed'],
  image: String (URL),
  college: ObjectId (ref: College),
  amenities: [String],
  manager: ObjectId (ref: User),
  isActive: Boolean,
  totalRooms: Number,
  occupiedRooms: Number,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Rooms**
```javascript
{
  _id: ObjectId,
  roomNumber: String,
  hostel: ObjectId (ref: Hostel),
  type: Enum['single', 'double', 'ensuite', 'triple'],
  price: Number,
  capacity: Number,
  occupants: Number,
  status: Enum['available', 'reserved', 'occupied', 'maintenance'],
  amenities: [String],
  images: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Reservations**
```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  room: ObjectId (ref: Room),
  hostel: ObjectId (ref: Hostel),
  checkInDate: Date,
  checkOutDate: Date,
  status: Enum['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
  paymentStatus: Enum['pending', 'paid', 'refunded'],
  totalAmount: Number,
  paymentTransactionId: String,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### **Colleges**
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  location: String,
  contact: String,
  departments: [ObjectId] (ref: Department),
  createdAt: Date,
  updatedAt: Date
}
```

#### **Departments**
```javascript
{
  _id: ObjectId,
  name: String,
  code: String,
  college: ObjectId (ref: College),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication & Authorization

### JWT Implementation

```javascript
// Token Structure
{
  header: { alg: 'HS256', typ: 'JWT' },
  payload: {
    userId: String,
    email: String,
    role: String,
    iat: Number (issued at),
    exp: Number (expires at - 7 days)
  },
  signature: HMAC(header + payload, secret)
}
```

### Authentication Flow

```
1. User Registration
   - Validate email and password strength
   - Hash password with bcryptjs
   - Create user document
   - Return success message

2. User Login
   - Find user by email
   - Compare hashed password with input
   - Generate JWT token (7-day expiration)
   - Return token and user info
   - Store token in secure cookie (web) or AsyncStorage (mobile)

3. Protected Routes
   - Extract JWT from Authorization header
   - Verify signature and expiration
   - Extract user info from payload
   - Attach user to request object
   - Allow or deny based on role

4. Token Refresh
   - Check token expiration
   - If expired, request new token with refresh endpoint
   - Update stored token
   - Retry original request

5. Logout
   - Clear token from storage
   - Clear cookies (web)
   - Clear AsyncStorage (mobile)
   - Redirect to login page
```

### Role-Based Access Control

```javascript
// Middleware pattern
authMiddleware(req, res, next) {
  // Verify JWT exists and is valid
  // Attach user to request
  // Proceed to next middleware
}

requireRole(['admin', 'porter'])(req, res, next) {
  // Check if user.role is in allowed roles
  // Return 403 if not authorized
  // Proceed if authorized
}

// Usage
router.delete('/hostels/:id', 
  authMiddleware, 
  requireRole(['admin']),
  adminController.deleteHostel
)
```

---

## API Documentation

### Base URL
```
Production: https://api.stayhub.com/api
Development: http://localhost:5000/api
```

### Authentication
```
Header: Authorization: Bearer {JWT_TOKEN}
```

### Common Response Format
```javascript
// Success Response
{
  success: true,
  message: "Operation successful",
  data: { /* response data */ }
}

// Error Response
{
  success: false,
  message: "Error description",
  errors: [{ field: "fieldName", message: "error" }]
}
```

### Key Endpoints

#### **Authentication**
```
POST   /auth/register          - Create new account
POST   /auth/login             - Authenticate user
POST   /auth/logout            - Clear session
POST   /auth/forgot-password   - Request password reset
POST   /auth/reset-password    - Reset with token
```

#### **Admin Operations**
```
GET    /admin/hostels                    - List all hostels
POST   /admin/hostels                    - Create hostel
PUT    /admin/hostels/:id               - Update hostel
DELETE /admin/hostels/:id               - Delete hostel

GET    /admin/hostels/:id/rooms         - List hostel rooms
POST   /admin/hostels/:id/rooms         - Add room
PUT    /admin/hostels/:id/rooms/:roomId - Update room
DELETE /admin/hostels/:id/rooms/:roomId - Delete room

GET    /admin/students                   - List students
POST   /admin/students                   - Enroll student
PUT    /admin/students/:id              - Update student
DELETE /admin/students/:id              - Remove student

POST   /admin/bulk-upload               - CSV import
GET    /admin/analytics                 - View reports
```

#### **Student Operations**
```
GET    /student/hostels           - Browse hostels
GET    /student/hostels/:id       - Hostel details
GET    /student/rooms/:id         - Room details
GET    /student/reservations      - My reservations
POST   /student/reservations      - Make reservation
PUT    /student/reservations/:id  - Update reservation
DELETE /student/reservations/:id  - Cancel reservation
GET    /student/profile           - User profile
PUT    /student/profile           - Update profile
```

#### **Payment**
```
POST   /payment/initialize        - Start payment
POST   /payment/verify            - Verify transaction
GET    /payment/receipts/:id      - Get receipt
```

#### **Porter Operations**
```
POST   /porter/check-in/:reservationId  - Check-in student
POST   /porter/check-out/:reservationId - Check-out student
GET    /porter/reservations             - View reservations
```

---

## Setup & Installation

### Prerequisites
- Node.js 18+ LTS
- npm or pnpm
- MongoDB (Atlas or local)
- Git

### Backend Setup

#### 1. Clone Repository
```bash
cd StayHub
cd StayHub-Backend
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
```bash
# Create .env file
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/stayhub
MONGODB_URI_DIRECT=mongodb+srv://user:password@cluster.mongodb.net/stayhub?directConnection=true
JWT_SECRET=your_jwt_secret_key_min_32_chars
JWT_EXPIRE=7d
NODE_ENV=development
PORT=5000

# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=noreply@stayhub.com

# Payment (Paystack)
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_SECRET_KEY=your_paystack_secret_key

# Frontend
FRONTEND_URL=http://localhost:3000
MOBILE_APP_URL=exp://your-expo-url

# Admin Setup
INITIAL_ADMIN_EMAIL=admin@stayhub.com
INITIAL_ADMIN_PASSWORD=secure_password_here
```

#### 4. Database Setup
```bash
# Run seed script to create initial data
npm run seed
```

#### 5. Start Development Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Frontend Setup

#### 1. Navigate to Frontend Directory
```bash
cd ../StayHub-Frontend
```

#### 2. Install Dependencies
```bash
pnpm install
# or npm install
```

#### 3. Environment Configuration
```bash
# Create .env.local file
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=StayHub
```

#### 4. Start Development Server
```bash
pnpm dev
```

Frontend runs on `http://localhost:3000`

### Mobile Setup

#### 1. Navigate to Mobile Directory
```bash
cd ../StayHub-Mobile
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Environment Configuration
```bash
# Create .env file or update constants/config.ts
API_URL=http://10.0.2.2:5000/api  # Android emulator
# API_URL=http://localhost:5000/api  # Physical device on same network
```

#### 4. Start Expo Development Server
```bash
npm start

# For Android
npm run android

# For iOS
npm run ios

# For Web
npm run web
```

---

## Deployment Guide

### Backend Deployment (Heroku/Railway)

#### 1. Prepare for Production
```bash
# Update .env for production
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

#### 2. Deploy to Heroku
```bash
# Install Heroku CLI
heroku login
heroku create stayhub-backend

# Add environment variables
heroku config:set MONGODB_URI=your_production_uri
heroku config:set JWT_SECRET=your_production_secret
heroku config:set PAYSTACK_SECRET_KEY=your_production_key

# Deploy
git push heroku main
```

#### 3. Verify Deployment
```bash
heroku logs --tail
curl https://stayhub-backend.herokuapp.com/api/health
```

### Frontend Deployment (Vercel)

#### 1. Connect Repository
```bash
# Push to GitHub
git push origin main
```

#### 2. Deploy via Vercel Dashboard
- Connect GitHub repository
- Select `StayHub-Frontend` as root
- Add environment variables
- Deploy

#### 3. Configure Domain
- Add custom domain in Vercel settings
- Configure DNS records

### Mobile Deployment

#### 1. Build Android APK
```bash
npm run bundle:android
eas build --platform android
```

#### 2. Build iOS App
```bash
eas build --platform ios
```

#### 3. Submit to App Stores
- Google Play Store
- Apple App Store

---

## Monitoring & Maintenance

### Logging
- Server logs: `console.log()` output
- Database logs: MongoDB Atlas dashboard
- Error tracking: Implement Sentry/LogRocket

### Performance Optimization
- Database indexing on frequently queried fields
- API response caching
- Image optimization and CDN
- Frontend code splitting and lazy loading

### Security Checklist
- [ ] Rotate JWT secret regularly
- [ ] Update dependencies monthly
- [ ] Enable rate limiting in production
- [ ] Use HTTPS everywhere
- [ ] Implement CORS correctly
- [ ] Validate all user inputs
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Monitor for suspicious activities

### Backup Strategy
- Daily MongoDB backups
- Database point-in-time recovery
- File storage backups (uploads directory)
- Code repository backups (GitHub)

---

## Troubleshooting

### Common Issues

**1. MongoDB Connection Error**
```
Error: ENOTFOUND/querysrv
Solution: Check MongoDB URI, whitelist IP, verify network connectivity
```

**2. CORS Error**
```
Error: Cross-Origin Request Blocked
Solution: Verify CORS configuration, check frontend URL in backend .env
```

**3. JWT Token Invalid**
```
Error: Token expired/invalid
Solution: Refresh token, re-login, check JWT_SECRET matches
```

**4. File Upload Fails**
```
Error: EACCES permission denied
Solution: Check upload directory permissions, verify Multer config
```

---

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -m 'Add feature description'`
3. Push branch: `git push origin feature/feature-name`
4. Open pull request for review

---

## License

ISC License - 2024 StayHub

---

## Project Team

- **Backend Developer**: Node.js/Express API development
- **Frontend Developer**: Next.js/React web interface
- **Mobile Developer**: React Native/Expo mobile app
- **Database Administrator**: MongoDB management

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev)
- [Expo Documentation](https://docs.expo.dev)
- [Paystack Documentation](https://paystack.com/docs)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

---

## Support

For issues and questions:
- GitHub Issues: [STAYHUB Issues](https://github.com/Adebowale-Dev/STAYHUB/issues)
- Email: support@stayhub.com
- Documentation: [Wiki](https://github.com/Adebowale-Dev/STAYHUB/wiki)

---

**Last Updated**: May 7, 2026
**Version**: 1.0.0
**Status**: Production Ready
