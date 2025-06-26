"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    constructor() {
        // Get Google OAuth URL
        this.getGoogleAuthUrl = (req, res) => {
            try {
                const url = this.authService.getAuthUrl();
                res.json({ url });
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to generate auth URL' });
            }
        };
        // Handle Google OAuth callback
        this.handleGoogleCallback = async (req, res) => {
            try {
                const { token } = req.body;
                if (!token) {
                    res.status(400).json({ error: 'No token provided' });
                    return;
                }
                const user = await this.authService.verifyGoogleToken(token);
                const accessToken = this.authService.generateJWT(user);
                res.json({
                    accessToken,
                    user: {
                        id: user.sub,
                        email: user.email,
                        name: user.name,
                        picture: user.picture,
                    },
                });
            }
            catch (error) {
                res.status(401).json({ error: 'Authentication failed' });
            }
        };
        // Verify JWT token
        this.verifyToken = async (req, res) => {
            try {
                const authHeader = req.headers.authorization;
                if (!authHeader?.startsWith('Bearer ')) {
                    res.status(401).json({ error: 'No token provided' });
                    return;
                }
                const token = authHeader.split(' ')[1];
                const user = this.authService.verifyJWT(token);
                res.json({ user });
            }
            catch (error) {
                res.status(401).json({ error: 'Invalid token' });
            }
        };
        this.authService = auth_service_1.AuthService.getInstance();
    }
}
exports.AuthController = AuthController;
