require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

let db;

async function connectDB() {
    try {
        const client = new MongoClient(process.env.MONGO_URI);
        await client.connect();
        db = client.db(); // Use default database from connection string
        console.log('Connected to MongoDB');
        await seedCommissions(); // Seed commissions if collection is empty

    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

// Middleware to make db accessible to routes (and mockable in tests)
app.use((req, res, next) => {
    req.db = db;
    next();
});

if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is not set.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

async function seedCommissions() {
    const commissionsCollection = db.collection('commissions');
    const count = await commissionsCollection.countDocuments();

    if (count === 0) {
        console.log('Seeding "commissions" collection...');
        const commissionData = {
            //'AM': { description: 'MORNING DIVE', price: 30, commission: 6 },
            //'WEEKEND': { description: 'WEEKEND DIVE', price: 40, commission: 8 }
        };
        const documents = Object.entries(commissionData).map(([code, data]) => ({
            _id: code,
            ...data
        }));
        if (documents.length > 0) {
            await commissionsCollection.insertMany(documents);
            console.log('Commissions seeded successfully.');
        }
    }
}

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_LOGIN_ATTEMPTS = 10;

function loginRateLimiter(req, res, next) {
    const ip = req.ip;
    const now = Date.now();
    const entry = loginAttempts.get(ip);

    if (entry && now - entry.firstAttempt < LOGIN_WINDOW_MS) {
        if (entry.count >= MAX_LOGIN_ATTEMPTS) {
            return res.status(429).json({ message: 'Too many login attempts. Try again later.' });
        }
        entry.count++;
    } else {
        loginAttempts.set(ip, { count: 1, firstAttempt: now });
    }
    next();
}

// Clean up expired entries every 15 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of loginAttempts) {
        if (now - entry.firstAttempt >= LOGIN_WINDOW_MS) {
            loginAttempts.delete(ip);
        }
    }
}, LOGIN_WINDOW_MS);

// --- API Routes ---

// Get commission data from the database
app.get('/api/commissions', authenticateToken, async (req, res) => {
    const commissionsArray = await req.db.collection('commissions').find({}).toArray();
    // Convert array of documents back to an object keyed by _id for the frontend
    const commissionData = commissionsArray.reduce((acc, item) => {
        acc[item._id] = { description: item.description, price: item.price, commission: item.commission };
        return acc;
    }, {});
    res.json(commissionData);
});

// Login
app.post('/api/login', loginRateLimiter, async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = req.db.collection('users');
    const user = await users.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
        const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: 'Login successful', username: user.username, token });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

// Get user data
app.get('/api/data/:username', authenticateToken, async (req, res) => {
    const { username } = req.params;
    const requester = req.user.username;
    
    // Allow access if it's the user's own data OR if the requester is 'renita'
    if (requester !== username && requester.toLowerCase() !== 'renita') {
        return res.sendStatus(403);
    }

    const user = await req.db.collection('users').findOne({ username });

    if (user) {
        res.json(user.payrollData || {});
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Save user data
app.post('/api/data/:username', authenticateToken, async (req, res) => {
    const { username } = req.params;

    if (req.user.username !== username) {
        return res.sendStatus(403);
    }

    const data = req.body;

    const result = await req.db.collection('users').updateOne(
        { username },
        { $set: { payrollData: data } }
    );

    if (result.modifiedCount > 0) {
        res.json({ message: 'Data saved successfully' });
    } else {
        res.status(404).json({ message: 'User not found or data was unchanged' });
    }
});

// Get list of users (Admin/Renita only)
app.get('/api/users', authenticateToken, async (req, res) => {
    if (req.user.username.toLowerCase() !== 'renita') {
        return res.sendStatus(403);
    }

    // Return list of usernames
    const users = await req.db.collection('users').find({}, { projection: { username: 1 } }).toArray();
    res.json(users.map(u => u.username));
});

// --- Serve Frontend ---

// Serve login page for the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the main app
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Only start the server if run directly (not imported by tests)
if (require.main === module) {
    connectDB().then(() => {
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
        });
    });
}

module.exports = { app, setTestDB: (mockDb) => { db = mockDb; } };