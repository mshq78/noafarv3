import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { User } from '../types';
import {
  getMe,
  logout as apiLogout,
  loginWithEmail as apiLoginWithEmail,
  registerWithEmail as apiRegisterWithEmail,
  requestOtp as apiRequestOtp,
  resetPassword as apiResetPassword,
  verifyOtp as apiVerifyOtp,
  type OtpRequestResult,
} from './endpoints';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'MERGE_USER'; payload: Partial<User> }
  | { type: 'READY' };

const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true, isLoading: false };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'MERGE_USER':
      return state.user
        ? { ...state, user: { ...state.user, ...action.payload } }
        : state;
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false };
    case 'READY':
      return { ...state, isLoading: false };
    default:
      return state;
  }
}

export interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
  requestOtp: (phone: string) => Promise<OtpRequestResult>;
  verifyOtp: (phone: string, code: string) => Promise<{ user: User }>;
  loginWithEmail: (email: string, password: string) => Promise<{ user: User }>;
  registerWithEmail: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<{ user: User }>;
  resetPassword: (token: string, password: string) => Promise<{ user: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  /**
   * The session lives in an httpOnly cookie, so the only way to know who the
   * visitor is, is to ask the server. Nothing about identity or role is read
   * from localStorage, which is what made the old client-side "admin" flag
   * forgeable.
   */
  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((user) => {
        if (!cancelled) dispatch({ type: 'LOGIN', payload: user });
      })
      .catch(() => {
        if (!cancelled) dispatch({ type: 'LOGOUT' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback((user: User) => {
    dispatch({ type: 'LOGIN', payload: user });
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    dispatch({ type: 'MERGE_USER', payload: updatedFields });
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const freshUser = await getMe();
      dispatch({ type: 'SET_USER', payload: freshUser });
    } catch {
      // A refresh failure must not sign the user out of a working session.
    }
  }, []);

  const requestOtp = useCallback((phone: string) => apiRequestOtp(phone), []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await apiVerifyOtp(phone, code);
    dispatch({ type: 'LOGIN', payload: result.user });
    return { user: result.user };
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const result = await apiLoginWithEmail(email, password);
    dispatch({ type: 'LOGIN', payload: result.user });
    return { user: result.user };
  }, []);

  const registerWithEmail = useCallback(
    async (email: string, password: string, displayName?: string) => {
      const result = await apiRegisterWithEmail(email, password, displayName);
      dispatch({ type: 'LOGIN', payload: result.user });
      return { user: result.user };
    },
    [],
  );

  const resetPassword = useCallback(async (token: string, password: string) => {
    const result = await apiResetPassword(token, password);
    dispatch({ type: 'LOGIN', payload: result.user });
    return { user: result.user };
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      ...state,
      login,
      logout: handleLogout,
      updateUser,
      refreshProfile,
      requestOtp,
      verifyOtp,
      loginWithEmail,
      registerWithEmail,
      resetPassword,
    }),
    [
      state,
      login,
      handleLogout,
      updateUser,
      refreshProfile,
      requestOtp,
      verifyOtp,
      loginWithEmail,
      registerWithEmail,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/** True for roles allowed into the admin panel. */
export function isOperatorRole(role: User['role'] | undefined): boolean {
  return role === 'admin' || role === 'operator';
}
