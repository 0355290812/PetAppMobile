import React, {useEffect, useState, useContext} from 'react';
import {FlatList, RefreshControl, ScrollView, TouchableOpacity} from 'react-native';
import {router} from 'expo-router';
import {format, isAfter, parseISO, differenceInDays} from 'date-fns';
import {vi} from 'date-fns/locale';

// GlueStack UI Components
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Heading} from "@/components/ui/heading";
import {Avatar, AvatarImage, AvatarFallbackText} from "@/components/ui/avatar";
import {Button, ButtonText, ButtonIcon} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {Badge, BadgeText} from "@/components/ui/badge";
import {Pressable} from '@/components/ui/pressable';
import {Card} from "@/components/ui/card";
import {Image} from "@/components/ui/image";
import {Divider} from "@/components/ui/divider";

// Icons
import {Plus, Calendar, Syringe, AlertCircle, ChevronRight, Bone, Heart, Shield, Tag, Mars, Venus} from "lucide-react-native";

// API and Context
import {ApiClient} from "@/config/api";

import {formatImageUrl} from '@/utils/imageUtils';
import {SafeAreaView} from 'react-native-safe-area-context';

const PetsScreen = () => {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const api = ApiClient();

    const fetchPets = async () => {
        try {
            setLoading(true);
            const response = await api.get('/pets', {
            });

            setPets(response.results);
            processUpcomingEvents(response.results);
        } catch (error) {
            console.error('Error fetching pets:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const processUpcomingEvents = (petsData) => {
        const events = [];

        petsData.forEach(pet => {
            // Process vaccinations
            pet.vaccinations?.forEach(vacc => {
                const expirationDate = parseISO(vacc.expirationDate);
                const daysToExpire = differenceInDays(expirationDate, new Date());

                if (daysToExpire <= 30 && daysToExpire > 0) {
                    events.push({
                        type: 'vaccination',
                        pet: pet.name,
                        petId: pet._id,
                        petAvatar: pet.avatar,
                        name: vacc.name,
                        date: expirationDate,
                        daysLeft: daysToExpire,
                        id: vacc._id,
                        vaccineType: vacc.type // 'Core' or 'Non-Core'
                    });
                }
            });

            // Process health records for any ongoing medications
            pet.healthRecords?.forEach(record => {
                if (record.medications && record.medications.endDate) {
                    const endDate = parseISO(record.medications.endDate);
                    if (isAfter(endDate, new Date())) {
                        events.push({
                            type: 'medication',
                            pet: pet.name,
                            petId: pet._id,
                            petAvatar: pet.avatar,
                            name: record.medications.name,
                            date: endDate,
                            daysLeft: differenceInDays(endDate, new Date()),
                            id: record._id,
                            title: record.title
                        });
                    }
                }
            });
        });

        // Sort by closest date first
        events.sort((a, b) => a.daysLeft - b.daysLeft);
        setUpcomingEvents(events);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchPets();
    };

    useEffect(() => {
        fetchPets();
    }, []);

    const goToPetDetail = (petId) => {
        router.push(`/pets/${ petId }`);
    };

    const goToAddPet = () => {
        router.push('/pets/add?source=pets');
    };

    const renderPetCard = ({item}) => (
        <TouchableOpacity onPress={() => goToPetDetail(item._id)} className="mb-3" key={item._id}>
            <Box
                className="p-3.5 rounded-2xl bg-white shadow-sm"
            >
                <HStack space="md" alignItems="center">
                    <Avatar size="lg" borderRadius="$full" className="border-2 border-blue-200">
                        {item.avatar ? (
                            <AvatarImage
                                source={{
                                    uri: formatImageUrl(item?.avatar)
                                }}
                                alt={item.name}
                            />
                        ) : (
                            <AvatarFallbackText>{item.name}</AvatarFallbackText>
                        )}
                    </Avatar>

                    <VStack flex={1}>
                        <HStack justifyContent="space-between" alignItems="center">
                            <HStack alignItems="center" space="xs">
                                <Heading size="sm" className="text-gray-800">{item.name}</Heading>
                                <Box
                                    className={`${ item.gender === 'Male' ? 'bg-blue-50' : 'bg-rose-50' } rounded-full p-1`}
                                >
                                    <Icon
                                        as={item.gender === 'Male' ? Mars : Venus}
                                        size="xs"
                                        className={item.gender === 'Male' ? 'text-blue-500' : 'text-rose-500'}
                                    />
                                </Box>
                            </HStack>
                            <Icon as={ChevronRight} size="sm" className="text-blue-400" />
                        </HStack>

                        {/* Species and breed combined */}
                        <HStack space="xs" alignItems="center" className="mt-1">
                            <Icon as={Tag} size="xs" className="text-blue-500" />
                            <Text size="xs" className="text-gray-600">
                                {item.species} • {item.breed}
                            </Text>
                        </HStack>

                        <HStack space="md" className="mt-2 flex-wrap">
                            <HStack alignItems="center" space="xs">
                                <Icon as={Heart} size="xs" className="text-rose-500" />
                                <Text size="xs" className="text-gray-600">
                                    {item.birthDate ? format(new Date(item.birthDate), 'dd/MM/yyyy') : 'Không rõ'}
                                </Text>
                            </HStack>

                            <HStack alignItems="center" space="xs">
                                <Icon as={Bone} size="xs" className="text-amber-500" />
                                <Text size="xs" className="text-gray-600">{item.weight}kg</Text>
                            </HStack>
                        </HStack>
                    </VStack>
                </HStack>
            </Box>
        </TouchableOpacity>
    );

    const renderEventCard = ({item}) => (
        <TouchableOpacity onPress={() => goToPetDetail(item.petId)} className="mb-3" key={item.id}>
            <Box
                className="p-4 rounded-2xl bg-white shadow-sm"
            >
                <HStack space="md">
                    <Box className={`${ item.type === 'vaccination' ? "bg-blue-100" : "bg-amber-100" } p-2.5 rounded-full self-start`}>
                        <Icon
                            as={item.type === 'vaccination' ? Syringe : Calendar}
                            size="md"
                            className={item.type === 'vaccination' ? "text-blue-500" : "text-amber-500"}
                        />
                    </Box>

                    <VStack flex={1}>
                        <HStack justifyContent="space-between" alignItems="flex-start">
                            <VStack flex={1}>
                                <Text className="text-gray-800 font-medium text-base">
                                    {item.name}
                                </Text>
                                <Text size="sm" className="text-gray-600 mt-0.5">
                                    Thú cưng: {item.pet}
                                </Text>
                                {item.title && (
                                    <Text size="xs" className="text-gray-500 mt-0.5">{item.title}</Text>
                                )}

                                {/* Add vaccine type badge for vaccination events */}
                                {item.type === 'vaccination' && item.vaccineType && (
                                    <HStack className="mt-1.5 mb-1" alignItems="center" space="xs">
                                        <Icon
                                            as={Shield}
                                            size="xs"
                                            className={item.vaccineType === 'Core' ? "text-emerald-500" : "text-amber-500"}
                                        />
                                        <Badge
                                            className={item.vaccineType === 'Core'
                                                ? "bg-emerald-50"
                                                : "bg-amber-50"
                                            }
                                            borderRadius="$full"
                                            size="sm"
                                        >
                                            <BadgeText
                                                className={item.vaccineType === 'Core'
                                                    ? "text-emerald-600"
                                                    : "text-amber-600"
                                                }
                                                size="xs"
                                            >
                                                {item.vaccineType === 'Core' ? 'Vaccine cốt lõi' : 'Vaccine không cốt lõi'}
                                            </BadgeText>
                                        </Badge>
                                    </HStack>
                                )}

                                <Text size="xs" className="text-gray-500 mt-1">
                                    {'Hết hạn'}: {format(item.date, 'dd/MM/yyyy', {locale: vi})}
                                </Text>
                            </VStack>

                            <Badge
                                className={item.daysLeft < 7 ? "bg-red-100" : "bg-amber-100"}
                                borderRadius="$lg"
                            >
                                <HStack space="xs" alignItems="center" >
                                    {item.daysLeft < 7 && <Icon as={AlertCircle} size="2xs" className="text-red-500" />}
                                    <BadgeText
                                        className={item.daysLeft < 7 ? "text-red-500" : "text-amber-600"}
                                    >
                                        {item.daysLeft} ngày
                                    </BadgeText>
                                </HStack>
                            </Badge>
                        </HStack>
                    </VStack>
                </HStack>
            </Box >
        </TouchableOpacity >
    );

    if (loading && !refreshing) {
        return (
            <Box className="flex-1 justify-center items-center bg-white">
                <Spinner size="large" className="text-blue-400" />
                <Text className="mt-3 text-gray-500">Đang tải thông tin thú cưng...</Text>
            </Box>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <Box className="flex-1 bg-white">
                {/* Header */}
                <Box className="px-6 py-5 bg-blue-400">
                    <HStack justifyContent="space-between" alignItems="center">
                        <VStack>
                            <Text className="text-white text-lg font-bold">Thú cưng của bạn</Text>
                            <Text className="text-blue-100 text-sm">
                                {pets.length} thú cưng được đăng ký
                            </Text>
                        </VStack>

                        <Button
                            size="sm"
                            variant="solid"
                            className="bg-white rounded-xl"
                            onPress={goToAddPet}
                        >
                            <ButtonIcon as={Plus} className="text-blue-400" />
                            <ButtonText className="text-blue-400">Thêm</ButtonText>
                        </Button>
                    </HStack>
                </Box>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#60a5fa"]} />
                    }
                    contentContainerClassName="pb-16"
                >


                    {/* Pet List */}
                    <Box className="px-6 mt-5">
                        <VStack space="md">
                            {pets.map(pet => renderPetCard({item: pet}))}
                        </VStack>

                        {pets.length === 0 && (
                            <Box className="mt-6 items-center p-6 bg-white rounded-2xl shadow-sm">
                                <Text className="text-gray-500 text-center mb-4">
                                    Bạn chưa thêm thú cưng nào.
                                    Hãy thêm thông tin thú cưng để quản lý tốt hơn!
                                </Text>
                                <Button
                                    onPress={goToAddPet}
                                    className="bg-blue-400 self-center"
                                    borderRadius="$full"
                                >
                                    <ButtonIcon as={Plus} className="text-white" />
                                    <ButtonText>Thêm thú cưng</ButtonText>
                                </Button>
                            </Box>
                        )}
                    </Box>

                    {/* Upcoming Events */}
                    {upcomingEvents.length > 0 && (
                        <Box className="px-6 mt-8">
                            <HStack justifyContent="space-between" alignItems="center" className="mb-4">
                                <Heading size="md" className="text-gray-900">Sắp tới</Heading>
                                <Pressable onPress={() => router.push('/calendar')}>
                                    <Text className="text-blue-400 font-medium">Xem tất cả</Text>
                                </Pressable>
                            </HStack>

                            <VStack space="md">
                                {upcomingEvents.slice(0, 3).map(event => renderEventCard({item: event}))}
                            </VStack>
                        </Box>
                    )}
                </ScrollView>
            </Box>
        </SafeAreaView>
    );
};

export default PetsScreen;