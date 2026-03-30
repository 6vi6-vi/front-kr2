import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

function Login() {
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
            
            // Сохраняем токены в localStorage
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            
            // Получаем информацию о пользователе
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
        <div className="auth-container">
            <h2>Вход в систему</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                    <label>Email:</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="form-group">
                    <label>Пароль:</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Вход...' : 'Войти'}
                </button>
            </form>
            <p className="auth-link">
                Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
            </p>
        </div>
    );
}

export default Login;