import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import UsersPage from './pages/UsersPage/UsersPage';
import PrivateRoute from './components/PrivateRoute';

function App() {
    const isAuthenticated = !!localStorage.getItem('accessToken');
    
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/products" element={
                    <PrivateRoute>
                        <ProductsPage />
                    </PrivateRoute>
                } />
                <Route path="/users" element={
                    <PrivateRoute>
                        <UsersPage />
                    </PrivateRoute>
                } />
                <Route path="/" element={
                    <Navigate to={isAuthenticated ? "/products" : "/login"} />
                } />
            </Routes>
        </BrowserRouter>
    );
}

export default App;