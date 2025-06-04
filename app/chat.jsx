import React, {useState, useRef, useEffect} from 'react';
import {
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Animated
} from 'react-native';
import {ApiClient} from '@/config/api';
import {Send, Bot, ArrowLeft} from 'lucide-react-native';
import {useRouter} from 'expo-router';

import {VStack} from '@/components/ui/vstack';
import {HStack} from '@/components/ui/hstack';
import {Box} from '@/components/ui/box';
import {Text} from '@/components/ui/text';
import {Heading} from '@/components/ui/heading';
import {Input} from '@/components/ui/input';
import {InputField} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {Image} from '@/components/ui/image';
import {Icon} from '@/components/ui/icon';
import {Spinner} from '@/components/ui/spinner';
import {Avatar} from '@/components/ui/avatar';
import {AvatarFallbackText} from '@/components/ui/avatar';
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast
} from '@/components/ui/toast';

// Định nghĩa cấu trúc tin nhắn
const MessageTypes = {
    USER: 'user',
    BOT: 'bot',
};

const ChatScreen = () => {
    const [messages, setMessages] = useState([
        {
            id: '1',
            type: MessageTypes.BOT,
            text: 'Xin chào! Tôi là PetBot, trợ lý ảo của PetCare. Bạn có câu hỏi gì về thú cưng hoặc dịch vụ của chúng tôi không?',
            timestamp: new Date()
        },
    ]);
    const [messageInput, setMessageInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState(null); // For storing the message being streamed
    const [visibleChars, setVisibleChars] = useState(0); // Number of characters to show
    const streamingIntervalRef = useRef(null);
    const scrollViewRef = useRef();
    const apiClient = ApiClient();
    const toast = useToast();
    const router = useRouter();

    // Function to start streaming text animation
    const startStreamingText = (fullText) => {
        // Clear any existing interval
        if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
        }

        setVisibleChars(0);

        // Create a streaming message object
        const streamingMsg = {
            id: Date.now().toString() + '-bot',
            type: MessageTypes.BOT,
            text: fullText,
            timestamp: new Date(),
            isStreaming: true
        };

        setStreamingMessage(streamingMsg);

        // Start the interval to gradually reveal characters
        streamingIntervalRef.current = setInterval(() => {
            setVisibleChars(prevChars => {
                const newCount = prevChars + 1;
                // Stop the interval when all characters are shown
                if (newCount >= fullText.length) {
                    clearInterval(streamingIntervalRef.current);
                    streamingIntervalRef.current = null;

                    // Add the completed message to the message list
                    setMessages(prevMessages => [...prevMessages, {
                        ...streamingMsg,
                        isStreaming: false
                    }]);

                    // Clear streaming message
                    setStreamingMessage(null);
                }
                return newCount;
            });
        }, 15); // Adjust speed as needed (milliseconds per character)
    };

    // Clear streaming on unmount
    useEffect(() => {
        return () => {
            if (streamingIntervalRef.current) {
                clearInterval(streamingIntervalRef.current);
            }
        };
    }, []);

    // Improved smooth loading dots animation component
    const LoadingDots = () => {
        const animations = [
            useRef(new Animated.Value(0)).current,
            useRef(new Animated.Value(0)).current,
            useRef(new Animated.Value(0)).current
        ];

        useEffect(() => {
            // Create continuous looping animations without resetting
            const startAnimation = () => {
                animations.forEach((anim, index) => {
                    Animated.loop(
                        Animated.sequence([
                            Animated.delay(index * 120),
                            Animated.timing(anim, {
                                toValue: 1,
                                duration: 300,
                                useNativeDriver: true
                            }),
                            Animated.timing(anim, {
                                toValue: 0,
                                duration: 300,
                                useNativeDriver: true
                            }),
                            Animated.delay((2 - index) * 80)
                        ])
                    ).start();
                });
            };

            startAnimation();

            return () => {
                animations.forEach(anim => anim.stopAnimation());
            };
        }, []);

        // Maps animation values to different positions
        const getAnimatedStyle = (anim) => {
            return {
                transform: [{
                    translateY: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -8],
                    })
                }]
            };
        };

        return (
            <Box className="py-2 flex-row justify-center items-center">
                {animations.map((anim, index) => (
                    <Animated.View
                        key={index}
                        style={[{
                            height: 6,
                            width: 6,
                            borderRadius: 3,
                            backgroundColor: '#3b82f6',
                            marginHorizontal: 4
                        }, getAnimatedStyle(anim)]}
                    />
                ))}
            </Box>
        );
    };

    const handleSendMessage = async () => {
        if (messageInput.trim() === '') return;

        const userMessage = {
            id: Date.now().toString(),
            type: MessageTypes.USER,
            text: messageInput,
            timestamp: new Date(),
        };

        setMessages((prevMessages) => [...prevMessages, userMessage]);
        setMessageInput('');
        setIsLoading(true);

        try {
            // Gửi tin nhắn đến API và nhận phản hồi
            const response = await apiClient.post('/rag/chat', {
                question: messageInput,
                // Tùy chọn: có thể gửi lịch sử tin nhắn nếu backend yêu cầu
                // history: messages.map(msg => ({ role: msg.type, content: msg.text }))
            });
            console.log('API Response:', response);

            // Thêm phản hồi từ bot vào danh sách tin nhắn
            if (response && response.data && response.data.answer) {
                setIsLoading(false); // Hide loading indicator

                // Start streaming effect instead of adding message directly
                startStreamingText(response.data.answer);
            } else {
                throw new Error('Không nhận được phản hồi hợp lệ');
            }
        } catch (error) {
            console.error('Lỗi khi gửi tin nhắn:', error);
            setIsLoading(false);

            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể gửi tin nhắn. Vui lòng thử lại sau.</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    // Cuộn xuống tin nhắn mới nhất khi có tin nhắn mới hoặc khi đang streaming
    useEffect(() => {
        if (scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current.scrollToEnd({animated: true});
            }, 100);
        }
    }, [messages, streamingMessage, visibleChars]);

    // Function to render a streaming message (partially revealed)
    const renderStreamingMessage = () => {
        if (!streamingMessage) return null;

        // Create a copy of the streaming message with partial text
        const partialMessage = {
            ...streamingMessage,
            text: streamingMessage.text.substring(0, visibleChars)
        };

        return (
            <Box
                key={partialMessage.id}
                className="mb-5 max-w-[85%] self-start mr-auto"
            >
                <HStack className="items-center mb-1 ml-1">
                    <Avatar size="xs" className="bg-blue-100 mr-1">
                        <AvatarFallbackText>PB</AvatarFallbackText>
                    </Avatar>
                    <Text className="text-xs text-gray-500">PetBot</Text>
                </HStack>

                <Box
                    className="p-4 rounded-2xl bg-gray-100 rounded-tl-none"
                    style={{
                        shadowColor: '#000',
                        shadowOffset: {width: 0, height: 1},
                        shadowOpacity: 0.1,
                        shadowRadius: 1,
                        elevation: 1,
                    }}
                >
                    <VStack>
                        {formatMessage(partialMessage.text)}
                    </VStack>
                </Box>

                <Text
                    className="text-xs mt-1 text-gray-500 text-left ml-1"
                >
                    {partialMessage.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </Text>
            </Box>
        );
    };

    // Enhanced formatMessage to handle bold text and improved list formatting
    const formatMessage = (text) => {
        if (!text) return '';

        // Process inline bold formatting first
        const processBoldText = (content) => {
            if (!content.includes('**')) return content;

            const parts = content.split(/(\*\*.*?\*\*)/g);
            return parts.map((part, index) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // Extract text between ** markers and render as bold
                    const boldContent = part.slice(2, -2);
                    return <Text key={index} className="font-bold text-gray-800">{boldContent}</Text>;
                }
                return part;
            });
        };

        // Tách các đoạn văn
        const paragraphs = text.split('\n\n');

        return paragraphs.map((paragraph, index) => {
            // Xử lý danh sách có dấu * ở đầu dòng
            if (paragraph.startsWith('* ') || paragraph.match(/^\* /m)) {
                // Split by newline first, then process each line for bullet points
                const lines = paragraph.split('\n');

                return (
                    <VStack key={`p-${ index }`} space="xs" className="mb-3">
                        {lines.map((line, i) => {
                            if (line.startsWith('* ')) {
                                // This is a bullet point
                                return (
                                    <HStack key={`item-${ i }`} space="xs" className="ml-2 mb-1" alignItems="flex-start">
                                        <Text className="text-blue-500 text-lg" style={{lineHeight: 24}}>•</Text>
                                        <Text className="text-gray-800 flex-1">{processBoldText(line.substring(2))}</Text>
                                    </HStack>
                                );
                            } else {
                                // Regular text line
                                return (
                                    <Text key={`line-${ i }`} className="text-gray-800 mb-1">
                                        {processBoldText(line)}
                                    </Text>
                                );
                            }
                        })}
                    </VStack>
                );
            }

            // Xử lý danh sách có dấu * sau dòng văn bản
            if (paragraph.includes('\n* ')) {
                const [intro, ...items] = paragraph.split('\n* ');
                return (
                    <VStack key={`p-${ index }`} space="xs" className="mb-3">
                        {intro && <Text className="text-gray-800 mb-1">{processBoldText(intro)}</Text>}
                        {items.map((item, i) => (
                            <HStack key={`item-${ i }`} space="xs" className="ml-2 mb-1" alignItems="flex-start">
                                <Text className="text-blue-500 text-lg" style={{lineHeight: 24}}>•</Text>
                                <Text className="text-gray-800 flex-1">{processBoldText(item)}</Text>
                            </HStack>
                        ))}
                    </VStack>
                );
            }

            // Xử lý danh sách có dấu gạch đầu dòng
            if (paragraph.startsWith('- ') || paragraph.includes('\n- ')) {
                const lines = paragraph.split('\n');

                return (
                    <VStack key={`p-${ index }`} space="xs" className="mb-3">
                        {lines.map((line, i) => {
                            if (line.startsWith('- ')) {
                                // This is a bullet point with dash
                                return (
                                    <HStack key={`item-${ i }`} space="xs" className="ml-2 mb-1" alignItems="flex-start">
                                        <Text className="text-blue-500 text-lg" style={{lineHeight: 24}}>•</Text>
                                        <Text className="text-gray-800 flex-1">{processBoldText(line.substring(2))}</Text>
                                    </HStack>
                                );
                            } else {
                                // Regular text line
                                return (
                                    <Text key={`line-${ i }`} className="text-gray-800 mb-1">
                                        {processBoldText(line)}
                                    </Text>
                                );
                            }
                        })}
                    </VStack>
                );
            }

            // Xử lý danh sách có số thứ tự
            if (/^\d+\./.test(paragraph) || paragraph.includes('\n\d+\.')) {
                const lines = paragraph.split('\n');

                return (
                    <VStack key={`p-${ index }`} space="xs" className="mb-3">
                        {lines.map((line, i) => {
                            const numberMatch = line.match(/^(\d+)\.(.+)/);
                            if (numberMatch) {
                                // This is a numbered line
                                const [_, number, content] = numberMatch;
                                return (
                                    <HStack key={`item-${ i }`} space="xs" className="ml-2 mb-1" alignItems="flex-start">
                                        <Text className="text-blue-500 font-bold" style={{lineHeight: 24}}>{number}.</Text>
                                        <Text className="text-gray-800 flex-1 ml-1">{processBoldText(content)}</Text>
                                    </HStack>
                                );
                            } else {
                                // Regular text line
                                return (
                                    <Text key={`line-${ i }`} className="text-gray-800 mb-1">
                                        {processBoldText(line)}
                                    </Text>
                                );
                            }
                        })}
                    </VStack>
                );
            }

            // Định dạng đoạn văn bình thường với khoảng cách tốt hơn
            return (
                <Text key={`p-${ index }`} className="text-gray-800 mb-3 leading-5">
                    {processBoldText(paragraph)}
                </Text>
            );
        });
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                className="flex-1"
            // behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            // keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
            >
                <VStack className="flex-1">
                    {/* Header with Back Button */}
                    <Box className="p-4 border-b border-gray-200">
                        <HStack className="items-center">
                            <TouchableOpacity
                                onPress={() => router.back()}
                                className="mr-3 p-1"
                            >
                                <Icon as={ArrowLeft} size="md" color="#3b82f6" />
                            </TouchableOpacity>
                            <Avatar className="bg-blue-100 mr-2">
                                <Icon as={Bot} size="md" color="#3b82f6" />
                            </Avatar>
                            <VStack>
                                <Heading size="sm" className="text-gray-800">PetBot</Heading>
                                <Text className="text-xs text-gray-500">Trợ lý ảo thú cưng</Text>
                            </VStack>
                        </HStack>
                    </Box>

                    {/* Message List */}
                    <ScrollView
                        ref={scrollViewRef}
                        className="flex-1 px-4"
                        contentContainerStyle={{paddingTop: 10, paddingBottom: 20}}
                    >
                        {messages.map((message) => (
                            <Box
                                key={message.id}
                                className={`mb-5 max-w-[85%] ${ message.type === MessageTypes.USER ? 'self-end ml-auto' : 'self-start mr-auto'
                                    }`}
                            >
                                {message.type === MessageTypes.BOT && (
                                    <HStack className="items-center mb-1 ml-1">
                                        <Avatar size="xs" className="bg-blue-100 mr-1">
                                            <AvatarFallbackText>PB</AvatarFallbackText>
                                        </Avatar>
                                        <Text className="text-xs text-gray-500">PetBot</Text>
                                    </HStack>
                                )}

                                <Box
                                    className={`p-4 rounded-2xl ${ message.type === MessageTypes.USER
                                        ? 'bg-blue-500 rounded-tr-none'
                                        : 'bg-gray-100 rounded-tl-none'
                                        }`}
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: {width: 0, height: 1},
                                        shadowOpacity: 0.1,
                                        shadowRadius: 1,
                                        elevation: 1,
                                    }}
                                >
                                    {message.type === MessageTypes.USER ? (
                                        <Text className="text-white">{message.text}</Text>
                                    ) : (
                                        <VStack>
                                            {formatMessage(message.text)}
                                        </VStack>
                                    )}
                                </Box>

                                <Text
                                    className={`text-xs mt-1 text-gray-500 ${ message.type === MessageTypes.USER ? 'text-right mr-1' : 'text-left ml-1'
                                        }`}
                                >
                                    {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                                </Text>
                            </Box>
                        ))}

                        {/* Show streaming message if available */}
                        {streamingMessage && renderStreamingMessage()}

                        {/* Show loading animation only if not streaming */}
                        {isLoading && !streamingMessage && (
                            <Box className="mb-5 w-20">
                                <HStack className="items-center mb-1 ml-1">
                                    <Avatar size="xs" className="bg-blue-100 mr-1">
                                        <AvatarFallbackText>PB</AvatarFallbackText>
                                    </Avatar>
                                    <Text className="text-xs text-gray-500">PetBot</Text>
                                </HStack>
                                <Box
                                    className="bg-gray-100 p-4 rounded-2xl rounded-tl-none"
                                    style={{
                                        shadowColor: '#000',
                                        shadowOffset: {width: 0, height: 1},
                                        shadowOpacity: 0.1,
                                        shadowRadius: 1,
                                        elevation: 1,
                                    }}
                                >
                                    <LoadingDots />
                                </Box>
                            </Box>
                        )}
                    </ScrollView>

                    {/* Message Input - Fixed Positioning */}
                    <Box className="p-3 border-t border-gray-200 bg-white">
                        <HStack space="sm" className="items-center">
                            <Input
                                className="flex-1 bg-gray-100 rounded-full overflow-hidden"
                                style={{maxHeight: 100}}
                            >
                                <InputField
                                    placeholder="Nhập câu hỏi của bạn..."
                                    placeholderTextColor="#a0aec0"
                                    value={messageInput}
                                    onChangeText={setMessageInput}
                                    multiline
                                    className="py-2 px-4"
                                />
                            </Input>
                            <TouchableOpacity
                                onPress={handleSendMessage}
                                disabled={isLoading || messageInput.trim() === ''}
                                className={`w-12 h-12 justify-center items-center rounded-full ${ isLoading || messageInput.trim() === '' ? 'bg-gray-300' : 'bg-blue-500'
                                    }`}
                            >
                                <Icon as={Send} size="sm" color="white" />
                            </TouchableOpacity>
                        </HStack>
                    </Box>
                </VStack>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default ChatScreen;
