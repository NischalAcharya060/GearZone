import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Home from './src/screens/Home';
import ProductDetail from './src/screens/ProductDetail';

// Context Providers (we'll create these next)
import { CartProvider } from './src/context/CartContext';
import { WishlistProvider } from './src/context/WishlistContext';
import { CompareProvider } from './src/context/CompareContext';

const Stack = createStackNavigator();

export default function App() {
    return (
        <CartProvider>
            <WishlistProvider>
                <CompareProvider>
                    <NavigationContainer>
                        <Stack.Navigator>
                            <Stack.Screen
                                name="Home"
                                component={Home}
                                options={{
                                    headerShown: false
                                }}
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
                    </NavigationContainer>
                </CompareProvider>
            </WishlistProvider>
        </CartProvider>
    );
}