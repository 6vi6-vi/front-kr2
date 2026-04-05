import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api/client';
import './ProductDetailPage.css';

function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get(`/products/${id}`);
            setProduct(response.data);
        } catch (err) {
            setError('Товар не найден');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                await apiClient.delete(`/products/${id}`);
                navigate('/products');
            } catch (err) {
                setError('Ошибка при удалении товара');
            }
        }
    };

    if (loading) {
        return (
            <div className="page detail-page">
                <div className="detail-container">
                    <div className="detail-card">
                        <div className="loading">Загрузка...</div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page detail-page">
                <div className="detail-container">
                    <div className="detail-card">
                        <div className="error-message">{error}</div>
                        <Link to="/products" className="btn btn--primary">Вернуться к товарам</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="page detail-page">
            <div className="detail-container">
                <div className="detail-card">
                    <div className="detail-header">
                        <div className="detail-category">{product.category}</div>
                        <div className="detail-id">#{product.id}</div>
                    </div>
                    
                    <h1 className="detail-title">{product.title}</h1>
                    
                    <div className="detail-price">
                        {product.price.toLocaleString()} ₽
                    </div>
                    
                    <div className="detail-description">
                        <h3>Описание</h3>
                        <p>{product.description}</p>
                    </div>
                    
                    <div className="detail-meta">
                        <p><strong>Создан:</strong> {new Date(product.createdAt).toLocaleString()}</p>
                        {product.updatedAt && (
                            <p><strong>Обновлен:</strong> {new Date(product.updatedAt).toLocaleString()}</p>
                        )}
                        {product.updatedBy && (
                            <p><strong>Обновлен пользователем:</strong> {product.updatedBy}</p>
                        )}
                    </div>
                    
                    <div className="detail-actions">
                        <Link to={`/products/${id}/edit`} className="btn btn--primary">
                            Редактировать
                        </Link>
                        <button onClick={handleDelete} className="btn btn--danger">
                            Удалить
                        </button>
                        <Link to="/products" className="btn">
                            Назад к списку
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetailPage;