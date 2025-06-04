import React, {useState, useEffect, useRef} from 'react';
import {View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Pressable, ScrollView, SafeAreaView} from 'react-native';
import {useAuth} from "@/contexts/AuthContext";
import {Ionicons} from '@expo/vector-icons';
import {ApiClient} from '@/config/api';
import {router, useLocalSearchParams} from 'expo-router';
import {formatImageUrl} from '@/utils/imageUtils';
import {
    AlertDialog,
    AlertDialogBackdrop,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader
} from "@/components/ui/alert-dialog";
import {Button, ButtonText} from "@/components/ui/button";
import {Heading} from "@/components/ui/heading";

const OrderItem = ({order, onPress, expanded, onToggleExpand, onCancelOrder, onReceiveOrder, onRateOrder, onPayOrder, onBuyAgain}) => {
    // Format the date
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');

    // Get products data
    const firstProduct = order.items?.[0];
    const totalItems = order.items?.length || 0;
    const hasMoreProducts = totalItems > 1;

    return (
        <Pressable
            className="bg-white mb-3 rounded-xl overflow-hidden shadow-sm"
            onPress={() => onPress(order._id)}
        >
            <View className="p-3 border-b border-gray-100 flex-row justify-between items-center">
                <Text className="font-medium">Đơn hàng #{order.orderNumber || order._id.slice(-6)}</Text>
            </View>

            <View className="p-3">
                {firstProduct ? (
                    <View>
                        {/* First product is always visible */}
                        <View className="flex-row mb-2">
                            <Image
                                source={{uri: formatImageUrl(firstProduct?.image)}}
                                className="w-16 h-16 rounded-md"
                            />
                            <View className="ml-3 flex-1 justify-center">
                                <Text className="font-medium" numberOfLines={1}>{firstProduct?.name}</Text>
                                <Text className="text-gray-500">{firstProduct.quantity} x {firstProduct?.price?.toLocaleString('vi-VN')}đ</Text>
                            </View>
                        </View>

                        {/* Additional products shown when expanded */}
                        {expanded && order.items?.slice(1).map((item, index) => (
                            <View key={index} className="flex-row mt-3 pb-3 border-t border-gray-50 pt-3">
                                <Image
                                    source={{uri: formatImageUrl(item?.image)}}
                                    className="w-16 h-16 rounded-md"
                                />
                                <View className="ml-3 flex-1 justify-center">
                                    <Text className="font-medium" numberOfLines={1}>{item?.name}</Text>
                                    <Text className="text-gray-500">{item.quantity} x {item?.price?.toLocaleString('vi-VN')}đ</Text>
                                </View>
                            </View>
                        ))}

                        {/* Toggle button to show more items */}
                        {hasMoreProducts && (
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation(); // Prevent triggering the parent onPress
                                    onToggleExpand(order._id);
                                }}
                                className="mt-1 self-center"
                            >
                                <Text className="text-blue-500 text-sm">
                                    {expanded ? 'Thu gọn' : `Xem thêm ${ totalItems - 1 } sản phẩm khác`}
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <Text className="text-gray-500 italic">Không có thông tin sản phẩm</Text>
                )}
            </View>

            <View className="p-3 border-t border-gray-100">
                <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500">{orderDate}</Text>
                    <Text className="font-bold">Tổng: {order.totalAmount?.toLocaleString('vi-VN')}đ</Text>
                </View>

                {/* Action buttons based on order status - styled to be compact and right-aligned */}
                <View className="flex-row justify-end mt-3 space-x-2">
                    {order.status === 'checkout' && (
                        <TouchableOpacity
                            className="bg-blue-500 py-2 px-4 rounded-md"
                            onPress={(e) => {
                                e.stopPropagation();
                                onPayOrder(order);
                            }}
                        >
                            <Text className="text-white text-center font-medium">Thanh toán</Text>
                        </TouchableOpacity>
                    )}

                    {order.status === 'pending' && (
                        <TouchableOpacity
                            className="bg-red-500 py-2 px-4 rounded-md"
                            onPress={(e) => {
                                e.stopPropagation();
                                onCancelOrder(order._id);
                            }}
                        >
                            <Text className="text-white text-center font-medium">Huỷ đơn hàng</Text>
                        </TouchableOpacity>
                    )}

                    {order.status === 'shipping' && (
                        <TouchableOpacity
                            className="bg-green-500 py-2 px-4 rounded-md"
                            onPress={(e) => {
                                e.stopPropagation();
                                onReceiveOrder(order._id);
                            }}
                        >
                            <Text className="text-white text-center font-medium">Đã nhận được hàng</Text>
                        </TouchableOpacity>
                    )}

                    {order.status === 'delivered' && (
                        <>
                            {/* Show Rate button only if not yet rated */}
                            {!order.isRated && (
                                <TouchableOpacity
                                    className="bg-blue-500 py-2 px-4 rounded-md mr-2"
                                    onPress={(e) => {
                                        e.stopPropagation();
                                        onRateOrder(order._id);
                                    }}
                                >
                                    <Text className="text-white text-center font-medium">Đánh giá</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity
                                className="bg-green-500 py-2 px-4 rounded-md"
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onBuyAgain(order);
                                }}
                            >
                                <Text className="text-white text-center font-medium">Mua lại</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {order.status === 'cancelled' && (
                        <TouchableOpacity
                            className="bg-green-500 py-2 px-4 rounded-md"
                            onPress={(e) => {
                                e.stopPropagation();
                                onBuyAgain(order);
                            }}
                        >
                            <Text className="text-white text-center font-medium">Mua lại</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Pressable>
    );
};

const Orders = () => {
    const {user} = useAuth();
    const params = useLocalSearchParams();
    const [activeTab, setActiveTab] = useState(params.tab || 'pending');
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    // Track which orders are expanded
    const [expandedOrders, setExpandedOrders] = useState({});
    const api = ApiClient();

    // For confirmation dialogs
    const [showCancelDialog, setShowCancelDialog] = useState(false);
    const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const cancelRef = useRef(null);
    const deliveryRef = useRef(null);

    // Create ref for FlatList
    const flatListRef = useRef(null);

    // Status tabs
    const tabs = [
        {id: 'checkout', label: 'Chưa thanh toán'},
        {id: 'pending', label: 'Chờ xử lý'},
        {id: 'shipping', label: 'Đang giao'},
        {id: 'delivered', label: 'Đã giao'},
        {id: 'cancelled', label: 'Đã hủy'}
    ];

    useEffect(() => {
        fetchOrders();
        // If there's an order ID in the params, navigate to order detail
        if (params.id) {
            navigateToOrderDetail(params.id);
        }
    }, [params.id]);

    useEffect(() => {
        fetchOrders();
        // Reset expanded orders when changing tabs
        setExpandedOrders({});
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const endpoint = `/orders/my-orders?status=${ activeTab }`;
            const response = await api.get(endpoint);

            if (response && response.results) {
                setOrders(response.results || []);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
    };

    const navigateToOrderDetail = (orderId) => {
        router.push(`/orders/${ orderId }`);
    };

    const handlePayOrder = (order) => {
        // Extract payment information from the order
        if (order.paymentId && order.status === 'checkout') {
            const paymentInfo = order.paymentId;

            // Navigate to stripe payment page with required parameters
            router.push({
                pathname: '/payments/stripe',
                params: {
                    clientSecret: paymentInfo.clientSecret,
                    orderId: order._id,
                    amount: order.totalAmount,
                    paymentId: paymentInfo._id,
                    type: 'order'
                }
            });
        }
    };

    const toggleExpandOrder = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const openCancelDialog = (orderId) => {
        setSelectedOrderId(orderId);
        setShowCancelDialog(true);
    };

    const openDeliveryDialog = (orderId) => {
        setSelectedOrderId(orderId);
        setShowDeliveryDialog(true);
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderId) return;

        try {
            setShowCancelDialog(false);
            // Show loading indicator if needed
            await api.post(`/orders/${ selectedOrderId }/cancel`);
            // Refresh orders after cancellation
            fetchOrders();
        } catch (error) {
            console.error('Error cancelling order:', error);
            // Handle error (show alert or toast)
        }
    };

    const handleReceiveOrder = async () => {
        if (!selectedOrderId) return;

        try {
            setShowDeliveryDialog(false);
            // Show loading indicator if needed
            await api.post(`/orders/${ selectedOrderId }/confirm-delivery`);
            // Refresh orders after marking as delivered
            fetchOrders();
        } catch (error) {
            console.error('Error updating order status:', error);
            // Handle error (show alert or toast)
        }
    };

    const handleRateOrder = (orderId) => {
        // Navigate to rating screen
        router.replace(`/orders/${ orderId }/rate`);
    };

    const handleBuyAgain = (order) => {
        // Add all items back to cart
        if (order.items && order.items.length > 0) {
            try {
                // We could implement bulk add to cart here
                // For now, we'll just navigate to the first product
                const firstProduct = order.items[0];
                if (firstProduct && firstProduct.productId) {
                    router.replace(`/products/${ firstProduct.productId }`);
                }
            } catch (error) {
                console.error('Error with buy again function:', error);
            }
        }
    };

    const renderOrderItem = ({item}) => (
        <OrderItem
            order={item}
            onPress={navigateToOrderDetail}
            expanded={!!expandedOrders[item._id]}
            onToggleExpand={toggleExpandOrder}
            onCancelOrder={openCancelDialog}
            onReceiveOrder={openDeliveryDialog}
            onRateOrder={handleRateOrder}
            onPayOrder={handlePayOrder}
            onBuyAgain={handleBuyAgain}
        />
    );

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {/* Tab Selector */}
            <View className="bg-white">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="px-2"
                >
                    {tabs.map(tab => (
                        <TouchableOpacity
                            key={tab.id}
                            className={`py-3 px-4 ${ activeTab === tab.id ? 'border-b-2 border-blue-500' : '' }`}
                            onPress={() => setActiveTab(tab.id)}
                        >
                            <Text
                                className={activeTab === tab.id ? 'text-blue-500 font-medium' : 'text-gray-600'}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Order List */}
            {loading && !refreshing ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#007AFF" />
                </View>
            ) : orders.length > 0 ? (
                <FlatList
                    ref={flatListRef}
                    data={orders}
                    renderItem={renderOrderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerClassName="p-3 pb-24"
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#007AFF']}
                        />
                    }
                />
            ) : (
                <View className="flex-1 justify-center items-center p-4">
                    <Ionicons name="cart-outline" size={60} color="#ccc" />
                    <Text className="text-gray-400 mt-3 text-center">
                        Bạn chưa có đơn hàng nào
                    </Text>
                </View>
            )}

            {/* Cancel Order Confirmation Dialog */}
            <AlertDialog
                leastDestructiveRef={cancelRef}
                isOpen={showCancelDialog}
                onClose={() => setShowCancelDialog(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="lg">Xác nhận huỷ đơn hàng</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text className="text-gray-700">
                            Bạn có chắc chắn muốn huỷ đơn hàng này không? Hành động này không thể hoàn tác.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onPress={() => setShowCancelDialog(false)}
                            ref={cancelRef}
                        >
                            <ButtonText>Không, giữ đơn hàng</ButtonText>
                        </Button>
                        <Button
                            className="bg-red-500 ml-3"
                            onPress={handleCancelOrder}
                        >
                            <ButtonText>Có, huỷ đơn hàng</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Confirm Delivery Dialog */}
            <AlertDialog
                leastDestructiveRef={deliveryRef}
                isOpen={showDeliveryDialog}
                onClose={() => setShowDeliveryDialog(false)}
            >
                <AlertDialogBackdrop />
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <Heading size="lg">Xác nhận đã nhận hàng</Heading>
                    </AlertDialogHeader>
                    <AlertDialogBody>
                        <Text className="text-gray-700 mb-2">
                            Bạn đã nhận được đơn hàng và kiểm tra các sản phẩm chưa?
                            Xác nhận này sẽ hoàn tất quá trình mua hàng.
                        </Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button
                            variant="outline"
                            onPress={() => setShowDeliveryDialog(false)}
                            ref={deliveryRef}
                            className='rounded-lg'
                        >
                            <ButtonText>Huỷ</ButtonText>
                        </Button>
                        <Button
                            className="bg-green-500 ml-3 rounded-lg"
                            onPress={handleReceiveOrder}
                        >
                            <ButtonText>Xác nhận đã nhận hàng</ButtonText>
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </SafeAreaView>
    );
};

export default Orders;
