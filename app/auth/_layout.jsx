import React from 'react';
import {Stack} from "expo-router";

export default function AuthLayout () {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {backgroundColor: 'white'},
            }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="reset-password" />
            <Stack.Screen name="new-password" />
        </Stack>
    )
}