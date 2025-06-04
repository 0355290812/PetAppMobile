import {Stack} from "expo-router";

export default function OrderDetailLayout () {
    return (
        <Stack>
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="rate"
                options={{
                    headerShown: false,
                    presentation: "modal"
                }}
            />
        </Stack>
    );
}
