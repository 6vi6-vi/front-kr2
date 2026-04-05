import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import RoleBadge from "../../components/RoleBadge";
import "./UsersPage.css";

export default function UsersPage() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [editingUser, setEditingUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            setCurrentUser(user);
            if (user.role !== 'admin') {
                navigate('/products');
            }
        }
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers();
            setUsers(data.users);
        } catch (err) {
            setError("Ошибка загрузки пользователей");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleEditUser = (user) => {
        setEditingUser({ ...user });
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;

        try {
            // Подготавливаем данные для обновления
            const updateData = {
                first_name: editingUser.first_name,
                last_name: editingUser.last_name,
                isActive: editingUser.isActive
            };
            
            // Если редактируем НЕ себя, можно менять роль
            if (editingUser.id !== currentUser?.id) {
                updateData.role = editingUser.role;
            }
            
            const updatedUser = await api.updateUser(editingUser.id, updateData);
            
            setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
            setEditingUser(null);
        } catch (err) {
            alert("Ошибка обновления пользователя");
        }
    };

    const handleToggleBlockUser = async (user) => {
        if (user.id === currentUser?.id) {
            alert("Вы не можете заблокировать/разблокировать самого себя");
            return;
        }

        const action = user.isActive ? 'заблокировать' : 'разблокировать';
        const ok = window.confirm(`Вы уверены, что хотите ${action} пользователя ${user.first_name} ${user.last_name}?`);
        if (!ok) return;

        try {
            if (user.isActive) {
                await api.deleteUser(user.id);
            } else {
                await api.updateUser(user.id, { isActive: true });
            }
            await loadUsers();
        } catch (err) {
            alert(`Ошибка ${user.isActive ? 'блокировки' : 'разблокировки'} пользователя`);
        }
    };

    const getRoleOptions = () => {
        return [
            { value: 'user', label: 'Пользователь' },
            { value: 'seller', label: 'Продавец' },
            { value: 'admin', label: 'Администратор' }
        ];
    };

    if (loading) {
        return <div className="page users-page"><div className="loading">Загрузка...</div></div>;
    }

    if (error) {
        return <div className="page users-page"><div className="error-message">{error}</div></div>;
    }

    return (
        <div className="page users-page">
            <header className="header">
                <div className="header__inner">
                    <div className="brand">Управление пользователями</div>
                    <div className="header__right">
                        <button onClick={() => navigate('/products')} className="btn">
                            Назад к товарам
                        </button>
                    </div>
                </div>
            </header>

            <main className="main">
                <div className="container">
                    <h1 className="title">Список пользователей</h1>
                    
                    <div className="users-table-container">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>Имя</th>
                                    <th>Фамилия</th>
                                    <th>Email</th>
                                    <th>Роль</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id} className={!user.isActive ? 'user-blocked-row' : ''}>
                                        <td>{user.first_name}</td>
                                        <td>{user.last_name}</td>
                                        <td>{user.email}</td>
                                        <td><RoleBadge role={user.role} /></td>
                                        <td>
                                            <span className={`status-badge ${user.isActive ? 'status-active' : 'status-blocked'}`}>
                                                {user.isActive ? 'Активен' : 'Заблокирован'}
                                            </span>
                                        </td>
                                        <td className="user-actions">
                                            <button 
                                                className="btn btn--small" 
                                                onClick={() => handleEditUser(user)}
                                            >
                                                Редактировать
                                            </button>
                                            {user.id !== currentUser?.id && (
                                                user.isActive ? (
                                                    <button 
                                                        className="btn btn--danger btn--small" 
                                                        onClick={() => handleToggleBlockUser(user)}
                                                    >
                                                        Заблокировать
                                                    </button>
                                                ) : (
                                                    <button 
                                                        className="btn btn--success btn--small" 
                                                        onClick={() => handleToggleBlockUser(user)}
                                                    >
                                                        Разблокировать
                                                    </button>
                                                )
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {editingUser && (
                <div className="backdrop" onClick={() => setEditingUser(null)}>
                    <div className="modal user-edit-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal__header">
                            <div className="modal__title">
                                Редактирование пользователя
                            </div>
                            <button className="iconBtn" onClick={() => setEditingUser(null)}>✕</button>
                        </div>
                        <div className="modal__body">
                            <div className="form-group">
                                <label>Имя</label>
                                <input
                                    type="text"
                                    value={editingUser.first_name}
                                    onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value})}
                                    placeholder="Введите имя"
                                />
                            </div>
                            <div className="form-group">
                                <label>Фамилия</label>
                                <input
                                    type="text"
                                    value={editingUser.last_name}
                                    onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value})}
                                    placeholder="Введите фамилию"
                                />
                            </div>
                            
                            {editingUser.id !== currentUser?.id ? (
                                <div className="form-group">
                                    <label>Роль</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                                    >
                                        {getRoleOptions().map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="form-group">
                                </div>
                            )}
                        </div>
                        <div className="modal__footer">
                            <button className="btn" onClick={() => setEditingUser(null)}>Отмена</button>
                            <button className="btn btn--primary" onClick={handleUpdateUser}>Сохранить</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}