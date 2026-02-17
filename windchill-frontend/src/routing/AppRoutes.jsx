import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import PrivateRoute from './PrivateRoute';
import PublicRoute from './PublicRoute';

import PlmLayout from '../pages/plm/PlmLayout';
import PartsPage from '../pages/plm/PartsPage';
import PartDetailPage from '../pages/plm/PartDetailPage';
import WorklistPage from '../pages/plm/WorklistPage';
import ChangesHomePage from '../pages/plm/ChangesHomePage';
import EcrDetailPage from '../pages/plm/EcrDetailPage';
import ChangeTasksPage from '../pages/plm/ChangeTasksPage';
import UsersAdminPage from '../pages/admin/UsersAdminPage';
import AIDemo from '../pages/AIDemo';

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
          path="/admin/users"
          element={
            <PrivateRoute>
              <UsersAdminPage />
            </PrivateRoute>
          }
        />

        {/* AI Demo Page */}
        <Route
          path="/ai-demo"
          element={
            <PrivateRoute>
              <AIDemo />
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
          <Route path="worklist" element={<WorklistPage />} />
          <Route path="changes" element={<ChangesHomePage />} />
          <Route path="changes/ecr/:id" element={<EcrDetailPage />} />
          <Route path="changes/tasks" element={<ChangeTasksPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;