// src/context/UserContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

interface UserContextType {
  id: string;
  name: string;
  // Add other user properties as needed
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserContextType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch('/api/users'); // Adjust the endpoint as needed
      if (res.ok) {
        const userData: UserContextType = await res.json();
        setUser(userData);
      }
    };

    fetchUser();
  }, []);

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  return useContext(UserContext);
};
