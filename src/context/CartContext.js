import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import { firestore } from '../firebase/config';
import {
    doc,
    setDoc,
    deleteDoc,
    collection,
    getDocs,
    query,
    where,
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
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
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Reference to user's cart collection
    const getCartRef = () => {
        if (!user) return null;
        return collection(firestore, 'users', user.uid, 'cart');
    };

    // Fetch cart items from Firestore
    const fetchCartItems = async () => {
        if (!user) {
            setCartItems([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const cartRef = getCartRef();
            const q = query(cartRef);
            const querySnapshot = await getDocs(q);

            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            setCartItems(items);
        } catch (error) {
            console.error('Error fetching cart:', error);
            Alert.alert('Error', 'Failed to load cart items');
        } finally {
            setLoading(false);
        }
    };

    // Real-time listener for cart changes
    useEffect(() => {
        if (!user) {
            setCartItems([]);
            setLoading(false);
            return;
        }

        const cartRef = getCartRef();
        const unsubscribe = onSnapshot(cartRef,
            (snapshot) => {
                const items = [];
                snapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() });
                });
                setCartItems(items);
                setLoading(false);
            },
            (error) => {
                console.error('Error in cart listener:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Add item to cart in Firestore
    const addToCart = async (product, navigation) => {
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

        try {
            const cartRef = getCartRef();
            const productRef = doc(cartRef, product.id);

            // Check if product already exists in cart
            const existingItem = cartItems.find(item => item.id === product.id);
            const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

            // Prepare product data for Firestore
            const productData = {
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice || product.price,
                brand: product.brand || '',
                category: product.category || '',
                description: product.description || '',
                images: product.images || [],
                rating: product.rating || 0,
                reviewCount: product.reviewCount || 0,
                stock: product.stock || 0,
                specifications: product.specifications || {},
                featured: product.featured || false,
                createdAt: product.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                quantity: newQuantity,
                addedToCartAt: new Date().toISOString(),
            };

            await setDoc(productRef, productData);

            return { success: true, message: `${product.name} added to cart` };
        } catch (error) {
            console.error('Error adding to cart:', error);
            Alert.alert('Error', 'Failed to add product to cart');
            return { success: false, message: 'Failed to add to cart' };
        }
    };

    const addToCartDirect = async (product) => {
        // Direct add without navigation parameter (for internal use)
        if (!user) {
            throw new Error('User must be logged in to add to cart');
        }

        try {
            const cartRef = getCartRef();
            const productRef = doc(cartRef, product.id);

            const existingItem = cartItems.find(item => item.id === product.id);
            const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

            const productData = {
                id: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice || product.price,
                brand: product.brand || '',
                category: product.category || '',
                description: product.description || '',
                images: product.images || [],
                rating: product.rating || 0,
                reviewCount: product.reviewCount || 0,
                stock: product.stock || 0,
                specifications: product.specifications || {},
                featured: product.featured || false,
                createdAt: product.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                quantity: newQuantity,
                addedToCartAt: new Date().toISOString(),
            };

            await setDoc(productRef, productData);

            return { success: true, message: `${product.name} added to cart` };
        } catch (error) {
            console.error('Error adding to cart:', error);
            throw new Error('Failed to add product to cart');
        }
    };

    // Remove item from cart in Firestore
    const removeFromCart = async (productId) => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return { success: false, message: 'User not authenticated' };
        }

        try {
            const cartRef = getCartRef();
            const productRef = doc(cartRef, productId);
            await deleteDoc(productRef);

            return { success: true, message: 'Item removed from cart' };
        } catch (error) {
            console.error('Error removing from cart:', error);
            Alert.alert('Error', 'Failed to remove product from cart');
            return { success: false, message: 'Failed to remove from cart' };
        }
    };

    // Update quantity in Firestore
    const updateQuantity = async (productId, newQuantity) => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return { success: false, message: 'User not authenticated' };
        }

        if (newQuantity < 1) {
            return removeFromCart(productId);
        }

        try {
            const cartRef = getCartRef();
            const productRef = doc(cartRef, productId);

            // Find the current item to preserve other data
            const currentItem = cartItems.find(item => item.id === productId);
            if (!currentItem) {
                throw new Error('Item not found in cart');
            }

            await setDoc(productRef, {
                ...currentItem,
                quantity: newQuantity,
                updatedAt: new Date().toISOString(),
            }, { merge: true });

            return { success: true, message: 'Quantity updated' };
        } catch (error) {
            console.error('Error updating quantity:', error);
            Alert.alert('Error', 'Failed to update quantity');
            return { success: false, message: 'Failed to update quantity' };
        }
    };

    // Clear entire cart in Firestore
    const clearCart = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return { success: false, message: 'User not authenticated' };
        }

        try {
            const cartRef = getCartRef();
            const q = query(cartRef);
            const querySnapshot = await getDocs(q);

            const batch = writeBatch(firestore);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            return { success: true, message: 'Cart cleared' };
        } catch (error) {
            console.error('Error clearing cart:', error);
            Alert.alert('Error', 'Failed to clear cart');
            return { success: false, message: 'Failed to clear cart' };
        }
    };

    // Bulk add to cart
    const bulkAddToCart = async (products) => {
        if (!user) {
            throw new Error('User must be logged in to add items to cart');
        }

        try {
            const batch = writeBatch(firestore);
            const cartRef = getCartRef();

            products.forEach(product => {
                const productRef = doc(cartRef, product.id);
                const existingItem = cartItems.find(item => item.id === product.id);
                const newQuantity = existingItem ?
                    existingItem.quantity + (product.quantity || 1) :
                    (product.quantity || 1);

                const productData = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice || product.price,
                    brand: product.brand || '',
                    category: product.category || '',
                    description: product.description || '',
                    images: product.images || [],
                    rating: product.rating || 0,
                    reviewCount: product.reviewCount || 0,
                    stock: product.stock || 0,
                    specifications: product.specifications || {},
                    featured: product.featured || false,
                    createdAt: product.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    quantity: newQuantity,
                    addedToCartAt: new Date().toISOString(),
                };

                batch.set(productRef, productData);
            });

            await batch.commit();
            return { success: true, message: `${products.length} items added to cart` };
        } catch (error) {
            console.error('Error bulk adding to cart:', error);
            throw new Error('Failed to add items to cart');
        }
    };

    // Move items from wishlist to cart
    const moveToCartFromWishlist = async (wishlistItems, navigation) => {
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

        try {
            const batch = writeBatch(firestore);
            const cartRef = getCartRef();

            wishlistItems.forEach(product => {
                const productRef = doc(cartRef, product.id);
                const existingItem = cartItems.find(item => item.id === product.id);
                const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

                const productData = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    originalPrice: product.originalPrice || product.price,
                    brand: product.brand || '',
                    category: product.category || '',
                    description: product.description || '',
                    images: product.images || [],
                    rating: product.rating || 0,
                    reviewCount: product.reviewCount || 0,
                    stock: product.stock || 0,
                    specifications: product.specifications || {},
                    featured: product.featured || false,
                    createdAt: product.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    quantity: newQuantity,
                    addedToCartAt: new Date().toISOString(),
                };

                batch.set(productRef, productData);
            });

            await batch.commit();
            return { success: true, message: `${wishlistItems.length} items moved to cart` };
        } catch (error) {
            console.error('Error moving to cart:', error);
            throw new Error('Failed to move items to cart');
        }
    };

    // Helper functions
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

    const value = {
        cartItems,
        loading,
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
        refreshCart: fetchCartItems,
        canPerformAction: !!user,
        userCartStatus: user ? 'active' : 'requires_login'
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};