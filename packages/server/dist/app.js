"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
const socket_1 = require("./socket");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});
(0, socket_1.initializeSocket)(io);
// Connect to MongoDB
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/rocketchat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('MongoDB connection error:', err);
});
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
        },
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 5, // stricter for auth
    message: {
        error: 'Too many authentication attempts, please try again later.'
    },
});
app.use('/api/auth', authLimiter);
app.use('/api', limiter);
// Body parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
    next();
});
// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'default_secret', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};
// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }
        // Check if user exists (simplified, in real app use database)
        // For now, assume not exists
        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt_1.default.hash(password, saltRounds);
        // Create user (simplified)
        const user = {
            _id: new mongoose_1.default.Types.ObjectId().toString(),
            username,
            email,
            passwordHash,
            displayName: username,
            roles: ['user'],
            status: 'offline',
            permissions: [],
            sessions: [],
            preferences: {
                theme: 'light',
                language: 'en',
                timezone: 'UTC',
                notifications: {
                    desktop: true,
                    mobile: true,
                    email: true,
                    mentions: true,
                    dms: true,
                    channels: [],
                    threads: true,
                    reactions: true,
                    mutedUsers: [],
                    mutedChannels: []
                },
                privacy: {
                    showOnlineStatus: true,
                    showLastSeen: true,
                    allowDirectMessages: true,
                    allowFileUploads: true,
                    allowVoiceCalls: true,
                    allowVideoCalls: true
                },
                sound: {
                    message: true,
                    mention: true,
                    dm: true,
                    channel: true,
                    thread: true,
                    reaction: true,
                    volume: 50
                },
                display: {
                    compactView: false,
                    showAvatars: true,
                    showUsernames: true,
                    showTimestamps: true,
                    timestampFormat: 'HH:mm',
                    messageDensity: 'comfortable',
                    sidebarWidth: 260,
                    fontSize: 'medium'
                }
            },
            profile: {
                firstName: '',
                lastName: '',
                bio: '',
                location: '',
                website: '',
                socialLinks: [],
                customFields: {}
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            isActive: true,
            isVerified: false,
            twoFactorEnabled: false
        };
        // Save to DB (simplified)
        // await UserModel.create(user);
        // Generate token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username, roles: user.roles }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        res.status(201).json({
            token,
            user: { ...user, passwordHash: undefined },
            message: 'User registered successfully'
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        // Find user (simplified)
        // const user = await UserModel.findOne({ email });
        let user = null; // Placeholder
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Check password
        const isValidPassword = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Generate token
        const token = jsonwebtoken_1.default.sign({ userId: user._id, username: user.username, roles: user.roles }, process.env.JWT_SECRET || 'default_secret', { expiresIn: '24h' });
        res.json({
            token,
            user: { ...user, passwordHash: undefined },
            message: 'Login successful'
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Protected routes
app.get('/api/user/profile', authenticateToken, (req, res) => {
    // Return user profile
    res.json({ user: req.user });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors
        });
    }
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID format'
        });
    }
    if (err.code === 11000) {
        return res.status(409).json({
            error: 'Duplicate entry'
        });
    }
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
// Export for testing
exports.default = app;
//# sourceMappingURL=app.js.map