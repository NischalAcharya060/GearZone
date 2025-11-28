import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Context Providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { CompareProvider } from './src/context/CompareContext';

// Screens
import Home from './src/screens/Home';
import ProductDetail from './src/screens/ProductDetail';
import Cart from './src/screens/Cart';
import Wishlist from './src/screens/Wishlist';
import Compare from './src/screens/Compare';
import Profile from './src/screens/Profile';
import Checkout from './src/screens/Checkout';
import SignIn from './src/screens/SignIn';
import SignUp from './src/screens/SignUp';
import LoadingScreen from './src/screens/LoadingScreen';
import Search from './src/screens/Search';
import OrderConfirmation from './src/screens/OrderConfirmation';

// Admin Screens
import AddProduct from './src/screens/admin/AddProduct';
import ManageOrders from './src/screens/admin/ManageOrders';
import Analytics from './src/screens/admin/Analytics';
import AddCategory from "./src/screens/admin/AddCategory";
import Addresses from "./src/screens/Addresses";
import OrderHistory from "./src/screens/OrderHistory";
import Notifications from "./src/screens/Notifications";
import ProfileScreen from "./src/screens/ProfileScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
const HomeStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Home"
                component={Home}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetail}
                options={{
                    title: 'Product Details',
                    headerBackTitle: 'Back'
                }}
            />
            <Stack.Screen
                name="Search"
                component={Search}
                options={{
                    title: 'Search Products',
                    headerBackTitle: 'Back'
                }}
            />
            <Stack.Screen
                name="Notifications"
                component={Notifications}
                options={{
                    title: 'My Notifications',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack.Navigator>
    );
};

// Cart Stack Navigator
const CartStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Cart"
                component={Cart}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Checkout"
                component={Checkout}
                options={{
                    title: 'Checkout',
                    headerBackTitle: 'Back'
                }}
            />
            {/* Order Confirmation accessible from cart flow */}
            <Stack.Screen
                name="OrderConfirmation"
                component={OrderConfirmation}
                options={{
                    headerShown: false,
                }}
            />
        </Stack.Navigator>
    );
};

// Wishlist Stack Navigator
const WishlistStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Wishlist"
                component={Wishlist}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetail}
                options={{
                    title: 'Product Details',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack.Navigator>
    );
};

// Compare Stack Navigator
const CompareStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Compare"
                component={Compare}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ProductDetail"
                component={ProductDetail}
                options={{
                    title: 'Product Details',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack.Navigator>
    );
};

// Profile Stack Navigator (Includes Admin Screens)
const ProfileStack = () => {
    const { user } = useAuth();

    return (
        <Stack.Navigator>
            <Stack.Screen
                name="Profile"
                component={Profile}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SignIn"
                component={SignIn}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="SignUp"
                component={SignUp}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="My Profile"
                component={ProfileScreen}
                options={{ title: 'My Profile' }}
            />
            <Stack.Screen
                name="Addresses"
                component={Addresses}
                options={{
                    title: 'My Addresses',
                    headerBackTitle: 'Back'
                }}
            />
            <Stack.Screen
                name="Orders"
                component={OrderHistory}
                options={{
                    title: 'Order History',
                    headerBackTitle: 'Back'
                }}
            />
            {/* Admin Only Screens */}
            {user?.role === 'admin' && (
                <>
                    <Stack.Screen
                        name="AddProduct"
                        component={AddProduct}
                        options={{
                            title: 'Add Product',
                            headerBackTitle: 'Back'
                        }}
                    />
                    <Stack.Screen
                        name="AddCategory"
                        component={AddCategory}
                        options={{
                            title: 'Add Category',
                            headerBackTitle: 'Back'
                        }}
                    />
                    <Stack.Screen
                        name="ManageOrders"
                        component={ManageOrders}
                        options={{
                            title: 'Manage Orders',
                            headerBackTitle: 'Back'
                        }}
                    />
                    <Stack.Screen
                        name="Analytics"
                        component={Analytics}
                        options={{
                            title: 'Analytics',
                            headerBackTitle: 'Back'
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
};

// Main App Tabs (for logged-in users)
const MainTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: '#2563EB',
                tabBarInactiveTintColor: '#666',
                tabBarStyle: {
                    paddingBottom: 5,
                    paddingTop: 5,
                    height: 60,
                    backgroundColor: 'white',
                    borderTopWidth: 1,
                    borderTopColor: '#E5E7EB',
                },
                tabBarLabelStyle: {
                    fontSize: 12,
                    fontWeight: '500',
                },
            }}
        >
            <Tab.Screen
                name="HomeTab"
                component={HomeStack}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="WishlistTab"
                component={WishlistStack}
                options={{
                    tabBarLabel: 'Wishlist',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="heart-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="CompareTab"
                component={CompareStack}
                options={{
                    tabBarLabel: 'Compare',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="swap-horizontal-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="CartTab"
                component={CartStack}
                options={{
                    tabBarLabel: 'Cart',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="cart-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
            <Tab.Screen
                name="ProfileTab"
                component={ProfileStack}
                options={{
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={size} color={color} />
                    ),
                    headerShown: false,
                }}
            />
        </Tab.Navigator>
    );
};

// Auth Stack (for non-logged-in users)
const AuthStack = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="SignIn" component={SignIn} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="MainApp" component={MainTabs} />
        </Stack.Navigator>
    );
};

// Root Navigator - Handles authentication state
const RootNavigator = () => {
    const { user, loading } = useAuth();

    console.log('RootNavigator - Auth state:', { user: user?.email, loading });

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {user ? (
                    // User is signed in - show main app
                    <>
                        <Stack.Screen name="MainApp" component={MainTabs} />
                        {/* Global screens accessible from anywhere */}
                        <Stack.Screen
                            name="OrderConfirmation"
                            component={OrderConfirmation}
                            options={{
                                headerShown: false,
                                gestureEnabled: false
                            }}
                        />
                    </>
                ) : (
                    // User is not signed in - show auth flow
                    <Stack.Screen name="Auth" component={AuthStack} />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

// App Component
export default function App() {
    return (
        <AuthProvider>
            <CartProvider>
                <WishlistProvider>
                    <CompareProvider>
                        <RootNavigator />
                    </CompareProvider>
                </WishlistProvider>
            </CartProvider>
        </AuthProvider>
    );
}