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
import ChangeOrderDetailPage from '../pages/plm/ChangeOrderDetailPage';
import EcnDetailPage from '../pages/plm/EcnDetailPage';
import ChangeTasksPage from '../pages/plm/ChangeTasksPage';
import NotificationsPage from '../pages/plm/NotificationsPage';
import DocumentsPage from '../pages/plm/DocumentsPage';
import DocumentDetailPage from '../pages/plm/DocumentDetailPage';
import ProductsPage from '../pages/plm/ProductsPage';
import ProjectsPage from '../pages/plm/ProjectsPage';
import LibraryPage from '../pages/plm/LibraryPage';
import AuditLogPage from '../pages/plm/AuditLogPage';
import TeamManagementPage from '../pages/plm/TeamManagementPage';
import UsersAdminPage from '../pages/admin/UsersAdminPage';
import WindchillSystemPage from '../pages/plm/WindchillSystemPage';
import AIDemo from '../pages/AIDemo';
import NotFoundPage from '../pages/NotFoundPage';
import ErrorBoundary from '../components/ErrorBoundary';

const AppRoutes = () => (
  <ErrorBoundary>
    <Router>
      <Routes>
        <Route path="/login"       element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/dashboard"   element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/plm" element={<PrivateRoute><PlmLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="parts" replace />} />
          <Route path="parts"             element={<PartsPage />} />
          <Route path="parts/:id"         element={<PartDetailPage />} />
          <Route path="worklist"          element={<WorklistPage />} />
          <Route path="changes"           element={<ChangesHomePage />} />
          <Route path="changes/ecr/:id"   element={<EcrDetailPage />} />
          <Route path="changes/eco/:id"   element={<ChangeOrderDetailPage />} />
          <Route path="changes/ecn/:id"   element={<EcnDetailPage />} />
          <Route path="changes/tasks"     element={<ChangeTasksPage />} />
          <Route path="documents"         element={<DocumentsPage />} />
          <Route path="documents/:id"     element={<DocumentDetailPage />} />
          <Route path="products"          element={<ProductsPage />} />
          <Route path="projects"          element={<ProjectsPage />} />
          <Route path="library"           element={<LibraryPage />} />
          <Route path="notifications"     element={<NotificationsPage />} />
          <Route path="audit-log"         element={<AuditLogPage />} />
          <Route path="team"              element={<TeamManagementPage />} />
          <Route path="ai-demo"           element={<AIDemo />} />
          <Route path="admin/users"       element={<UsersAdminPage />} />
          <Route path="admin/system"      element={<WindchillSystemPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  </ErrorBoundary>
);

export default AppRoutes;
