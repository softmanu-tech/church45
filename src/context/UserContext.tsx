// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  name: string;
  // Add other user properties as needed
}

const UserContext = createContext<User | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser ] = useState<User | null>(null);

  useEffect(() => {
    // Fetch user data from your API or session
    const fetchUser  = async () => {
      const res = await fetch('/api/user'); // Adjust the endpoint as needed
      if (res.ok) {
        const userData = await res.json();
        setUser (userData);
      }
    };

    fetchUser ();
  }, []);

  return <User Context.Provider value={user}>{children}</User Context.Provider>;
};

export const useUser  = () => {
  return useContext(UserContext);
};
