import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AppLayout from './components/layout/AppLayout.jsx';
import LoginPage from './pages/auth/LoginPage.jsx';
import SignupPage from './pages/auth/SignupPage.jsx';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage.jsx';
import DashboardPage from './pages/dashboard/DashboardPage.jsx';
import ProductsPage from './pages/products/ProductsPage.jsx';
import ReceiptsPage from './pages/operations/ReceiptsPage.jsx';
import DeliveriesPage from './pages/operations/DeliveriesPage.jsx';
import TransfersPage from './pages/operations/TransfersPage.jsx';
import AdjustmentsPage from './pages/operations/AdjustmentsPage.jsx';
import MoveHistoryPage from './pages/operations/MoveHistoryPage.jsx';
import SettingsPage from './pages/settings/SettingsPage.jsx';
import ProfilePage from './pages/profile/ProfilePage.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/transfers" element={<TransfersPage />} />
          <Route path="/adjustments" element={<AdjustmentsPage />} />
          <Route path="/move-history" element={<MoveHistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Default redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
