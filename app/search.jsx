import {useState, useEffect, useRef, useCallback} from "react";
import {SafeAreaView, StatusBar, FlatList, ActivityIndicator, TouchableOpacity} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {Search, X, ArrowLeft, Filter, Check, ChevronDown} from "lucide-react-native";
import {ApiClient} from "@/config/api";
import {getItemImageUrl} from "@/utils/imageUtils";
import {formatVietnamCurrency} from "@/utils/formatters";

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Image} from "@/components/ui/image";
import {Input, InputField} from "@/components/ui/input";
import {Pressable} from "@/components/ui/pressable";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Spinner} from "@/components/ui/spinner";
import {Tabs} from "@/components/ui/tabs";
import {ScrollView} from "@/components/ui/scroll-view";
import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
} from "@/components/ui/actionsheet";
import {Divider} from "@/components/ui/divider";

export default function SearchScreen () {
    const params = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState(params.query || "");
    const [activeTab, setActiveTab] = useState("services");
    const [results, setResults] = useState({
        services: [],
        products: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({
        priceRange: [0, 5000000],
        sort: "newest",
        categoryId: null,
    });
    const [pagination, setPagination] = useState({
        services: {page: 1, hasMore: true},
        products: {page: 1, hasMore: true}
    });
    const searchTimeout = useRef(null);
    const servicesListRef = useRef(null);
    const productsListRef = useRef(null);
    const apiClient = ApiClient();

    const priceRanges = [
        {min: 0, max: 100000, label: "Dưới 100K"},
        {min: 100000, max: 300000, label: "100K - 300K"},
        {min: 300000, max: 500000, label: "300K - 500K"},
        {min: 500000, max: 1000000, label: "500K - 1M"},
        {min: 1000000, max: 5000000, label: "Trên 1M"},
    ];

    const debounceSearch = (query) => {
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        setSearchQuery(query);

        if (!query.trim()) {
            setResults({services: [], products: []});
            return;
        }

        searchTimeout.current = setTimeout(() => {
            handleSearch(true, query);
        }, 500);
    };

    const handleSearch = async (reset = false, queryOverride = null) => {
        const queryToUse = queryOverride || searchQuery;

        if (!queryToUse.trim()) {
            setResults({services: [], products: []});
            return;
        }

        if (reset) {
            setLoading(true);
            setPagination({
                services: {page: 1, hasMore: true},
                products: {page: 1, hasMore: true}
            });
        } else {
            setLoadingMore(true);
        }

        setError(null);

        try {
            const currentTab = activeTab;
            const currentPage = reset
                ? 1
                : pagination[currentTab].page;

            let newResults = reset
                ? {services: [], products: []}
                : {...results};

            const params = {
                search: queryToUse,
                isVisible: true,
                limit: 12,
                page: currentPage,
                ...(filters.sort === "newest" && {sort: "-createdAt"}),
                ...(filters.sort === "priceAsc" && {sort: "price"}),
                ...(filters.sort === "priceDesc" && {sort: "-price"}),
                ...(filters.priceRange && {
                    minPrice: filters.priceRange[0],
                    maxPrice: filters.priceRange[1]
                }),
                ...(filters.categoryId && {categoryId: filters.categoryId})
            };

            if (currentTab === "services") {
                const response = await apiClient.get("/services", params);
                const newServices = response?.results || [];
                const hasMore = newServices.length === 12;

                newResults = {
                    ...newResults,
                    services: reset
                        ? newServices
                        : [...newResults.services, ...newServices]
                };

                setPagination(prev => ({
                    ...prev,
                    services: {
                        page: currentPage + 1,
                        hasMore
                    }
                }));
            } else if (currentTab === "products") {
                const response = await apiClient.get("/products", params);
                const newProducts = response?.results || [];
                const hasMore = newProducts.length === 12;

                newResults = {
                    ...newResults,
                    products: reset
                        ? newProducts
                        : [...newResults.products, ...newProducts]
                };

                setPagination(prev => ({
                    ...prev,
                    products: {
                        page: currentPage + 1,
                        hasMore
                    }
                }));
            }

            setResults(newResults);
        } catch (err) {
            console.log("Search error:", err);
            setError("Đã có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        if (searchQuery.trim() && !showFilter) {
            handleSearch(true);
        }
    }, [activeTab]);

    useEffect(() => {
        if (searchQuery.trim() && !showFilter) {
            handleSearch(true);
        }
    }, [filters]);

    useEffect(() => {
        if (params.query) {
            handleSearch(true);
        }
    }, []);

    const handleClearSearch = () => {
        setSearchQuery("");
        setResults({services: [], products: []});
        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === "services" && servicesListRef.current) {
            servicesListRef.current.scrollToOffset({offset: 0, animated: true});
        } else if (tab === "products" && productsListRef.current) {
            productsListRef.current.scrollToOffset({offset: 0, animated: true});
        }
    };

    const handleEndReached = () => {
        const currentTab = activeTab;
        if (!loading && !loadingMore && pagination[currentTab].hasMore) {
            handleSearch(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters({...filters, ...newFilters});
        setShowFilter(false);
        if (searchQuery.trim()) {
            setTimeout(() => {
                handleSearch(true);
            }, 100);
        }
    };

    const renderServiceItem = ({item}) => (
        <Pressable
            className="mb-4 w-full shadow-sm"
            onPress={() => router.push(`/services/${ item._id }`)}
        >
            <Box className="rounded-2xl overflow-hidden bg-white shadow-md">
                <HStack>
                    <Image
                        source={{uri: getItemImageUrl(item, 'images')}}
                        alt={item.name}
                        className="w-1/4 h-full"
                        resizeMode="cover"
                    />
                    <VStack className="flex-1 p-4">
                        <Text className="font-medium text-gray-900" numberOfLines={1}>
                            {item.name}
                        </Text>
                        {item.highlights && item.highlights.length > 0 && (
                            <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
                                {item.highlights[0]}
                            </Text>
                        )}
                        <Text className="text-blue-500 font-bold mt-2">
                            {formatVietnamCurrency(item.price)}
                        </Text>
                    </VStack>
                </HStack>
            </Box>
        </Pressable>
    );

    const renderProductItem = ({item}) => (
        <Pressable
            className="mb-4 w-full shadow-sm"
            onPress={() => router.push(`/products/${ item._id }`)}
        >
            <Box className="rounded-2xl overflow-hidden bg-white shadow-md">
                <HStack>
                    <Image
                        source={{uri: getItemImageUrl(item)}}
                        alt={item.name}
                        className="w-1/4 h-full"
                        resizeMode="cover"
                    />
                    <VStack className="flex-1 p-4">
                        <Text className="font-medium text-gray-900" numberOfLines={1}>
                            {item.name}
                        </Text>
                        <Text className="text-xs text-gray-600 mt-1" numberOfLines={2}>
                            {item.description}
                        </Text>
                        <HStack className="items-center mt-2">
                            <Text className="text-blue-500 font-bold mr-2">
                                {formatVietnamCurrency(item.onSale ? item.salePrice : item.price)}
                            </Text>
                            {item.onSale && (
                                <Text className="text-gray-500 text-xs line-through">
                                    {formatVietnamCurrency(item.price)}
                                </Text>
                            )}
                        </HStack>
                    </VStack>
                </HStack>
            </Box>
        </Pressable>
    );

    const renderEmptyList = () => {
        if (loading) {
            return (
                <VStack className="items-center justify-center flex-1 py-8">
                    <Spinner size="large" color="#3B82F6" />
                    <Text className="mt-4 text-gray-600">Đang tìm kiếm...</Text>
                </VStack>
            );
        }

        if (error) {
            return (
                <VStack className="items-center justify-center flex-1 py-8">
                    <Text className="text-red-500">{error}</Text>
                    <Button className="mt-4" onPress={() => handleSearch(true)}>
                        <ButtonText>Thử lại</ButtonText>
                    </Button>
                </VStack>
            );
        }

        if (searchQuery && activeTab === "services") {
            return (
                <VStack className="items-center justify-center flex-1 py-8">
                    <Text className="text-gray-600">Không tìm thấy dịch vụ nào cho "{searchQuery}"</Text>
                </VStack>
            );
        }

        if (searchQuery && activeTab === "products") {
            return (
                <VStack className="items-center justify-center flex-1 py-8">
                    <Text className="text-gray-600">Không tìm thấy sản phẩm nào cho "{searchQuery}"</Text>
                </VStack>
            );
        }

        if (!searchQuery) {
            return (
                <VStack className="items-center justify-center flex-1 py-8">
                    <Text className="text-gray-600">Nhập từ khóa để tìm kiếm</Text>
                </VStack>
            );
        }

        return null;
    };

    const renderListFooter = () => {
        if (loadingMore) {
            return (
                <VStack className="items-center justify-center py-4">
                    <ActivityIndicator size="small" color="#3B82F6" />
                </VStack>
            );
        }
        return null;
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar barStyle="dark-content" />
            <VStack className="flex-1">
                <HStack className="px-4 py-3 items-center border-b border-gray-200">
                    <Pressable
                        className="mr-3 p-4 rounded-full bg-gray-100"
                        onPress={() => router.back()}
                    >
                        <Icon as={ArrowLeft} size="sm" color="#374151" />
                    </Pressable>
                    <HStack className="flex-1 bg-gray-100 rounded-full items-center px-4 py-2">
                        <Icon as={Search} size="sm" color="#6B7280" />
                        <Input
                            returnKeyType="search"
                            className="flex-1 text-gray-900 text-base h-9 bg-transparent border-0"
                            autoFocus
                        >
                            <InputField
                                className="flex-1 bg-transparent border-0 h-full"
                                placeholderTextColor="#6B7280"
                                placeholder="Tìm kiếm dịch vụ, sản phẩm..."
                                value={searchQuery}
                                onChangeText={debounceSearch}
                                onSubmitEditing={() => handleSearch(true)}
                                returnKeyType="search"
                            />
                            {searchQuery ? (
                                <Pressable onPress={handleClearSearch}>
                                    <Icon as={X} size="sm" color="#6B7280" />
                                </Pressable>
                            ) : null}
                        </Input>
                    </HStack>
                    <Pressable
                        className="ml-3 p-4 bg-gray-100 rounded-full"
                        onPress={() => setShowFilter(true)}
                    >
                        <Icon as={Filter} size="sm" color="#374151" />
                    </Pressable>
                </HStack>

                <VStack className="flex-1">
                    <HStack className="px-4 pt-2">
                        <Pressable
                            className={`py-3 px-4 ${ activeTab === 'services' ? 'border-b-2 border-blue-500' : '' }`}
                            onPress={() => handleTabChange('services')}
                        >
                            <Text className={activeTab === "services" ? "text-blue-500 font-medium" : "text-gray-600"}>
                                Dịch vụ
                            </Text>
                        </Pressable>
                        <Pressable
                            className={`py-3 px-4 ${ activeTab === 'products' ? 'border-b-2 border-blue-500' : '' }`}
                            onPress={() => handleTabChange('products')}
                        >
                            <Text className={activeTab === "products" ? "text-blue-500 font-medium" : "text-gray-600"}>
                                Sản phẩm
                            </Text>
                        </Pressable>
                    </HStack>

                    <Box className="flex-1">
                        {activeTab === "services" ? (
                            loading && !loadingMore ? (
                                <VStack className="items-center justify-center flex-1 py-8">
                                    <Spinner size="large" color="#3B82F6" />
                                    <Text className="mt-4 text-gray-600">Đang tìm kiếm...</Text>
                                </VStack>
                            ) : (
                                <FlatList
                                    ref={servicesListRef}
                                    data={results.services}
                                    renderItem={renderServiceItem}
                                    keyExtractor={(item) => `service-${ item._id }`}
                                    ListEmptyComponent={renderEmptyList}
                                    onEndReached={handleEndReached}
                                    onEndReachedThreshold={0.5}
                                    ListFooterComponent={renderListFooter}
                                    className="px-4 py-2"
                                />
                            )
                        ) : (
                            loading && !loadingMore ? (
                                <VStack className="items-center justify-center flex-1 py-8">
                                    <Spinner size="large" color="#3B82F6" />
                                    <Text className="mt-4 text-gray-600">Đang tìm kiếm...</Text>
                                </VStack>
                            ) : (
                                <FlatList
                                    ref={productsListRef}
                                    data={results.products}
                                    renderItem={renderProductItem}
                                    keyExtractor={(item) => `product-${ item._id }`}
                                    ListEmptyComponent={renderEmptyList}
                                    onEndReached={handleEndReached}
                                    onEndReachedThreshold={0.5}
                                    ListFooterComponent={renderListFooter}
                                    className="px-4 py-2"
                                />
                            )
                        )}
                    </Box>
                </VStack>
            </VStack>

            <Actionsheet isOpen={showFilter} onClose={() => setShowFilter(false)}>
                <ActionsheetBackdrop />
                <ActionsheetContent className="bg-white rounded-t-3xl w-full">
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>

                    <HStack className="w-full justify-between items-center p-4 pl-0 border-gray-200">
                        <Heading size="sm">Bộ lọc tìm kiếm</Heading>
                    </HStack>
                    <Divider className="w-full" />

                    <ScrollView className="py-2 max-h-[70vh] w-full">
                        <VStack className="py-4 border-gray-200">
                            <Heading size="xs" className="mb-4">Sắp xếp theo</Heading>
                            <VStack space={3}>
                                <Pressable
                                    className="flex-row items-center py-3"
                                    onPress={() => setFilters({...filters, sort: "newest"})}
                                >
                                    <Box
                                        className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${ filters.sort === "newest" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                                            }`}
                                    >
                                        {filters.sort === "newest" && (
                                            <Icon as={Check} size="xs" color="#3B82F6" />
                                        )}
                                    </Box>
                                    <Text>Mới nhất</Text>
                                </Pressable>

                                <Pressable
                                    className="flex-row items-center py-3"
                                    onPress={() => setFilters({...filters, sort: "priceAsc"})}
                                >
                                    <Box
                                        className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${ filters.sort === "priceAsc" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                                            }`}
                                    >
                                        {filters.sort === "priceAsc" && (
                                            <Icon as={Check} size="xs" color="#3B82F6" />
                                        )}
                                    </Box>
                                    <Text>Giá thấp đến cao</Text>
                                </Pressable>

                                <Pressable
                                    className="flex-row items-center py-3"
                                    onPress={() => setFilters({...filters, sort: "priceDesc"})}
                                >
                                    <Box
                                        className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${ filters.sort === "priceDesc" ? "border-blue-500 bg-blue-50" : "border-gray-300"
                                            }`}
                                    >
                                        {filters.sort === "priceDesc" && (
                                            <Icon as={Check} size="xs" color="#3B82F6" />
                                        )}
                                    </Box>
                                    <Text>Giá cao đến thấp</Text>
                                </Pressable>
                            </VStack>
                        </VStack>

                        <Divider className="w-full" />

                        <VStack className="py-4 border-gray-200">
                            <Heading size="xs" className="mb-4">Khoảng giá</Heading>
                            <VStack space={3}>
                                {priceRanges.map((range, index) => (
                                    <Pressable
                                        key={`price-range-${ index }`}
                                        className="flex-row items-center py-3"
                                        onPress={() => setFilters({...filters, priceRange: [range.min, range.max]})}
                                    >
                                        <Box
                                            className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${ filters.priceRange[0] === range.min && filters.priceRange[1] === range.max
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-gray-300"
                                                }`}
                                        >
                                            {filters.priceRange[0] === range.min && filters.priceRange[1] === range.max && (
                                                <Icon as={Check} size="xs" color="#3B82F6" />
                                            )}
                                        </Box>
                                        <Text>{range.label}</Text>
                                    </Pressable>
                                ))}
                                <Pressable
                                    className="flex-row items-center py-3"
                                    onPress={() => setFilters({...filters, priceRange: [0, 10000000]})}
                                >
                                    <Box
                                        className={`w-5 h-5 rounded-full border mr-3 items-center justify-center ${ filters.priceRange[0] === 0 && filters.priceRange[1] === 10000000
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-300"
                                            }`}
                                    >
                                        {filters.priceRange[0] === 0 && filters.priceRange[1] === 10000000 && (
                                            <Icon as={Check} size="xs" color="#3B82F6" />
                                        )}
                                    </Box>
                                    <Text>Tất cả giá</Text>
                                </Pressable>
                            </VStack>
                        </VStack>
                    </ScrollView>

                    <HStack className="p-4 border-t border-gray-200">
                        <Button
                            variant="outline"
                            className="flex-1 mr-2"
                            onPress={() => {
                                setFilters({
                                    priceRange: [0, 5000000],
                                    sort: "newest",
                                    categoryId: null
                                });
                            }}
                        >
                            <ButtonText>Đặt lại</ButtonText>
                        </Button>
                        <Button
                            className="flex-1 ml-2"
                            onPress={() => {
                                handleFilterChange(filters);
                            }}
                        >
                            <ButtonText>Áp dụng</ButtonText>
                        </Button>
                    </HStack>
                </ActionsheetContent>
            </Actionsheet>
        </SafeAreaView>
    );
}
