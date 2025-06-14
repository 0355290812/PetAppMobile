import {Stack} from 'expo-router';

export default function ProductsLayout () {
    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: {
                backgroundColor: 'white',
            },
        }}>
            <Stack.Screen name="index" />
        </Stack>
    );
}
