"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  authLogin,
  authLogout,
  authMe,
  authRegister,
  type ApiUser,
} from "@/lib/api";
import type { RoleSlug } from "@/lib/roles";

type AuthContextValue = {
  currentUser: ApiUser | null;
  isInitialized: boolean;
  initializationError: string | null;
  register: (data: Parameters<typeof authRegister>[0]) => Promise<ApiUser>;
  login: (
    email: string,
    password: string,
    role?: RoleSlug
  ) => Promise<ApiUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );

  useEffect(() => {
    let active = true;

    authMe()
      .then(({ user }) => {
        if (active) setCurrentUser(user);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (!(error instanceof ApiError) || error.status !== 401) {
          setInitializationError(
            error instanceof Error ? error.message : "Unable to restore session."
          );
        }
      })
      .finally(() => {
        if (active) setIsInitialized(true);
      });

    return () => {
      active = false;
    };
  }, []);

  async function register(
    data: Parameters<typeof authRegister>[0]
  ): Promise<ApiUser> {
    const { user } = await authRegister(data);
    setCurrentUser(user);
    setInitializationError(null);
    return user;
  }

  async function login(
    email: string,
    password: string,
    role?: RoleSlug
  ): Promise<ApiUser> {
    const { user } = await authLogin({ email, password, role });
    setCurrentUser(user);
    setInitializationError(null);
    return user;
  }

  async function logout(): Promise<void> {
    try {
      await authLogout();
    } finally {
      setCurrentUser(null);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isInitialized,
        initializationError,
        register,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
