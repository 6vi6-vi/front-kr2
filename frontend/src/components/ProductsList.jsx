import React from "react";
import ProductItem from "./ProductItem";

export default function ProductsList({ products, onEdit, onDelete, canEdit = false, canDelete = false }) {
    if (!products.length) {
        return <div className="empty">Товаров пока нет</div>;
    }

    return (
        <div className="list">
            {products.map((product) => (
                <ProductItem 
                    key={product.id} 
                    product={product} 
                    onEdit={onEdit} 
                    onDelete={onDelete}
                    canEdit={canEdit}
                    canDelete={canDelete}
                />
            ))}
        </div>
    );
}