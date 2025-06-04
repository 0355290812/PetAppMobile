import React from "react";
import {View} from "react-native";
import {HStack} from "./hstack";
import {Pressable} from "./pressable";

// Simple Tabs container component
export const Tabs = ({children, className = "", ...props}) => {
    return (
        <View className={className} {...props}>
            {children}
        </View>
    );
};

// Tabs.TabList component for holding Tab components
Tabs.TabList = ({children, className = "", ...props}) => {
    return (
        <HStack className={`border-b border-gray-200 ${ className }`} {...props}>
            {children}
        </HStack>
    );
};

// Individual Tab component
Tabs.Tab = ({
    children,
    value,
    isActive = false,
    onPress = () => {},
    className = "",
    ...props
}) => {
    return (
        <Pressable
            className={`py-3 px-4 ${ isActive ? "border-b-2 border-blue-500" : "" } ${ className }`}
            onPress={() => onPress(value)}
            {...props}
        >
            {children}
        </Pressable>
    );
};
