import {TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert} from 'react-native'
import React, {useState, useEffect} from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Redirect, router} from 'expo-router'
import {Input, InputField} from "@/components/ui/input"
import {Button, ButtonText} from "@/components/ui/button"
import {FormControl, FormControlError, FormControlErrorText, FormControlLabel, FormControlLabelText} from "@/components/ui/form-control"
import {Text} from "@/components/ui/text"
import {Heading} from "@/components/ui/heading"
import {Box} from "@/components/ui/box"
import {VStack} from "@/components/ui/vstack"
import {HStack} from "@/components/ui/hstack"
import {Center} from "@/components/ui/center"
import {Spinner} from "@/components/ui/spinner"
import {Icon} from "@/components/ui/icon"
import {Eye, EyeOff, Mail, Lock, PawPrint} from 'lucide-react-native'
import {useAuth} from '@/contexts/AuthContext'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})

    // Use the correct properties from AuthContext
    const {login, loading, error, setError, isLoggedIn} = useAuth()

    // Show errors from AuthContext
    useEffect(() => {
        if (error) {
            Alert.alert('Đăng Nhập Thất Bại', error)
            // Clear the error after showing it
            setError(null)
        }
    }, [error])

    // Form validation
    const validate = () => {
        let isValid = true
        let newErrors = {}

        if (!email) {
            newErrors.email = 'Email không được để trống'
            isValid = false
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email không hợp lệ'
            isValid = false
        }

        if (!password) {
            newErrors.password = 'Mật khẩu không được để trống'
            isValid = false
        } else if (password.length < 6) {
            newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
            isValid = false
        }

        setErrors(newErrors)
        return isValid
    }

    // Input change handlers with error clearing
    const handleEmailChange = (value) => {
        setEmail(value)
        if (errors.email) {
            setErrors(prev => ({...prev, email: null}))
        }
    }

    const handlePasswordChange = (value) => {
        setPassword(value)
        if (errors.password) {
            setErrors(prev => ({...prev, password: null}))
        }
    }

    // Login handler with validation
    const handleLogin = async () => {
        if (validate()) {
            await login(email, password)
            // Navigation is handled by the AuthContext if login is successful
        }
    }

    return isLoggedIn ? <Redirect href={'/'} /> : (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{flexGrow: 1}}
                    keyboardShouldPersistTaps="handled"
                >
                    <VStack className="flex-1 px-6 py-10 justify-between">
                        {/* Header */}
                        <Center className="mt-6">
                            <Box className="bg-blue-400 rounded-full p-4 mb-4">
                                <PawPrint size={40} color="white" />
                            </Box>
                            <Heading className="text-3xl font-bold text-gray-800 mb-2">Chào Mừng Trở Lại</Heading>
                            <Text className="text-gray-500 text-center mb-8">Đăng nhập để tiếp tục sử dụng PetCare</Text>
                        </Center>

                        {/* Form */}
                        <VStack className="w-full space-y-4 gap-2">
                            <FormControl isInvalid={!!errors.email} >
                                <FormControlLabel>
                                    <FormControlLabelText className="text-gray-700 font-medium mb-1">Email</FormControlLabelText>
                                </FormControlLabel>
                                <Input
                                    className="bg-gray-50 rounded-xl border-gray-200 px-4 h-fit py-2"
                                >
                                    <Icon as={Mail} className="text-blue-400" />
                                    <InputField
                                        placeholder="Nhập email của bạn"
                                        value={email}
                                        onChangeText={handleEmailChange}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        className="py-3 px-2 flex-1"
                                    />
                                </Input>
                                <FormControlError>
                                    <FormControlErrorText>{errors.email}</FormControlErrorText>
                                </FormControlError>
                            </FormControl>

                            <FormControl isInvalid={!!errors.password}>
                                <FormControlLabel>
                                    <FormControlLabelText className="text-gray-700 font-medium mb-1">Mật khẩu</FormControlLabelText>
                                </FormControlLabel>
                                <Input
                                    className="bg-gray-50 rounded-xl border-gray-200 px-4 h-fit py-2"
                                >
                                    <Icon as={Lock} className="text-blue-400" />
                                    <InputField
                                        placeholder="Nhập mật khẩu của bạn"
                                        value={password}
                                        onChangeText={handlePasswordChange}
                                        secureTextEntry={!showPassword}
                                        className="py-3 px-2 flex-1"
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        className="mr-2"
                                    >
                                        {showPassword ?
                                            <EyeOff size={18} color="#9ca3af" /> :
                                            <Eye size={18} color="#9ca3af" />
                                        }
                                    </TouchableOpacity>
                                </Input>
                                <FormControlError>
                                    <FormControlErrorText>{errors.password}</FormControlErrorText>
                                </FormControlError>
                            </FormControl>

                            <Box className="self-end">
                                <TouchableOpacity
                                    onPress={() => router.push('/auth/forgot-password')}
                                >
                                    <Text className="text-blue-500 font-medium">Quên mật khẩu?</Text>
                                </TouchableOpacity>
                            </Box>

                            <Button
                                className="bg-blue-400 rounded-xl h-12 mt-4"
                                onPress={handleLogin}
                                isDisabled={loading}
                            >
                                {loading ? (
                                    <HStack space="sm" alignItems="center">
                                        <Spinner color="white" size="small" />
                                        <ButtonText>Đang đăng nhập...</ButtonText>
                                    </HStack>
                                ) : (
                                    <ButtonText>Đăng Nhập</ButtonText>
                                )}
                            </Button>
                        </VStack>

                        {/* Footer */}
                        <HStack className="justify-center mt-8">
                            <Text className="text-gray-600">Bạn chưa có tài khoản? </Text>
                            <TouchableOpacity onPress={() => router.push('/auth/register')}>
                                <Text className="text-blue-500 font-medium">Đăng Ký</Text>
                            </TouchableOpacity>
                        </HStack>
                    </VStack>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    )
}

export default Login