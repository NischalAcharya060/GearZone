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
    onSnapshot,
    writeBatch
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

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
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Reference to user's compare collection
    const getCompareRef = () => {
        if (!user) return null;
        return collection(firestore, 'users', user.uid, 'compare');
    };

    // Fetch compare items from Firestore
    const fetchCompareItems = async () => {
        if (!user) {
            setCompareItems([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const compareRef = getCompareRef();
            const q = query(compareRef);
            const querySnapshot = await getDocs(q);

            const items = [];
            querySnapshot.forEach((doc) => {
                items.push({ id: doc.id, ...doc.data() });
            });

            setCompareItems(items);
        } catch (error) {
            console.error('Error fetching compare items:', error);
            Alert.alert('Error', 'Failed to load compare items');
        } finally {
            setLoading(false);
        }
    };

    // Real-time listener for compare changes
    useEffect(() => {
        if (!user) {
            setCompareItems([]);
            setLoading(false);
            return;
        }

        const compareRef = getCompareRef();
        const unsubscribe = onSnapshot(compareRef,
            (snapshot) => {
                const items = [];
                snapshot.forEach((doc) => {
                    items.push({ id: doc.id, ...doc.data() });
                });
                setCompareItems(items);
                setLoading(false);
            },
            (error) => {
                console.error('Error in compare listener:', error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, [user]);

    // Add item to compare in Firestore
    const addToCompare = async (product) => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to compare products',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Sign In',
                        onPress: () => navigation.navigate('SignIn')
                    }
                ]
            );
            throw new Error('User must be logged in to compare products');
        }

        try {
            // Check if already at limit
            if (compareItems.length >= 2) {
                Alert.alert(
                    'Limit Reached',
                    'You can only compare 2 products at a time. Remove one to add another.',
                    [
                        { text: 'OK', style: 'default' },
                        {
                            text: 'View Compare',
                            onPress: () => navigation.navigate('CompareTab')
                        }
                    ]
                );
                return false;
            }

            // Check if product already exists
            if (compareItems.find(item => item.id === product.id)) {
                Alert.alert('Already Added', 'This product is already in your compare list');
                return false;
            }

            const compareRef = getCompareRef();
            const productRef = doc(compareRef, product.id);

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
                addedToCompareAt: new Date().toISOString(),
            };

            await setDoc(productRef, productData);

            Alert.alert('Success', 'Product added to compare!');
            return true;
        } catch (error) {
            console.error('Error adding to compare:', error);
            Alert.alert('Error', 'Failed to add product to compare');
            return false;
        }
    };

    // Remove item from compare in Firestore
    const removeFromCompare = async (productId) => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return false;
        }

        try {
            const compareRef = getCompareRef();
            const productRef = doc(compareRef, productId);
            await deleteDoc(productRef);

            Alert.alert('Removed', 'Product removed from compare');
            return true;
        } catch (error) {
            console.error('Error removing from compare:', error);
            Alert.alert('Error', 'Failed to remove product from compare');
            return false;
        }
    };

    // Clear entire compare list in Firestore
    const clearCompare = async () => {
        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return false;
        }

        try {
            const compareRef = getCompareRef();
            const q = query(compareRef);
            const querySnapshot = await getDocs(q);

            const batch = writeBatch(firestore);
            querySnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            Alert.alert('Success', 'Compare list cleared');
            return true;
        } catch (error) {
            console.error('Error clearing compare:', error);
            Alert.alert('Error', 'Failed to clear compare list');
            return false;
        }
    };

    // Check if can add more items to compare
    const canAddToCompare = () => {
        return compareItems.length < 2;
    };

    // Check if product is in compare list
    const isInCompare = (productId) => {
        return compareItems.some(item => item.id === productId);
    };

    // Get compare items count
    const getCompareCount = () => {
        return compareItems.length;
    };

    // Move compare items to cart
    const moveAllToCart = async (cartContext, navigation) => {
        if (!user) {
            Alert.alert(
                'Sign In Required',
                'Please sign in to add items to cart',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Sign In',
                        onPress: () => navigation.navigate('SignIn')
                    }
                ]
            );
            return false;
        }

        try {
            await cartContext.bulkAddToCart(compareItems);
            await clearCompare();

            Alert.alert('Success', 'All compared items moved to cart!');
            return true;
        } catch (error) {
            console.error('Error moving to cart:', error);
            Alert.alert('Error', 'Failed to move items to cart');
            return false;
        }
    };

    const value = {
        compareItems,
        loading,
        addToCompare,
        removeFromCompare,
        clearCompare,
        canAddToCompare,
        isInCompare,
        getCompareCount,
        moveAllToCart,
        refreshCompare: fetchCompareItems,
    };

    return (
        <CompareContext.Provider value={value}>
            {children}
        </CompareContext.Provider>
    );
};