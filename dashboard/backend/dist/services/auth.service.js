"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const google_auth_library_1 = require("google-auth-library");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    constructor() {
        this.oauthClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    getAuthUrl() {
        return this.oauthClient.generateAuthUrl({
            access_type: 'offline',
            scope: [
                'https://www.googleapis.com/auth/userinfo.profile',
                'https://www.googleapis.com/auth/userinfo.email',
            ],
        });
    }
    async verifyGoogleToken(token) {
        try {
            const ticket = await this.oauthClient.verifyIdToken({
                idToken: token,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            const payload = ticket.getPayload();
            if (!payload) {
                throw new Error('Invalid token payload');
            }
            return {
                email: payload.email,
                name: payload.name,
                picture: payload.picture,
                sub: payload.sub,
            };
        }
        catch (error) {
            throw new Error('Invalid Google token');
        }
    }
    generateJWT(user) {
        const session = {
            id: user.sub,
            email: user.email,
            name: user.name,
            picture: user.picture,
        };
        return jsonwebtoken_1.default.sign(session, process.env.JWT_SECRET, {
            expiresIn: '24h',
        });
    }
    verifyJWT(token) {
        try {
            return jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid JWT token');
        }
    }
}
exports.AuthService = AuthService;
