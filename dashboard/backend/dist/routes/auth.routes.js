"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Get Google OAuth URL
router.get('/google/url', authController.getGoogleAuthUrl);
// Handle Google OAuth callback
router.post('/google/callback', authController.handleGoogleCallback);
// Verify JWT token
router.get('/verify', authController.verifyToken);
exports.default = router;
