import { apiClient, API_BASE_URL } from './api';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

class AuthService {
  private static instance: AuthService;
  private token: string | null = null;
  private user: User | null = null;

  private constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');
      if (userData) {
        try {
          this.user = JSON.parse(userData);
        } catch (error) {
          console.error('Failed to parse user data:', error);
          this.clearAuth();
        }
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Initialize Google Sign-In
  public async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth can only be initialized in browser'));
        return;
      }

      // Load Google Sign-In script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
            callback: this.handleGoogleResponse.bind(this),
          });
          resolve();
        } else {
          reject(new Error('Google Sign-In failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
      document.head.appendChild(script);
    });
  }

  // Handle Google Sign-In response
  private async handleGoogleResponse(response: any): Promise<void> {
    try {
      const credential = response.credential;
      
      // Send credential to backend for verification
      const authResponse = await fetch(`${API_BASE_URL}/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential }),
      });

      if (!authResponse.ok) {
        throw new Error('Authentication failed');
      }

      const data: AuthResponse = await authResponse.json();
      this.setAuth(data.token, data.user);
      
      // Reload page to update UI
      window.location.reload();
    } catch (error) {
      console.error('Google Sign-In error:', error);
      throw error;
    }
  }

  // Render Google Sign-In button
  public renderSignInButton(elementId: string): void {
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId)!,
        {
          theme: 'outline',
          size: 'large',
          width: 300,
        }
      );
    }
  }

  // Sign out
  public signOut(): void {
    this.clearAuth();
    if (typeof window !== 'undefined' && window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    window.location.reload();
  }

  // Set authentication data
  private setAuth(token: string, user: User): void {
    this.token = token;
    this.user = user;
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
    }
  }

  // Clear authentication data
  private clearAuth(): void {
    this.token = null;
    this.user = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    }
  }

  // Get current token
  public getToken(): string | null {
    return this.token;
  }

  // Get current user
  public getUser(): User | null {
    return this.user;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  // Get authorization header for API requests
  public getAuthHeader(): { Authorization: string } | {} {
    if (this.token) {
      console.log('Auth: Using token for API request', {
        hasToken: !!this.token,
        tokenLength: this.token.length,
        tokenPreview: this.token.substring(0, 20) + '...'
      });
      return { Authorization: `Bearer ${this.token}` };
    } else {
      console.warn('Auth: No token available for API request');
      return {};
    }
  }
}

// Global Google types
declare global {
  interface Window {
    google: any;
  }
}

export const authService = AuthService.getInstance();
export type { User }; 