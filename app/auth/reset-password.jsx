import {View, TouchableOpacity, Keyboard} from 'react-native'
import React, {useState, useRef, useEffect} from 'react'
import {StatusBar} from 'expo-status-bar'
import {router} from 'expo-router'
import {ArrowLeft} from 'lucide-react-native'

import {VStack} from "@/components/ui/vstack"
import {HStack} from "@/components/ui/hstack"
import {Heading} from "@/components/ui/heading"
import {Text} from "@/components/ui/text"
import {Spinner} from "@/components/ui/spinner"

import {
    Button,
    ButtonText,
    ButtonSpinner
} from "@/components/ui/button"

import {
    FormControl,
    FormControlError,
    FormControlErrorText
} from "@/components/ui/form-control"

import {
    Input,
    InputField
} from "@/components/ui/input"

import {Icon} from "@/components/ui/icon"
import {SafeAreaView} from 'react-native-safe-area-context'

const ResetPassword = () => {
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const inputRefs = useRef([])

    // Focus first input when component mounts
    useEffect(() => {
        if (inputRefs.current[0]) {
            setTimeout(() => inputRefs.current[0].focus(), 100)
        }
    }, [])

    const handleCodeChange = (text, index) => {
        // Allow only single digit
        if (text.length > 1) {
            text = text.slice(0, 1)
        }

        // Update the code state
        const newCode = [...code]
        newCode[index] = text
        setCode(newCode)

        // Auto focus to next input if a digit was entered
        if (text.length === 1 && index < 5) {
            inputRefs.current[index + 1].focus()
        }
    }

    const handleKeyPress = (e, index) => {
        // If backspace is pressed and the field is empty, focus on previous field
        if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1].focus()
        }
    }

    const handleVerifyCode = async () => {
        const fullCode = code.join('')

        if (fullCode.length !== 6) {
            setError('Vui lòng nhập đủ 6 số')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Wait for 1.5 seconds to simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Check if code is 123456
            if (fullCode === '123456') {
                // Navigate to new password screen
                router.push('/auth/new-password')
            } else {
                setError('Mã xác nhận không đúng. Vui lòng thử lại.')
            }
        } catch (err) {
            console.log(err);
            setError('Có lỗi xảy ra. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView className="flex-1 bg-white px-5">
            <StatusBar style="dark" />

            <TouchableOpacity
                className="absolute top-14 left-6 z-10 bg-gray-100 rounded-full p-2"
                onPress={() => router.back()}
            >
                <Icon as={ArrowLeft} size="md" className="text-black" />
            </TouchableOpacity>

            <VStack space="lg" className="mt-8">
                <VStack space="xs">
                    <Heading size="2xl">Đặt Lại Mật Khẩu</Heading>
                    <Text size="md" className="text-gray-500">Nhập mã 6 số đã gửi đến email của bạn</Text>
                </VStack>

                <FormControl isInvalid={!!error} className="mt-6">
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={Keyboard.dismiss}
                        className="w-full"
                    >
                        <HStack space="sm" className="justify-center">
                            {code.map((digit, index) => (
                                <Input
                                    key={index}
                                    variant="outline"
                                    size="md"
                                    className="w-12 h-12 bg-gray-50 rounded-full border-gray-300"
                                    isFocused={true}
                                >
                                    <InputField
                                        ref={el => inputRefs.current[index] = el}
                                        value={digit}
                                        onChangeText={(text) => handleCodeChange(text, index)}
                                        onKeyPress={(e) => handleKeyPress(e, index)}
                                        keyboardType="numeric"
                                        maxLength={1}
                                        selectTextOnFocus
                                        className="text-center text-lg font-medium"
                                    />
                                </Input>
                            ))}
                        </HStack>
                    </TouchableOpacity>

                    {error && (
                        <FormControlError>
                            <FormControlErrorText>{error}</FormControlErrorText>
                        </FormControlError>
                    )}
                </FormControl>

                <Button
                    size="lg"
                    variant="solid"
                    className={`${ loading ? 'bg-blue-200' : 'bg-blue-400' } rounded-xl mt-6 `}
                    isDisabled={code.join('').length !== 6}
                    onPress={handleVerifyCode}
                    isLoading={loading}
                    spinnerPlacement="start"
                >
                    {loading ? (
                        <ButtonSpinner className='mr-2 text-white' />
                    ) : null}
                    <ButtonText>Xác Nhận Mã</ButtonText>
                </Button>

                <HStack className="justify-center mt-4">
                    <Text size="sm" className="text-gray-600">Không nhận được mã?</Text>
                    <TouchableOpacity className="ml-1">
                        <Text size="sm" className="text-blue-400 font-medium">Gửi lại</Text>
                    </TouchableOpacity>
                </HStack>
            </VStack>
        </SafeAreaView>
    )
}

export default ResetPassword