import {useEffect, useState} from "react";
import {ScrollView, RefreshControl, SafeAreaView} from "react-native";
import {router} from "expo-router";
import {ApiClient} from "@/config/api";
import {Search, ShoppingCart} from "lucide-react-native";
import {formatImageUrl, getItemImageUrl} from "@/utils/imageUtils";
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
import {Divider} from "@/components/ui/divider";
import {Badge, BadgeText} from "@/components/ui/badge";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";

const Products = () => {
    const [categories, setCategories] = useState([]);
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [saleProducts, setSaleProducts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const {cart, cartCount, addToCart} = useCart();
    const apiClient = ApiClient();
    const toast = useToast();

    const fetchData = async () => {
        try {
            const [categoriesData, featuredProductsData, saleProductsData] = await Promise.all([
                apiClient.get("/categories"),
                apiClient.get("/products", {isFeatured: true, isVisible: true}),
                apiClient.get("/products", {onSale: true, isVisible: true}),
            ]);

            setCategories(categoriesData.categories || []);
            setFeaturedProducts(featuredProductsData.results || []);
            setSaleProducts(saleProductsData.results || []);
        } catch (error) {
            console.log("Error fetching products data:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleAddToCart = async (product) => {
        const result = await addToCart(product);

        if (result.success) {
            toast.show({
                render: ({id}) => {
                    return (
                        <Toast nativeID={id} action="success" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Đã thêm vào giỏ hàng</ToastTitle>
                                <ToastDescription>{product.name}</ToastDescription>
                            </VStack>
                        </Toast>
                    );
                },
            });
        } else {
            toast.show({
                render: ({id}) => {
                    return (
                        <Toast nativeID={id} action="error" variant="solid">
                            <VStack space="xs">
                                <ToastTitle>Lỗi</ToastTitle>
                                <ToastDescription>{result.error}</ToastDescription>
                            </VStack>
                        </Toast>
                    );
                },
            });
        }
    };

    const ProductCard = ({product}) => (
        <Pressable
            className="w-44 shadow-sm mr-4 mb-2"
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
                <VStack className="p-4 pb-3">
                    <Text className="font-medium text-gray-900 mt-1" numberOfLines={2}>{product.name}</Text>
                    <HStack className="items-center justify-between mt-2">
                        <VStack className="h-10 justify-center">
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

    return (
        <SafeAreaView className="flex-1 bg-white">
            <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                contentContainerClassName="pb-16"
            >
                <VStack className="px-6 pt-6">
                    <HStack className="justify-between items-center mb-4">
                        <Heading className="text-gray-900 text-xl">
                            Sản phẩm thú cưng
                        </Heading>
                        <Pressable
                            className="relative p-3 bg-blue-50 rounded-full shadow-sm"
                            onPress={() => router.push('/cart')}
                        >
                            <Icon as={ShoppingCart} size="md" color="#3B82F6" />
                            {cartCount > 0 && (
                                <Badge
                                    variant="solid"
                                    className="bg-red-500 absolute -top-2 -right-2 rounded-full w-fit h-fit"
                                    size="sm"
                                >
                                    <BadgeText className="text-white text-xs text-center w-2 h-4">{cartCount}</BadgeText>
                                </Badge>
                            )}
                        </Pressable>
                    </HStack>

                    <HStack className="mb-6 space-x-3 justify-center items-center gap-2">
                        <Pressable
                            className="flex-1 flex-row items-center bg-gray-100 rounded-2xl px-4 py-4 shadow-sm"
                            onPress={() => router.push('/search')}
                        >
                            <Icon as={Search} size="sm" color="#6B7280" />
                            <Text className="ml-2 text-gray-500 text-base">Tìm kiếm sản phẩm...</Text>
                        </Pressable>
                    </HStack>
                </VStack>

                <VStack className="px-6 mb-4">
                    <Heading size="md" className="text-gray-900 mb-4">Danh mục sản phẩm</Heading>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-2"
                    >
                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <Pressable
                                    key={category._id}
                                    className="mr-4 w-32"
                                    onPress={() => router.push(`/products/all?category=${ category._id }`)}
                                >
                                    <VStack className="items-center">
                                        <Box className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-100 mb-2">
                                            <Image
                                                source={{uri: formatImageUrl(category.image)}}
                                                alt={category.name}
                                                className="w-full h-full"
                                                resizeMode="cover"
                                            />
                                        </Box>
                                        <Text className="text-center text-sm font-medium" numberOfLines={2}>{category.name}</Text>
                                    </VStack>
                                </Pressable>
                            ))
                        ) : (
                            <Box className="w-full py-4 items-center">
                                <Text className="text-gray-500">Đang tải danh mục...</Text>
                            </Box>
                        )}
                    </ScrollView>
                </VStack>

                <Box className="mb-2 mx-6">
                    <Divider />
                </Box>

                <VStack className="px-6 mb-4">
                    <HStack className="justify-between items-center mb-4">
                        <Heading size="md" className="text-gray-900">Sản phẩm nổi bật</Heading>
                        <Pressable onPress={() => router.push('/products/all?tab=featured')}>
                            <Text className="text-blue-400 font-medium">Xem tất cả</Text>
                        </Pressable>
                    </HStack>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-2"
                    >
                        {featuredProducts.length > 0 ? (
                            featuredProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))
                        ) : (
                            <Box className="w-full py-4 items-center">
                                <Text className="text-gray-500">Đang tải sản phẩm nổi bật...</Text>
                            </Box>
                        )}
                    </ScrollView>
                </VStack>

                <Box className="mb-2 mx-6">
                    <Divider />
                </Box>

                <VStack className="px-6 mb-4">
                    <HStack className="justify-between items-center mb-4">
                        <Heading size="md" className="text-gray-900">Đang giảm giá</Heading>
                        <Pressable onPress={() => router.push('/products/all?tab=sale')}>
                            <Text className="text-blue-400 font-medium">Xem tất cả</Text>
                        </Pressable>
                    </HStack>

                    {saleProducts.length > 0 ? (
                        <HStack className="flex-wrap justify-between">
                            {saleProducts.map((product) => (
                                <Box key={product._id} className="w-[48%] mb-4">
                                    <ProductCard product={product} />
                                </Box>
                            ))}
                        </HStack>
                    ) : (
                        <Box className="w-full py-4 items-center">
                            <Text className="text-gray-500">Không có sản phẩm giảm giá</Text>
                        </Box>
                    )}

                    <Button
                        className="bg-blue-400 rounded-xl mt-2"
                        onPress={() => router.push('/products/all')}
                    >
                        <ButtonText>Xem tất cả sản phẩm</ButtonText>
                    </Button>
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
};

export default Products;