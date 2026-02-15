import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/organisms/Header/Header';
import Card from '../../components/molecules/Card/Card';
import Button from '../../components/atoms/Button/Button';
import { PlmWorkspaceContext } from '../../context/PlmWorkspaceContext';
import { useContext } from 'react';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const { selectedContextId, selectedContextName, partsCount } = useContext(PlmWorkspaceContext);

  const stats = [
    { label: 'Contexts', value: selectedContextId ? 1 : 0 },
    { label: 'Parts in Context', value: partsCount ?? 0 },
    { label: 'Documents', value: 0 },
    { label: 'Projects', value: 0 },
  ];

  return (
    <div className="dashboard-container">
      <Header title="Dashboard" />

      <main className="dashboard-main">
        <div className="dashboard-grid">
          {stats.map((stat, idx) => (
            <Card key={idx} className="stat-card">
              <div className="stat-content">
                <p className="stat-label">{stat.label}</p>
                <h2 className="stat-value">
                  {stat.value}
                </h2>
                {idx === 1 && selectedContextId && (
                  <p className="stat-sub">Context: {selectedContextName || selectedContextId}</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        <Card title="Workspace" subtitle="Windchill-like navigator (Contexts/Folders/Parts/BOM)">
          <p>
            Open the PLM Workspace to work with contexts, folders, parts, BOM, lifecycle, and audit trail.
          </p>
          <Link to="/plm" style={{ textDecoration: 'none' }}>
            <Button variant="secondary" size="sm">Open Workspace</Button>
          </Link>
        </Card>

        <Card title="Welcome" subtitle={`Role: ${user?.role || 'Viewer'}`}>
          <p>
            Welcome to Windchill PLM, <strong>{user?.fullName || user?.username}</strong>!
          </p>
          <p>
            This is your Windchill-like Product Lifecycle Management workspace. You can manage contexts,
            parts, BOM, and lifecycle, and later documents, projects, and workflows.
          </p>
          <ul>
            <li>Navigate contexts and folders</li>
            <li>Create and manage parts and BOM</li>
            <li>Promote and revise parts through lifecycle</li>
            <li>Track audit history and (future) workflows</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
