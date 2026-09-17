import { createContext, useContext, useState, useEffect } from "react";
import { api, setAuthToken } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [selectedRestaurantId, setSelectedRestaurantIdState] = useState(() => localStorage.getItem("selectedRestaurantId"));

  useEffect(() => {
    const checkAuthSession = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        setAuthToken(storedToken);
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
          setToken(storedToken);
          if (userData.restaurantId) {
            setSelectedRestaurantId(userData.restaurantId);
          }
        } catch (_) {
          // Token expired or invalid
          setAuthToken(null);
          localStorage.removeItem("token");
          localStorage.removeItem("selectedRestaurantId");
          setToken(null);
          setUser(null);
        }
      } else {
        setAuthToken(null);
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    checkAuthSession();
  }, []);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    setAuthToken(data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.user.restaurantId) {
      setSelectedRestaurantId(data.user.restaurantId);
    }
    return data.user;
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("selectedRestaurantId");
    setToken(null);
    setUser(null);
    setSelectedRestaurantIdState(null);
  };

  const setSelectedRestaurantId = (id) => {
    if (id) {
      localStorage.setItem("selectedRestaurantId", id);
      setSelectedRestaurantIdState(id);
    } else {
      localStorage.removeItem("selectedRestaurantId");
      setSelectedRestaurantIdState(null);
    }
  };

  const value = {
    user,
    token,
    role: user?.role,
    isAuthenticated: !!token && !!user,
    loading,
    selectedRestaurantId,
    setSelectedRestaurantId,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
