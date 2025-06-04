import React, {useState, useEffect, useCallback} from 'react';
import {FlatList, RefreshControl} from 'react-native';
import {router} from 'expo-router';
import {ApiClient} from '@/config/api';
import {SafeAreaView} from 'react-native-safe-area-context';

// UI Components
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {
    Input,
    InputField,
    InputSlot,
    InputIcon
} from "@/components/ui/input";
import {Image} from "@/components/ui/image";
import {Pressable} from "@/components/ui/pressable";
import {
    Button,
    ButtonText,
} from "@/components/ui/button";
import {
    Badge,
    BadgeText
} from "@/components/ui/badge";
import {Icon} from "@/components/ui/icon";
import {
    Select,
    SelectTrigger,
    SelectInput,
    SelectIcon,
    SelectPortal,
    SelectBackdrop,
    SelectContent,
    SelectDragIndicatorWrapper,
    SelectDragIndicator,
    SelectItem
} from "@/components/ui/select";
import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogCloseButton
} from "@/components/ui/alert-dialog";
import {Center} from "@/components/ui/center";
import {Spinner} from "@/components/ui/spinner";
import {Divider} from "@/components/ui/divider";

// Icons
import {Search, Filter, ArrowDownUp, Calendar, Star, PawPrint, Cat, Dog, Clock, X, AlertCircle} from 'lucide-react-native';
import {formatImageUrl} from "@/utils/imageUtils";

const Services = () => {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPetType, setSelectedPetType] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [showFilterDialog, setShowFilterDialog] = useState(false);
    const [priceRange, setPriceRange] = useState('all');
    const [errorMessage, setErrorMessage] = useState('');
    const [showError, setShowError] = useState(false);
    const api = ApiClient();

    // Map of sort values to display labels
    const sortOptions = {
        'name': 'Tên (A-Z)',
        '-name': 'Tên (Z-A)',
        'price': 'Giá (Thấp đến Cao)',
        '-price': 'Giá (Cao đến Thấp)',
        'rating': 'Đánh Giá'
    };

    // Modified to accept filter parameters
    const fetchServices = useCallback(async (filters = {}) => {
        try {
            setLoading(true);

            // Build query parameters according to backend schema
            let queryParams = {};

            // Price range
            if (filters.minPrice) {
                queryParams.minPrice = filters.minPrice;
            }
            if (filters.maxPrice) {
                queryParams.maxPrice = filters.maxPrice;
            }

            // Rating range
            if (filters.minRating) {
                queryParams.minRating = filters.minRating;
            }

            // Pet types
            if (filters.petTypes && filters.petTypes.length > 0) {
                queryParams.petTypes = filters.petTypes;
            }

            // Feature flags
            if (filters.onSale !== undefined) {
                queryParams.onSale = filters.onSale;
            }
            if (filters.isFeatured !== undefined) {
                queryParams.isFeatured = filters.isFeatured;
            }

            // Name and search
            if (filters.name) {
                queryParams.name = filters.name;
            }
            if (filters.search && filters.search.trim() !== '') {
                queryParams.search = filters.search.trim();
            }

            // Sort
            if (filters.sort) {
                queryParams.sort = filters.sort;
            }

            // Pagination
            if (filters.limit) {
                queryParams.limit = filters.limit;
            }
            if (filters.page) {
                queryParams.page = filters.page;
            }

            // Convert query params to URL format
            const queryString = Object.keys(queryParams)
                .map(key => {
                    // Handle array parameters like petTypes
                    if (Array.isArray(queryParams[key])) {
                        return `${ key }=${ queryParams[key].join(',') }`;
                    }
                    return `${ key }=${ encodeURIComponent(queryParams[key]) }`;
                })
                .join('&');

            const url = queryString ? `/services?${ queryString }` : '/services';

            console.log('Fetching services from URL:', url);


            const response = await api.get(url);

            if (response && response.results) {
                const results = response.results;
                setServices(results);
                setFilteredServices(results);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            setErrorMessage('Không thể tải dịch vụ. Vui lòng thử lại sau.');
            setShowError(true);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [api]);

    useEffect(() => {
        fetchServices({sort: 'name'}); // Fetch all services on initial load
    }, []);

    const onRefresh = () => {
        setRefreshing(true);

        // Prepare filter object based on current filter states
        const filters = {};

        // Handle pet type filtering
        if (selectedPetType !== 'all') {
            filters.petTypes = [selectedPetType];
        }

        // Handle price range filtering
        if (priceRange === 'low') {
            filters.minPrice = 0;
            filters.maxPrice = 300000;
        } else if (priceRange === 'medium') {
            filters.minPrice = 300000;
            filters.maxPrice = 500000;
        } else if (priceRange === 'high') {
            filters.minPrice = 500000;
        }

        // Handle sorting
        if (sortBy) {
            filters.sort = sortBy;
        }

        // Handle search query
        if (searchQuery && searchQuery.trim() !== '') {
            filters.search = searchQuery;
        }

        fetchServices(filters);
    };

    // Apply filters by fetching from backend instead of filtering on frontend
    const applyFilters = () => {
        // Prepare filter object based on selected filter states
        const filters = {};

        // Handle pet type filtering
        if (selectedPetType !== 'all') {
            filters.petTypes = [selectedPetType];
        }

        // Handle price range filtering
        if (priceRange === 'low') {
            filters.minPrice = 0;
            filters.maxPrice = 300000;
        } else if (priceRange === 'medium') {
            filters.minPrice = 300000;
            filters.maxPrice = 500000;
        } else if (priceRange === 'high') {
            filters.minPrice = 500000;
        }

        // Handle sorting
        if (sortBy) {
            filters.sort = sortBy;
        }

        // Handle search query
        if (searchQuery && searchQuery.trim() !== '') {
            filters.search = searchQuery;
        }

        fetchServices(filters);
        setShowFilterDialog(false);
    };

    const clearFilters = () => {
        setSelectedPetType('all');
        setPriceRange('all');
        setSortBy('name');
        setSearchQuery('');
        fetchServices({}); // Fetch all services without filters
        setShowFilterDialog(false);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(price);
    };

    const renderServiceItem = ({item}) => {
        const imageUri = formatImageUrl(item.images[0]);

        return (
            <Pressable
                onPress={() => router.push(`/services/${ item._id }`)}
                className="mb-5 mx-4 mt-2 bg-white rounded-xl shadow-sm"
            >
                <Box className='shadow-sm'>
                    <Image
                        source={{uri: imageUri}}
                        alt={item.name}
                        className="w-full h-52 rounded-t-xl"
                        resizeMode="cover"
                    />

                    <HStack className="absolute top-3 left-3 space-x-2">
                        {item.petTypes.includes('dog') && (
                            <Badge className="bg-blue-100 px-3 py-1 mr-2">
                                <Icon as={Dog} size="sm" className="text-blue-500 mr-1" />
                                <BadgeText className="text-blue-600 font-medium">Chó</BadgeText>
                            </Badge>
                        )}
                        {item.petTypes.includes('cat') && (
                            <Badge className="bg-purple-100 px-3 py-1">
                                <Icon as={Cat} size="sm" className="text-purple-600 mr-1" />
                                <BadgeText className="text-purple-600 font-medium">Mèo</BadgeText>
                            </Badge>
                        )}
                    </HStack>

                    <HStack className="absolute top-3 right-3 space-x-2">
                        {item.isFeatured && (
                            <Badge className="bg-yellow-100 px-3 py-1 mr-2">
                                <BadgeText className="text-yellow-700 font-medium">Nổi bật</BadgeText>
                            </Badge>
                        )}
                        {item.onSale && (
                            <Badge className="bg-red-100 px-3 py-1">
                                <BadgeText className="text-red-600 font-medium">Giảm giá</BadgeText>
                            </Badge>
                        )}
                    </HStack>
                </Box>

                <VStack className="p-5">
                    <HStack className="justify-between items-start h-fit">
                        <Heading size="md" className="text-gray-800 flex-1 mr-2">
                            {item.name}
                        </Heading>
                        <VStack alignItems="flex-end" className='mt-1'>
                            {item.onSale ? (
                                <>
                                    <Text className="text-gray-500 line-through text-sm">
                                        {formatPrice(item.price)}
                                    </Text>
                                    <Text className="text-red-500 font-bold">
                                        {formatPrice(item.salePrice)}
                                    </Text>
                                </>
                            ) : (
                                <Text className="text-blue-500 font-bold">
                                    {formatPrice(item.price)}
                                </Text>
                            )}
                        </VStack>
                    </HStack>

                    <Text className="text-gray-600 mt-2 mb-3 line-clamp-2" numberOfLines={2}>
                        {item.description}
                    </Text>

                    <HStack className="justify-between items-center mt-3">
                        <HStack className="items-center">
                            <Icon as={Clock} size="sm" className="text-gray-500 mr-1" />
                            <Text className="text-gray-500">{item.duration} phút</Text>
                        </HStack>

                        <HStack className="items-center">
                            <Icon as={Star} size="sm" className="text-yellow-500 mr-1" />
                            <Text className="text-gray-700 font-medium">
                                {item.ratings.average > 0 ? item.ratings.average.toFixed(1) : 'Mới'}
                                {item.ratings.count > 0 && ` (${ item.ratings.count })`}
                            </Text>
                        </HStack>
                    </HStack>
                </VStack>
            </Pressable>
        );
    };

    const renderEmptyList = () => (
        <Box className="flex-1 justify-center items-center py-8">
            <Icon as={PawPrint} size="xl" className="text-gray-300 mb-4" />
            <Text className="text-gray-500 text-center">
                Không tìm thấy dịch vụ nào.
            </Text>
            <Text className="text-gray-400 text-center mt-1">
                Hãy thử điều chỉnh bộ lọc của bạn.
            </Text>
            <Button
                onPress={clearFilters}
                className="mt-4 rounded-xl"
            >
                <ButtonText>Xóa Bộ Lọc</ButtonText>
            </Button>
        </Box>
    );

    if (loading && !refreshing) {
        return (
            <Center className="flex-1">
                <Spinner size="lg" color="#3b82f6" />
                <Text className="mt-4 text-gray-500">Đang tải dịch vụ...</Text>
            </Center>
        );
    }

    return (
        <SafeAreaView className="flex-1">
            {/* Header */}
            <VStack className="px-5 pt-4 pb-3 bg-white">
                <HStack className="justify-between items-center mb-5">
                    <VStack>
                        <Heading className="text-2xl font-bold text-gray-800">Dịch Vụ Thú Cưng</Heading>
                        <Text className="text-gray-500 mt-1">Tìm dịch vụ chăm sóc tốt nhất</Text>
                    </VStack>
                    <Button
                        size="sm"
                        borderRadius="$full"
                        className="bg-blue-400 rounded-md p-3 h-fit w-fit"
                        onPress={() => router.push('/bookings')}
                    >
                        <Icon as={Calendar} size="sm" color="white" />
                        <ButtonText className="text-white ml-1">Lịch đã đặt</ButtonText>
                    </Button>
                </HStack>

                {/* Search bar */}
                <HStack className="mb-6 space-x-3 justify-center items-center gap-2">
                    <Pressable
                        className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 py-4 shadow-sm"
                        onPress={() => router.push('/search')}
                    >
                        <Icon as={Search} size="sm" color="#6B7280" />
                        <Text className="ml-2 text-gray-500 text-base">Tìm kiếm dịch vụ...</Text>
                    </Pressable>
                </HStack>

                {/* Filters - Pet Type selection removed */}
                <HStack className="justify-between mb-2 space-x-3">
                    <Button
                        size="sm"
                        className="bg-white border-gray-200 border rounded-xl"
                        onPress={() => setShowFilterDialog(true)}
                    >
                        <Icon as={Filter} size="sm" className="text-blue-400 mr-1" />
                        <ButtonText className="text-gray-700">Bộ Lọc</ButtonText>
                    </Button>

                    <Select
                        // selectedValue={sortBy}
                        onValueChange={value => {
                            setSortBy(value);
                            fetchServices({
                                petType: selectedPetType,
                                priceRange: priceRange,
                                sort: value,
                                searchQuery: searchQuery
                            });
                        }}
                        className=''
                    >
                        <SelectTrigger className="border-gray-200 bg-white shadow-sm rounded-xl" size="sm">
                            <Icon as={ArrowDownUp} size="sm" className="text-blue-400 mr-1 ml-3" />
                            <SelectInput placeholder="Sắp Xếp">{sortOptions[sortBy]}</SelectInput>
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectBackdrop />
                            <SelectContent>
                                <SelectDragIndicatorWrapper>
                                    <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectItem label="Tên (A-Z)" value="name">
                                    Tên (A-Z)
                                </SelectItem>
                                <SelectItem label="Tên (Z-A)" value="-name">
                                    Tên (Z-A)
                                </SelectItem>
                                <SelectItem label="Giá (Thấp đến Cao)" value="price">
                                    Giá (Thấp đến Cao)
                                </SelectItem>
                                <SelectItem label="Giá (Cao đến Thấp)" value="-price">
                                    Giá (Cao đến Thấp)
                                </SelectItem>
                                <SelectItem label="Đánh Giá" value="rating">
                                    Đánh Giá
                                </SelectItem>
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </HStack>
            </VStack>

            {/* Service List */}
            <FlatList
                data={filteredServices}
                renderItem={renderServiceItem}
                keyExtractor={item => item._id}
                contentContainerStyle={{paddingHorizontal: 12, paddingTop: 10, paddingBottom: 48}}
                ListEmptyComponent={renderEmptyList}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#3b82f6']}
                    />
                }
            />

            {/* Filter Dialog */}
            <AlertDialog isOpen={showFilterDialog} onClose={() => setShowFilterDialog(false)}>
                <AlertDialogBackdrop />
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader className="pb-3">
                        <Heading size="lg">Lọc Dịch Vụ</Heading>
                        <AlertDialogCloseButton />
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <VStack space="md" className='pb-2'>
                            {/* Pet type selection - now only in filter dialog */}
                            <Box className="mb-3">
                                <Text className="font-medium mb-3">Loại Thú Cưng</Text>
                                <HStack className="space-x-3 gap-2">
                                    <Pressable
                                        onPress={() => setSelectedPetType('all')}
                                        className={`px-5 py-2.5 rounded-full ${ selectedPetType === 'all' ? 'bg-blue-400' : 'bg-gray-100' }`}
                                    >
                                        <Text className={selectedPetType === 'all' ? 'text-white font-medium' : 'text-gray-600'}>Tất Cả</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setSelectedPetType('dog')}
                                        className={`flex-row items-center px-5 py-2.5 rounded-full ${ selectedPetType === 'dog' ? 'bg-blue-400' : 'bg-gray-100' }`}
                                    >
                                        <Icon as={Dog} size="sm" className={`mr-1.5 ${ selectedPetType === 'dog' ? 'text-white' : 'text-gray-600' }`} />
                                        <Text className={selectedPetType === 'dog' ? 'text-white font-medium' : 'text-gray-600'}>Chó</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setSelectedPetType('cat')}
                                        className={`flex-row items-center px-5 py-2.5 rounded-full ${ selectedPetType === 'cat' ? 'bg-blue-400' : 'bg-gray-100' }`}
                                    >
                                        <Icon as={Cat} size="sm" className={`mr-1.5 ${ selectedPetType === 'cat' ? 'text-white' : 'text-gray-600' }`} />
                                        <Text className={selectedPetType === 'cat' ? 'text-white font-medium' : 'text-gray-600'}>Mèo</Text>
                                    </Pressable>
                                </HStack>
                            </Box>

                            <Divider className="my-2" />

                            <Box className="mt-2">
                                <Text className="font-medium mb-3">Khoảng Giá</Text>
                                <VStack className="space-y-2.5 gap-3">
                                    <Pressable
                                        onPress={() => setPriceRange('all')}
                                        className={`px-5 py-2.5 rounded-full ${ priceRange === 'all' ? 'bg-blue-400' : 'bg-gray-100' }`}
                                    >
                                        <Text className={priceRange === 'all' ? 'text-white font-medium' : 'text-gray-600'}>Tất Cả Giá</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setPriceRange('low')}
                                        className={`px-5 py-2.5 rounded-full ${ priceRange === 'low' ? 'bg-blue-400' : 'bg-gray-100' }`}
                                    >
                                        <Text className={priceRange === 'low' ? 'text-white font-medium' : 'text-gray-600'}>Dưới 300K</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setPriceRange('medium')}
                                        className={`px-5 py-2.5 rounded-full ${ priceRange === 'medium' ? 'bg-blue-400' : 'bg-gray-100' }`}
                                    >
                                        <Text className={priceRange === 'medium' ? 'text-white font-medium' : 'text-gray-600'}>300K-500K</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => setPriceRange('high')}
                                        className={`px-5 py-2.5 rounded-full ${ priceRange === 'high' ? 'bg-blue-400' : 'bg-gray-100' }`}
                                    >
                                        <Text className={priceRange === 'high' ? 'text-white font-medium' : 'text-gray-600'}>Trên 500K</Text>
                                    </Pressable>
                                </VStack>
                            </Box>


                        </VStack>
                    </AlertDialogBody>
                    <AlertDialogFooter className="pt-2">
                        <Button
                            className="mr-3 bg-gray-100 rounded-xl"
                            onPress={() => {
                                setSelectedPetType('all');
                                setPriceRange('all');
                                setSortBy('name');
                                setSearchQuery('');
                                // Don't close dialog yet
                            }}>
                            <ButtonText className="text-gray-700">Xóa Tất Cả</ButtonText>
                        </Button>
                        <Button
                            className="bg-blue-400 rounded-xl"
                            onPress={applyFilters}
                        >
                            <ButtonText>Áp Dụng</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Error Dialog */}
            <AlertDialog isOpen={showError} onClose={() => setShowError(false)}>
                <AlertDialogBackdrop />
                <AlertDialogContent className="rounded-2xl">
                    <AlertDialogHeader>
                        <HStack className="items-center">
                            <Icon as={AlertCircle} size="md" className="text-red-500 mr-2" />
                            <Heading size="md">Lỗi</Heading>
                        </HStack>
                        <AlertDialogCloseButton />
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text>{errorMessage}</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button className="bg-blue-400 rounded-xl" onPress={() => setShowError(false)}>
                            <ButtonText>Đồng Ý</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SafeAreaView>
    );
};

export default Services;