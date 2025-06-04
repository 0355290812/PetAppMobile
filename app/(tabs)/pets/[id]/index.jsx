import React, {useState, useEffect} from 'react';
import {ScrollView, SafeAreaView, ActivityIndicator} from 'react-native';
import {useLocalSearchParams, router} from 'expo-router';
import {format} from 'date-fns';
import {formatImageUrl} from '@/utils/imageUtils';

// UI Components
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Image} from "@/components/ui/image";
import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Heading} from "@/components/ui/heading";
import {Pressable} from "@/components/ui/pressable";
import {Avatar, AvatarImage, AvatarFallbackText} from "@/components/ui/avatar";
import {Icon} from "@/components/ui/icon";
import {Divider} from "@/components/ui/divider";
import {Badge, BadgeText} from "@/components/ui/badge";
import {Center} from "@/components/ui/center";
import {Button, ButtonText, ButtonIcon} from "@/components/ui/button";

// Icons
import {
    CalendarDays, Heart, Info, Cake, Weight,
    UserCircle, Pill, Syringe, UtensilsCrossed,
    PawPrint, CircleDashed, Check, Clock, Calendar,
    ChevronLeft, ArrowLeft
} from 'lucide-react-native';

// API Client
import {ApiClient} from "@/config/api";

const PetDetailScreen = () => {
    const {id} = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState('basic');
    const [petData, setPetData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const api = ApiClient();

    useEffect(() => {
        const fetchPetData = async () => {
            try {
                setIsLoading(true);
                // Call actual API to fetch pet data
                const response = await api.get(`/pets/${ id }`);
                setPetData(response);
            } catch (err) {
                console.error("Error fetching pet data:", err);
                setError("Không thể tải thông tin thú cưng");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPetData();

    }, [id]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy');
        } catch (e) {
            return 'N/A';
        }
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'HH:mm - dd/MM/yyyy');
        } catch (e) {
            return 'N/A';
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 'N/A';
        try {
            const birth = new Date(birthDate);
            const now = new Date();
            let years = now.getFullYear() - birth.getFullYear();
            const monthDiff = now.getMonth() - birth.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
                years--;
            }

            return `${ years } tuổi`;
        } catch (e) {
            return 'N/A';
        }
    };

    // Function to format species and breed text
    const getSpeciesBreedDisplay = () => {
        if (!petData) return '';

        const species = petData.species || '';
        const breed = petData.breed || '';

        if (species === 'Cat') {
            return `Mèo ${ breed }`;
        } else if (species === 'Dog') {
            return `Chó ${ breed }`;
        } else {
            return breed ? `${ species } - ${ breed }` : species;
        }
    };

    const handleBackPress = () => {
        router.back();
    };

    if (isLoading) {
        return (
            <Center className="flex-1 bg-white">
                <ActivityIndicator size="large" color="#60a5fa" />
                <Text className="mt-4">Đang tải thông tin thú cưng...</Text>
            </Center>
        );
    }

    if (error || !petData) {
        return (
            <Center className="flex-1 bg-white p-4">
                <Icon as={Info} size="xl" className="text-gray-500" />
                <Text className="text-red-500 mt-2">{error || "Không tìm thấy thông tin thú cưng"}</Text>
                <Button className="mt-4 bg-blue-400" onPress={() => router.back()}>
                    <ButtonText>Quay lại</ButtonText>
                </Button>
            </Center>
        );
    }

    const renderBasicInfo = () => (
        <VStack space="md" className="p-4 pt-0">
            <Box className="bg-white rounded-xl p-4 shadow-sm">
                <HStack space="md" className="items-center">
                    <Icon as={Cake} size="md" className="text-blue-400" />
                    <VStack>
                        <Text className="text-gray-500 text-sm">Ngày sinh</Text>
                        <Text className="font-medium">{formatDate(petData.birthDate)}</Text>
                    </VStack>
                    <Text className="ml-auto text-gray-600">{calculateAge(petData.birthDate)}</Text>
                </HStack>

                <Divider className="my-3" />

                <HStack space="md" className="items-center">
                    <Icon as={PawPrint} size="md" className="text-blue-400" />
                    <VStack>
                        <Text className="text-gray-500 text-sm">Giống loài</Text>
                        <Text className="font-medium">{getSpeciesBreedDisplay()}</Text>
                    </VStack>
                </HStack>

                <Divider className="my-3" />

                <HStack space="md" className="items-center">
                    <Icon as={UserCircle} size="md" className="text-blue-400" />
                    <VStack>
                        <Text className="text-gray-500 text-sm">Giới tính</Text>
                        <Text className="font-medium">{petData.gender === 'Male' ? 'Đực' : 'Cái'}</Text>
                    </VStack>
                </HStack>

                <Divider className="my-3" />

                <HStack space="md" className="items-center">
                    <Icon as={Weight} size="md" className="text-blue-400" />
                    <VStack>
                        <Text className="text-gray-500 text-sm">Cân nặng</Text>
                        <Text className="font-medium">{petData.weight} kg</Text>
                    </VStack>
                </HStack>

                <Divider className="my-3" />

                <HStack space="md" className="items-center">
                    <Icon as={CircleDashed} size="md" className="text-blue-400" />
                    <VStack>
                        <Text className="text-gray-500 text-sm">Màu lông</Text>
                        <Text className="font-medium">{petData.color}</Text>
                    </VStack>
                </HStack>
            </Box>
        </VStack>
    );

    const renderHealthInfo = () => (
        <VStack space="md" className="p-4 pt-0">
            {petData.healthRecords && petData.healthRecords.length > 0 ? (
                petData.healthRecords.map((record, index) => (
                    <Box key={record._id || index} className="bg-white rounded-xl p-4 shadow-sm mb-4">
                        <HStack className="justify-between mb-2">
                            <Heading size="sm">{record.title}</Heading>
                            <Badge className="bg-blue-100">
                                <BadgeText className="text-blue-600">{formatDate(record.date)}</BadgeText>
                            </Badge>
                        </HStack>

                        <Divider className="my-2" />

                        <HStack space="md" className="mb-2">
                            <Text className="text-gray-500 w-24">Triệu chứng:</Text>
                            <Text className="flex-1">{record.symptoms}</Text>
                        </HStack>

                        <HStack space="md" className="mb-2">
                            <Text className="text-gray-500 w-24">Điều trị:</Text>
                            <Text className="flex-1">{record.treatment}</Text>
                        </HStack>

                        {record.medications && record.medications.length > 0 ? (
                            <VStack space="sm" className="mt-4 bg-blue-50 p-3 rounded-lg">
                                <Heading size="xs" className="text-blue-700">Thuốc điều trị</Heading>
                                {record.medications.map((medication, idx) => (
                                    <Box key={idx} className={idx > 0 ? "mt-3 pt-3 border-t border-blue-100" : ""}>
                                        <HStack space="md" className='items-center'>
                                            <Icon as={Pill} size="sm" className="text-blue-400" />
                                            <Text className="font-medium">{medication.name || 'N/A'}</Text>
                                        </HStack>
                                        <HStack space="md">
                                            <Text className="text-gray-500 text-sm">Liều lượng:</Text>
                                            <Text className="text-sm">{medication.dosage || 'N/A'}</Text>
                                        </HStack>
                                        <HStack space="md">
                                            <Text className="text-gray-500 text-sm">Tần suất:</Text>
                                            <Text className="text-sm">{medication.frequency || 'N/A'}</Text>
                                        </HStack>
                                        <HStack space="md">
                                            <Text className="text-gray-500 text-sm">Thời gian:</Text>
                                            <Text className="text-sm">{formatDate(medication.startDate)} - {formatDate(medication.endDate)}</Text>
                                        </HStack>
                                    </Box>
                                ))}
                            </VStack>
                        ) : (
                            <Box className="mt-4 bg-gray-50 p-3 rounded-lg">
                                <Text className="text-gray-500 text-center">Không có thông tin thuốc</Text>
                            </Box>
                        )}

                        {record.notes && (
                            <Box className="mt-3 bg-gray-50 p-3 rounded-lg">
                                <Text className="text-gray-600 italic">{record.notes}</Text>
                            </Box>
                        )}

                        {record.attachments && record.attachments.length > 0 && (
                            <VStack className="mt-4">
                                <Text className="font-medium mb-2">Hình ảnh đính kèm:</Text>
                                <HStack space="sm" className="flex-wrap">
                                    {record.attachments.map((attachment, idx) => {
                                        const imageUrl = formatImageUrl(attachment);

                                        return (
                                            <Image
                                                key={idx}
                                                source={{uri: imageUrl}}
                                                className="w-20 h-20 rounded-md"
                                                alt="Attachment"
                                                fallbackSource={require('@/assets/images/image-placeholder.png')}
                                            />
                                        );
                                    })}
                                </HStack>
                            </VStack>
                        )}
                    </Box>
                ))
            ) : (
                <Center className="bg-white rounded-xl p-6 shadow-sm">
                    <Icon as={Info} size="xl" className="text-gray-500" />
                    <Text className="text-gray-500 mt-2">Chưa có hồ sơ sức khỏe nào</Text>
                </Center>
            )}
        </VStack>
    );

    const renderVaccinationInfo = () => (
        <VStack space="md" className="p-4 pt-0">
            {petData.vaccinations && petData.vaccinations.length > 0 ? (
                petData.vaccinations.map((vaccination, index) => (
                    <Box key={vaccination._id || index} className="bg-white rounded-xl p-4 shadow-sm mb-4">
                        <HStack className="items-center mb-2">
                            <Icon as={Syringe} size="md" className="text-blue-400 mr-2" />
                            <Heading size="sm">{vaccination.name}</Heading>
                            <Badge className="ml-auto bg-amber-100">
                                <BadgeText className="text-amber-600">{vaccination.type}</BadgeText>
                            </Badge>
                        </HStack>

                        <Divider className="my-3" />

                        <HStack space="md" className="mb-2">
                            <Icon as={Check} size="sm" className="text-green-500" />
                            <Text className="text-gray-500">Ngày tiêm:</Text>
                            <Text>{formatDateTime(vaccination.dateAdministered)}</Text>
                        </HStack>

                        <HStack space="md" className="mb-2">
                            <Icon as={Calendar} size="sm" className="text-orange-500" />
                            <Text className="text-gray-500">Hết hạn:</Text>
                            <Text>{formatDateTime(vaccination.expirationDate)}</Text>
                        </HStack>

                        <HStack space="md" className="mb-2">
                            <Icon as={UserCircle} size="sm" className="text-blue-500" />
                            <Text className="text-gray-500">Cung cấp bởi:</Text>
                            <Text>{vaccination.provider}</Text>
                        </HStack>

                        {vaccination.notes && (
                            <Box className="mt-3 bg-gray-50 p-3 rounded-lg">
                                <Text className="text-gray-600 italic">{vaccination.notes}</Text>
                            </Box>
                        )}
                    </Box>
                ))
            ) : (
                <Center className="bg-white rounded-xl p-6 shadow-sm">
                    <Icon as={Info} size="xl" className="text-gray-500" />
                    <Text className="text-gray-500 mt-2">Chưa có thông tin tiêm phòng</Text>
                </Center>
            )}
        </VStack>
    );

    const renderDietInfo = () => (
        <VStack space="md" className="p-4 pt-0">
            <Box className="bg-white rounded-xl p-4 shadow-sm">
                <HStack className="items-center mb-3">
                    <Icon as={UtensilsCrossed} size="md" className="text-blue-400 mr-2" />
                    <Heading size="sm">Chế độ ăn của {petData.name}</Heading>
                </HStack>

                <Divider className="my-3" />

                <VStack space="md">
                    <VStack>
                        <Text className="text-gray-500">Loại thức ăn</Text>
                        <Text className="font-medium">{petData.dietInfo?.foodType || "Chưa có thông tin"}</Text>
                    </VStack>

                    <VStack>
                        <Text className="text-gray-500">Lịch cho ăn</Text>
                        <HStack space="sm" className="items-center">
                            <Icon as={Clock} size="sm" className="text-blue-400" />
                            <Text>{petData.dietInfo?.schedule || "Chưa có lịch cụ thể"}</Text>
                        </HStack>
                    </VStack>

                    <VStack>
                        <Text className="text-gray-500">Các dị ứng</Text>
                        {petData.dietInfo?.allergies && petData.dietInfo.allergies.length > 0 ? (
                            <HStack space="sm" className="flex-wrap mt-1">
                                {petData.dietInfo.allergies.map((allergy, idx) => (
                                    <Badge key={idx} className="bg-red-100 mb-1">
                                        <BadgeText className="text-red-600">{allergy}</BadgeText>
                                    </Badge>
                                ))}
                            </HStack>
                        ) : (
                            <Text>Không có dị ứng</Text>
                        )}
                    </VStack>

                    {petData.dietInfo?.notes && (
                        <VStack className="bg-blue-50 p-3 rounded-lg mt-2">
                            <Text className="font-medium text-blue-700">Lưu ý:</Text>
                            <Text>{petData.dietInfo.notes}</Text>
                        </VStack>
                    )}
                </VStack>
            </Box>
        </VStack>
    );

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'basic':
                return renderBasicInfo();
            case 'health':
                return renderHealthInfo();
            case 'vaccination':
                return renderVaccinationInfo();
            case 'diet':
                return renderDietInfo();
            default:
                return renderBasicInfo();
        }
    };

    // Get pet avatar URL
    const getPetAvatarUrl = () => {
        if (!petData.avatar) return null;
        return formatImageUrl(petData?.avatar);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Back Button */}
            <Box className="absolute top-24 left-4 z-10">
                <Button
                    className="bg-white rounded-full w-10 h-10 flex items-center justify-center shadow-sm"
                    onPress={handleBackPress}
                >
                    <ButtonIcon as={ArrowLeft} className="text-gray-800" />
                </Button>
            </Box>

            {/* Pet Header */}
            <Box className="bg-blue-400 pt-16 pb-6 px-4">
                <VStack space="sm" className="items-center">
                    <Avatar size="xl" className="border-4 border-white">
                        {getPetAvatarUrl() ? (
                            <AvatarImage
                                source={{uri: getPetAvatarUrl()}}
                                fallbackSource={require('@/assets/images/pet-placeholder.png')}
                            />
                        ) : (
                            <AvatarFallbackText>{petData.name}</AvatarFallbackText>
                        )}
                    </Avatar>
                    <Heading className="text-white text-2xl">{petData.name}</Heading>
                    <Text className="text-white/80">{getSpeciesBreedDisplay()}</Text>
                </VStack>
            </Box>

            {/* Tabs Navigation */}
            <HStack className="bg-white p-1 rounded-xl mx-4 -mt-6 shadow-sm">
                <Pressable
                    className={`flex-1 p-3 rounded-lg ${ activeTab === 'basic' ? 'bg-blue-100' : '' }`}
                    onPress={() => setActiveTab('basic')}
                >
                    <Center>
                        <Icon
                            as={Info}
                            size="sm"
                            className={activeTab === 'basic' ? 'text-blue-500' : 'text-gray-500'}
                        />
                        <Text
                            className={`text-center text-xs ${ activeTab === 'basic' ? 'text-blue-600 font-medium' : 'text-gray-600' }`}
                        >
                            Cơ bản
                        </Text>
                    </Center>
                </Pressable>

                <Pressable
                    className={`flex-1 p-3 rounded-lg ${ activeTab === 'health' ? 'bg-blue-100' : '' }`}
                    onPress={() => setActiveTab('health')}
                >
                    <Center>
                        <Icon
                            as={Heart}
                            size="sm"
                            className={activeTab === 'health' ? 'text-blue-500' : 'text-gray-500'}
                        />
                        <Text
                            className={`text-center text-xs ${ activeTab === 'health' ? 'text-blue-600 font-medium' : 'text-gray-600' }`}
                        >
                            Sức khỏe
                        </Text>
                    </Center>
                </Pressable>

                <Pressable
                    className={`flex-1 p-3 rounded-lg ${ activeTab === 'vaccination' ? 'bg-blue-100' : '' }`}
                    onPress={() => setActiveTab('vaccination')}
                >
                    <Center>
                        <Icon
                            as={Syringe}
                            size="sm"
                            className={activeTab === 'vaccination' ? 'text-blue-500' : 'text-gray-500'}
                        />
                        <Text
                            className={`text-center text-xs ${ activeTab === 'vaccination' ? 'text-blue-600 font-medium' : 'text-gray-600' }`}
                        >
                            Vaccine
                        </Text>
                    </Center>
                </Pressable>

                <Pressable
                    className={`flex-1 p-3 rounded-lg ${ activeTab === 'diet' ? 'bg-blue-100' : '' }`}
                    onPress={() => setActiveTab('diet')}
                >
                    <Center>
                        <Icon
                            as={UtensilsCrossed}
                            size="sm"
                            className={activeTab === 'diet' ? 'text-blue-500' : 'text-gray-500'}
                        />
                        <Text
                            className={`text-center text-xs ${ activeTab === 'diet' ? 'text-blue-600 font-medium' : 'text-gray-600' }`}
                        >
                            Dinh dưỡng
                        </Text>
                    </Center>
                </Pressable>
            </HStack>
            <ScrollView className='mt-4' contentContainerClassName=''>

                {/* Tab Content */}
                <Box className="pb-10">
                    {renderActiveTab()}
                </Box>
            </ScrollView>
        </SafeAreaView>
    );
};

export default PetDetailScreen;
