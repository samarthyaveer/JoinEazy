import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { authApi } from "@/services/api";

const AuthContext = createContext(null);

/**
 * Authentication Provider component that manages the user state.
 * @param {Object} props - React props.
 * @param {React.ReactNode} props.children - Child components.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const { data } = await authApi.getMe();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  /**
   * Logs a user in.
   * @param {string} email - User email.
   * @param {string} password - User password.
   * @returns {Promise<Object>} The authenticated user object.
   */
  const login = async (email, password) => {
    try {
      const { data } = await authApi.login({ email, password });
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Registers a new user.
   * @param {Object} userData - User registration details.
   * @returns {Promise<Object>} The newly registered user object.
   */
  const register = async (userData) => {
    try {
      const { data } = await authApi.register(userData);
      setUser(data.user);
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logs out the current user.
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Intentionally swallow logout errors but clear local user state.
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access Auth context.
 * @throws {Error} If used outside of AuthProvider.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
