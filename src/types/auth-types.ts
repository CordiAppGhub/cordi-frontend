export interface AuthUser {
  id: number;
  email: string;
  name?: string | null;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: AuthUser;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
}