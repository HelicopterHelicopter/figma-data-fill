import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const router = Router();
const authController = new AuthController();

// Get Google OAuth URL
router.get('/google/url', authController.getGoogleAuthUrl);

// Handle Google Sign-In
router.post('/google', authController.handleGoogleSignIn);

// Verify JWT token
router.get('/verify', authController.verifyToken);

export default router; 