const express = require('express');
const { nanoid } = require("nanoid");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

const ACCESS_SECRET = "access_secret";
const REFRESH_SECRET = "refresh_secret";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API AUTH & PRODUCTS',
            version: '1.0.0',
            description: 'API для авторизации и управления товарами',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер',
            },
        ],
    },
    apis: ['./server.js'],
};

let users = [];
let products = [];

const refreshTokens = new Set();

function findUserOr404(email, res) {
    const user = users.find(u => u.email == email);
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return null;
    }
    return user;
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
            error: "Missing or invalid Authorization header",
        });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired token",
        });
    }
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
 *     description: Создает нового пользователя с хешированным паролем
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - first_name
 *               - last_name
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@example.com
 *               first_name:
 *                 type: string
 *                 example: Иван
 *               last_name:
 *                 type: string
 *                 example: Петров
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *       400:
 *         description: Некорректные данные
 */

app.post("/api/auth/register", async (req, res) => {
    const { email, first_name, last_name, password } = req.body;

    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: "email, first_name, last_name and password are required" });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.status(400).json({ error: "User with this email already exists" });
    }

    const newUser = {
        id: nanoid(),
        email: email,
        first_name: first_name,
        last_name: last_name,
        password: await hashPassword(password)
    };

    users.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Авторизация пользователя
 *     description: Проверяет email и пароль пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: ivan@example.com
 *               password:
 *                 type: string
 *                 example: qwerty123
 *     responses:
 *       200:
 *         description: Успешная авторизация
 *       401:
 *         description: Неверные учетные данные
 */

app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "email and password are required" });
    }

    const user = findUserOr404(email, res);
    if (!user) return;

    const isAuthenticated = await verifyPassword(password, user.password);

    if (!isAuthenticated) {
        return res.status(401).json({ error: "Invalid credentials" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    refreshTokens.add(refreshToken);

    res.status(200).json({
        accessToken,
        refreshToken
    });
});

app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            error: "Refresh token required",
        });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({
            error: "Invalid refresh token",
        });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);

        const user = users.find(u => u.id === payload.sub);
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        refreshTokens.delete(refreshToken);

        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);

        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (err) {
        return res.status(401).json({
            error: "Invalid or expired refresh token",
        });
    }
});

app.get("/api/auth/me", authMiddleware, (req, res) => {
    const userId = req.user.sub;

    const user = users.find(u => u.id === userId);

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    const { password, ...userWithoutPassword } = user;

    res.json(userWithoutPassword);
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать товар
 *     description: Создает новый товар
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - description
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *                 example: Ноутбук
 *               category:
 *                 type: string
 *                 example: Электроника
 *               description:
 *                 type: string
 *                 example: Мощный ноутбук для игр и работы
 *               price:
 *                 type: number
 *                 example: 60000
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *       400:
 *         description: Некорректные данные
 */

app.post("/api/products", async (req, res) => {
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
        createdAt: new Date().toISOString()
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список товаров
 *     description: Возвращает список всех товаров
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список товаров успешно получен
 */

app.get("/api/products", (req, res) => {
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
 *     description: Возвращает параметры товара
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар успешно найден
 *       404:
 *         description: Товар не найден
 */

app.get("/api/products/:id", authMiddleware, (req, res) => {
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
 *     description: Обновляет товар по id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Товар успешно обновлен
 *       400:
 *         description: Некорректные данные
 *       404:
 *         description: Товар не найден
 */

app.put("/api/products/:id", authMiddleware, (req, res) => {
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
    
    products[productIndex] = updatedProduct;
    res.status(200).json(updatedProduct);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар
 *     description: Удаляет товар по id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар успешно удален
 *       404:
 *         description: Товар не найден
 */

app.delete("/api/products/:id", authMiddleware, (req, res) => {
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

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${port}/api-docs`);
});