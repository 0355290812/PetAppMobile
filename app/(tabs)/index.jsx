import {useEffect, useState} from "react";
import {ScrollView, RefreshControl, SafeAreaView} from "react-native";
import {router, Redirect, useRootNavigationState} from "expo-router";
import {useAuth} from "@/contexts/AuthContext";
import {ApiClient} from "@/config/api";
import {Search, Bell, Heart, ShoppingCart, Paw, Clock, MessageSquare} from "lucide-react-native";
import {formatImageUrl, getItemImageUrl} from "@/utils/imageUtils";
import {formatVietnamCurrency} from "@/utils/formatters";
import {useCart} from "@/contexts/CartContext";
import {
    Toast,
    ToastTitle,
    ToastDescription,
    useToast,
} from "@/components/ui/toast";
import {Badge, BadgeText} from "@/components/ui/badge";

import {VStack} from "@/components/ui/vstack";
import {HStack} from "@/components/ui/hstack";
import {Box} from "@/components/ui/box";
import {Text} from "@/components/ui/text";
import {Heading} from "@/components/ui/heading";
import {Image} from "@/components/ui/image";
import {
    Avatar,
    AvatarFallbackText,
    AvatarImage,
} from "@/components/ui/avatar";
import {Pressable} from "@/components/ui/pressable";
import {
    Button,
    ButtonText,
} from "@/components/ui/button";
import {Icon} from "@/components/ui/icon";
import {Divider} from "@/components/ui/divider";

export default function Index () {
    const {isLoggedIn, user} = useAuth();
    const [pets, setPets] = useState([]);
    const [services, setServices] = useState([]);
    const [products, setProducts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const apiClient = ApiClient();
    const {cart, addToCart} = useCart();
    const toast = useToast();

    const fetchData = async () => {
        try {
            const [petsData, servicesData, productsData] = await Promise.all([
                apiClient.get("/pets"),
                apiClient.get("/services", {isFeatured: true, isVisible: true}),
                apiClient.get("/products", {isFeatured: true, isVisible: true}),
            ]);

            setPets(petsData.results || []);
            setServices(servicesData.results || []);
            setProducts(productsData.results || []);
        } catch (error) {
            console.log("Error fetching data:", error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchData();
        }
    }, [isLoggedIn]);

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

    return !isLoggedIn ? <Redirect href="/auth/login" /> : (
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
                    <HStack className="justify-between items-center mb-6">
                        <HStack className="items-center space-x-4">
                            <Avatar className="size-14 mr-2">
                                <AvatarFallbackText>{user?.fullname || "User"}</AvatarFallbackText>
                                {user?.avatar && <AvatarImage source={{uri: formatImageUrl(user?.avatar)}} />}
                            </Avatar>
                            <VStack>
                                <Text className="text-gray-600 text-sm font-medium">Xin chào,</Text>
                                <Heading className="text-gray-900 text-xl">
                                    {user?.fullname || "Người yêu thú cưng"}
                                </Heading>
                            </VStack>
                        </HStack>
                        <HStack className="space-x-4 gap-2">
                            <Pressable
                                className="w-11 h-11 rounded-full bg-blue-50 items-center justify-center shadow-sm relative"
                                onPress={() => router.push('/cart')}
                            >
                                <Icon as={ShoppingCart} size="md" color="#3B82F6" />
                                {cart.length > 0 && (
                                    <Badge
                                        variant="solid"
                                        className="bg-red-500 absolute -top-2 -right-2 rounded-full"
                                        size="sm"
                                    >
                                        <BadgeText className="text-white text-xs">{cart.length}</BadgeText>
                                    </Badge>
                                )}
                            </Pressable>
                        </HStack>
                    </HStack>

                    <Pressable
                        className="flex-row items-center bg-gray-100 rounded-2xl px-4 py-3.5 mb-8 shadow-sm"
                        onPress={() => router.push('/search')}
                    >
                        <Icon as={Search} size="sm" color="#6B7280" />
                        <Text className="ml-2 text-gray-500 text-base">Tìm kiếm dịch vụ, sản phẩm...</Text>
                    </Pressable>
                </VStack>

                <VStack className="px-6 mb-2">
                    <HStack className="justify-between items-center mb-5">
                        <Heading size="md" className="text-gray-900">Thú cưng của tôi</Heading>
                        <Pressable onPress={() => router.push('/pets')}>
                            <Text className="text-blue-400 font-medium">Xem tất cả</Text>
                        </Pressable>
                    </HStack>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="pb-2"
                    >
                        <Pressable
                            className="w-16 h-16 rounded-full bg-blue-400 items-center justify-center mr-5"
                            onPress={() => router.push('/pets/add')}
                        >
                            <Text className="text-white text-2xl font-semibold">+</Text>
                        </Pressable>

                        {pets.length > 0 ? (
                            pets.map((pet) => (
                                <Pressable
                                    key={pet._id}
                                    className="mr-5"
                                    onPress={() => router.push(`/pets/${ pet._id }`)}
                                >
                                    <VStack className="items-center">
                                        <Box className="relative">
                                            <Avatar className="w-16 h-16 rounded-full border-2 border-blue-300">
                                                <AvatarFallbackText>{pet.name}</AvatarFallbackText>
                                                {pet.avatar && <AvatarImage source={{uri: formatImageUrl(pet.avatar)}} />}
                                            </Avatar>
                                            {/* <Box className="absolute -bottom-1 -right-1 bg-white rounded-full p-1.5 shadow-sm">
                                                <Icon as={Paw} size="xs" color="#3B82F6" />
                                            </Box> */}
                                        </Box>
                                        <Text className="text-sm mt-2 text-center font-medium">{pet.name}</Text>
                                    </VStack>
                                </Pressable>
                            ))
                        ) : (
                            <VStack className="items-center justify-center p-4 bg-blue-50 rounded-2xl shadow-sm">
                                <Text className="text-center text-gray-600 font-medium">Thêm thú cưng đầu tiên của bạn</Text>
                            </VStack>
                        )}
                    </ScrollView>
                </VStack>
                <Box className="mb-2 mx-6">
                    <Divider />
                </Box>
                <VStack className="px-6 mb-2">
                    <HStack className="justify-between items-center mb-5">
                        <Heading size="md" className="text-gray-900">Dịch vụ nổi bật</Heading>
                        <Pressable onPress={() => router.push('/services')}>
                            <Text className="text-blue-400 font-medium">Xem tất cả</Text>
                        </Pressable>
                    </HStack>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="pb-3"
                        contentContainerClassName="pl-1 pt-1"
                    >
                        {services.length > 0 ? (
                            services.map((service) => (
                                <Pressable
                                    key={service._id}
                                    className="mr-5 w-52 shadow-sm"
                                    onPress={() => router.push(`/services/${ service._id }`)}
                                >
                                    <Box className="rounded-2xl overflow-hidden bg-white shadow-md">
                                        <Box className="relative">
                                            <Image
                                                source={{uri: getItemImageUrl(service, 'images')}}
                                                alt={service.name}
                                                className="w-full h-36"
                                                resizeMode="cover"
                                            />
                                            <Box className="absolute bottom-2 left-2 bg-blue-500/80 rounded-lg px-2 py-1">
                                                <HStack space="sm" alignItems="center">
                                                    <Icon as={Clock} size="xs" color="white" />
                                                    <Text className="text-white text-xs">{service.duration} phút</Text>
                                                </HStack>
                                            </Box>
                                        </Box>
                                        <VStack className="p-4">
                                            <Text className="font-medium text-gray-900" numberOfLines={1}>{service.name}</Text>

                                            {service.highlights && service.highlights.length > 0 && (
                                                <Text className="text-xs text-gray-600 mt-1" numberOfLines={1}>
                                                    {service.highlights[0]}
                                                </Text>
                                            )}

                                            <HStack className="items-center justify-between mt-2">
                                                <Text className="text-blue-500 font-bold mr-2">{formatVietnamCurrency(service.price)}</Text>
                                                <Button
                                                    size="xs"
                                                    className="bg-blue-400 rounded-xl h-8"
                                                    onPress={() => router.push(`/services/${ service._id }`)}
                                                >
                                                    <ButtonText className="px-1">Đặt lịch</ButtonText>
                                                </Button>
                                            </HStack>
                                        </VStack>
                                    </Box>
                                </Pressable>
                            ))
                        ) : (
                            <VStack className="items-center justify-center w-full bg-blue-50 rounded-2xl shadow-sm p-4">
                                <Text className="text-center text-gray-600 font-medium">Không có dịch vụ khả dụng</Text>
                            </VStack>
                        )}
                    </ScrollView>
                </VStack>
                <Box className="mb-2 mx-6">
                    <Divider />
                </Box>
                <VStack className="px-6 mb-4">
                    <HStack className="justify-between items-center mb-5">
                        <Heading size="md" className="text-gray-900">Sản phẩm nổi bật</Heading>
                        <Pressable onPress={() => router.push('/products')}>
                            <Text className="text-blue-400 font-medium">Xem tất cả</Text>
                        </Pressable>
                    </HStack>

                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="pb-3"
                        contentContainerClassName="pl-1 pt-1"
                    >
                        {products.length > 0 ? (
                            products.map((product) => (
                                <Pressable
                                    key={product._id}
                                    className="mr-5 w-44 shadow-sm"
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
                                            {/* <Text className="text-sm text-gray-600 font-medium">{product.categoryId}</Text> */}
                                            <Text className="font-medium text-gray-900 mt-1 h-fit" numberOfLines={2}>{product.name}</Text>
                                            <HStack className="items-center justify-between mt-2">
                                                <VStack className="h-10 justify-center">
                                                    <Text className="text-blue-500 font-bold">{formatVietnamCurrency(product.onSale ? product.salePrice : product.price)}</Text>
                                                    {product.onSale && (
                                                        <Text className="text-gray-500 text-xs line-through">
                                                            {formatVietnamCurrency(product.price)}
                                                        </Text>
                                                    )}
                                                    {/* <Text className={`text-gray-500 text-xs ${ !product.onSale && "opacity-0" }`}>
                                                        {product.onSale ? formatVietnamCurrency(product.price)}
                                                    </Text> */}
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
                            ))
                        ) : (
                            <VStack className="items-center justify-center w-full p-4 bg-blue-50 rounded-2xl shadow-sm">
                                <Text className="text-center text-gray-600 font-medium">Không có sản phẩm khả dụng</Text>
                            </VStack>
                        )}
                    </ScrollView>
                </VStack>
            </ScrollView>
        </SafeAreaView>
    );
}
