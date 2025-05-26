# Matik Key Registration System

## Overview
A comprehensive system for managing the rental and return of a single physical key using RFID chips. The system features a complete web interface with Google authentication, admin approval workflow, and real-time key status tracking. Multiple users (students/admins) each have their own RFID card, but there is only one key being tracked.

## 🏗️ Architecture
- **Frontend:** Nuxt 3 web app with Vue 3 + TypeScript
- **Backend:** Nuxt server API routes with MongoDB integration
- **Database:** MongoDB for user management and key event tracking
- **Hardware:** ESP microcontroller with RFID reader (planned)
- **Authentication:** Google OAuth with two-tier approval system

## ✨ Key Features

### 🔐 Authentication & Authorization
- **Google Sign-In:** Secure OAuth authentication
- **Two-tier system:** 
  - Level 1: Anyone can sign in with Google
  - Level 2: Admin approval required for system access
- **Role-based access:** Admin vs Student permissions
- **Persistent sessions:** Auto-restore login state on page refresh

### 🏠 Home Page (Key Status)
- **Real-time status:** Shows if key is taken or available
- **Holder information:** Displays who currently has the key
- **Last updated timestamp:** Track when status was last changed
- **Authentication guards:** Status only visible to approved users

### 👨‍💼 Admin Panel
- **Signup request management:** View pending user requests
- **Approve/reject users:** Simple one-click approval process
- **Admin-only access:** Restricted to users in admins table
- **Real-time updates:** Automatically refreshes after actions

### 🔄 User Flow
1. User signs in with Google → Gets JWT with email/name
2. System checks if user is approved or admin
3. If not approved → Shows "Request Access" button
4. Admin sees pending requests in admin panel
5. Admin approves → User gains access to key system

## 🛠️ Tech Stack
- **Frontend:** Nuxt 3, Vue 3, TypeScript, CSS3
- **Backend:** Nuxt server routes, Node.js
- **Database:** MongoDB with collections for users, admins, events, requests
- **Authentication:** Google OAuth 2.0, JWT tokens
- **Styling:** Custom CSS with dark theme
- **Dev Tools:** Vite, ESLint, TypeScript compiler

## 📊 Data Model

### Collections
```typescript
// users - Approved users
{
  email: string,
  name: string,
  phone?: string,
  rfid?: string,
  createdAt: Date
}

// admins - Admin email addresses
{
  email: string,
  createdAt: Date
}

// signupRequests - Pending approvals
{
  email: string,
  name: string,
  picture: string,
  requestedAt: Date,
  status: 'pending' | 'approved' | 'rejected'
}

// keyEvents - RFID key tracking
{
  timestamp: Date,
  rfid: string,
  eventType: 'take' | 'return'
}
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/verify` - Check user registration and admin status
- `POST /api/auth/signup` - Create signup request for approval

### Admin Management
- `GET /api/admin/users` - List pending signup requests (admin only)
- `POST /api/admin/users` - Approve/reject user requests (admin only)

### Key System
- `GET /api/key-status` - Get current key status (authenticated users only)
- `POST /api/log-key-event` - Log RFID events (ESP device)
- `POST /api/register-user` - Register new RFID cards (admin only)

### Utilities
- `POST /api/setup-admin` - Add admin emails to database

## 🏃‍♂️ Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance
- Google OAuth credentials

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd matik-registration/nuxt
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create `.env` file in `/nuxt` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/matik
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   ```

4. **Setup Google OAuth**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins: `http://localhost:3000`

5. **Initialize Admin User**
   ```bash
   npm run dev
   # Then visit: http://localhost:3000/api/setup-admin (POST request)
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📱 Usage

### For Users
1. Visit the web app
2. Click "Sign in with Google"
3. If not approved, click "Request Access"
4. Wait for admin approval
5. Once approved, view key status on home page

### For Admins
1. Sign in with admin Google account
2. Navigate to Admin panel
3. Review pending signup requests
4. Approve or reject users as needed

## 🔧 File Structure
```
nuxt/
├── composables/
│   └── useAuth.ts              # Shared authentication state
├── layouts/
│   └── default.vue             # Main layout with navigation
├── pages/
│   ├── index.vue               # Home page with key status
│   └── admin/
│       └── index.vue           # Admin panel for user management
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── signup.ts       # User signup requests
│   │   │   └── verify.ts       # Authentication verification
│   │   ├── admin/
│   │   │   └── users.ts        # Admin user management
│   │   ├── key-status.ts       # Key status endpoint
│   │   ├── register-user.ts    # RFID registration
│   │   └── setup-admin.ts      # Admin setup utility
│   └── utils/
│       └── mongo.ts            # MongoDB connection
└── nuxt.config.ts              # Nuxt configuration
```

## 🎨 UI/UX Features
- **Dark theme:** Modern dark color scheme
- **Responsive design:** Works on desktop and mobile
- **Real-time updates:** Auto-refresh when auth state changes
- **Loading states:** Clear feedback during API calls
- **Error handling:** User-friendly error messages
- **Navigation:** Clean navigation with role-based links

## 🔮 Future Improvements
- **ESP32 Integration:** Physical RFID reader implementation
- **SMS Notifications:** Alert when key is taken/overdue
- **Usage Analytics:** Track key usage patterns and history
- **Overdue Handling:** Automated reminders for long-term holders
- **Bulk User Management:** Import/export user lists
- **Activity Logs:** Detailed audit trail of all system actions
- **Mobile App:** Native mobile application
- **Reservation System:** Allow users to reserve key in advance

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 Notes
- **Admin Access:** Users in the `admins` collection automatically have full access
- **Security:** All API endpoints require authentication via Bearer tokens
- **Database:** MongoDB collections are created automatically on first use
- **Development:** Use `npm run dev` for hot-reload development server
