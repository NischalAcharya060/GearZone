import React, { createContext, useState, useContext } from 'react';

const CompareContext = createContext();

export const useCompare = () => {
    const context = useContext(CompareContext);
    if (!context) {
        throw new Error('useCompare must be used within a CompareProvider');
    }
    return context;
};

export const CompareProvider = ({ children }) => {
    const [compareItems, setCompareItems] = useState([]);

    const addToCompare = (product) => {
        setCompareItems(prevItems => {
            // Limit to 2 items
            if (prevItems.length >= 2) {
                return prevItems;
            }
            if (prevItems.find(item => item.id === product.id)) {
                return prevItems;
            }
            return [...prevItems, product];
        });
    };

    const removeFromCompare = (productId) => {
        setCompareItems(prevItems => prevItems.filter(item => item.id !== productId));
    };

    const clearCompare = () => {
        setCompareItems([]);
    };

    const canAddToCompare = () => {
        return compareItems.length < 2;
    };

    const value = {
        compareItems,
        addToCompare,
        removeFromCompare,
        clearCompare,
        canAddToCompare,
    };

    return (
        <CompareContext.Provider value={value}>
            {children}
        </CompareContext.Provider>
    );
};