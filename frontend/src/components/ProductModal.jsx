import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
    const [title, setTitle] = useState("");      
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");

    useEffect(() => {
        if (!open) return;
        setTitle(initialProduct?.title ?? "");   
        setCategory(initialProduct?.category ?? "");
        setDescription(initialProduct?.description ?? "");
        setPrice(initialProduct?.price != null ? String(initialProduct.price) : "");
    }, [open, initialProduct]);

    if (!open) return null;

    const titleText = mode === "edit" ? "Редактирование товара" : "Добавление товара";

    const handleSubmit = (e) => {
        e.preventDefault();

        const trimmedTitle = title.trim();          
        const trimmedCategory = category.trim();
        const trimmedDescription = description.trim();
        const parsedPrice = Number(price);

        if (!trimmedTitle) {
            alert("Введите название товара");
            return;
        }
        if (!trimmedCategory) {
            alert("Введите категорию товара");
            return;
        }
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            alert("Введите корректную цену");
            return;
        }

        onSubmit({
            id: initialProduct?.id,
            title: trimmedTitle,                  
            category: trimmedCategory,
            description: trimmedDescription,
            price: parsedPrice,
        });
    };

    return (
        <div className="backdrop" onMouseDown={onClose}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
                <div className="modal__header">
                    <div className="modal__title">{titleText}</div>
                    <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                <form className="form" onSubmit={handleSubmit}>
                    <label className="label">
                        Название товара *
                        <input
                            className="input"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Например, Холодильник"
                            autoFocus
                            required
                        />
                    </label>

                    <label className="label">
                        Категория *
                        <input
                            className="input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="Например, Бытовая техника"
                            required
                        />
                    </label>

                    <label className="label">
                        Описание
                        <textarea
                            className="input textarea"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Краткое описание товара"
                            rows="3"
                        />
                    </label>

                    <label className="label">
                        Цена (₽) *
                        <input
                            className="input"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="35000"
                            inputMode="numeric"
                            required
                        />
                    </label>

                    <div className="modal__footer">
                        <button type="button" className="btn" onClick={onClose}>
                            Отмена
                        </button>
                        <button type="submit" className="btn btn--primary">
                            {mode === "edit" ? "Сохранить" : "Добавить"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}