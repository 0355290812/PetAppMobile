import React, {createContext, useState, useContext, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {router} from 'expo-router';
import {ApiClient} from '../config/api';
import {Spinner} from "@/components/ui/spinner"

// Create the Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
    return useContext(AuthContext);
};

// API endpoint path for authentication
const AUTH_PATH = '/auth';

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const api = ApiClient();

    // Initialize auth state
    useEffect(() => {
        loadStoredAuth();
    }, []);

    // Load authentication state from storage
    const loadStoredAuth = async () => {
        setLoading(true);
        try {
            const storedToken = await AsyncStorage.getItem('token');

            if (storedToken) {
                const response = await api.get(`/users/me`, {});
                const userData = response;
                setUser(userData);
                setIsLoggedIn(true);
                setError(null);
                await AsyncStorage.setItem('auth_user', JSON.stringify(userData));

            }
        } catch (e) {
            console.error('Failed to load authentication info', e);
        } finally {
            setLoading(false);
        }
    };

    // Store authentication data
    const storeAuthData = async (userData, tokens) => {
        try {
            await AsyncStorage.setItem('token', `Bearer ${ tokens.access.token }`);
            await AsyncStorage.setItem('refreshToken', tokens.refresh.token);
            await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
        } catch (e) {
            console.error('Failed to store auth data', e);
        }
    };

    // Clear authentication data
    const clearAuthData = async () => {
        try {
            await AsyncStorage.removeItem('token');
            await AsyncStorage.removeItem('refreshToken');
            await AsyncStorage.removeItem('auth_user');
        } catch (e) {
            console.error('Failed to clear auth data', e);
        }
    };

    // Login function
    const login = async (email, password) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post(`${ AUTH_PATH }/login`, {
                email,
                password
            });

            const {user: userData, tokens} = response;

            setUser(userData);
            setIsLoggedIn(true);
            await storeAuthData(userData, tokens);

            // router.replace('/');
            return true;
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Signup function
    const signup = async (userData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.post(`${ AUTH_PATH }/register`, userData);

            const {user: newUser, tokens} = response;

            setUser(newUser);
            setIsLoggedIn(true);
            await storeAuthData(newUser, tokens);

            // router.navigate('/');
            return true;
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        setLoading(true);

        try {
            // Optional: Call logout API endpoint
            // await api.post(`${AUTH_PATH}/logout`);

            setUser(null);
            setIsLoggedIn(false);
            await clearAuthData();

            router.navigate('/auth/login');
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setLoading(false);
        }
    };

    // Check if user is authenticated
    const isAuthenticated = async () => {
        const token = await AsyncStorage.getItem('token');
        console.log('Token:', token);

        return !!token;
    };

    // Update user profile
    const updateProfile = async (updatedUserData) => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.put(`${ AUTH_PATH }/profile`, updatedUserData);

            const updatedUser = response.user || response;
            setUser(updatedUser);
            await AsyncStorage.setItem('auth_user', JSON.stringify(updatedUser));

            return true;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to update profile.';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Password reset request
    const requestPasswordReset = async (email) => {
        setLoading(true);
        setError(null);

        try {
            await api.post(`${ AUTH_PATH }/forgot-password`, {email});
            return true;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to request password reset.';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Reset password with token
    const resetPassword = async (token, newPassword) => {
        setLoading(true);
        setError(null);

        try {
            await api.post(`${ AUTH_PATH }/reset-password`, {
                token,
                password: newPassword
            });
            return true;
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to reset password.';
            setError(message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/users/me`, {});
            const userData = response;
            setUser(userData);
            await AsyncStorage.setItem('auth_user', JSON.stringify(userData));
        } catch (e) {
            console.error('Failed to refresh user data', e);
        } finally {
            setLoading(false);
        }
    }

    // Context value
    const value = {
        user,
        isLoggedIn,
        loading,
        error,
        login,
        signup,
        logout,
        isAuthenticated,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        setError,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
            {loading && (
                <Spinner
                    size="lg"
                    accessibilityLabel="Loading"
                    color="primary.500"
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: [{translateX: -25}, {translateY: -25}]
                    }}
                />
            )}
        </AuthContext.Provider>
    );
};

export default AuthContext;
