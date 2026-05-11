# StayHub Chapter 4 Prompt README

This file gives you a paste-ready prompt you can use in ChatGPT to generate a strong Chapter 4 write-up for the StayHub project.

## Copy This Prompt Into ChatGPT

```text
I am writing Chapter 4 of my project report for a system titled "StayHub: Smart Hostel Management System." I want you to write Chapter 4 as a formal academic implementation chapter, using the verified project details below.

Write in clear academic English.
Use past tense where appropriate.
Keep the tone natural and human, not robotic.
Do not invent features, tools, or modules that are not listed below.
If any detail is unclear, state that it was not explicitly shown in the implementation instead of guessing.

Structure the chapter with headings similar to:
4.1 Introduction
4.2 System Architecture
4.3 Backend Implementation
4.4 Frontend Implementation
4.5 Mobile Application Implementation
4.6 Integration of System Components
4.7 Security and Validation Features
4.8 Summary

Where helpful, explain:
- what each layer of the system does
- the tools and frameworks used
- how users interact with the system
- how data flows from the client applications to the backend
- how authentication, authorization, payments, notifications, and reservations were handled

Make the chapter descriptive, well-linked, and suitable for a final-year project or thesis. Do not write source code. Explain the implementation in paragraph form with a few short bullet lists only where necessary.

Use the following verified implementation facts:

PROJECT OVERVIEW
- The project is divided into three major parts: StayHub-Frontend, StayHub-Backend, and StayHub-Mobile.
- The system is a smart hostel management platform for students, administrators, and porters.
- The main business areas covered by the project are hostel management, room management, student management, reservations, payments, porter operations, and notifications.

SYSTEM ARCHITECTURE
- The system follows a client-server architecture.
- The frontend web application and the mobile application both consume the same REST API from the backend.
- The backend exposes role-based routes for authentication, admin operations, student operations, porter operations, and payments.
- MongoDB is used as the main database through Mongoose models.

BACKEND IMPLEMENTATION
- The backend was implemented with Node.js and Express.
- The main backend entry file is StayHub-Backend/src/server.js.
- The backend uses Helmet for security headers, CORS for cross-origin communication, express-rate-limit for request throttling, JSON and URL-encoded body parsing, and static file serving for uploaded files.
- Swagger documentation is exposed through /api-docs and /api-docs.json.
- The backend logs incoming requests and starts a reservation cleanup job during server startup.
- The backend route groups include:
  /api/auth
  /api/admin
  /api/student
  /api/porter
  /api/payments
- Authentication features include login, forgot password, reset password, logout, profile retrieval, profile update, password change, and profile picture upload.
- The login logic accepts either email or matric number, depending on the user category.
- JWT-based authentication is used for protected routes.
- Role-based authorization is enforced through middleware such as protect, adminOnly, studentOnly, porterOnly, and approval or first-login checks where necessary.
- The backend includes validation middleware and upload middleware.
- The backend contains models such as Admin, Student, Porter, College, Department, Hostel, Room, Bunk, Payment, PaymentConfig, and NotificationCampaign.
- The Student model includes fields for personal data, level, gender, department, assigned hostel, assigned room, assigned bunk, roommates, payment status, reservation status, notification preferences, push devices, and invitation history.
- The Room model supports room number, floor, capacity, current occupants, level, hostel, active state, and automatically derived availability information.
- The Payment model stores the student, amount, reference, payment code, payment status, payment method, date paid, and Paystack response.
- Admin routes support dashboard statistics, search, notification history, notification broadcast and test sending, college management, department management, student management, bulk student upload, hostel management, bulk hostel upload, room management, bulk room upload, porter creation and approval, payment amount configuration, payment statistics, and payment listing.
- Student routes support dashboard access, alerts, notifications, notification preference updates, push device registration, invitation history, hostel browsing, room browsing, bunk browsing, reservation creation, reservation cancellation, reservation invitations, group member handling, and payment operations.
- Porter routes support porter application, dashboard access, student list access, room list access, student check-in, and release of expired reservations.
- Payment handling was implemented with Paystack integration.
- The backend initializes payments, verifies payments, stores references and payment codes, updates student payment status after successful verification, and supports payment code verification.
- The backend also uses notification and email-related services for payment and reservation events.

FRONTEND IMPLEMENTATION
- The web frontend was implemented with Next.js, React, and TypeScript.
- It uses the App Router structure under the app directory.
- The frontend uses Tailwind CSS for styling and Radix UI-based components for reusable interface elements.
- React Hook Form and Zod were used for form handling and validation.
- Zustand was used for client-side state management.
- Axios was used for communication with the backend API.
- The main API client is in StayHub-Frontend/services/api.ts.
- The frontend API layer is separated into authAPI, adminAPI, studentAPI, porterAPI, and paymentAPI.
- Axios request interceptors attach the JWT token to outgoing requests.
- Axios response interceptors log the user out and redirect to the login page when a 401 response is returned.
- Authentication state is stored in a Zustand store and persisted for reuse.
- The main auth store keeps the user, token, authentication state, loading state, error state, and role-based redirect helpers.
- The root layout uses a theme provider and global styles.
- The landing page presents the StayHub platform, its workflow, and its user roles instead of redirecting immediately.
- The web login form accepts either email or matric number and password.
- The frontend contains separate route areas for admin, student, and porter users.
- The admin interface includes pages for dashboard, notifications, colleges, hostels, rooms, porters, payments, and reports.
- The student interface includes pages for dashboard, hostels, reservation, notifications, payment, profile, and settings.
- The porter interface includes pages for dashboard, students, check-in, rooms, reports, profile, and settings.
- The sidebar changes navigation items based on the role of the logged-in user.
- The dashboard layout includes user profile actions, theme toggling, responsive navigation, and student notification dropdown handling.
- The frontend also includes multiple reusable dialog components for creating, editing, and deleting hostels, rooms, colleges, departments, and students.

MOBILE IMPLEMENTATION
- The mobile app was implemented with React Native and Expo.
- Expo Router was used for file-based navigation.
- React Native Paper was used for UI elements and theme integration.
- Zustand and AsyncStorage were used for mobile authentication state and local persistence.
- The mobile API client is in StayHub-Mobile/services/api.ts.
- The mobile app normalizes backend responses before using them in screens.
- The root mobile layout loads saved authentication state, loads theme state, applies an auth gate, and sets up push-notification handling.
- The auth gate redirects unauthenticated users to the login screen and authenticated users to the student dashboard.
- Push notifications are handled through Expo notifications.
- The mobile app registers device tokens, stores push tokens locally, supports notification permission checks, configures Android notification channels, and routes users to the correct screen when they open a notification.
- The mobile app currently focuses mainly on the student experience.
- The mobile login screen accepts matric number and password.
- The student tab layout contains dashboard, hostels, reservation, payment, and profile tabs, with hidden routes for notifications and room details.
- The hostels screen fetches hostel data from the backend, filters available hostels by the student's gender, and supports search and refresh.
- The payment screen displays the student payment state, allows Paystack-based payment initialization, supports verification by reference, and also supports verification through a payment code.
- The mobile app uses a Paystack webview package for embedded payment flow.
- The mobile app also contains reusable components such as hostel cards, room cards, reservation cards, loading indicators, alerts cards, and empty states.

INTEGRATION OF COMPONENTS
- The frontend and mobile app both communicate with the backend over HTTP using Axios-based service layers.
- Authentication tokens are sent in the Authorization header.
- The backend returns role-aware responses that are consumed differently by admin, student, and porter interfaces.
- Profile picture upload is supported across the system.
- Payment status is synchronized between the backend and client applications after verification.
- Notification destinations are also mapped into mobile navigation routes.

SECURITY AND VALIDATION
- The backend applies security headers with Helmet.
- CORS is configured to allow cross-origin requests with credentials.
- Rate limiting is applied globally to API traffic and more strictly to authentication-sensitive routes.
- Protected routes require JWT validation.
- Role-based middleware restricts access to specific resources.
- Form validation exists in both the backend middleware and the frontend form layer.

CONCLUSION REQUIREMENT
- End the chapter with a concise summary explaining that the StayHub system was implemented as an integrated web, backend, and mobile solution for hostel administration, student reservations, payment processing, and porter support.
```

## How To Use It

1. Copy the full prompt above.
2. Paste it into ChatGPT.
3. Ask ChatGPT to make the writing fit your school format if needed.
4. If your supervisor wants shorter or longer sections, ask ChatGPT to expand or compress each subsection.

## Optional Follow-Up Prompt

```text
Now rewrite the chapter in a more natural student project style, reduce repetition, and make it sound like a real undergraduate Chapter 4. Keep the same technical facts and headings.
```
