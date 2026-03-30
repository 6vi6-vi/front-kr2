import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:3000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Перехватчик запросов - добавляет access-токен к каждому запросу
apiClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Перехватчик ответов - обрабатывает истекшие токены
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // Проверяем, что это ошибка 401 и мы еще не пробовали обновить токен
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                // Нет refresh-токена, перенаправляем на страницу входа
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(error);
            }
            
            try {
                // Пытаемся обновить токены
                const response = await axios.post('http://localhost:3000/api/auth/refresh', {
                    refreshToken: refreshToken
                });
                
                const { accessToken, refreshToken: newRefreshToken } = response.data;
                
                // Сохраняем новые токены
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefreshToken);
                
                // Повторяем оригинальный запрос с новым токеном
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return apiClient(originalRequest);
                
            } catch (refreshError) {
                // Обновление не удалось, очищаем токены и перенаправляем на вход
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

export default apiClient;