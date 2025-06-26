import { Request } from 'express';

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
  picture: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: UserSession;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture: string;
  };
} 