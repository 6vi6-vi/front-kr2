import React from 'react';

export default function RoleBadge({ role }) {
    const getRoleInfo = (role) => {
        switch (role) {
            case 'admin':
                return { name: 'Администратор', className: 'role-badge role-admin' };
            case 'seller':
                return { name: 'Продавец', className: 'role-badge role-seller' };
            default:
                return { name: 'Пользователь', className: 'role-badge role-user' };
        }
    };

    const roleInfo = getRoleInfo(role);

    return (
        <span className={roleInfo.className}>
            {roleInfo.name}
        </span>
    );
}