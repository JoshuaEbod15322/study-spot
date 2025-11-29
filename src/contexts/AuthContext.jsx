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
      // Handle SIGNED_OUT event explicitly
      if (event === "SIGNED_OUT" || !session) {
        setUser(null);
        setLoading(false);
        return;
      }
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

<<<<<<< HEAD
      // Sign out from Supabase with global scope to clear all tabs
      const { error } = await supabase.auth.signOut({ scope: "global" });

      // Clear all storage types (PWA may use multiple storage mechanisms)
      if (typeof window !== "undefined") {
        // Clear localStorage
        const storageKey = "supabase.auth.token";
        localStorage.removeItem(storageKey);
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            localStorage.removeItem(key);
          }
        });

        // Clear sessionStorage
        sessionStorage.clear();

        // Clear IndexedDB (Supabase uses IndexedDB in PWA)
        if ("indexedDB" in window) {
          try {
            const databases = await indexedDB.databases();
            await Promise.all(
              databases.map((db) => {
                if (db.name && (db.name.includes("supabase") || db.name.includes("realtime"))) {
                  return new Promise((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name);
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => reject(deleteReq.error);
                    deleteReq.onblocked = () => resolve(); // Still resolve if blocked
                  });
                }
                return Promise.resolve();
              })
            );
          } catch (idbError) {
            console.warn("Error clearing IndexedDB:", idbError);
          }
        }

        // Clear ALL service worker caches to ensure no auth data persists
        if ("caches" in window) {
          try {
            const cacheNames = await caches.keys();
            await Promise.all(
              cacheNames.map(async (cacheName) => {
                // Clear all caches, not just supabase ones
                await caches.delete(cacheName);
              })
            );
            console.log("All service worker caches cleared on logout");
          } catch (cacheError) {
            console.warn("Error clearing service worker cache:", cacheError);
          }
        }
      }
=======
      const { error } = await supabase.auth.signOut();
>>>>>>> 74e1ba1205811d35b29dafdbe657c3072ce8eeb5

      if (error) {
        console.error("Supabase signOut error:", error);
        return { error };
      }

      return { error: null };
    } catch (error) {
      console.error("Unexpected error during signOut:", error);
<<<<<<< HEAD
      // Even if there's an unexpected error, clear local state and storage
=======
>>>>>>> 74e1ba1205811d35b29dafdbe657c3072ce8eeb5
      setUser(null);
      if (typeof window !== "undefined") {
        const storageKey = "supabase.auth.token";
        localStorage.removeItem(storageKey);
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith("sb-") || key.includes("supabase")) {
            localStorage.removeItem(key);
          }
        });
        sessionStorage.clear();
      }
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
