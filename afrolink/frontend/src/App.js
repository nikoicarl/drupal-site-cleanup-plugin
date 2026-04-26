import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import PrivateRoute from './components/common/PrivateRoute';

// Pages
import Home           from './pages/Home';
import Login          from './pages/auth/Login';
import Register       from './pages/auth/Register';
import Shop           from './pages/Shop';
import ProductDetail  from './pages/ProductDetail';
import Cart           from './pages/Cart';
import Checkout       from './pages/Checkout';
import OrderTracking  from './pages/OrderTracking';

// Customer portal
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerOrders    from './pages/customer/Orders';

// Vendor portal
import VendorDashboard from './pages/vendor/Dashboard';
import VendorProducts  from './pages/vendor/Products';
import VendorOrders    from './pages/vendor/Orders';

// Driver portal
import DriverDashboard from './pages/driver/Dashboard';

// Community
import Community   from './pages/community/Community';
import RecipeDetail from './pages/community/RecipeDetail';

// Admin
import AdminDashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* Auth pages — full-screen, no shared navbar */}
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Public pages — navbar is embedded in Home; shop/community pages
              have their own layout or can share a lightweight Navbar if needed */}
          <Route path="/"            element={<Home />} />
          <Route path="/shop"        element={<Shop />} />
          <Route path="/shop/:id"    element={<ProductDetail />} />
          <Route path="/community"   element={<Community />} />
          <Route path="/community/recipes/:id" element={<RecipeDetail />} />

          {/* Protected — any authenticated user */}
          <Route element={<PrivateRoute />}>
            <Route path="/cart"          element={<Cart />} />
            <Route path="/checkout"      element={<Checkout />} />
            <Route path="/orders/:id"    element={<OrderTracking />} />
          </Route>

          {/* Customer */}
          <Route element={<PrivateRoute roles={['customer']} />}>
            <Route path="/account"        element={<CustomerDashboard />} />
            <Route path="/account/orders" element={<CustomerOrders />} />
          </Route>

          {/* Vendor */}
          <Route element={<PrivateRoute roles={['vendor']} />}>
            <Route path="/vendor"          element={<VendorDashboard />} />
            <Route path="/vendor/products" element={<VendorProducts />} />
            <Route path="/vendor/orders"   element={<VendorOrders />} />
          </Route>

          {/* Driver */}
          <Route element={<PrivateRoute roles={['driver']} />}>
            <Route path="/driver" element={<DriverDashboard />} />
          </Route>

          {/* Admin */}
          <Route element={<PrivateRoute roles={['admin', 'super_admin']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer position="top-right" autoClose={3500} hideProgressBar={false} />
      </CartProvider>
    </AuthProvider>
  );
}
