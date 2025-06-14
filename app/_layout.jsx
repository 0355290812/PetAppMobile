import {Stack} from "expo-router";
import {GluestackUIProvider} from "@/components/ui/gluestack-ui-provider";
import '../global.css';
import {AuthProvider} from "@/contexts/AuthContext";
import {CartProvider} from '@/contexts/CartContext';

export default function RootLayout () {
  return (
    <GluestackUIProvider mode="light">
      <AuthProvider>
        <CartProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: {backgroundColor: 'white'},
            }}
          >
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="orders" />
            <Stack.Screen name="bookings" />
            <Stack.Screen name="payments/stripe" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="cart" />
            <Stack.Screen name="search" />
            <Stack.Screen name="chat" />
            <Stack.Screen name="pets" />
            <Stack.Screen name="products" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="services" />
            {/* <Stack.Screen name="notifications" /> */}
          </Stack>
        </CartProvider>
      </AuthProvider>
    </GluestackUIProvider>
  )
}
