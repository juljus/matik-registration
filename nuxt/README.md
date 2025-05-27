# Matik Key Registration System

A comprehensive user registration and RFID management system built with Nuxt 3, featuring Google OAuth authentication, admin controls, and RFID tag assignment.

## 🌟 Features

### 🔐 **Authentication System**
- **Google OAuth Integration** - Secure sign-in with Google accounts
- **JWT Token Management** - Persistent authentication sessions
- **Role-Based Access Control** - Admin and user privilege separation

### 👥 **User Management**
- **Signup Request System** - Users request access with phone numbers
- **Admin Approval Workflow** - Admins approve/reject registration requests
- **Account Status Tracking** - Complete vs incomplete account monitoring
- **User Removal** - Admin ability to remove users with cleanup

### 🏷️ **RFID Management**
- **Two-Section User Display**:
  - **Complete Accounts** ✅ - Users with assigned RFID tags
  - **Incomplete Accounts** ⚠️ - Users missing RFID tags
- **RFID Assignment** - Add/edit RFID tags for any user account
- **Duplicate Prevention** - Ensures RFID uniqueness across all users
- **Admin-Only RFID Access** - Secure RFID management interface

### 🎛️ **Admin Panel**
- **Pending Requests Management** - View and process signup requests
- **User Overview** - Complete account status dashboard
- **RFID Assignment Interface** - Modal-based RFID tag management
- **Real-Time Updates** - Live refresh of user and request data

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Google OAuth credentials

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd matik-registration/nuxt
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create a `.env` file with:
```env
MONGODB_URI=mongodb://localhost:27017/matik-registration
GOOGLE_CLIENT_ID=your_google_client_id
```

4. **Database Setup**
```bash
# Start MongoDB
brew services start mongodb-community

# The application will create collections automatically
```

5. **Setup Admin Account**
```bash
# Run setup to create your first admin
npm run dev
# Visit http://localhost:3000/api/setup-admin
```

### Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## 📋 Usage Guide

### **For Users**
1. **Sign In** - Use Google OAuth to authenticate
2. **Request Access** - Enter phone number and submit signup request
3. **Wait for Approval** - Admin will review and approve/reject request
4. **Complete Setup** - Admin will assign RFID tag to complete account

### **For Admins**
1. **Access Admin Panel** - Navigate to `/admin` after signing in
2. **Review Requests** - See pending signup requests with user details
3. **Approve/Reject Users** - Process signup requests with one-click actions
4. **Manage RFID Tags**:
   - View users in **Complete** (with RFID) vs **Incomplete** (missing RFID) sections
   - Click **"Add RFID"** for incomplete accounts
   - Click **"Edit RFID"** to update existing tags
   - Enter RFID tag ID manually or scan with RFID reader
5. **Remove Users** - Delete user accounts with automatic cleanup

## 🏗️ Architecture

### **Frontend (Nuxt 3)**
- **Vue 3 Composition API** - Modern reactive components
- **Google Sign-In Integration** - OAuth authentication flow
- **Responsive Design** - Works on desktop and mobile
- **Real-Time Updates** - Live data refresh without page reloads

### **Backend (Nitro)**
- **API Routes** - RESTful endpoints for all operations
- **MongoDB Integration** - Document-based data storage
- **JWT Authentication** - Secure token-based auth
- **Admin Authorization** - Role-based access control

### **Database Schema**

#### Collections:
- **`admins`** - Admin user accounts
- **`users`** - Approved user accounts with RFID data
- **`signupRequests`** - Pending/processed signup requests

#### Key Fields:
```typescript
// User Document
{
  email: string;
  name: string;
  phone: string;
  rfid?: string;        // RFID tag ID
  createdAt: Date;
  updatedAt?: Date;
}

// Signup Request Document
{
  email: string;
  name: string;
  phoneNumber: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Date;
}
```

## 🔧 API Endpoints

### **Authentication**
- `POST /api/auth/signup` - Submit signup request
- `GET /api/auth/verify` - Verify user authentication status

### **Admin Operations**
- `GET /api/admin/users` - Get all users and pending requests
- `POST /api/admin/users` - Approve/reject/remove users
- `POST /api/admin/rfid` - Add/update RFID tags

### **Utilities**
- `GET /api/setup-admin` - Create initial admin account
- `POST /api/register-user` - Register RFID card usage
- `GET /api/key-status` - Check key/access status

## 🔒 Security Features

- **Google OAuth** - Secure third-party authentication
- **Admin-Only Routes** - Protected admin functionality
- **RFID Uniqueness** - Prevents duplicate tag assignments
- **Input Validation** - Server-side validation for all inputs
- **Error Handling** - Comprehensive error management
- **Audit Trail** - Timestamps for all operations

## 🎨 UI/UX Features

- **Dark Theme** - Modern dark interface design
- **Status Badges** - Visual indicators for account completion
- **Color-Coded Sections** - Green for complete, yellow for incomplete
- **Modal Interfaces** - Clean popup forms for RFID management
- **Loading States** - Visual feedback during operations
- **Real-Time Counts** - Live user count displays

## 📱 Mobile Support

- **Responsive Design** - Works on all screen sizes
- **Touch-Friendly** - Mobile-optimized interactions
- **Camera Integration** - QR code scanning capability (future feature)

## 🔮 Future Enhancements

- **Web NFC Integration** - Direct RFID scanning via browser
- **QR Code Bridge** - Alternative to RFID for mobile devices
- **Bulk User Import** - CSV/Excel user import functionality
- **Advanced Analytics** - Usage statistics and reporting
- **Email Notifications** - Automated approval/rejection emails

## 🛠️ Development

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Type Checking
```bash
npm run typecheck
```

## 📄 License

This project is part of the Matik registration system.

---

**Built with ❤️ using Nuxt 3, Vue 3, and MongoDB**
