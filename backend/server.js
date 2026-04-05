const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

const ACCESS_SECRET = "access_secret_key_here";
const REFRESH_SECRET = "refresh_secret_key_here";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API AUTH & PRODUCTS & USERS',
            version: '1.0.0',
            description: 'API с системой ролей (RBAC)',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./server.js'],
};

let users = [];
let products = [];

const refreshTokens = new Set();

function findUserByEmail(email) {
    return users.find(u => u.email === email);
}

function findUserById(id) {
    return users.find(u => u.id === id);
}

function findProductOr404(id, res) {
    const product = products.find(p => p.id == id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

async function hashPassword(password) {  
    const rounds = 10;
    return bcrypt.hash(password, rounds);  
}

async function verifyPassword(password, passwordHash) {  
    return bcrypt.compare(password, passwordHash);  
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role
        },
        ACCESS_SECRET,
        {
            expiresIn: ACCESS_EXPIRES_IN,
        }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role
        },
        REFRESH_SECRET,
        {
            expiresIn: REFRESH_EXPIRES_IN,
        }
    );
}

function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({
            error: "Missing or invalid Authorization header. Expected format: Bearer <token>",
        });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: "Token has expired",
            });
        }
        return res.status(401).json({
            error: "Invalid token",
        });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: "Forbidden: You don't have permission to access this resource",
            });
        }
        next();
    };
}

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(express.json());

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});


/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     description: Доступ - Гость
 *     tags: [Auth]
 */
app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password, role } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "email, first_name, last_name and password are required" });
    }

    const existingUser = findUserByEmail(email);
    if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
    }

    let userRole = "user";
    
    if (role && (role === "admin" || role === "seller")) {
        const hasAdmin = users.some(u => u.role === "admin");
        if (!hasAdmin && role === "admin") {
            userRole = "admin";
        } else if (role === "seller") {
            userRole = "seller";
        }
    }

    const newUser = {
        id: nanoid(),
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: await hashPassword(password),
        role: userRole,
        isActive: true,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     description: Доступ - Гость
 *     tags: [Auth]
 */
app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
    }

    const user = findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    if (!user.isActive) {
        return res.status(401).json({ error: "Account is blocked" });
    }

    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    res.status(200).json({ 
        accessToken: accessToken,
        refreshToken: refreshToken
    });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление пары токенов
 *     description: Доступ - Гость
 *     tags: [Auth]
 */
app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            error: "refreshToken is required",
        });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({
            error: "Invalid refresh token",
        });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);

        const user = findUserById(payload.sub);
        if (!user || !user.isActive) {
            return res.status(401).json({
                error: "User not found or blocked",
            });
        }

        refreshTokens.delete(refreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired refresh token",
        });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить информацию о текущем пользователе
 *     description: Доступ - Пользователь, Продавец, Администратор
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = findUserById(userId);

    if (!user) {
        return res.status(404).json({
            error: "User not found",
        });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Получить список пользователей
 *     description: Доступ - Администратор
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/users", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json({
        count: usersWithoutPasswords.length,
        users: usersWithoutPasswords
    });
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Получить пользователя по id
 *     description: Доступ - Администратор
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const { id } = req.params;
    const user = findUserById(id);
    
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Обновить информацию пользователя
 *     description: Доступ - Администратор
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.put("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), async (req, res) => {
    const { id } = req.params;
    const { first_name, last_name, role, isActive } = req.body;
    
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }
    
    const updatedUser = { ...users[userIndex] };
    
    if (first_name) updatedUser.first_name = first_name;
    if (last_name) updatedUser.last_name = last_name;
    if (role) updatedUser.role = role;
    if (isActive !== undefined) updatedUser.isActive = isActive;
    
    updatedUser.updatedAt = new Date().toISOString();
    updatedUser.updatedBy = req.user.email;
    
    users[userIndex] = updatedUser;
    
    const { password, ...userWithoutPassword } = updatedUser;
    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Заблокировать пользователя
 *     description: Доступ - Администратор
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
app.delete("/api/users/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const { id } = req.params;
    const userIndex = users.findIndex(u => u.id === id);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: "User not found" });
    }
    
    if (users[userIndex].id === req.user.sub) {
        return res.status(400).json({ error: "You cannot block yourself" });
    }
    
    users[userIndex].isActive = false;
    users[userIndex].blockedAt = new Date().toISOString();
    users[userIndex].blockedBy = req.user.email;
    
    res.json({ 
        message: "User blocked successfully",
        user: { id: users[userIndex].id, email: users[userIndex].email, isActive: false }
    });
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     description: Доступ - Продавец, Администратор
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.post("/api/products", authMiddleware, roleMiddleware(["seller", "admin"]), async (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || price === undefined) {
        return res.status(400).json({ error: "title, category, description and price are required" });
    }

    if (typeof price !== 'number' || price <= 0) {
        return res.status(400).json({ error: "price must be a positive number" });
    }

    const newProduct = {
        id: nanoid(),
        title: title,
        category: category,
        description: description,
        price: price,
        createdAt: new Date().toISOString(),
        createdBy: req.user.email
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     description: Доступ - Пользователь, Продавец, Администратор
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/products", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
    res.status(200).json({
        count: products.length,
        products: products
    });
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по id
 *     description: Доступ - Пользователь, Продавец, Администратор
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.get("/api/products/:id", authMiddleware, roleMiddleware(["user", "seller", "admin"]), (req, res) => {
    const { id } = req.params;
    const product = findProductOr404(id, res);
    
    if (product) {
        res.status(200).json(product);
    }
});

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Обновить параметры товара
 *     description: Доступ - Продавец, Администратор
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.put("/api/products/:id", authMiddleware, roleMiddleware(["seller", "admin"]), (req, res) => {
    const { id } = req.params;
    const { title, category, description, price } = req.body;
    
    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    const updatedProduct = { ...products[productIndex] };
    
    if (title) updatedProduct.title = title;
    if (category) updatedProduct.category = category;
    if (description) updatedProduct.description = description;
    if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0) {
            return res.status(400).json({ error: "price must be a positive number" });
        }
        updatedProduct.price = price;
    }
    
    updatedProduct.updatedAt = new Date().toISOString();
    updatedProduct.updatedBy = req.user.email;
    
    products[productIndex] = updatedProduct;
    res.status(200).json(updatedProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     description: Доступ - Администратор
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 */
app.delete("/api/products/:id", authMiddleware, roleMiddleware(["admin"]), (req, res) => {
    const { id } = req.params;
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
        return res.status(404).json({ error: "Product not found" });
    }
    
    const deletedProduct = products[productIndex];
    products.splice(productIndex, 1);
    
    res.status(200).json({ 
        message: "Product deleted successfully",
        deletedProduct: deletedProduct
    });
});

async function initTestUsers() {
    const adminExists = users.find(u => u.email === 'admin@mail.com');
    if (!adminExists) {
        users.push({
            id: nanoid(),
            email: 'admin@mail.com',
            first_name: 'Валерия',
            last_name: 'Иванова',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            isActive: true,
            createdAt: new Date().toISOString()
        });
    }

    const seller1Exists = users.find(u => u.email === 'seller1@mail.com');
    if (!seller1Exists) {
        users.push({
            id: nanoid(),
            email: 'seller1@mail.com',
            first_name: 'Продавец',
            last_name: 'Первый',
            password: await bcrypt.hash('seller_1', 10),
            role: 'seller',
            isActive: true,
            createdAt: new Date().toISOString()
        });
    }

    const seller2Exists = users.find(u => u.email === 'seller2@mail.com');
    if (!seller2Exists) {
        users.push({
            id: nanoid(),
            email: 'seller2@mail.com',
            first_name: 'Продавец',
            last_name: 'Второй',
            password: await bcrypt.hash('seller_2', 10),
            role: 'seller',
            isActive: true,
            createdAt: new Date().toISOString()
        });
    }
}


async function initTestProducts() {
    if (products.length === 0) {
        const defaultProducts = [
            {
                id: nanoid(),
                title: 'Стиральная машина',
                category: 'Бытовая техника',
                description: '7 кг, 1200 об/мин. Защита от протечек.',
                price: 35000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Холодильник',
                category: 'Бытовая техника',
                description: 'No Frost, общий объем 325 л. Управление электронное, LED подсветка.',
                price: 46000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Телевизор',
                category: 'Электроника',
                description: '55 дюймов, Smart TV, HDR, Android TV. 4K разрешение.',
                price: 68000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Ноутбук',
                category: 'Компьютеры',
                description: 'Intel Core i7, 16GB RAM, SSD 512GB, видеокарта RTX 3060.',
                price: 90000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'iPhone 15',
                category: 'Смартфоны',
                description: '128GB, двойная камера 48 МП, Dynamic Island, USB-C.',
                price: 90000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Планшет',
                category: 'Электроника',
                description: '11 дюймов, M2 чип, 256GB, поддержка Apple Pencil.',
                price: 110000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Наушники',
                category: 'Аксессуары',
                description: 'Беспроводные, активное шумоподавление, до 30 часов работы.',
                price: 28000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Кофемашина',
                category: 'Бытовая техника',
                description: 'Автоматическая, 15 бар, встроенная кофемолка.',
                price: 46000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Фитнес-браслет',
                category: 'Аксессуары',
                description: 'AMOLED экран, пульсометр, измерение кислорода в крови, GPS.',
                price: 4000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Монитор',
                category: 'Компьютеры',
                description: '27 дюймов, 240Hz, QLED, 1ms отклика, HDR400.',
                price: 35000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Пылесос',
                category: 'Бытовая техника',
                description: 'Беспроводной, лазерная подсветка, до 60 минут работы.',
                price: 60000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            },
            {
                id: nanoid(),
                title: 'Умные часы',
                category: 'Аксессуары',
                description: 'GPS, измерение кислорода в крови, ECG, AMOLED экран.',
                price: 43000,
                createdAt: new Date().toISOString(),
                createdBy: 'system'
            }
        ];

        products.push(...defaultProducts);
    }
}

app.listen(port, async () => {
    await initTestUsers();
    await initTestProducts(); 
    console.log(`\nСервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});