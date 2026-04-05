import React, { useState } from "react";
import ProductDetailModal from "./ProductDetailModal";

export default function ProductItem({ product, onEdit, onDelete }) {
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const openDetailModal = () => {
        setIsDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setIsDetailModalOpen(false);
    };

    return (
        <>
            <div className="productCard">
                <div className="productCard__header">
                    <button 
                        className="productCard__info-btn" 
                        onClick={openDetailModal}
                        title="Подробная информация"
                    >
                        <svg 
                            className="info-icon" 
                            width="20" 
                            height="20" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                            <line x1="12" y1="12" x2="12" y2="16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="12" cy="8" r="1" fill="currentColor"/>
                        </svg>
                    </button>
                    <div className="productCard__category">{product.category}</div>
                </div>

                <div className="productCard__body">
                    <h3 className="productCard__title">{product.title}</h3>
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

            <ProductDetailModal
                open={isDetailModalOpen}
                product={product}
                onClose={closeDetailModal}
            />
        </>
    );
}