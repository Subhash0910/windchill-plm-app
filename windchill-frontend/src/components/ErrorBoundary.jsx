import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary caught]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/dashboard';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#f8fafc', padding: '32px',
          boxSizing: 'border-box',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '44px 40px', maxWidth: '480px', width: '100%',
            textAlign: 'center',
            boxShadow: '0 4px 28px rgba(0,0,0,0.08)',
            border: '1px solid #fee2e2',
            borderTop: '5px solid #ef4444',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '14px' }}>⚠️</div>
            <h1 style={{
              fontSize: '20px', fontWeight: 700,
              color: '#1e293b', margin: '0 0 8px 0',
            }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px 0', lineHeight: 1.6 }}>
              An unexpected error occurred in the application.
              Our team has been notified. Please try refreshing or go back to the dashboard.
            </p>

            {this.state.error && (
              <pre style={{
                background: '#fef2f2', color: '#b91c1c',
                padding: '12px 14px', borderRadius: '8px',
                fontSize: '11px', textAlign: 'left',
                overflow: 'auto', marginBottom: '24px',
                maxHeight: '100px', border: '1px solid #fecaca',
              }}>
                {this.state.error.message}
              </pre>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#4f46e5', color: 'white', border: 'none',
                  borderRadius: '8px', padding: '10px 22px',
                  fontSize: '14px', fontWeight: 600, cursor: 'pointer',
                }}
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#f1f5f9', color: '#374151',
                  border: '1px solid #e2e8f0', borderRadius: '8px',
                  padding: '10px 22px', fontSize: '14px',
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
