import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

// Context Providers
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Home Stack Navigator
const HomeStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="HomeMain"
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
        </Stack.Navigator>
    );
};

// Cart Stack Navigator
const CartStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="CartMain"
                component={Cart}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

// Wishlist Stack Navigator
const WishlistStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="WishlistMain"
                component={Wishlist}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="ProductDetailFromWishlist"
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
                name="CompareMain"
                component={Compare}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

// Profile Stack Navigator
const ProfileStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="ProfileMain"
                component={Profile}
                options={{ headerShown: false }}
            />
        </Stack.Navigator>
    );
};

// Bottom Tab Navigator
const TabNavigator = () => {
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

// Main Stack Navigator (for modals and other screens)
const MainStack = () => {
    return (
        <Stack.Navigator>
            <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="Cart"
                component={Cart}
                options={{
                    title: 'Shopping Cart',
                    headerBackTitle: 'Back'
                }}
            />
        </Stack.Navigator>
    );
};

export default function App() {
    return (
        <CartProvider>
            <WishlistProvider>
                <CompareProvider>
                    <NavigationContainer>
                        <MainStack />
                    </NavigationContainer>
                </CompareProvider>
            </WishlistProvider>
        </CartProvider>
    );
}