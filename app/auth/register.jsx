import React, {useState, useContext, useRef} from 'react'
import {ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity} from 'react-native'
import {router} from 'expo-router'
import {useAuth} from '@/contexts/AuthContext'
import {Box} from "@/components/ui/box"

import {
    Button,
    ButtonText,
} from "@/components/ui/button"

import {
    Checkbox,
    CheckboxIndicator,
    CheckboxLabel,
    CheckboxIcon,
} from "@/components/ui/checkbox"

import {
    FormControl,
    FormControlLabel,
    FormControlHelper,
    FormControlError,
    FormControlErrorText,
} from "@/components/ui/form-control"

import {Heading} from "@/components/ui/heading"

import {HStack} from "@/components/ui/hstack"

import {Icon} from "@/components/ui/icon"

import {Image} from "@/components/ui/image"

import {
    Input,
    InputField,
    InputIcon,
    InputSlot,
    InputAddon,
} from "@/components/ui/input"

import {Progress, ProgressFilledTrack} from "@/components/ui/progress"

import {Spinner} from "@/components/ui/spinner"

import {Text} from "@/components/ui/text"

import {VStack} from "@/components/ui/vstack"

import {Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckIcon, Shield, Key, Phone} from 'lucide-react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

const Register = () => {
    const {signup} = useAuth()
    const scrollViewRef = useRef(null)

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })

    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [acceptTerms, setAcceptTerms] = useState(false)

    const getPasswordStrength = (password) => {
        if (!password) return 0

        let strength = 0

        if (password.length >= 8) strength += 0.25
        if (/[A-Z]/.test(password)) strength += 0.25
        if (/[0-9]/.test(password)) strength += 0.25
        if (/[^A-Za-z0-9]/.test(password)) strength += 0.25

        return strength
    }

    const getStrengthLabel = (strength) => {
        if (strength === 0) return {label: "", color: "text-gray-300", trackColor: "bg-gray-300"}
        if (strength <= 0.25) return {label: "Yếu", color: "text-red-400", trackColor: "bg-red-400"}
        if (strength <= 0.5) return {label: "Trung bình", color: "text-orange-400", trackColor: "bg-orange-400"}
        if (strength <= 0.75) return {label: "Khá", color: "text-yellow-400", trackColor: "bg-yellow-400"}
        return {label: "Mạnh", color: "text-green-500", trackColor: "bg-green-500"}
    }

    const passwordStrength = getPasswordStrength(formData.password)
    const strengthInfo = getStrengthLabel(passwordStrength)

    const validate = () => {
        let tempErrors = {}
        let isValid = true

        if (!formData.fullName) {
            tempErrors.fullName = "Họ tên là bắt buộc"
            isValid = false
        }

        if (!formData.email) {
            tempErrors.email = "Email là bắt buộc"
            isValid = false
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            tempErrors.email = "Email không hợp lệ"
            isValid = false
        }

        if (!formData.phone) {
            tempErrors.phone = "Số điện thoại là bắt buộc"
            isValid = false
        } else if (!/^[0-9]{10,11}$/.test(formData.phone.replace(/\s/g, ''))) {
            tempErrors.phone = "Số điện thoại không hợp lệ"
            isValid = false
        }

        if (!formData.password) {
            tempErrors.password = "Mật khẩu là bắt buộc"
            isValid = false
        } else if (formData.password.length < 6) {
            tempErrors.password = "Mật khẩu phải có ít nhất 6 ký tự"
            isValid = false
        }

        if (!formData.confirmPassword) {
            tempErrors.confirmPassword = "Vui lòng xác nhận mật khẩu"
            isValid = false
        } else if (formData.password !== formData.confirmPassword) {
            tempErrors.confirmPassword = "Mật khẩu không khớp"
            isValid = false
        }

        if (!acceptTerms) {
            tempErrors.terms = "Bạn phải chấp nhận điều khoản và điều kiện"
            isValid = false
        }

        setErrors(tempErrors)

        if (!isValid && scrollViewRef.current) {
            setTimeout(() => {
                const firstError = Object.keys(tempErrors)[0]
                if (firstError === 'fullName') scrollViewRef.current.scrollTo({y: 0, animated: true})
                else if (firstError === 'terms') scrollViewRef.current.scrollToEnd({animated: true})
            }, 100)
        }

        return isValid
    }

    const handleChange = (field, value) => {
        setFormData({
            ...formData,
            [field]: value
        })
        if (errors[field]) {
            setErrors({
                ...errors,
                [field]: null
            })
        }
    }

    const handleSubmit = async () => {
        if (validate()) {
            try {
                setIsLoading(true)
                await signup(
                    {
                        fullname: formData.fullName,
                        email: formData.email,
                        phone: formData.phone,
                        password: formData.password,
                    }
                )
                router.replace('/')

            } catch (error) {
                let errorMessage = "Đăng ký thất bại. Vui lòng thử lại."

                if (error.response?.data?.message) {
                    errorMessage = error.response.data.message
                } else if (error.message === 'Network Error') {
                    errorMessage = "Lỗi kết nối. Vui lòng kiểm tra đường truyền."
                }

                setErrors({
                    form: errorMessage
                })
            } finally {
                setIsLoading(false)
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
                className="flex-1 bg-white"
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
            >
                <VStack space="lg" className="p-6 pt-20">
                    <Box className="items-center my-4">
                        <Image
                            source={require('@/assets/images/react-logo.png')}
                            alt="Logo ứng dụng thú cưng"
                            className="w-32 h-32"
                            resizeMode="contain"
                        />
                        <Heading size="2xl" className="text-blue-400 mt-4">Tạo Tài Khoản</Heading>
                        <Text className="text-gray-500 mt-2">Tham gia với chúng tôi để quản lý thú cưng của bạn</Text>
                    </Box>

                    {errors.form && (
                        <Box className="bg-red-50 p-3 rounded-xl mb-4">
                            <Text className="text-red-500">{errors.form}</Text>
                        </Box>
                    )}

                    <VStack space="md">
                        <FormControl isInvalid={!!errors.fullName}>
                            <FormControlLabel>
                                <Text className="text-gray-700 font-medium mb-1">Họ và Tên</Text>
                            </FormControlLabel>
                            <Input className="bg-gray-50 rounded-xl h-fit border border-gray-200 px-4 py-2">
                                <InputSlot>
                                    <InputIcon as={User} className="text-blue-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Nhập họ và tên của bạn"
                                    value={formData.fullName}
                                    onChangeText={(value) => handleChange('fullName', value)}
                                    className="py-3 px-2 flex-1"
                                />
                            </Input>
                            {errors.fullName && (
                                <FormControlError>
                                    <FormControlErrorText>{errors.fullName}</FormControlErrorText>
                                </FormControlError>
                            )}
                        </FormControl>

                        <FormControl isInvalid={!!errors.email}>
                            <FormControlLabel>
                                <Text className="text-gray-700 font-medium mb-1">Địa chỉ Email</Text>
                            </FormControlLabel>
                            <Input className="bg-gray-50 rounded-xl h-fit border border-gray-200 px-4 py-2">
                                <InputSlot>
                                    <InputIcon as={Mail} className="text-blue-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Nhập địa chỉ email của bạn"
                                    value={formData.email}
                                    onChangeText={(value) => handleChange('email', value)}
                                    keyboardType="email-address"
                                    className="py-3 px-2 flex-1"
                                />
                                {formData.email && (
                                    <InputSlot>
                                        <InputIcon
                                            as={formData.email.includes('@') ? CheckIcon : Mail}
                                            className={formData.email.includes('@') ? "text-green-500" : "text-gray-400"}
                                        />
                                    </InputSlot>
                                )}
                            </Input>
                            {errors.email && (
                                <FormControlError>
                                    <FormControlErrorText>{errors.email}</FormControlErrorText>
                                </FormControlError>
                            )}
                        </FormControl>

                        <FormControl isInvalid={!!errors.phone}>
                            <FormControlLabel>
                                <Text className="text-gray-700 font-medium mb-1">Số Điện Thoại</Text>
                            </FormControlLabel>
                            <Input className="bg-gray-50 rounded-xl h-fit border border-gray-200 px-4 py-2">
                                <InputSlot>
                                    <InputIcon as={Phone} className="text-blue-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Nhập số điện thoại của bạn"
                                    value={formData.phone}
                                    onChangeText={(value) => handleChange('phone', value)}
                                    keyboardType="phone-pad"
                                    className="py-3 px-2 flex-1"
                                />
                            </Input>
                            {errors.phone && (
                                <FormControlError>
                                    <FormControlErrorText>{errors.phone}</FormControlErrorText>
                                </FormControlError>
                            )}
                        </FormControl>

                        <FormControl isInvalid={!!errors.password}>
                            <FormControlLabel>
                                <Text className="text-gray-700 font-medium mb-1">Mật Khẩu</Text>
                            </FormControlLabel>
                            <Input className="bg-gray-50 rounded-xl h-fit border border-gray-200 px-4 py-2">
                                <InputSlot>
                                    <InputIcon as={Shield} className="text-blue-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Tạo mật khẩu"
                                    value={formData.password}
                                    onChangeText={(value) => handleChange('password', value)}
                                    type={showPassword ? "text" : "password"}
                                    className="py-3 px-2 flex-1"
                                />
                                <InputSlot onPress={() => setShowPassword(!showPassword)}>
                                    <InputIcon as={showPassword ? EyeOff : Eye} className="text-gray-400" />
                                </InputSlot>
                            </Input>

                            {formData.password ? (
                                <Box className="mt-2">
                                    <HStack space="xs" alignItems="center">
                                        <Progress
                                            value={passwordStrength * 100}
                                            className={`bg-gray-200 flex-1 h-1.5 rounded-full overflow-hidden`}
                                        >
                                            <ProgressFilledTrack className={`${ strengthInfo.trackColor }`} />
                                        </Progress>
                                        <Text className={`text-xs ml-2 ${ strengthInfo.color }`}>
                                            {strengthInfo.label}
                                        </Text>
                                    </HStack>

                                    <FormControlHelper>
                                        <Text className="text-xs text-gray-500 mt-1">
                                            Sử dụng ít nhất 8 ký tự với chữ hoa, số và ký tự đặc biệt
                                        </Text>
                                    </FormControlHelper>
                                </Box>
                            ) : errors.password ? (
                                <FormControlError>
                                    <FormControlErrorText>{errors.password}</FormControlErrorText>
                                </FormControlError>
                            ) : (
                                <FormControlHelper>
                                    <Text className="text-xs text-gray-500">
                                        Mật khẩu phải có ít nhất 6 ký tự
                                    </Text>
                                </FormControlHelper>
                            )}
                        </FormControl>

                        <FormControl isInvalid={!!errors.confirmPassword}>
                            <FormControlLabel>
                                <Text className="text-gray-700 font-medium mb-1">Xác Nhận Mật Khẩu</Text>
                            </FormControlLabel>
                            <Input className="bg-gray-50 rounded-xl h-fit border border-gray-200 px-4 py-2">
                                <InputSlot>
                                    <InputIcon as={Key} className="text-blue-400" />
                                </InputSlot>
                                <InputField
                                    placeholder="Xác nhận mật khẩu của bạn"
                                    value={formData.confirmPassword}
                                    onChangeText={(value) => handleChange('confirmPassword', value)}
                                    type={showConfirmPassword ? "text" : "password"}
                                    className="py-3 px-2 flex-1"
                                />
                                <InputSlot onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <InputIcon as={showConfirmPassword ? EyeOff : Eye} className="text-gray-400" />
                                </InputSlot>
                            </Input>
                            {errors.confirmPassword && (
                                <FormControlError>
                                    <FormControlErrorText>{errors.confirmPassword}</FormControlErrorText>
                                </FormControlError>
                            )}
                            {formData.confirmPassword && formData.password === formData.confirmPassword && !errors.confirmPassword && (
                                <Box className="mt-1 flex-row items-center">
                                    <Icon as={CheckIcon} className="text-green-500 mr-1" />
                                    <Text className="text-xs text-green-500">Mật khẩu khớp</Text>
                                </Box>
                            )}
                        </FormControl>

                        <FormControl isInvalid={!!errors.terms} className="mt-2">
                            <Checkbox
                                value="terms"
                                isChecked={acceptTerms}
                                onChange={setAcceptTerms}
                                className="my-1"
                            >
                                <CheckboxIndicator className="mr-2 h-5 w-5 border-blue-400">
                                    <CheckboxIcon as={CheckIcon} />
                                </CheckboxIndicator>
                                <CheckboxLabel className="text-sm text-gray-700">
                                    Tôi chấp nhận <Text className="text-blue-500 underline" onPress={() => router.push('/terms')}>Điều khoản và Điều kiện</Text>
                                </CheckboxLabel>
                            </Checkbox>
                            {errors.terms && (
                                <FormControlError>
                                    <FormControlErrorText>{errors.terms}</FormControlErrorText>
                                </FormControlError>
                            )}
                        </FormControl>

                        <Button
                            className="bg-blue-400 rounded-xl h-12 mt-4"
                            onPress={handleSubmit}
                            isDisabled={isLoading}
                        >
                            {isLoading ? (
                                <HStack space="sm" alignItems="center">
                                    <Spinner color="white" size="small" />
                                    <ButtonText>Đang tạo tài khoản...</ButtonText>
                                </HStack>
                            ) : (
                                <ButtonText>Đăng Ký</ButtonText>
                            )}
                        </Button>

                        <Box className="flex-row justify-center mt-4">
                            <Text className="text-gray-600">Bạn đã có tài khoản?</Text>
                            <Text
                                className="text-blue-500 font-medium ml-1"
                                onPress={() => router.push('/auth/login')}
                            >
                                Đăng Nhập
                            </Text>
                        </Box>
                    </VStack>
                </VStack>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

export default Register