import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (credentials) => {
    return await supabase.auth.signUp(credentials);
  };

  const signIn = async (credentials) => {
    return await supabase.auth.signInWithPassword(credentials);
  };

  const signInWithGoogle = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: "google",
    });
  };

  const signInWithFacebook = async () => {
    return await supabase.auth.signInWithOAuth({
      provider: "facebook",
    });
  };

  const signOut = async () => {
    try {
      setUser(null);

      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase signOut error:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected error during signOut:", error);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
