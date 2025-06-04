import {useState, useEffect, useMemo} from 'react';
import {ScrollView, SafeAreaView, Dimensions, RefreshControl, FlatList} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {ChevronLeft, Share2, Clock, Calendar, Star, ArrowRight, ShieldCheck, Check, PawPrint, AlertCircle} from 'lucide-react-native';
import {ApiClient} from '@/config/api';
import {formatImageUrl} from '@/utils/imageUtils';
import {formatVietnamCurrency} from '@/utils/formatters';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {format, parseISO, isValid} from 'date-fns';
import {vi} from 'date-fns/locale';

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Image} from "@/components/ui/image";
import {Pressable} from "@/components/ui/pressable";
import {Button, ButtonText, ButtonIcon} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Divider} from "@/components/ui/divider";
import {Badge, BadgeText} from "@/components/ui/badge";
import {Spinner} from "@/components/ui/spinner";
import {
    Accordion,
    AccordionItem,
    AccordionHeader,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";

const {width} = Dimensions.get('window');
const imageHeight = width * 0.8;

const ServiceDetailScreen = () => {
    const {id} = useLocalSearchParams();
    const [service, setService] = useState(null);
    const [timeSlots, setTimeSlots] = useState({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
    const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
    const [userPets, setUserPets] = useState([]);
    const [loadingPets, setLoadingPets] = useState(false);
    const [selectedPets, setSelectedPets] = useState([]); // Mảng thú cưng đã chọn
    const apiClient = ApiClient();
    const toast = useToast();

    const availableDates = useMemo(() => {
        return Object.keys(timeSlots).filter(date =>
            timeSlots[date] && timeSlots[date].length > 0
        ).sort();
    }, [timeSlots]);

    useEffect(() => {
        if (availableDates.length > 0 && !selectedDate) {
            setSelectedDate(availableDates[0]);
        }
    }, [availableDates, selectedDate]);

    const fetchServiceDetails = async () => {
        try {
            setLoading(true);
            const data = await apiClient.get(`/services/${ id }`);
            setService(data);
        } catch (error) {
            console.error("Failed to fetch service details:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải thông tin dịch vụ</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchTimeSlots = async () => {
        try {
            setLoadingTimeSlots(true);
            const data = await apiClient.get(`/services/${ id }/timeslots`);
            setTimeSlots(data);
        } catch (error) {
            console.error("Failed to fetch time slots:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải lịch trống</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoadingTimeSlots(false);
        }
    };

    const fetchUserPets = async () => {
        try {
            setLoadingPets(true);
            const data = await apiClient.get('/pets');
            setUserPets(data.results);
        } catch (error) {
            console.error("Không thể tải danh sách thú cưng:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể tải danh sách thú cưng</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } finally {
            setLoadingPets(false);
        }
    };

    useEffect(() => {
        fetchServiceDetails();
        fetchTimeSlots();
        fetchUserPets();
    }, [id]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchServiceDetails();
        fetchTimeSlots();
    };

    const handleSelectDate = (date) => {
        setSelectedDate(date);
        setSelectedTimeSlot(null);
    };

    const handleSelectTime = (timeSlot) => {
        setSelectedTimeSlot(timeSlot);
    };

    const handleSelectPet = (pet) => {
        setSelectedPets(prevSelectedPets => {
            // Kiểm tra xem thú cưng đã được chọn chưa
            const isAlreadySelected = prevSelectedPets.some(selectedPet => selectedPet._id === pet._id);

            if (isAlreadySelected) {
                // Nếu đã chọn, loại bỏ khỏi danh sách
                return prevSelectedPets.filter(selectedPet => selectedPet._id !== pet._id);
            } else {
                // Nếu chưa chọn, thêm vào danh sách
                return [...prevSelectedPets, pet];
            }
        });
    };

    // Kiểm tra xem có đủ chỗ trống cho số thú cưng đã chọn không
    const hasEnoughSpots = useMemo(() => {
        if (!selectedTimeSlot || selectedPets.length === 0) return true;
        return selectedTimeSlot.availableSpots >= selectedPets.length;
    }, [selectedTimeSlot, selectedPets]);

    const handleShare = () => {
        // TODO: Implement share functionality
    };

    const handleBookNow = async () => {
        if (!service || !selectedDate || !selectedTimeSlot) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="warning" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thông báo</ToastTitle>
                            <ToastDescription>Vui lòng chọn ngày và giờ trước khi đặt lịch</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        if (selectedPets.length === 0) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="warning" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thông báo</ToastTitle>
                            <ToastDescription>Vui lòng chọn ít nhất một thú cưng trước khi đặt lịch</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        if (!hasEnoughSpots) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="warning" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Thông báo</ToastTitle>
                            <ToastDescription>Số chỗ trống không đủ cho {selectedPets.length} thú cưng</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
            return;
        }

        try {
            // Save booking information for the booking page
            await AsyncStorage.setItem('serviceBooking', JSON.stringify({
                serviceId: service._id,
                serviceName: service.name,
                serviceImage: service.images[0],
                price: service.onSale ? service.salePrice : service.price,
                date: selectedDate,
                startTime: selectedTimeSlot.startTime,
                endTime: selectedTimeSlot.endTime,
                pets: selectedPets.map(pet => ({
                    id: pet._id,
                    name: pet.name,
                    breed: pet.breed,
                    petType: pet.species,
                    image: pet.avatar
                })),
                totalPrice: (service.onSale ? service.salePrice : service.price) * selectedPets.length
            }));

            router.push(`/services/${ id }/booking`);
        } catch (error) {
            console.error("Failed to process booking:", error);
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>Không thể xử lý yêu cầu đặt lịch</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = parseISO(dateString);
            if (!isValid(date)) {
                return 'Ngày không hợp lệ';
            }
            return format(date, 'EEEE, dd/MM', {locale: vi});
        } catch (error) {
            console.error("Date formatting error:", error);
            return 'Ngày không hợp lệ';
        }
    };

    // Lọc thú cưng theo loại phù hợp với dịch vụ
    const compatiblePets = useMemo(() => {
        if (!service || !userPets.length) return [];
        return userPets.filter(pet =>
            service.petTypes.includes(pet.species.toLowerCase())
        );
    }, [service, userPets]);

    const renderDateItem = ({item}) => {
        const isSelected = selectedDate === item;
        const date = parseISO(item);
        const dayOfWeek = format(date, 'EEE', {locale: vi});
        const dayOfMonth = format(date, 'dd');

        return (
            <Pressable
                onPress={() => handleSelectDate(item)}
                className={`mr-3 px-3 py-2 rounded-xl ${ isSelected ? 'bg-blue-500' : 'bg-gray-100' }`}
                style={{minWidth: 70}}
            >
                <VStack className="items-center">
                    <Text className={`font-medium ${ isSelected ? 'text-white' : 'text-gray-800' }`}>
                        {dayOfWeek}
                    </Text>
                    <Text className={`text-lg font-bold ${ isSelected ? 'text-white' : 'text-gray-800' }`}>
                        {dayOfMonth}
                    </Text>
                </VStack>
            </Pressable>
        );
    };

    // Component để hiển thị thú cưng
    const renderPetItem = ({item}) => {
        const isSelected = selectedPets.some(pet => pet._id === item._id);
        return (
            <Pressable
                onPress={() => handleSelectPet(item)}
                className={`mr-3 px-3 py-3 rounded-xl border ${ isSelected ? 'bg-blue-50 border-blue-500' : 'bg-white border-gray-200' }`}
                style={{width: 120}}
            >
                <VStack className="items-center">
                    <Box
                        className={`w-14 h-14 rounded-full mb-2 overflow-hidden border-2 ${ isSelected ? 'border-blue-500' : 'border-gray-200' }`}
                    >
                        <Image
                            source={{uri: formatImageUrl(item.avatar)}}
                            alt={item.name}
                            className="w-full h-full"
                            resizeMode="cover"
                            fallbackSource={require('@/assets/images/pet-placeholder.png')}
                        />
                        {isSelected && (
                            <Box className="absolute top-0 right-0 bg-blue-500 w-5 h-5 rounded-full items-center justify-center">
                                <Text className="text-white font-bold text-xs">
                                    {selectedPets.findIndex(pet => pet._id === item._id) + 1}
                                </Text>
                            </Box>
                        )}
                    </Box>
                    <Text className={`font-medium text-center ${ isSelected ? 'text-blue-600' : 'text-gray-800' }`} numberOfLines={1}>
                        {item.name}
                    </Text>
                    <Text className="text-gray-500 text-xs text-center" numberOfLines={1}>
                        {item.breed}
                    </Text>
                </VStack>
            </Pressable>
        );
    };

    if (loading && !service) {
        return (
            <Box className="flex-1 justify-center items-center">
                <Spinner size="lg" color="blue" />
            </Box>
        );
    }

    if (!service) {
        return (
            <Box className="flex-1 justify-center items-center px-6">
                <Text className="text-gray-500 text-center mb-4">
                    Không tìm thấy thông tin dịch vụ
                </Text>
                <Button onPress={() => router.navigate("/services")} className="bg-blue-500">
                    <ButtonText>Quay lại</ButtonText>
                </Button>
            </Box>
        );
    }

    const displayPrice = service.onSale ? service.salePrice : service.price;
    const hasDiscount = service.onSale && service.salePrice < service.price;
    const discountPercentage = hasDiscount
        ? Math.round(((service.price - service.salePrice) / service.price) * 100)
        : 0;

    // Get time slots for the selected date
    const availableTimeSlots = selectedDate ? timeSlots[selectedDate] || [] : [];

    // Render thông tin số lượng thú cưng và chỗ trống
    const renderPetCountInfo = () => {
        if (selectedPets.length === 0 || !selectedTimeSlot) return null;

        return (
            <HStack className={`p-3 rounded-lg mb-3 ${ hasEnoughSpots ? 'bg-green-50' : 'bg-red-50' }`}>
                <Icon
                    as={hasEnoughSpots ? Check : AlertCircle}
                    size="sm"
                    color={hasEnoughSpots ? "#10b981" : "#ef4444"}
                    className="mr-2"
                />
                <Text className={hasEnoughSpots ? "text-green-700" : "text-red-700"}>
                    {hasEnoughSpots
                        ? `Bạn đã chọn ${ selectedPets.length } thú cưng (còn ${ selectedTimeSlot.availableSpots } chỗ trống)`
                        : `Chỉ còn ${ selectedTimeSlot.availableSpots } chỗ trống cho ${ selectedPets.length } thú cưng đã chọn`
                    }
                </Text>
            </HStack>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="flex-1 bg-white">
                {/* Header */}
                <HStack className="px-4 py-3 bg-white items-center justify-between absolute top-0 left-0 right-0 z-10">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-full bg-white/70 items-center justify-center shadow-sm"
                    >
                        <Icon as={ChevronLeft} size="md" color="#374151" />
                    </Pressable>
                    {/* <HStack space="md">
                        <Pressable
                            onPress={handleShare}
                            className="w-10 h-10 rounded-full bg-white/70 items-center justify-center shadow-sm"
                        >
                            <Icon as={Share2} size="md" color="#374151" />
                        </Pressable>
                    </HStack> */}
                </HStack>

                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    contentContainerClassName='pt-16'
                >
                    {/* Service Images */}
                    <Box className="w-full" style={{height: imageHeight}}>
                        <Image
                            source={{uri: formatImageUrl(service.images[0])}}
                            alt={service.name}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                        {hasDiscount && (
                            <Badge
                                variant="solid"
                                className="bg-red-500 absolute top-4 right-4 px-2 py-1 rounded-lg"
                            >
                                <BadgeText className="text-white font-bold">-{discountPercentage}%</BadgeText>
                            </Badge>
                        )}
                    </Box>

                    {/* Service Info */}
                    <VStack className="px-6 pt-4">
                        {/* Pet Types */}
                        <HStack className="mb-1">
                            <Text className="text-blue-500">
                                {service.petTypes.map(type => type === 'dog' ? 'Chó' : type === 'cat' ? 'Mèo' : type).join(', ')}
                            </Text>
                        </HStack>

                        {/* Title */}
                        <Heading size="lg" className="text-gray-900 mb-2">{service.name}</Heading>

                        {/* Rating */}
                        <HStack className="items-center mb-4">
                            <HStack className="items-center">
                                <Icon as={Star} size="sm" color={service.ratings.average > 0 ? "#f59e0b" : "#d1d5db"} fill={service.ratings.average > 0 ? "#f59e0b" : "transparent"} />
                                <Text className="ml-1 text-gray-700">
                                    {service.ratings.average > 0 ? service.ratings.average.toFixed(1) : "Chưa có đánh giá"}
                                </Text>
                            </HStack>
                            {service.ratings.count > 0 && (
                                <Text className="ml-2 text-gray-500">({service.ratings.count} đánh giá)</Text>
                            )}
                        </HStack>

                        {/* Price */}
                        <HStack className="items-baseline mb-4">
                            <Heading size="xl" className="text-blue-600 mr-2">
                                {formatVietnamCurrency(displayPrice)}
                            </Heading>
                            {hasDiscount && (
                                <Text className="text-gray-500 line-through text-base">
                                    {formatVietnamCurrency(service.price)}
                                </Text>
                            )}
                        </HStack>

                        {/* Duration */}
                        <HStack className="items-center mb-4">
                            <Icon as={Clock} size="sm" color="#3B82F6" />
                            <Text className="ml-2 text-gray-700">
                                Thời gian: {service.duration} phút
                            </Text>
                        </HStack>

                        <Divider className="my-4" />

                        {/* Pet Selection */}
                        <VStack className="mb-6">
                            <HStack className="justify-between items-center mb-3">
                                <Heading size="sm">Chọn thú cưng</Heading>
                                {selectedPets.length > 0 && (
                                    <Badge variant="outline" className="bg-blue-50 border-blue-200">
                                        <BadgeText className="text-blue-600">Đã chọn: {selectedPets.length}</BadgeText>
                                    </Badge>
                                )}
                            </HStack>

                            {loadingPets ? (
                                <Box className="items-center py-4">
                                    <Spinner size="sm" color="blue" />
                                </Box>
                            ) : compatiblePets.length > 0 ? (
                                <>
                                    <FlatList
                                        data={compatiblePets}
                                        renderItem={renderPetItem}
                                        keyExtractor={item => item._id}
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerClassName="py-2"
                                    />
                                    <Text className="text-gray-500 text-xs mt-2 italic">
                                        * Bạn có thể chọn nhiều thú cưng cho cùng một lịch hẹn
                                    </Text>
                                </>
                            ) : (
                                <VStack className="bg-gray-100 rounded-lg p-4">
                                    <Text className="text-gray-500 text-center mb-2">
                                        Bạn chưa có thú cưng phù hợp với dịch vụ này
                                    </Text>
                                    <Button
                                        onPress={() => router.push('/pets/add')}
                                        variant="outline"
                                        className="bg-white border border-blue-500"
                                    >
                                        <ButtonIcon as={PawPrint} className="mr-1 text-blue-500" />
                                        <ButtonText className="text-blue-500">Thêm thú cưng</ButtonText>
                                    </Button>
                                </VStack>
                            )}
                        </VStack>

                        {/* Date Selection */}
                        <VStack className="mb-6">
                            <Heading size="sm" className="mb-3">Chọn ngày</Heading>

                            {loadingTimeSlots ? (
                                <Box className="items-center py-4">
                                    <Spinner size="sm" color="blue" />
                                </Box>
                            ) : availableDates.length > 0 ? (
                                <FlatList
                                    data={availableDates}
                                    renderItem={renderDateItem}
                                    keyExtractor={item => item}
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerClassName="py-2"
                                />
                            ) : (
                                <Box className="bg-gray-100 rounded-lg p-4 items-center">
                                    <Text className="text-gray-500">Không có lịch trống</Text>
                                </Box>
                            )}
                        </VStack>

                        {/* Time Slot Selection */}
                        {selectedDate && availableTimeSlots.length > 0 && (
                            <VStack className="mb-6">
                                <HStack className="justify-between items-center mb-3">
                                    <Heading size="sm">Chọn giờ</Heading>
                                    <Text className="text-gray-500">
                                        {formatDate(selectedDate)}
                                    </Text>
                                </HStack>

                                {renderPetCountInfo()}

                                <Box className="flex-row flex-wrap gap-2">
                                    {availableTimeSlots.map((slot, index) => {
                                        const isDisabled = selectedPets.length > slot.availableSpots;
                                        const isSelected = selectedTimeSlot && selectedTimeSlot.startTime === slot.startTime;

                                        return (
                                            <Pressable
                                                key={index}
                                                onPress={() => handleSelectTime(slot)}
                                                disabled={isDisabled}
                                                className={`px-3 py-2 rounded-lg border ${ isSelected
                                                    ? 'bg-blue-500 border-blue-500'
                                                    : isDisabled
                                                        ? 'bg-gray-100 border-gray-200'
                                                        : 'bg-white border-gray-200'
                                                    } w-[23%]`}
                                            >
                                                <VStack>
                                                    <Text
                                                        className={`text-center ${ isSelected
                                                            ? 'text-white font-medium'
                                                            : isDisabled
                                                                ? 'text-gray-400'
                                                                : 'text-gray-800'
                                                            }`}
                                                    >
                                                        {slot.startTime}
                                                    </Text>
                                                    <Text
                                                        className={`text-center text-xs ${ isSelected
                                                            ? 'text-white'
                                                            : isDisabled
                                                                ? 'text-gray-400'
                                                                : 'text-gray-500'
                                                            }`}
                                                    >
                                                        Còn {slot.availableSpots} chỗ
                                                    </Text>
                                                </VStack>
                                            </Pressable>
                                        );
                                    })}
                                </Box>
                            </VStack>
                        )}

                        {selectedDate && availableTimeSlots.length === 0 && (
                            <Box className="bg-orange-100 p-4 rounded-lg mb-6">
                                <Text className="text-orange-700 text-center">
                                    Không có lịch trống trong ngày này
                                </Text>
                            </Box>
                        )}

                        {/* Service Description */}
                        <VStack className="mb-4">
                            <Heading size="md" className="mb-2">Mô tả dịch vụ</Heading>
                            <Text className="text-gray-700 mb-4">{service.description}</Text>
                        </VStack>

                        {/* Service Highlights */}
                        {service.highlights && service.highlights.length > 0 && (
                            <VStack className="mb-6">
                                <Heading size="md" className="mb-3">Điểm nổi bật</Heading>
                                <VStack className="bg-blue-50 p-5 rounded-xl border border-blue-100 shadow-sm gap-4">
                                    {service.highlights.map((highlight, index) => (
                                        <HStack key={index} className="items-center justify-start gap-2">
                                            <Box className="rounded-full bg-blue-100 p-1">
                                                <Icon as={Check} size="sm" color="#3B82F6" />
                                            </Box>
                                            <Text className="text-gray-700 flex-1 font-medium">{highlight}</Text>
                                        </HStack>
                                    ))}
                                </VStack>
                            </VStack>
                        )}

                        {/* Recent Reviews Section */}
                        {service.recentReviews && service.recentReviews.length > 0 && (
                            <VStack className="mb-6">
                                <HStack className="justify-between items-center mb-3">
                                    <Heading size="md">Đánh giá gần đây</Heading>
                                    <Pressable onPress={() => router.push(`/services/${ id }/reviews`)}>
                                        <HStack className="items-center">
                                            <Text className="text-blue-500">Xem tất cả</Text>
                                            <Icon as={ArrowRight} size="xs" color="#3B82F6" className="ml-1" />
                                        </HStack>
                                    </Pressable>
                                </HStack>

                                <VStack className="space-y-4">
                                    {service.recentReviews.slice(0, 2).map((review, index) => (
                                        <Box
                                            key={index}
                                            className="p-4 bg-gray-50 rounded-lg border border-gray-100 mb-2"
                                        >
                                            <HStack className="items-center mb-2">
                                                <Image
                                                    source={{uri: review.customerAvatar ? formatImageUrl(review.customerAvatar) : 'https://via.placeholder.com/40'}}
                                                    className="w-8 h-8 rounded-full mr-2"
                                                    alt="Avatar"
                                                />
                                                <Text className="font-medium">{review.customerName || "Khách hàng"}</Text>
                                                <Box className="ml-auto flex-row items-center">
                                                    {[...Array(5)].map((_, i) => (
                                                        <Icon
                                                            key={i}
                                                            as={Star}
                                                            size="xs"
                                                            color={i < review.rating ? "#f59e0b" : "#d1d5db"}
                                                            fill={i < review.rating ? "#f59e0b" : "transparent"}
                                                        />
                                                    ))}
                                                </Box>
                                            </HStack>
                                            <Text className="text-gray-700 mb-1">{review.content}</Text>
                                            {review.photos && review.photos.length > 0 && (
                                                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
                                                    <HStack className="space-x-2">
                                                        {review.photos.map((photo, photoIndex) => (
                                                            <Image
                                                                key={photoIndex}
                                                                source={{uri: formatImageUrl(photo)}}
                                                                className="w-16 h-16 rounded-md"
                                                                alt={`Review photo ${ photoIndex }`}
                                                            />
                                                        ))}
                                                    </HStack>
                                                </ScrollView>
                                            )}
                                            <Text className="text-gray-500 text-xs">{new Date(review.createdAt).toLocaleDateString('vi-VN')}</Text>
                                        </Box>
                                    ))}
                                </VStack>
                            </VStack>
                        )}

                        {/* Additional Information */}
                        <Accordion className="mb-6 rounded-2xl" type="single" defaultValue="item-1">
                            <AccordionItem value="item-1" className='rounded-2xl'>
                                <AccordionHeader>
                                    <AccordionTrigger>
                                        <Heading size="sm">Thông tin chi tiết</Heading>
                                    </AccordionTrigger>
                                </AccordionHeader>
                                <AccordionContent>
                                    <VStack className="space-y-2 pt-2">
                                        <HStack className="justify-between">
                                            <Text className="text-gray-600">Loại thú cưng:</Text>
                                            <Text className="text-gray-800 font-medium">
                                                {service.petTypes.map(type => type === 'dog' ? 'Chó' : type === 'cat' ? 'Mèo' : type).join(', ')}
                                            </Text>
                                        </HStack>
                                        <HStack className="justify-between">
                                            <Text className="text-gray-600">Thời gian thực hiện:</Text>
                                            <Text className="text-gray-800 font-medium">{service.duration} phút</Text>
                                        </HStack>
                                        <HStack className="justify-between">
                                            <Text className="text-gray-600">Mã dịch vụ:</Text>
                                            <Text className="text-gray-800 font-medium">{service._id.slice(-8).toUpperCase()}</Text>
                                        </HStack>
                                        <Divider className="my-4" />
                                        <HStack className="space-x-2 items-start">
                                            <Icon as={ShieldCheck} size="sm" color="#10b981" className="mt-1 mr-2" />
                                            <VStack>
                                                <Text className="text-gray-800 font-medium">Cam kết dịch vụ</Text>
                                                <Text className="text-gray-600">Hoàn tiền 100% nếu không hài lòng về chất lượng dịch vụ</Text>
                                            </VStack>
                                        </HStack>
                                    </VStack>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </VStack>
                </ScrollView>

                {/* Bottom Action Button */}
                <Box className="p-4 pb-0 bg-white border-t border-gray-200">
                    <Button
                        className="bg-blue-500 p-4 h-fit"
                        onPress={handleBookNow}
                        disabled={!selectedDate || !selectedTimeSlot || selectedPets.length === 0 || !hasEnoughSpots}
                    >
                        <ButtonIcon as={Calendar} mr="2" className='text-white' />
                        <ButtonText>
                            {selectedDate && selectedTimeSlot && selectedPets.length > 0
                                ? `Đặt lịch: ${ selectedTimeSlot.startTime }, ${ formatDate(selectedDate) } (${ selectedPets.length } thú cưng)`
                                : 'Chọn thú cưng, ngày và giờ để đặt lịch'}
                        </ButtonText>
                    </Button>
                </Box>
            </VStack>
        </SafeAreaView>
    );
};

export default ServiceDetailScreen;