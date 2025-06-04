import React from 'react';
import {Stack} from 'expo-router';
import {Box} from "@/components/ui/box";

export default function ServicesLayout () {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {backgroundColor: 'white'}
            }}
        >
            <Stack.Screen name="index" />
            {/* <Stack.Screen
                name="[id]"
                options={{
                    headerShown: true,
                    headerTitle: "Service Details",
                    presentation: "card"
                }}
            /> */}
            {/* <Stack.Screen
                name="bookings"
                options={{
                    headerShown: true,
                    headerTitle: "My Bookings",
                    presentation: "card"
                }}
            /> */}
        </Stack>
    );
}
