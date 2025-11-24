import React, { createContext, useState, useContext, useEffect } from 'react';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            console.log('Auth state changed:', user ? `User ${user.email} logged in` : 'No user');

            if (user) {
                try {
                    console.log('Fetching user data from Firestore for UID:', user.uid);

                    // Get user role from Firestore
                    const userDoc = await getDoc(doc(firestore, 'users', user.uid));

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        console.log('User data found:', userData);
                        setUser({
                            uid: user.uid,
                            email: user.email,
                            ...userData
                        });
                    } else {
                        console.log('No user document found, creating default...');
                        // Create default user document
                        const defaultUserData = {
                            email: user.email,
                            role: 'user',
                            fullName: user.email.split('@')[0], // Use email prefix as default name
                            phone: '',
                            createdAt: new Date().toISOString(),
                        };

                        await setDoc(doc(firestore, 'users', user.uid), defaultUserData);

                        setUser({
                            uid: user.uid,
                            email: user.email,
                            ...defaultUserData
                        });
                        console.log('Default user document created');
                    }
                    setAuthError(null);
                } catch (error) {
                    console.error('Error in auth state change:', error);
                    // Even if Firestore fails, set basic user info
                    setUser({
                        uid: user.uid,
                        email: user.email,
                        role: 'user',
                        fullName: user.email.split('@')[0]
                    });
                }
            } else {
                console.log('User signed out');
                setUser(null);
                setAuthError(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signUp = async (email, password, userData) => {
        try {
            setAuthError(null);
            console.log('Signing up user:', email);

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User created with UID:', user.uid);

            // Save user data to Firestore
            const userDocData = {
                email: user.email,
                role: userData.role || 'user',
                fullName: userData.fullName,
                phone: userData.phone || '',
                createdAt: new Date().toISOString(),
            };

            await setDoc(doc(firestore, 'users', user.uid), userDocData);
            console.log('User document saved to Firestore');

            // Update local user state
            setUser({
                uid: user.uid,
                email: user.email,
                ...userDocData
            });

            return { success: true };
        } catch (error) {
            console.error('Sign up error:', error);
            let errorMessage = 'Failed to create account. Please try again.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Password should be at least 6 characters.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }

            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const signIn = async (email, password) => {
        try {
            setAuthError(null);
            console.log('Signing in user:', email);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('User signed in successfully:', user.uid);

            // The onAuthStateChanged listener will handle the rest
            return { success: true };
        } catch (error) {
            console.error('Sign in error:', error);
            let errorMessage = 'Failed to sign in. Please try again.';

            if (error.code === 'auth/user-not-found') {
                errorMessage = 'No account found with this email.';
            } else if (error.code === 'auth/wrong-password') {
                errorMessage = 'Incorrect password. Please try again.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            }

            setAuthError(errorMessage);
            return { success: false, error: errorMessage };
        }
    };

    const logout = async () => {
        try {
            setAuthError(null);
            await signOut(auth);
            // onAuthStateChanged will handle setting user to null
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            setAuthError('Failed to logout. Please try again.');
            return { success: false, error: error.message };
        }
    };

    const clearError = () => {
        setAuthError(null);
    };

    const value = {
        user,
        signUp,
        signIn,
        logout,
        loading,
        authError,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};