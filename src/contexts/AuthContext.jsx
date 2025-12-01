import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);

  const getSafeSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        if (
          error.message?.includes("storage") ||
          error.message?.includes("localStorage") ||
          error.message?.includes("404") ||
          error.message?.includes("NOT_FOUND")
        ) {
          console.warn("Storage not available (incognito mode?)", error);
          setStorageError(true);
          return null;
        }
        throw error;
      }

      return session?.user ?? null;
    } catch (error) {
      console.error("Error getting session:", error);
      setStorageError(true);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const isStorageAvailable = () => {
          try {
            localStorage.setItem("test", "test");
            localStorage.removeItem("test");
            return true;
          } catch {
            return false;
          }
        };

        if (!isStorageAvailable()) {
          console.warn("Storage not available - incognito mode detected");
          setStorageError(true);
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
          return;
        }

        const sessionUser = await getSafeSession();

        if (mounted) {
          setUser(sessionUser);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (mounted) {
          setUser(null);
          setLoading(false);
          setStorageError(true);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        try {
          if (event === "SIGNED_OUT" || event === "USER_DELETED") {
            setUser(null);
          } else if (session?.user) {
            setUser(session.user);
          }
          setLoading(false);
        } catch (error) {
          console.error("Auth state change error:", error);
          setUser(null);
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (credentials) => {
    try {
      if (storageError) {
        throw new Error(
          "Storage not available. Please disable incognito mode or allow cookies."
        );
      }
      return await supabase.auth.signUp(credentials);
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const signIn = async (credentials) => {
    try {
      if (storageError) {
        throw new Error(
          "Storage not available. Please disable incognito mode or allow cookies."
        );
      }
      return await supabase.auth.signInWithPassword(credentials);
    } catch (error) {
      console.error("Signin error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (storageError) {
        throw new Error(
          "Storage not available. Please disable incognito mode or allow cookies."
        );
      }
      return await supabase.auth.signInWithOAuth({
        provider: "google",
      });
    } catch (error) {
      console.error("Google signin error:", error);
      throw error;
    }
  };

  const signInWithFacebook = async () => {
    try {
      if (storageError) {
        throw new Error(
          "Storage not available. Please disable incognito mode or allow cookies."
        );
      }
      return await supabase.auth.signInWithOAuth({
        provider: "facebook",
      });
    } catch (error) {
      console.error("Facebook signin error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error("Signout error:", error);
      setUser(null);
      return { error };
    }
  };

  const value = {
    user,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    loading,
    storageError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
