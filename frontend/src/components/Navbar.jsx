import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('accessToken');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-brand">
                    <Link to="/products">Product Manager</Link>
                </div>
                <div className="nav-links">
                    {isAuthenticated ? (
                        <>
                            <Link to="/products">Товары</Link>
                            <Link to="/products/new">Добавить товар</Link>
                            <span className="user-name">{user.first_name} {user.last_name}</span>
                            <button onClick={handleLogout} className="logout-btn">Выйти</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Вход</Link>
                            <Link to="/register">Регистрация</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;