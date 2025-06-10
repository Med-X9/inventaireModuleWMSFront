export interface LoginForm {
  username: string;
  password: string;
  remember: boolean;
}

export interface LoginFormErrors {
  username?: string;
  password?: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  // Add other user properties as needed
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user?: User;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}