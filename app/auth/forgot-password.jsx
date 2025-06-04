import {TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert} from 'react-native'
import React, {useState} from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import {router} from 'expo-router'
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
import {Mail, PawPrint, ArrowLeft} from 'lucide-react-native'

const ForgotPassword = () => {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const [errors, setErrors] = useState({})

    // Validation function
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

        setErrors(newErrors)
        return isValid
    }

    // Handle email change with error clearing
    const handleEmailChange = (value) => {
        setEmail(value)
        if (errors.email) {
            setErrors(prev => ({...prev, email: null}))
        }
    }

    // Submit handler
    const handleSubmit = async () => {
        if (validate()) {
            setLoading(true)
            try {
                // Giả lập gửi email khôi phục
                // Thay thế bằng gọi API thật trong thực tế
                await new Promise(resolve => setTimeout(resolve, 1500))

                // Hiển thị thành công
                setEmailSent(true)

                // Hiển thị thông báo
                Alert.alert(
                    "Yêu cầu đã được gửi",
                    "Hãy kiểm tra email của bạn để nhận hướng dẫn đặt lại mật khẩu."
                )

                router.push('/auth/reset-password')
            } catch (error) {
                Alert.alert("Lỗi", "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau.")
            } finally {
                setLoading(false)
            }
        }
    }

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1"
        >
            <TouchableOpacity
                className="absolute top-14 left-6 z-10 bg-gray-100 rounded-full p-2"
                onPress={() => router.back()}
            >
                <Icon as={ArrowLeft} size="md" className="text-black" />
            </TouchableOpacity>
            <ScrollView
                contentContainerStyle={{flexGrow: 1}}
                keyboardShouldPersistTaps="handled"
            >
                <VStack className="flex-1 px-6 pb-10 justify-start">
                    <Center className="flex-1 justify-center">
                        {/* Icon and Title */}
                        <Box className="bg-blue-400 rounded-full p-4 mb-4">
                            <PawPrint size={40} color="white" />
                        </Box>
                        <Heading className="text-2xl font-bold text-gray-800 mb-2">Quên mật khẩu?</Heading>
                        <Text className="text-gray-500 text-center mb-8 px-4">
                            Nhập email của bạn và chúng tôi sẽ gửi cho bạn liên kết để đặt lại mật khẩu
                        </Text>

                        {/* Form */}
                        <VStack className="w-full space-y-4 mb-8">
                            <FormControl isInvalid={!!errors.email}>
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

                            <Button
                                className="bg-blue-400 rounded-xl h-12 mt-4"
                                onPress={handleSubmit}
                                isDisabled={loading || emailSent}
                            >
                                {loading ? (
                                    <HStack space="sm" alignItems="center">
                                        <Spinner color="white" size="small" />
                                        <ButtonText>Đang gửi...</ButtonText>
                                    </HStack>
                                ) : emailSent ? (
                                    <ButtonText>Đã gửi liên kết</ButtonText>
                                ) : (
                                    <ButtonText>Gửi liên kết đặt lại</ButtonText>
                                )}
                            </Button>
                        </VStack>
                    </Center>

                    {/* Footer */}
                    <HStack className="justify-center mt-8">
                        <Text className="text-gray-600">Nhớ mật khẩu của bạn? </Text>
                        <TouchableOpacity onPress={() => router.push('/auth/login')}>
                            <Text className="text-blue-500 font-medium">Đăng nhập</Text>
                        </TouchableOpacity>
                    </HStack>
                </VStack>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

export default ForgotPassword