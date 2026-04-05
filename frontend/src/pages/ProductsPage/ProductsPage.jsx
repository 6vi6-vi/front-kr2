import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProductsPage.css";
import ProductsList from "../../components/ProductsList";
import ProductModal from "../../components/ProductModal";
import { api } from "../../api/client";

export default function ProductsPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        loadUser();
        loadProducts();
    }, []);

    const loadUser = () => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    };

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await api.getProducts();
            setProducts(data.products || []);
        } catch (err) {
            console.error(err);
            if (err.response?.status === 403) {
                alert("У вас нет прав для просмотра товаров");
            } else {
                alert("Ошибка загрузки товаров");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        api.logout();
        navigate('/login');
    };

    const canManageProducts = user && (user.role === 'seller' || user.role === 'admin');
    const canDeleteProduct = user && user.role === 'admin';

    const openCreate = () => {
        if (!canManageProducts) {
            alert("У вас нет прав для создания товаров");
            return;
        }
        setModalMode("create");
        setEditingProduct(null);
        setModalOpen(true);
    };

    const openEdit = (product) => {
        if (!canManageProducts) {
            alert("У вас нет прав для редактирования товаров");
            return;
        }
        setModalMode("edit");
        setEditingProduct(product);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingProduct(null);
    };

    const handleDelete = async (id) => {
        if (!canDeleteProduct) {
            alert("Только администратор может удалять товары");
            return;
        }
        
        const ok = window.confirm("Удалить товар?");
        if (!ok) return;

        try {
            await api.deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            console.error(err);
            alert("Ошибка удаления товара");
        }
    };

    const handleSubmitModal = async (payload) => {
        try {
            if (modalMode === "create") {
                const newProduct = await api.createProduct(payload);
                setProducts((prev) => [...prev, newProduct]);
            } else {
                const updatedProduct = await api.updateProduct(payload.id, payload);
                setProducts((prev) =>
                    prev.map((p) => (p.id === payload.id ? updatedProduct : p))
                );
            }
            closeModal();
        } catch (err) {
            console.error(err);
            alert("Ошибка сохранения товара");
        }
    };

    const getRoleName = (role) => {
        switch (role) {
            case 'admin': return 'Администратор';
            case 'seller': return 'Продавец';
            default: return 'Пользователь';
        }
    };

    return (
        <div className="page">
            <header className="header">
                <div className="header__inner">
                    <div className="header__left">
                        <div className="brand">Products App</div>
                        {user && (
                            <span className={`role-badge role-${user.role} header-role`}>
                                {getRoleName(user.role)}
                            </span>
                        )}
                    </div>
                    <div className="header__right">
                        {user && (
                            <div className="user-info">
                                <span className="user-name">
                                    {user.first_name} {user.last_name}
                                </span>
                                {user.role === 'admin' && (
                                    <button 
                                        onClick={() => navigate('/users')} 
                                        className="btn btn--primary btn--small"
                                    >
                                        Управление пользователями
                                    </button>
                                )}
                                <button 
                                    onClick={handleLogout} 
                                    className="btn btn--danger btn--small"
                                >
                                    Выйти
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <div className="toolbar">
                        <h1 className="title">Каталог товаров</h1>
                        {canManageProducts && (
                            <button className="btn btn--primary" onClick={openCreate}>
                                + Добавить товар
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <div className="empty">Загрузка...</div>
                    ) : (
                        <ProductsList
                            products={products}
                            onEdit={openEdit}
                            onDelete={handleDelete}
                            canEdit={canManageProducts}
                            canDelete={canDeleteProduct}
                        />
                    )}
                </div>
            </main>

            <footer className="footer">
                <div className="footer__inner">
                    © {new Date().getFullYear()} Products App
                </div>
            </footer>

            <ProductModal
                open={modalOpen}
                mode={modalMode}
                initialProduct={editingProduct}
                onClose={closeModal}
                onSubmit={handleSubmitModal}
            />
        </div>
    );
}