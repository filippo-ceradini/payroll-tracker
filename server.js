require('dotenv').config();
const express = require('express');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const path = require('path');

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

        // Seed the database with the default user if it doesn't exist
        await seedDatabase();

    } catch (err) {
        console.error('Failed to connect to MongoDB', err);
        process.exit(1);
    }
}

async function seedDatabase() {
    const users = db.collection('users');
    const userExists = await users.findOne({ username: 'john_doe' });

    if (!userExists) {
        console.log('Seeding database with user: john_doe');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('1234', salt);
        await users.insertOne({
            username: 'john_doe',
            password: hashedPassword,
            payrollData: {}
        });
    }
}

// --- API Routes ---

// Login
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }

    const users = db.collection('users');
    const user = await users.findOne({ username });

    if (user && (await bcrypt.compare(password, user.password))) {
        // In a real app, you'd return a JWT here. For simplicity, we'll use the username.
        res.json({ message: 'Login successful', username: user.username });
    } else {
        res.status(401).json({ message: 'Invalid username or password.' });
    }
});

// Get user data
app.get('/api/data/:username', async (req, res) => {
    const { username } = req.params;
    const user = await db.collection('users').findOne({ username });

    if (user) {
        res.json(user.payrollData || {});
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// Save user data
app.post('/api/data/:username', async (req, res) => {
    const { username } = req.params;
    const data = req.body;

    const result = await db.collection('users').updateOne(
        { username },
        { $set: { payrollData: data } }
    );

    if (result.modifiedCount > 0) {
        res.json({ message: 'Data saved successfully' });
    } else {
        res.status(404).json({ message: 'User not found or data was unchanged' });
    }
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

connectDB().then(() => {
    app.listen(port, () => {
        console.log(`Server running on http://localhost:${port}`);
    });
});