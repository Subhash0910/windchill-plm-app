import { lazy } from 'react';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('../pages/LoginPage'));
const WorkspacePage = lazy(() => import('../pages/WorkspacePage'));
const AIDemo = lazy(() => import('../pages/AIDemo'));

/**
 * Application routes configuration
 */
export const routes = [
  {
    path: '/login',
    element: <LoginPage />,
    public: true
  },
  {
    path: '/',
    element: <WorkspacePage />,
    protected: true
  },
  {
    path: '/workspace',
    element: <WorkspacePage />,
    protected: true
  },
  {
    path: '/ai-demo',
    element: <AIDemo />,
    protected: true
  }
];

export default routes;