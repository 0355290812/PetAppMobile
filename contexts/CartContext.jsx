import React, {createContext, useState, useContext, useEffect, useCallback} from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import {ApiClient} from "@/config/api";
import {useAuth} from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({children}) => {
    const [cart, setCart] = useState([]);
    const [cartCount, setCartCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [cartInitialized, setCartInitialized] = useState(false);
    const {isLoggedIn} = useAuth();
    const apiClient = ApiClient();

    // Tính toán tổng số lượng sản phẩm trong giỏ hàng
    const updateCartCount = (cartItems) => {
        setCartCount(cartItems.length);
    };

    // Lấy giỏ hàng từ API khi người dùng đăng nhập lần đầu
    const fetchCartFromAPI = useCallback(async () => {
        if (!isLoggedIn) return;

        try {
            setLoading(true);
            const response = await apiClient.get("/cart");

            // Chuyển đổi dữ liệu API thành định dạng giỏ hàng
            if (response && response?.items) {

                const cartItems = response.items.map(item => ({
                    _id: item?.productId._id,
                    name: item?.name,
                    price: item?.productId.onSale ? item?.productId.salePrice : item?.productId.price,
                    originalPrice: item?.productId.price,
                    image: item?.productId?.images && item?.productId.images.length > 0 ? item?.productId.images[0] : null,
                    quantity: item?.quantity,
                    stock: item?.productId.stock,
                    onSale: item?.productId.onSale
                }));

                setCart(cartItems);
                updateCartCount(cartItems);

                await AsyncStorage.setItem('cart', JSON.stringify(cartItems));

                // Đánh dấu giỏ hàng đã được khởi tạo
                await AsyncStorage.setItem('cartInitialized', 'true');
                setCartInitialized(true);
            }
        } catch (error) {
            console.log("Error fetching cart from API:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Lấy giỏ hàng từ AsyncStorage
    const fetchCartFromStorage = useCallback(async () => {
        try {
            const cartData = await AsyncStorage.getItem('cart');
            const isInitialized = await AsyncStorage.getItem('cartInitialized');

            if (cartData) {
                const parsedCart = JSON.parse(cartData);
                setCart(parsedCart);
                updateCartCount(parsedCart);
                setCartInitialized(isInitialized === 'true');
            }
        } catch (error) {
            console.log("Error fetching cart from storage:", error);
        }
    }, []);

    // Gọi khi component mount và khi trạng thái đăng nhập thay đổi
    useEffect(() => {
        const initializeCart = async () => {
            // Kiểm tra xem giỏ hàng đã được khởi tạo từ API chưa
            const isInitialized = await AsyncStorage.getItem('cartInitialized');

            if (isLoggedIn && isInitialized !== 'true') {
                // Nếu đăng nhập và chưa khởi tạo, lấy từ API
                await fetchCartFromAPI();
            } else {
                // Nếu đã khởi tạo hoặc không đăng nhập, lấy từ Storage
                await fetchCartFromStorage();
            }
        };

        initializeCart();
    }, [isLoggedIn]);

    // Reset cart initialization khi logout
    useEffect(() => {
        if (!isLoggedIn) {
            AsyncStorage.removeItem('cartInitialized');
            setCartInitialized(false);
        }
    }, [isLoggedIn]);

    // Thêm sản phẩm vào giỏ hàng
    const addToCart = async (product, quantity = 1) => {
        try {
            let updatedCart = [...cart];
            const existingProductIndex = updatedCart.findIndex(item => item._id === product._id);

            // Nếu sản phẩm đã có trong giỏ hàng
            if (existingProductIndex >= 0) {
                // Kiểm tra tồn kho
                const newQuantity = updatedCart[existingProductIndex].quantity + quantity;
                if (newQuantity <= product.stock) {
                    // Tăng số lượng
                    updatedCart[existingProductIndex].quantity = newQuantity;
                } else {
                    throw new Error("Số lượng sản phẩm trong giỏ đã đạt giới hạn");
                }
            } else {
                // Thêm sản phẩm mới vào giỏ hàng
                const cartItem = {
                    _id: product._id,
                    name: product.name,
                    price: product.onSale ? product.salePrice : product.price,
                    originalPrice: product.price,
                    image: product.images && product.images.length > 0 ? product.images[0] : null,
                    quantity: quantity,
                    stock: product.stock,
                    onSale: product.onSale
                };
                updatedCart.push(cartItem);
            }

            // Cập nhật state và lưu vào AsyncStorage
            setCart(updatedCart);
            updateCartCount(updatedCart);
            await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));

            // Nếu đã đăng nhập, cập nhật lên API
            if (isLoggedIn) {
                await apiClient.post('/cart', {
                    productId: product._id,
                    quantity: quantity
                });
            }

            return {success: true};
        } catch (error) {
            console.log("Error adding to cart:", error);
            return {
                success: false,
                error: error.message || "Không thể thêm sản phẩm vào giỏ hàng"
            };
        }
    };

    // Cập nhật số lượng sản phẩm trong giỏ hàng
    const updateCartItemQuantity = async (productId, quantity) => {
        try {
            if (quantity < 1) {
                return await removeFromCart(productId);
            }

            let updatedCart = [...cart];
            const existingProductIndex = updatedCart.findIndex(item => item._id === productId);

            if (existingProductIndex >= 0) {
                // Kiểm tra tồn kho
                if (quantity <= updatedCart[existingProductIndex].stock) {
                    updatedCart[existingProductIndex].quantity = quantity;
                } else {
                    throw new Error("Số lượng vượt quá tồn kho");
                }
            } else {
                throw new Error("Sản phẩm không có trong giỏ hàng");
            }

            // Cập nhật state và lưu vào AsyncStorage
            setCart(updatedCart);
            updateCartCount(updatedCart);
            await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));

            // Nếu đã đăng nhập, cập nhật lên API
            if (isLoggedIn) {
                await apiClient.patch(`/cart/${ productId }`, {
                    quantity: quantity
                });
            }

            return {success: true};
        } catch (error) {
            console.log("Error updating cart item:", error);
            return {
                success: false,
                error: error.message || "Không thể cập nhật số lượng"
            };
        }
    };

    // Xóa sản phẩm khỏi giỏ hàng
    const removeFromCart = async (productId) => {
        console.log("Removing product from cart:", productId);

        try {
            const updatedCart = cart.filter(item => item._id !== productId);

            // Cập nhật state và lưu vào AsyncStorage
            setCart(updatedCart);
            updateCartCount(updatedCart);
            await AsyncStorage.setItem('cart', JSON.stringify(updatedCart));

            // Nếu đã đăng nhập, cập nhật lên API
            if (isLoggedIn) {
                await apiClient.del(`/cart/${ productId }`);
            }

            return {success: true};
        } catch (error) {
            console.log("Error removing from cart:", error);
            return {
                success: false,
                error: error.message || "Không thể xóa sản phẩm khỏi giỏ hàng"
            };
        }
    };

    // Xóa toàn bộ giỏ hàng
    const clearCart = async () => {
        try {
            setCart([]);
            setCartCount(0);
            await AsyncStorage.setItem('cart', JSON.stringify([]));

            // Nếu đã đăng nhập, cập nhật lên API
            if (isLoggedIn) {
                await apiClient.del('/cart');
            }

            return {success: true};
        } catch (error) {
            console.log("Error clearing cart:", error);
            return {
                success: false,
                error: error.message || "Không thể xóa giỏ hàng"
            };
        }
    };

    // Đồng bộ giỏ hàng từ storage lên API
    const syncCartToAPI = async () => {
        if (!isLoggedIn || cart.length === 0) return;

        try {
            // Xóa giỏ hàng hiện tại trên API
            await apiClient.del('/cart');

            // Thêm từng sản phẩm vào giỏ hàng
            for (const item of cart) {
                await apiClient.post('/cart', {
                    productId: item._id,
                    quantity: item.quantity
                });
            }
        } catch (error) {
            console.log("Error syncing cart to API:", error);
        }
    };

    // Tính tổng giá trị giỏ hàng
    const getCartTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    return (
        <CartContext.Provider value={{
            cart,
            cartCount,
            loading,
            addToCart,
            updateCartItemQuantity,
            removeFromCart,
            clearCart,
            syncCartToAPI,
            getCartTotal,
            fetchCartFromAPI,
            fetchCartFromStorage
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
