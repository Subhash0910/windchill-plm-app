import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/organisms/Header/Header';
import Card from '../../components/molecules/Card/Card';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: users, loading: usersLoading } = useFetch('/api/v1/users');
  const { data: products, loading: productsLoading } = useFetch('/api/v1/products');
  const { data: documents, loading: documentsLoading } = useFetch('/api/v1/documents');
  const { data: projects, loading: projectsLoading } = useFetch('/api/v1/projects');

  const stats = [
    { label: 'Total Users', value: users?.length || 0, loading: usersLoading },
    { label: 'Products', value: products?.length || 0, loading: productsLoading },
    { label: 'Documents', value: documents?.length || 0, loading: documentsLoading },
    { label: 'Projects', value: projects?.length || 0, loading: projectsLoading },
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
                  {stat.loading ? '...' : stat.value}
                </h2>
              </div>
            </Card>
          ))}
        </div>

        <Card title="Welcome" subtitle={`Role: ${user?.role || 'Viewer'}`}>
          <p>
            Welcome to Windchill PLM, <strong>{user?.fullName || user?.username}</strong>!
          </p>
          <p>
            This is your enterprise Product Lifecycle Management system. You can manage products,
            documents, projects, and workflows from here.
          </p>
          <ul>
            <li>View and manage products</li>
            <li>Upload and control documents</li>
            <li>Track projects and their progress</li>
            <li>Manage approvals and workflows</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default DashboardPage;
