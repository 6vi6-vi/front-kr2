import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

function Products() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await apiClient.get('/products');
            setProducts(response.data.products);
        } catch (err) {
            setError('Ошибка при загрузке товаров');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                await apiClient.delete(`/products/${id}`);
                setProducts(products.filter(p => p.id !== id));
            } catch (err) {
                setError('Ошибка при удалении товара');
            }
        }
    };

    if (loading) return <div className="loading">Загрузка...</div>;

    return (
        <div className="products-container">
            <h2>Список товаров</h2>
            {error && <div className="error">{error}</div>}
            <div className="products-grid">
                {products.length === 0 ? (
                    <p>Нет товаров</p>
                ) : (
                    products.map(product => (
                        <div key={product.id} className="product-card">
                            <h3>{product.title}</h3>
                            <p className="category">{product.category}</p>
                            <p className="price">{product.price} ₽</p>
                            <p className="description">{product.description.substring(0, 100)}...</p>
                            <div className="product-actions">
                                <Link to={`/products/${product.id}`} className="btn-view">Просмотр</Link>
                                <Link to={`/products/${product.id}/edit`} className="btn-edit">Редактировать</Link>
                                <button onClick={() => handleDelete(product.id)} className="btn-delete">Удалить</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default Products;