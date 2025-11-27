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
    onSnapshot
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const useWishlist = () => {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
};

export const WishlistProvider = ({ children }) => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Reference to user's wishlist collection
    const getWishlistRef = () => {
        if (!user) return null;
        return collection(firestore, 'users', user.uid, 'wishlist');
    };

    // Fetch wishlist items from Firestore
    const fetchWishlistItems = async () => {
        if (!user) {
            setWishlistItems([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const wishlistRef = getWishlistRef();
            const q = query(wishlistRef);
            const querySnapshot = await getDocs(q);

            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            setWishlistItems(items);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            Alert.alert('Error', 'Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    // Real-time listener for wishlist changes
    useEffect(() => {
        if (!user) {
            setWishlistItems([]);
            setLoading(false);
            return;
        }

        const wishlistRef = getWishlistRef();
        const unsubscribe = onSnapshot(wishlistRef,
            (snapshot) => {
                const items = [];
                snapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() });
                });
                setWishlistItems(items);
                setLoading(false);
            },
            (error) => {
                console.error('Error in wishlist listener:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Add item to wishlist in Firestore
    const addToWishlist = async (product) => {
        if (!user) {
            Alert.alert('Sign In Required', 'Please sign in to add items to wishlist');
            return false;
        }

        try {
            const wishlistRef = getWishlistRef();
            const productRef = doc(wishlistRef, product.id);

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
                addedToWishlistAt: new Date().toISOString(),
            };

            await setDoc(productRef, productData);

            Alert.alert('Success', 'Product added to wishlist!');
            return true;
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            Alert.alert('Error', 'Failed to add product to wishlist');
            return false;
        }
    };

    // Remove item from wishlist in Firestore
    const removeFromWishlist = async (productId) => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return false;
        }

        try {
            const wishlistRef = getWishlistRef();
            const productRef = doc(wishlistRef, productId);
            await deleteDoc(productRef);

            Alert.alert('Removed', 'Product removed from wishlist');
            return true;
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            Alert.alert('Error', 'Failed to remove product from wishlist');
            return false;
        }
    };

    // Clear entire wishlist
    const clearWishlist = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return false;
        }

        try {
            const wishlistRef = getWishlistRef();
            const q = query(wishlistRef);
            const querySnapshot = await getDocs(q);

            const deletePromises = [];
            querySnapshot.forEach((doc) => {
                deletePromises.push(deleteDoc(doc.ref));
            });

            await Promise.all(deletePromises);
            Alert.alert('Success', 'Wishlist cleared');
            return true;
        } catch (error) {
            console.error('Error clearing wishlist:', error);
            Alert.alert('Error', 'Failed to clear wishlist');
            return false;
        }
    };

    // Check if product is in wishlist
    const isInWishlist = (productId) => {
        return wishlistItems.some(item => item.id === productId);
    };

    // Get wishlist items count
    const getWishlistCount = () => {
        return wishlistItems.length;
    };

    // Move item to cart and remove from wishlist
    const moveToCart = async (product, cartContext) => {
        try {
            // Add to cart
            cartContext.addToCart(product);

            // Remove from wishlist
            await removeFromWishlist(product.id);

            Alert.alert('Success', 'Product moved to cart!');
            return true;
        } catch (error) {
            console.error('Error moving to cart:', error);
            Alert.alert('Error', 'Failed to move product to cart');
            return false;
        }
    };

    const value = {
        wishlistItems,
        loading,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        isInWishlist,
        getWishlistCount,
        moveToCart,
        refreshWishlist: fetchWishlistItems,
    };

    return (
        <WishlistContext.Provider value={value}>
            {children}
        </WishlistContext.Provider>
    );
};