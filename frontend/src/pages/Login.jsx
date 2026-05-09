import React, { useState } from 'react';
import { userAPI } from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 5) {
      newErrors.password = 'Password must be at least 5 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', formData.email);
      
      const response = await userAPI.login(formData);
      console.log('Login response:', response);
      
      if (response.data.success) {
        console.log('Login successful:', response.data.user);
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Get the intended destination from location state or default to admin
        const from = location.state?.from?.pathname || '/admin';
        navigate(from, { replace: true });
      } else {
        setErrors({ general: 'Login failed' });
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        const errorMsg = error.response.data.msg || 'Login failed';
        setErrors({ general: errorMsg });
      } else if (error.request) {
        setErrors({ general: 'Network error. Please try again.' });
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-form-container">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="#0f172a"/>
              <path d="M20 10L26 16L20 22L14 16L20 10Z" fill="white"/>
              <path d="M10 20L16 26L22 20L16 14L10 20Z" fill="white" opacity="0.7"/>
            </svg>
          </div>
          
          <div className="login-header">
            <h1>Welcome Back!</h1>
            <p>Please enter your details</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {errors.general && (
              <div className="error-message">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isLoading}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && (
                <span className="error-text">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isLoading}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading-spinner"></span>
                  Logging in...
                </>
              ) : (
                <>
                  Login
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L6.59 1.41 10.17 5H0v2h10.17l-3.58 3.59L8 12l6-6z"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>By continuing, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></p>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="illustration-content">
          <div className="illustration-image">
            <svg width="400" height="300" viewBox="0 0 400 300" fill="none">
              {/* Background elements */}
              <circle cx="50" cy="50" r="30" fill="#E0E7FF" opacity="0.5"/>
              <circle cx="350" cy="80" r="20" fill="#C7D2FE" opacity="0.5"/>
              <rect x="30" y="200" width="60" height="60" rx="10" fill="#DDD6FE" opacity="0.5"/>
              
              {/* Person on beanbag */}
              <ellipse cx="200" cy="220" rx="80" ry="40" fill="#1F2937"/>
              <circle cx="200" cy="180" r="25" fill="#F3F4F6"/>
              <rect x="175" y="200" width="50" height="40" rx="5" fill="#6B7280"/>
              
              {/* Laptop */}
              <rect x="180" y="195" width="40" height="25" rx="2" fill="#9CA3AF"/>
              <rect x="178" y="220" width="44" height="3" fill="#6B7280"/>
              
              {/* Lamp */}
              <line x1="320" y1="50" x2="320" y2="120" stroke="#6B7280" strokeWidth="3"/>
              <circle cx="320" cy="50" r="8" fill="#FEF3C7"/>
              <path d="M310 120 L330 120 L325 140 L315 140 Z" fill="#6B7280"/>
            </svg>
          </div>
          
          <div className="illustration-text">
            <h2>Streamlined Restaurant Management</h2>
            <p>Complete QR code ordering system with real-time analytics and multi-cafe support</p>
          </div>
          
          <div className="carousel-dots">
            <span className="dot active"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
