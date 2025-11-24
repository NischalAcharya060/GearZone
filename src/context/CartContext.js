import React, { createContext, useState, useContext } from 'react';
import { Alert } from 'react-native';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const { user } = useAuth();

    const addToCart = (product, navigation) => {
        // Check if user is logged in
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to add items to your cart',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Sign In',
                        onPress: () => navigation.navigate('SignIn')
                    }
                ]
            );
            throw new Error('User must be logged in to add to cart');
        }

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });

        // Return success message
        return { success: true, message: `${product.name} added to cart` };
    };

    const addToCartDirect = (product) => {
        // Direct add without navigation parameter (for internal use)
        if (!user) {
            throw new Error('User must be logged in to add to cart');
        }

        setCartItems(prevItems => {
            const existingItem = prevItems.find(item => item.id === product.id);
            if (existingItem) {
                return prevItems.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prevItems, { ...product, quantity: 1 }];
        });

        return { success: true, message: `${product.name} added to cart` };
    };

    const removeFromCart = (productId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
        return { success: true, message: 'Item removed from cart' };
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity < 1) {
            return removeFromCart(productId);
        }
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === productId ? { ...item, quantity: newQuantity } : item
            )
        );
        return { success: true, message: 'Quantity updated' };
    };

    const clearCart = () => {
        setCartItems([]);
        return { success: true, message: 'Cart cleared' };
    };

    const getCartTotal = () => {
        return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartItemsCount = () => {
        return cartItems.reduce((total, item) => total + item.quantity, 0);
    };

    const getCartItem = (productId) => {
        return cartItems.find(item => item.id === productId);
    };

    const isInCart = (productId) => {
        return cartItems.some(item => item.id === productId);
    };

    const getCartSummary = () => {
        const subtotal = getCartTotal();
        const shipping = subtotal > 0 ? 9.99 : 0;
        const tax = subtotal * 0.08; // 8% tax
        const total = subtotal + shipping + tax;

        return {
            subtotal,
            shipping,
            tax,
            total,
            itemCount: getCartItemsCount()
        };
    };

    const bulkAddToCart = (products) => {
        if (!user) {
            throw new Error('User must be logged in to add items to cart');
        }

        setCartItems(prevItems => {
            let newItems = [...prevItems];

            products.forEach(product => {
                const existingItem = newItems.find(item => item.id === product.id);
                if (existingItem) {
                    newItems = newItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + product.quantity || 1 }
                            : item
                    );
                } else {
                    newItems.push({ ...product, quantity: product.quantity || 1 });
                }
            });

            return newItems;
        });

        return { success: true, message: `${products.length} items added to cart` };
    };

    const moveToCartFromWishlist = (wishlistItems, navigation) => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to add items to your cart',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Sign In',
                        onPress: () => navigation.navigate('SignIn')
                    }
                ]
            );
            throw new Error('User must be logged in to add to cart');
        }

        setCartItems(prevItems => {
            let newItems = [...prevItems];

            wishlistItems.forEach(product => {
                const existingItem = newItems.find(item => item.id === product.id);
                if (existingItem) {
                    newItems = newItems.map(item =>
                        item.id === product.id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    newItems.push({ ...product, quantity: 1 });
                }
            });

            return newItems;
        });

        return { success: true, message: `${wishlistItems.length} items moved to cart` };
    };

    const value = {
        cartItems,
        addToCart,
        addToCartDirect,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartItemsCount,
        getCartItem,
        isInCart,
        getCartSummary,
        bulkAddToCart,
        moveToCartFromWishlist,
        canPerformAction: !!user,
        userCartStatus: user ? 'active' : 'requires_login'
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};