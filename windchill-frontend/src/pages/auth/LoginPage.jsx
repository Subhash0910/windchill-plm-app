import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/atoms/Button/Button';
import Input from '../../components/atoms/Input/Input';
import Card from '../../components/molecules/Card/Card';
import './LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username is required';
    if (!formData.password) newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    const success = await login(formData.username, formData.password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    } else {
      setErrors({ submit: authError || 'Login failed' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  return (
    <div className="login-container">
      <Card className="login-card">
        <div className="login-header">
          <h1>Windchill PLM</h1>
          <p>Enterprise Product Lifecycle Management</p>
        </div>

        <form onSubmit={handleSubmit}>
          {errors.submit && <div className="error-banner">{errors.submit}</div>}

          <Input
            label="Username"
            type="text"
            name="username"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username}
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password}
            required
          />

          <Button
            type="submit"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Login
          </Button>
        </form>

        <div className="login-footer">
          <p>Default credentials: admin / admin123</p>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
