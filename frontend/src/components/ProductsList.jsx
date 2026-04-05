import React from "react";
import { Link } from "react-router-dom";
import ProductItem from "./ProductItem";

export default function ProductsList({ products, onEdit, onDelete }) {
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
                />
            ))}
        </div>
    );
}