import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import ProductForm from './pages/ProductForm';

function App() {
    return (
        <div className="app">
            <Navbar />
            <div className="container">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<Navigate to="/products" />} />
                    <Route
                        path="/products"
                        element={
                            <PrivateRoute>
                                <Products />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/products/new"
                        element={
                            <PrivateRoute>
                                <ProductForm />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/products/:id"
                        element={
                            <PrivateRoute>
                                <ProductDetail />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/products/:id/edit"
                        element={
                            <PrivateRoute>
                                <ProductForm />
                            </PrivateRoute>
                        }
                    />
                </Routes>
            </div>
        </div>
    );
}

export default App;