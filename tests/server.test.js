const request = require('supertest');
const bcrypt = require('bcryptjs');
const { app, setTestDB } = require('../server');

// Mock Data
const mockUser = {
    username: 'testuser',
    password: 'hashedpassword',
    payrollData: { some: 'data' }
};

// Mock Database Collection
const mockCollection = {
    findOne: jest.fn(),
    updateOne: jest.fn()
};

// Mock Database
const mockDb = {
    collection: jest.fn().mockReturnValue(mockCollection)
};

describe('API Endpoints', () => {
    beforeAll(async () => {
        // Setup mock DB and password
        setTestDB(mockDb);
        mockUser.password = await bcrypt.hash('password123', 10);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/login', () => {
        test('should login successfully with correct credentials', async () => {
            mockCollection.findOne.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/login')
                .send({ username: 'testuser', password: 'password123' });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('token');
            expect(res.body.username).toBe('testuser');
        });

        test('should fail with incorrect password', async () => {
            mockCollection.findOne.mockResolvedValue(mockUser);

            const res = await request(app)
                .post('/api/login')
                .send({ username: 'testuser', password: 'wrongpassword' });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('GET /api/data/:username', () => {
        test('should return user data when authenticated', async () => {
            // 1. Login to get token
            mockCollection.findOne.mockResolvedValue(mockUser);
            const loginRes = await request(app)
                .post('/api/login')
                .send({ username: 'testuser', password: 'password123' });
            const token = loginRes.body.token;

            // 2. Request data
            const res = await request(app)
                .get('/api/data/testuser')
                .set('Authorization', `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toEqual(mockUser.payrollData);
            // Verify DB was called correctly
            expect(mockCollection.findOne).toHaveBeenCalledWith({ username: 'testuser' });
        });
    });
});