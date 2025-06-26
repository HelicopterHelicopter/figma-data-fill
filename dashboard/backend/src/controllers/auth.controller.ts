import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = AuthService.getInstance();
  }

  // Get Google OAuth URL
  public getGoogleAuthUrl = (req: Request, res: Response): void => {
    try {
      const url = this.authService.getAuthUrl();
      res.json({ url });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate auth URL' });
    }
  };

  // Handle Google Sign-In JWT token
  public handleGoogleSignIn = async (req: Request, res: Response): Promise<void> => {
    try {
      const { credential } = req.body;
      if (!credential) {
        res.status(400).json({ error: 'No credential provided' });
        return;
      }

      const user = await this.authService.verifyGoogleToken(credential);
      const accessToken = this.authService.generateJWT(user);

      res.json({
        token: accessToken,
        user: {
          id: user.sub,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      res.status(401).json({ error: 'Authentication failed' });
    }
  };

  // Verify JWT token
  public verifyToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const user = this.authService.verifyJWT(token);
      res.json({ user });
    } catch (error) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
} 