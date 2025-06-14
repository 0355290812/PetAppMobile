import {Stack} from 'expo-router';

export default function PetsLayout () {
    return (
        <Stack screenOptions={{
            headerShown: false,
            contentStyle: {
                backgroundColor: 'white',
            },
        }}>
            <Stack.Screen name="add" />
            <Stack.Screen name="[id]" />
        </Stack>
    );
}
