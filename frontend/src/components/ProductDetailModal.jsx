import React from "react";

export default function ProductDetailModal({ open, product, onClose }) {
    if (!open) return null;

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal detail-modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal__header">
                    <div className="modal__title">Информация о товаре</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <div className="modal__body">
                    <div className="detail-info">
                        <div className="detail-row">
                            <span className="detail-label">Категория:</span>
                            <span className="detail-value">{product.category}</span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="detail-label">Название:</span>
                            <span className="detail-value">{product.title}</span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="detail-label">Цена:</span>
                            <span className="detail-value price">{product.price.toLocaleString()} ₽</span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="detail-label">Описание:</span>
                            <span className="detail-value description">{product.description}</span>
                        </div>
                        
                        <div className="detail-row">
                            <span className="detail-label">Создан:</span>
                            <span className="detail-value">{new Date(product.createdAt).toLocaleString()}</span>
                        </div>
                        
                        {product.updatedAt && (
                            <div className="detail-row">
                                <span className="detail-label">Обновлен:</span>
                                <span className="detail-value">{new Date(product.updatedAt).toLocaleString()}</span>
                            </div>
                        )}
                        
                        {product.updatedBy && (
                            <div className="detail-row">
                                <span className="detail-label">Кем обновлен:</span>
                                <span className="detail-value">{product.updatedBy}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}