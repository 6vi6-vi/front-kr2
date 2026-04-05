import React from "react";
import { Link } from "react-router-dom";

export default function ProductItem({ product, onEdit, onDelete }) {
    return (
        <div className="productCard">
            <div className="productCard__header">
                <div className="productCard__id">#{product.id}</div>
                <div className="productCard__category">{product.category}</div>
            </div>

            <div className="productCard__body">
                <Link to={`/products/${product.id}`} className="productCard__title-link">
                    <h3 className="productCard__title">{product.title}</h3>
                </Link>
                <p className="productCard__description">{product.description}</p>
            </div>

            <div className="productCard__footer">
                <div className="productCard__price">
                    {product.price.toLocaleString()} ₽
                </div>
            </div>

            <div className="productCard__actions">
                <button className="btn" onClick={() => onEdit(product)}>
                    Редактировать
                </button>
                <button className="btn btn--danger" onClick={() => onDelete(product.id)}>
                    Удалить
                </button>
            </div>
        </div>
    );
}