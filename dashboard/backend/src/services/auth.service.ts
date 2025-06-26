import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { GoogleUser, UserSession } from '../types/auth';
import { config } from '../config';

export class AuthService {
  private static instance: AuthService;
  private oauthClient: OAuth2Client;

  private constructor() {
    this.oauthClient = new OAuth2Client(
      config.google.clientId,
      config.google.clientSecret
    );
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getAuthUrl(): string {
    return this.oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
    });
  }

  async verifyGoogleToken(token: string): Promise<GoogleUser> {
    try {
      const ticket = await this.oauthClient.verifyIdToken({
        idToken: token,
        audience: config.google.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid token payload');
      }

      return {
        email: payload.email!,
        name: payload.name!,
        picture: payload.picture!,
        sub: payload.sub!,
      };
    } catch (error) {
      throw new Error('Invalid Google token');
    }
  }

  generateJWT(user: GoogleUser): string {
    const session: UserSession = {
      id: user.sub,
      email: user.email,
      name: user.name,
      picture: user.picture,
    };

    const options: jwt.SignOptions = {
      expiresIn: config.jwt.accessTokenExpiry,
    };
    
    return jwt.sign(session, config.jwt.secret, options);
  }

  verifyJWT(token: string): UserSession {
    try {
      return jwt.verify(token, config.jwt.secret) as UserSession;
    } catch (error) {
      throw new Error('Invalid JWT token');
    }
  }
} 