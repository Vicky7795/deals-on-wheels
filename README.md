# DEALS ON WHEELS — FULL-STACK VEHICLE MARKETPLACE APPLICATION

**Deals on Wheels** is a production-ready, full-stack online vehicle marketplace application built with **Node.js, Express, MongoDB (Mongoose)** for the backend and **React, Vite, Tailwind CSS** for the frontend.

The platform enables users to register as either a **Buyer** or a **Seller** to buy and sell vehicles with direct communication, atomic purchase guarantees, real-time inventory management, and role-based access control.

---

## 🚀 KEY FEATURES

### 1. Public Website & Browsing
- **Hero & Search**: Search vehicles by title, brand, model, vehicle type, and city location.
- **Marketplace Browse**: Multi-parameter backend filtering (vehicle type, brand, min/max price, fuel type, transmission, year, condition, city), sorting (price low/high, newest), and pagination.
- **Vehicle Details Page**: High-resolution image gallery, full specifications sheet, seller information card, and action CTAs.

### 2. Role-Based Access Control (RBAC)
- **Strict Two Roles**: **Buyer** and **Seller** only (No Admin / Officer clutter).
- Dedicated dashboards and protected navigation for each user role.
- Backend middleware (`authenticateUser`, `requireBuyer`, `requireSeller`) independently enforcing security rules on all APIs.

### 3. Seller Features & Inventory Management
- **Multi-section Listing Form**: Easily publish vehicles with basic info, technical specs, pricing, location, description, and multi-image uploads or image URLs.
- **My Vehicles Dashboard**: View all published listings, edit existing details, mark vehicles as sold, or delete listings with a safety confirmation modal.
- **Customer Inquiries**: Review buyer inquiry messages and reply directly with custom responses.
- **Sales Orders & Analytics**: Track overall sales revenue (₹), active listings count, sold vehicles, and recent buyer orders.

### 4. Buyer Features & Purchasing
- **Favorites System**: Save/bookmark vehicles for quick reference and track availability status.
- **Direct Seller Inquiries**: Send messages to vehicle owners directly from listing pages.
- **Atomic Purchase Flow**: Order confirmation process backed by MongoDB `findOneAndUpdate` concurrency checks preventing double purchases.
- **My Orders**: View purchase receipts, seller contact details, and order timestamps.

### 5. Account & Security
- **JWT Authentication**: Password hashing using `bcryptjs` and stateless JWT authorization.
- **Security Middlewares**: `helmet` headers, `cors` domain restriction, `morgan` request logging, and `express-rate-limit` DDoS protection.
- **Profile & Security Settings**: Update full name, phone number, city, state, profile image, and change password with current password verification.

---

## 🛠️ TECHNOLOGY STACK

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Icons**: Lucide React
- **Routing**: React Router DOM (v6)
- **HTTP Client**: Axios (Centralized instance with JWT Bearer interceptor)
- **Form Management**: React Hook Form / Controlled State

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB & Mongoose ORM
- **Authentication**: JWT (`jsonwebtoken`) & `bcryptjs`
- **File Upload**: Multer (Local disk storage fallback for uploads)
- **Security & Logging**: Helmet, CORS, Morgan, Express Rate Limit

---

## 📁 PROJECT STRUCTURE

```
deals-on-wheels/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── vehicleController.js
│   │   ├── favoriteController.js
│   │   ├── inquiryController.js
│   │   ├── orderController.js
│   │   ├── notificationController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js (authenticateUser, requireBuyer, requireSeller)
│   │   ├── error.js (Centralized JSON error handler)
│   │   └── upload.js (Multer disk storage)
│   ├── models/
│   │   ├── User.js
│   │   ├── Vehicle.js
│   │   ├── Favorite.js
│   │   ├── Inquiry.js
│   │   ├── Order.js
│   │   └── Notification.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── vehicleRoutes.js
│   │   ├── favoriteRoutes.js
│   │   ├── inquiryRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── userRoutes.js
│   ├── utils/
│   │   └── seed.js (Database seed script)
│   ├── .env
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/ (Badge, Button, LoadingSpinner, ErrorMessage, EmptyState, Modal, ConfirmDialog, Pagination)
    │   │   ├── vehicle/ (VehicleCard, VehicleGrid, SearchBar, FilterSidebar, ImageGallery)
    │   │   ├── layout/ (DashboardSidebar, ProtectedRoute, RoleRoute)
    │   │   ├── notification/ (NotificationDropdown)
    │   │   ├── Navbar.jsx
    │   │   └── Footer.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── pages/
    │   │   ├── public/ (Home, Browse, VehicleDetails, Login, Register, About)
    │   │   ├── buyer/ (BuyerDashboard, BuyerFavorites, BuyerInquiries, ConfirmPurchase, BuyerOrders, BuyerNotifications, BuyerProfile)
    │   │   └── seller/ (SellerDashboard, SellerVehicles, AddVehicle, EditVehicle, SellerInquiries, SellerOrders, SellerNotifications, SellerProfile)
    │   ├── routes/
    │   │   └── AppRoutes.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── package.json
```

---

## ⚡ INSTALLATION & SETUP

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create environment file (.env)
cp .env.example .env

# Seed sample database (Sellers, Buyers, Vehicle Listings)
npm run seed

# Start backend server
npm start
```

Backend will run on **http://localhost:5000**.

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Frontend will run on **http://localhost:5173**.

---

## 🔑 DEMO LOGIN CREDENTIALS

The database seed script initializes ready-to-use demo accounts with sample listings. All accounts use password: `Password123`.

| Role | Email | Phone | Location | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Seller** | `seller1@example.com` | `9876543210` | Mumbai, MH | Listed Creta, Nexon EV, Meteor 350 |
| **Seller** | `seller2@example.com` | `9876543211` | Bengaluru, KA | Listed Thar 4WD, Honda City, Tata Ace |
| **Buyer** | `buyer1@example.com` | `9876543212` | Delhi, DL | Active test buyer account |
| **Buyer** | `buyer2@example.com` | `9876543213` | Chennai, TN | Active test buyer account |

---

## 📡 API ENDPOINTS SUMMARY

### Authentication
- `POST /api/auth/register` — Register Buyer or Seller
- `POST /api/auth/login` — Login user & issue JWT
- `GET /api/auth/me` — Get authenticated user details

### Vehicles
- `GET /api/vehicles` — Browse vehicles with search, filters & pagination
- `GET /api/vehicles/:id` — Get single vehicle details & seller profile
- `GET /api/vehicles/seller/my-listings` — List seller's owned vehicles
- `GET /api/vehicles/seller/stats` — Seller dashboard analytics
- `POST /api/vehicles` — Create new vehicle listing (Seller only)
- `PUT /api/vehicles/:id` — Edit vehicle listing (Seller only)
- `DELETE /api/vehicles/:id` — Delete vehicle listing (Seller only)
- `PATCH /api/vehicles/:id/sold` — Mark vehicle as sold (Seller only)

### Favorites
- `GET /api/favorites` — Get buyer's saved vehicles (Buyer only)
- `POST /api/favorites/:vehicleId` — Add vehicle to favorites (Buyer only)
- `DELETE /api/favorites/:vehicleId` — Remove vehicle from favorites (Buyer only)

### Inquiries
- `POST /api/inquiries` — Send message to vehicle seller (Buyer only)
- `GET /api/inquiries/buyer` — Get buyer's sent inquiries (Buyer only)
- `GET /api/inquiries/seller` — Get inquiries for seller's vehicles (Seller only)
- `POST /api/inquiries/:id/respond` — Reply to buyer inquiry (Seller only)
- `PATCH /api/inquiries/:id/close` — Close inquiry

### Orders & Purchases
- `POST /api/orders` — Purchase vehicle atomically (Buyer only)
- `GET /api/orders/buyer` — Get buyer's order receipts (Buyer only)
- `GET /api/orders/seller` — Get seller's sales orders (Seller only)
- `GET /api/orders/:id` — Get order details by ID

### Notifications & User Profile
- `GET /api/notifications` — Get user notifications & unread count
- `PATCH /api/notifications/:id/read` — Mark notification read
- `PATCH /api/notifications/read-all` — Mark all notifications read
- `GET /api/users/profile` — Get user profile
- `PUT /api/users/profile` — Update name, phone, city, state
- `PUT /api/users/change-password` — Change password with current verification

---

## 🛡️ CONCURRENCY & DUPLICATE PURCHASE PROTECTION

When a buyer completes payment verification for a vehicle, the backend executes an atomic database operation:
```js
const vehicle = await Vehicle.findOneAndUpdate(
  { _id: payment.vehicleId, status: 'available' },
  { $set: { status: 'reserved' } },
  { new: true }
);
```
If two buyers attempt to pay for the exact same vehicle concurrently:
1. Only one transaction succeeds in updating the vehicle status to `reserved` and confirming the order.
2. The losing request's atomic update returns `null`. The backend flags the losing payment record status as `refund_required` for manual admin resolution, cancels the duplicate order, and returns an HTTP `409 Conflict` response with the message: `"This vehicle is no longer available."`

---

## ❓ TROUBLESHOOTING

- **MongoDB Connection Error**: Ensure MongoDB service is running locally (`net start MongoDB` on Windows) or check your `MONGO_URI` in `backend/.env`.
- **CORS Error**: Verify `CLIENT_URL` in `backend/.env` matches `http://localhost:5173`.
- **Image Not Loading**: Check uploaded images inside `backend/uploads/` or use valid public image URLs.

---

## 📄 LICENSE

Built with ❤️ for full-stack web application showcase.
