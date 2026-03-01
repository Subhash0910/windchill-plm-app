import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { PlmWorkspaceProvider } from './context/PlmWorkspaceContext';
import AppRoutes from './routing/AppRoutes';
import './App.css';
import './mobile-responsive.css'; // Mobile-friendly styles for all devices

function App() {
  return (
    <AuthProvider>
      <PlmWorkspaceProvider>
        <AppRoutes />
      </PlmWorkspaceProvider>
    </AuthProvider>
  );
}

export default App;
