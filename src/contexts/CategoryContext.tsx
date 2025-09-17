import React, { createContext, useContext, useState, ReactNode } from 'react';

interface CategoryContextType {
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    console.log('🔄 CategoryContext: Triggering category refresh');
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <CategoryContext.Provider value={{ refreshTrigger, triggerRefresh }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategoryContext = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategoryContext must be used within a CategoryProvider');
  }
  return context;
};