import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import './LoginPage.css';

function LoginPage() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await apiClient.post('/auth/login', formData);
            const { accessToken, refreshToken } = response.data;
            
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            const userResponse = await apiClient.get('/auth/me');
            localStorage.setItem('user', JSON.stringify(userResponse.data));
            
            navigate('/products');
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при входе');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="brand">Products App</div>
                        <h1 className="login-title">Вход в систему</h1>
                        <p className="login-subtitle">Добро пожаловать!</p>
                    </div>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="ivan@example.com"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Пароль</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                            />
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="btn btn--primary btn--full"
                        >
                            {loading ? 'Вход...' : 'Войти'}
                        </button>
                    </form>
                    
                    <div className="login-footer">
                        <span>Нет аккаунта?</span>
                        <Link to="/register" className="auth-link">Зарегистрироваться</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;