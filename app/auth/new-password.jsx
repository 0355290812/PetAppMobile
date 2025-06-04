import {SafeAreaView} from 'react-native'
import React, {useState} from 'react'
import {router, useLocalSearchParams} from 'expo-router'
import {VStack} from '@/components/ui/vstack'
import {Heading} from '@/components/ui/heading'
import {Text} from '@/components/ui/text'
import {
    FormControl,
    FormControlLabel,
    FormControlLabelText,
    FormControlError,
    FormControlErrorIcon,
    FormControlErrorText,
    FormControlHelper,
} from '@/components/ui/form-control'
import {
    Input,
    InputField,
    InputSlot,
    InputIcon,
} from '@/components/ui/input'
import {
    Button,
    ButtonText,
} from '@/components/ui/button'
import {HStack} from '@/components/ui/hstack'
import {Box} from '@/components/ui/box'
import {Pressable} from '@/components/ui/pressable'
import {Eye, EyeOff, AlertCircle, Check, X} from 'lucide-react-native'
import {
    useToast,
    Toast,
    ToastTitle,
    ToastDescription
} from '@/components/ui/toast'
import {useAuth} from '@/contexts/AuthContext'
import apiClient from '@/config/api'

const NewPassword = () => {
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const toast = useToast()
    const {token} = useLocalSearchParams()

    const handleTogglePassword = () => {
        setShowPassword(!showPassword)
    }

    const handleToggleConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword)
    }

    // Password validation
    const hasMinLength = password.length >= 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const passwordsMatch = password === confirmPassword && password !== ''
    const isPasswordValid = hasMinLength && hasUpperCase && hasNumber && hasSpecialChar

    const handleResetPassword = async () => {
        if (!isPasswordValid || !passwordsMatch) {
            toast.show({
                placement: "top",
                render: ({id}) => {
                    return (
                        <Toast nativeID={id} action="error" variant="solid">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>
                                Vui lòng đảm bảo mật khẩu đáp ứng tất cả các yêu cầu và hai mật khẩu khớp nhau.
                            </ToastDescription>
                        </Toast>
                    )
                }
            })
            return
        }

        try {
            setLoading(true)
            // API call to reset password
            // await apiClient.post('/auth/reset-password', {
            //     token,
            //     newPassword: password
            // })

            toast.show({
                placement: "top",
                render: ({id}) => {
                    return (
                        <Toast nativeID={id} action="success" variant="solid">
                            <ToastTitle>Thành công</ToastTitle>
                            <ToastDescription>
                                Mật khẩu của bạn đã được đặt lại thành công!
                            </ToastDescription>
                        </Toast>
                    )
                }
            })

            // Navigate to login screen after successful password reset
            setTimeout(() => {
                router.replace('/auth/login')
            }, 1500)
        } catch (error) {
            toast.show({
                placement: "top",
                render: ({id}) => {
                    return (
                        <Toast nativeID={id} action="error" variant="solid">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>
                                {error?.response?.data?.message || 'Không thể đặt lại mật khẩu. Vui lòng thử lại.'}
                            </ToastDescription>
                        </Toast>
                    )
                }
            })
        } finally {
            setLoading(false)
        }
    }

    const ValidationStatus = ({isValid, label}) => (
        <HStack space="sm" alignItems="center" my={1}>
            {isValid ? (
                <Check size={16} color="#22C55E" />
            ) : (
                <X size={16} color="#EF4444" />
            )}
            <Text fontSize="xs" color={isValid ? "green.500" : "red.500"}>{label}</Text>
        </HStack>
    )

    return (
        <SafeAreaView className="flex-1 bg-white px-4 py-8 mx-6">
            <VStack space="xl" className="mt-8">
                <Box>
                    <Heading size="2xl" className="text-blue-400 mb-2">Tạo mật khẩu mới</Heading>
                    <Text className="text-gray-500">
                        Mật khẩu mới của bạn phải khác với mật khẩu đã sử dụng trước đây
                    </Text>
                </Box>

                <VStack space="md">
                    <FormControl isInvalid={password.length > 0 && !isPasswordValid}>
                        <FormControlLabel>
                            <FormControlLabelText>Mật khẩu mới</FormControlLabelText>
                        </FormControlLabel>

                        <Input variant="outline" size="lg" className="rounded-xl">
                            <InputField
                                placeholder="Nhập mật khẩu mới"
                                secureTextEntry={!showPassword}
                                value={password}
                                onChangeText={setPassword}
                                className="pl-4 pr-12 py-3"
                            />
                            <InputSlot onPress={handleTogglePassword} className="pr-4">
                                <InputIcon as={showPassword ? EyeOff : Eye} size={20} className="mx-2" />
                            </InputSlot>
                        </Input>

                        <FormControlHelper>
                            <VStack space="xs" className="mt-2">
                                <ValidationStatus isValid={hasMinLength} label="Ít nhất 8 ký tự" />
                                <ValidationStatus isValid={hasUpperCase} label="Ít nhất một chữ cái viết hoa" />
                                <ValidationStatus isValid={hasNumber} label="Ít nhất một số" />
                                <ValidationStatus isValid={hasSpecialChar} label="Ít nhất một ký tự đặc biệt" />
                            </VStack>
                        </FormControlHelper>
                    </FormControl>

                    <FormControl isInvalid={confirmPassword.length > 0 && !passwordsMatch}>
                        <FormControlLabel>
                            <FormControlLabelText>Xác nhận mật khẩu</FormControlLabelText>
                        </FormControlLabel>

                        <Input variant="outline" size="lg" className="rounded-xl">
                            <InputField
                                placeholder="Xác nhận mật khẩu mới của bạn"
                                secureTextEntry={!showConfirmPassword}
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                className="pl-4 pr-12 py-3"
                            />
                            <InputSlot onPress={handleToggleConfirmPassword} className="pr-4">
                                <InputIcon as={showConfirmPassword ? EyeOff : Eye} size={20} className="mx-2" />
                            </InputSlot>
                        </Input>

                        {confirmPassword.length > 0 && !passwordsMatch && (
                            <FormControlError>
                                <FormControlErrorIcon as={AlertCircle} />
                                <FormControlErrorText>Mật khẩu không khớp</FormControlErrorText>
                            </FormControlError>
                        )}
                    </FormControl>
                </VStack>

                <Button
                    size="lg"
                    variant="solid"
                    className="bg-blue-400 rounded-xl mt-4"
                    isDisabled={!passwordsMatch || !isPasswordValid}
                    onPress={handleResetPassword}
                    isLoading={loading}
                >
                    <ButtonText>Đặt lại mật khẩu</ButtonText>
                </Button>

                <Pressable onPress={() => router.replace('/auth/login')}>
                    <Text className="text-center text-blue-400">Trở về đăng nhập</Text>
                </Pressable>
            </VStack>
        </SafeAreaView>
    )
}

export default NewPassword