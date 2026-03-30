import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

function ProductDetail() {
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
            const response = await apiClient.get(`/products/${id}`);
            setProduct(response.data);
        } catch (err) {
            setError('Товар не найден');
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

    if (loading) return <div className="loading">Загрузка...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="product-detail">
            <div className="detail-header">
                <h2>{product.title}</h2>
                <div className="detail-actions">
                    <Link to={`/products/${id}/edit`} className="btn-edit">Редактировать</Link>
                    <button onClick={handleDelete} className="btn-delete">Удалить</button>
                </div>
            </div>
            <div className="detail-info">
                <p><strong>Категория:</strong> {product.category}</p>
                <p><strong>Цена:</strong> {product.price} ₽</p>
                <p><strong>Описание:</strong></p>
                <p>{product.description}</p>
                <p><small>Создан: {new Date(product.createdAt).toLocaleString()}</small></p>
                {product.updatedAt && (
                    <p><small>Обновлен: {new Date(product.updatedAt).toLocaleString()}</small></p>
                )}
            </div>
            <Link to="/products" className="btn-back">Назад к списку</Link>
        </div>
    );
}

export default ProductDetail;