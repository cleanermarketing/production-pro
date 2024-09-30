import React, { createContext, useState, useContext, ReactNode } from "react";
import axios from "axios";

interface UserContextType {
  isClockedIn: boolean;
  setIsClockedIn: (value: boolean) => void;
  itemsPressed: number;
  setItemsPressed: React.Dispatch<React.SetStateAction<number>>;
  fetchItemsPressed: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [itemsPressed, setItemsPressed] = useState<number>(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      return parsedUser.itemsPressed || 0;
    }
    return 0;
  });

  const updateItemsPressed = (value: React.SetStateAction<number>) => {
    const newCount = typeof value === "function" ? value(itemsPressed) : value;
    setItemsPressed(newCount);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const updatedUser = { ...user, itemsPressed: newCount };
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const fetchItemsPressed = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const response = await axios.get(
        `http://localhost:5000/api/stats/today?userId=${user.id}`
      );
      setItemsPressed(response.data.itemsPressed);

      // Update the user object in localStorage with the new itemsPressed value
      const updatedUser = { ...user, itemsPressed: response.data.itemsPressed };
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error fetching items pressed:", error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        isClockedIn,
        setIsClockedIn,
        itemsPressed,
        setItemsPressed: updateItemsPressed,
        fetchItemsPressed,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
