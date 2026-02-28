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
import NotificationsPage from '../pages/plm/NotificationsPage';
import UsersAdminPage from '../pages/admin/UsersAdminPage';
import AIDemo from '../pages/AIDemo';
import NotFoundPage from '../pages/NotFoundPage';
import ErrorBoundary from '../components/ErrorBoundary';

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>

          {/* Public — redirect to dashboard if already logged in */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          {/* Main Dashboard */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <UsersAdminPage />
              </PrivateRoute>
            }
          />

          {/* PLM Workspace — nested under PlmLayout */}
          <Route
            path="/plm"
            element={
              <PrivateRoute>
                <PlmLayout />
              </PrivateRoute>
            }
          >
            <Route index element={<Navigate to="parts" replace />} />
            <Route path="parts"              element={<PartsPage />} />
            <Route path="parts/:id"          element={<PartDetailPage />} />
            <Route path="worklist"           element={<WorklistPage />} />
            <Route path="changes"            element={<ChangesHomePage />} />
            <Route path="changes/ecr/:id"    element={<EcrDetailPage />} />
            <Route path="changes/tasks"      element={<ChangeTasksPage />} />
            <Route path="notifications"      element={<NotificationsPage />} />
            <Route path="ai-demo"            element={<AIDemo />} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 catch-all — must be last */}
          <Route path="*" element={<NotFoundPage />} />

        </Routes>
      </Router>
    </ErrorBoundary>
  );
};

export default AppRoutes;
