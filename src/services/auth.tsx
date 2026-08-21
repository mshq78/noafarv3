import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '../types';
import { getAuthToken, setAuthToken, clearAuthToken } from './api';
import { requestOtp as apiRequestOtp, verifyOtp as apiVerifyOtp, getMe, syncMockUserWithFirebase } from './endpoints';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

type AuthAction =
  | { type: 'LOGIN'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean };

const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    default:
      return state;
  }
}

export interface AuthContextType extends AuthState {
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  refreshProfile: () => Promise<void>;
  requestOtp: (phone: string) => Promise<{ expiresInSeconds: number }>;
  verifyOtp: (phone: string, code: string) => Promise<{ token: string; user: User }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => {
    // Check localStorage on mount
    const savedToken = getAuthToken();
    const savedUserJson = localStorage.getItem('noafar:auth:user');
    
    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch custom user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          syncMockUserWithFirebase(userData);
          dispatch({ type: 'LOGIN', payload: { user: userData, token: await firebaseUser.getIdToken() } });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        // Clear auth state if firebase says logged out
        clearAuthToken();
        localStorage.removeItem('noafar:auth:user');
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (token: string, user: User) => {
    setAuthToken(token);
    syncMockUserWithFirebase(user);
    localStorage.setItem('noafar:auth:user', JSON.stringify(user));
    dispatch({ type: 'LOGIN', payload: { user, token } });
  };

  const handleLogout = async () => {
    await signOut(auth);
    clearAuthToken();
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (updatedFields: Partial<User>) => {
    if (state.user) {
      const newUser = { ...state.user, ...updatedFields };
      localStorage.setItem('noafar:auth:user', JSON.stringify(newUser));
      dispatch({ type: 'SET_USER', payload: newUser });
    }
  };

  const refreshProfile = async () => {
    try {
      const freshUser = await getMe();
      if (freshUser) {
        localStorage.setItem('noafar:auth:user', JSON.stringify(freshUser));
        dispatch({ type: 'SET_USER', payload: freshUser });
      }
    } catch {
      // Ignore
    }
  };

  const requestOtp = async (phone: string) => {
    return apiRequestOtp(phone);
  };

  const verifyOtp = async (phone: string, code: string) => {
    const res = await apiVerifyOtp(phone, code);
    login(res.token, res.user);
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout: handleLogout,
        updateUser,
        refreshProfile,
        requestOtp,
        verifyOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
