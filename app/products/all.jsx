import React, {useEffect, useState} from "react";
import {ScrollView, RefreshControl, SafeAreaView, FlatList} from "react-native";
import {router, useLocalSearchParams} from "expo-router";
import {ApiClient} from "@/config/api";
import {ChevronLeft, Filter, Search, ShoppingCart, SlidersHorizontal} from "lucide-react-native";
import {getItemImageUrl} from "@/utils/imageUtils";
import {formatVietnamCurrency} from "@/utils/formatters";
import {useCart} from "@/contexts/CartContext";

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Image} from "@/components/ui/image";
import {Pressable} from "@/components/ui/pressable";
import {Button, ButtonText} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Badge, BadgeText} from "@/components/ui/badge";
import {Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectContent, SelectDragIndicator, SelectItem, SelectDragIndicatorWrapper} from "@/components/ui/select";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {Actionsheet, ActionsheetBackdrop, ActionsheetContent, ActionsheetDragIndicator, ActionsheetDragIndicatorWrapper} from "@/components/ui/actionsheet";

const ProductsView = () => {
    const {cart, cartCount, addToCart} = useCart();
    const toast = useToast();
    const params = useLocalSearchParams();
    const apiClient = ApiClient();

    // States
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);

    // Filter and sort states
    const [activeTab, setActiveTab] = useState(params.tab || "all");
    const [selectedCategory, setSelectedCategory] = useState(params.category || "");
    const [sortOption, setSortOption] = useState("Mới nhất");
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    // Create query params based on filters
    const getQueryParams = () => {
        const query = {isVisible: true, page};

        if (activeTab === "featured") {
            query.isFeatured = true;
        } else if (activeTab === "sale") {
            query.onSale = true;
        }
        console.log("Selected Category:", selectedCategory);


        if (selectedCategory) {
            query.categoryId = selectedCategory;
        }

        // Add sort options
        switch (sortOption) {
            case "priceAsc":
                query.sort = "price";
                break;
            case "priceDesc":
                query.sort = "-price";
                break;
            case "newest":
                query.sort = "-createdAt";
                break;
            default:
                query.sort = "-createdAt";
        }

        return query;
    };

    const fetchCategories = async () => {
        try {
            const categoriesData = await apiClient.get("/categories");
            setCategories(categoriesData.categories || []);
        } catch (error) {
            console.log("Error fetching categories:", error);
        }
    };

    const fetchProducts = async (reset = false) => {
        try {
            setLoading(true);
            const queryParams = getQueryParams();

            if (reset) {
                queryParams.page = 1;
                setPage(1);
            }

            const response = await apiClient.get("/products", queryParams);

            if (reset) {
                setProducts(response.results || []);
            } else {
                setProducts(prev => [...prev, ...(response.results || [])]);
            }

            setHasMore((response.results || []).length === 10); // Assuming 10 is the page size
        } catch (error) {
            console.log("Error fetching products:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        fetchProducts(true);
    }, [activeTab, selectedCategory, sortOption]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts(true);
    };

    const loadMore = () => {
        if (hasMore && !loading) {
            setPage(prev => prev + 1);
            fetchProducts();
        }
    };

    const handleAddToCart = async (product) => {
        const result = await addToCart(product);

        if (result.success) {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="success" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Đã thêm vào giỏ hàng</ToastTitle>
                            <ToastDescription>{product.name}</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        } else {
            toast.show({
                render: ({id}) => (
                    <Toast nativeID={id} action="error" variant="solid">
                        <VStack space="xs">
                            <ToastTitle>Lỗi</ToastTitle>
                            <ToastDescription>{result.error}</ToastDescription>
                        </VStack>
                    </Toast>
                ),
            });
        }
    };

    const ProductCard = ({product}) => (
        <Pressable
            className="w-[48%] shadow-sm mb-4"
            onPress={() => router.push(`/products/${ product._id }`)}
        >
            <Box className="rounded-2xl overflow-hidden bg-white shadow-md">
                <Box className="relative">
                    <Image
                        source={{uri: getItemImageUrl(product)}}
                        alt={product.name}
                        className="w-full h-44"
                        resizeMode="cover"
                    />
                    {product.onSale && (
                        <Box className="absolute top-2 left-2 bg-red-500 rounded-lg px-2 py-0.5">
                            <Text className="text-white text-xs font-bold">GIẢM GIÁ</Text>
                        </Box>
                    )}
                    {product.stock < 10 && (
                        <Box className="absolute bottom-2 left-2 bg-amber-500/80 rounded-lg px-2 py-0.5">
                            <Text className="text-white text-xs font-bold">Còn {product.stock}</Text>
                        </Box>
                    )}
                </Box>
                <VStack className="p-3">
                    <Text className="font-medium text-gray-900" numberOfLines={2}>{product.name}</Text>
                    <HStack className="items-center justify-between mt-2">
                        <VStack className="justify-center h-10">
                            <Text className="text-blue-500 font-bold">{formatVietnamCurrency(product.onSale ? product.salePrice : product.price)}</Text>
                            {product.onSale && (
                                <Text className="text-gray-500 text-xs line-through">
                                    {formatVietnamCurrency(product.price)}
                                </Text>
                            )}
                        </VStack>
                        <Button
                            size="xs"
                            className="bg-blue-400 rounded-xl h-8"
                            onPress={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                            }}
                            disabled={product.stock <= 0}
                        >
                            <Icon as={ShoppingCart} size="xs" color="white" />
                        </Button>
                    </HStack>
                </VStack>
            </Box>
        </Pressable>
    );

    const getTitle = () => {
        if (selectedCategory) {
            const category = categories.find(c => c._id === selectedCategory);
            return category ? category.name : "Sản phẩm";
        }

        switch (activeTab) {
            case "featured":
                return "Sản phẩm nổi bật";
            case "sale":
                return "Sản phẩm giảm giá";
            default:
                return "Tất cả sản phẩm";
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <VStack className="flex-1">
                <HStack className="px-6 py-4 bg-white items-center justify-between">
                    <HStack className="items-center">
                        <Pressable
                            onPress={() => router.back()}
                            className="p-2 mr-3"
                        >
                            <Icon as={ChevronLeft} size="md" color="#374151" />
                        </Pressable>
                        <Heading size="md">{getTitle()}</Heading>
                    </HStack>

                    <HStack className="space-x-2">
                        <Pressable
                            className="p-2"
                            onPress={() => router.push('/search')}
                        >
                            <Icon as={Search} size="md" color="#374151" />
                        </Pressable>
                        <Pressable
                            className="relative p-2"
                            onPress={() => setShowFilters(true)}
                        >
                            <Icon as={Filter} size="md" color="#374151" />
                        </Pressable>
                        <Pressable
                            className="relative p-2"
                            onPress={() => router.push('/cart')}
                        >
                            <Icon as={ShoppingCart} size="md" color="#374151" />
                            {cartCount > 0 && (
                                <Badge
                                    variant="solid"
                                    className="bg-red-500 absolute -top-2 -right-2 rounded-full"
                                    size="sm"
                                >
                                    <BadgeText className="text-white text-xs">{cartCount}</BadgeText>
                                </Badge>
                            )}
                        </Pressable>
                    </HStack>
                </HStack>

                {/* Tabs for All, Featured, On Sale */}
                <HStack className="px-6 py-2 bg-gray-50 border-b border-gray-200">
                    <Pressable
                        className={`py-2 px-4 rounded-full mr-2 ${ activeTab === "all" ? "bg-blue-500" : "bg-gray-200" }`}
                        onPress={() => setActiveTab("all")}
                    >
                        <Text className={`${ activeTab === "all" ? "text-white" : "text-gray-700" } font-medium`}>Tất cả</Text>
                    </Pressable>
                    <Pressable
                        className={`py-2 px-4 rounded-full mr-2 ${ activeTab === "featured" ? "bg-blue-500" : "bg-gray-200" }`}
                        onPress={() => setActiveTab("featured")}
                    >
                        <Text className={`${ activeTab === "featured" ? "text-white" : "text-gray-700" } font-medium`}>Nổi bật</Text>
                    </Pressable>
                    <Pressable
                        className={`py-2 px-4 rounded-full ${ activeTab === "sale" ? "bg-blue-500" : "bg-gray-200" }`}
                        onPress={() => setActiveTab("sale")}
                    >
                        <Text className={`${ activeTab === "sale" ? "text-white" : "text-gray-700" } font-medium`}>Giảm giá</Text>
                    </Pressable>
                </HStack>

                {/* Sorting dropdown */}
                <HStack className="px-6 py-2 items-center justify-between bg-white border-b border-gray-200">
                    <Text className="text-gray-700 font-medium">Sắp xếp theo:</Text>
                    <Select
                        selectedValue={sortOption}
                        onValueChange={(value) => setSortOption(value)}
                        dropdownIcon={<Icon as={SlidersHorizontal} size="sm" color="#374151" />}
                    >
                        <SelectTrigger className="border-0 bg-transparent w-32">
                            <SelectInput placeholder="Sắp xếp" className="text-right" />
                            <SelectIcon>
                                <Icon as={SlidersHorizontal} size="sm" color="#374151" />
                            </SelectIcon>
                        </SelectTrigger>
                        <SelectPortal>
                            <SelectContent>
                                <SelectDragIndicatorWrapper>
                                    <SelectDragIndicator />
                                </SelectDragIndicatorWrapper>
                                <SelectItem label="Mới nhất" value="newest" />
                                <SelectItem label="Giá tăng dần" value="priceAsc" />
                                <SelectItem label="Giá giảm dần" value="priceDesc" />
                            </SelectContent>
                        </SelectPortal>
                    </Select>
                </HStack>

                {/* Products grid */}
                {products.length === 0 && !loading ? (
                    <Box className="flex-1 items-center justify-center">
                        <Text className="text-gray-500">Không có sản phẩm</Text>
                    </Box>
                ) : (
                    <FlatList
                        data={products}
                        renderItem={({item}) => <ProductCard product={item} />}
                        keyExtractor={(item) => item._id}
                        numColumns={2}
                        columnWrapperStyle={{justifyContent: "space-between", paddingHorizontal: 16}}
                        contentContainerStyle={{paddingVertical: 16}}
                        onEndReached={loadMore}
                        onEndReachedThreshold={0.1}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                        ListFooterComponent={loading && hasMore ? (
                            <Box className="py-4 items-center">
                                <Text className="text-gray-500">Đang tải thêm...</Text>
                            </Box>
                        ) : null}
                    />
                )}

                {/* Filter actionsheet */}
                <Actionsheet isOpen={showFilters} onClose={() => setShowFilters(false)}>
                    <ActionsheetBackdrop />
                    <ActionsheetContent className="pb-6">
                        <ActionsheetDragIndicatorWrapper>
                            <ActionsheetDragIndicator />
                        </ActionsheetDragIndicatorWrapper>
                        <Heading className="px-4 py-2">Lọc sản phẩm</Heading>

                        <Text className="px-4 mt-2 mb-1 text-gray-600 font-medium">Danh mục:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 py-2">
                            <Pressable
                                className={`py-2 px-4 mr-2 rounded-full ${ !selectedCategory ? "bg-blue-500" : "bg-gray-200" }`}
                                onPress={() => {
                                    setSelectedCategory("");
                                    setShowFilters(false);
                                }}
                            >
                                <Text className={`${ !selectedCategory ? "text-white" : "text-gray-700" } font-medium`}>Tất cả</Text>
                            </Pressable>
                            {categories.map(category => (
                                <Pressable
                                    key={category._id}
                                    className={`py-2 px-4 mr-2 rounded-full ${ selectedCategory === category._id ? "bg-blue-500" : "bg-gray-200" }`}
                                    onPress={() => {
                                        setSelectedCategory(category._id);
                                        setShowFilters(false);
                                    }}
                                >
                                    <Text className={`${ selectedCategory === category._id ? "text-white" : "text-gray-700" } font-medium`}>{category.name}</Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        <Button
                            className="mx-4 mt-4 bg-blue-500"
                            onPress={() => {
                                setSelectedCategory("");
                                setShowFilters(false);
                            }}
                        >
                            <ButtonText>Xóa bộ lọc</ButtonText>
                        </Button>
                    </ActionsheetContent>
                </Actionsheet>
            </VStack>
        </SafeAreaView>
    );
};

export default ProductsView;
