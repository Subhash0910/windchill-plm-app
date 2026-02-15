import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

import PlmLayout from '../pages/plm/PlmLayout';
import PartsPage from '../pages/plm/PartsPage';
import PartDetailPage from '../pages/plm/PartDetailPage';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/plm"
          element={
            <PrivateRoute>
              <PlmLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="parts" replace />} />
          <Route path="parts" element={<PartsPage />} />
          <Route path="parts/:id" element={<PartDetailPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
