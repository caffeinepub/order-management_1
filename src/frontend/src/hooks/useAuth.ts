import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { AppUser } from "../backend.d";
import { useActor } from "./useActor";

const SESSION_KEY = "om_session";

// BigInt-safe JSON serialization
function serializeUser(user: AppUser): string {
  return JSON.stringify(user, (_, v) =>
    typeof v === "bigint" ? `__bigint__${v.toString()}` : v,
  );
}

function deserializeUser(raw: string): AppUser | null {
  try {
    return JSON.parse(raw, (_, v) => {
      if (typeof v === "string" && v.startsWith("__bigint__")) {
        return BigInt(v.slice(10));
      }
      return v;
    });
  } catch {
    return null;
  }
}

export interface AuthContextValue {
  currentUser: AppUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AppUser>;
  register: (username: string, password: string) => Promise<AppUser>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuthProvider(): AuthContextValue {
  const { actor, isFetching } = useActor();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      return stored ? deserializeUser(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const sessionValidated = useRef(false);

  useEffect(() => {
    if (!actor || isFetching || sessionValidated.current) return;
    sessionValidated.current = true;
  }, [actor, isFetching]);

  const persistUser = useCallback((user: AppUser | null) => {
    if (user) {
      localStorage.setItem(SESSION_KEY, serializeUser(user));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setCurrentUser(user);
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      if (!actor) throw new Error("Backend not ready");
      setIsLoading(true);
      try {
        const user = await actor.loginWithPassword(username, password);
        if (!user) throw new Error("Invalid username or password");
        persistUser(user);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    [actor, persistUser],
  );

  const register = useCallback(
    async (username: string, password: string) => {
      if (!actor) throw new Error("Backend not ready");
      setIsLoading(true);
      try {
        await actor.registerWithPassword(username, password);
        const user = await actor.loginWithPassword(username, password);
        if (!user) throw new Error("Registration succeeded but login failed");
        persistUser(user);
        return user;
      } finally {
        setIsLoading(false);
      }
    },
    [actor, persistUser],
  );

  const logout = useCallback(() => {
    persistUser(null);
  }, [persistUser]);

  return {
    currentUser,
    isLoading: isLoading || isFetching,
    login,
    register,
    logout,
  };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
