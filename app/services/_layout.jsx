import {Stack} from "expo-router";
import {useLocalSearchParams} from "expo-router";
import {Pressable} from "react-native";
import {Ionicons} from "@expo/vector-icons";
import {useRouter} from "expo-router";

export default function ServiceDetailLayout () {

    return (
        <Stack
            screenOptions={{
                headerShown: false
            }}
        >
            <Stack.Screen
                name="[id]"
            />
        </Stack>
    );
}
