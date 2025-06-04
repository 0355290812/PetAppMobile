import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const YOUR_REFRESH_TOKEN_URL = process.env.EXPO_PUBLIC_API_URL + "/auth/refresh-tokens";

export const ApiClient = () => {

    const api = axios.create({
        baseURL: process.env.EXPO_PUBLIC_API_URL,
        headers: {
            "Content-Type": "application/json",
        },
    });

    api.interceptors.request.use(
        async (config) => {
            const token = await AsyncStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `${ token }`;
            }
            return config;
        },
        (error) => Promise.reject(error)
    );

    createAxiosResponseInterceptor();

    function createAxiosResponseInterceptor () {
        const interceptor = api.interceptors.response.use(
            (response) => response.data,
            async (error) => {
                console.log("error ne", error);

                if (error.response.status !== 401) {
                    return Promise.reject(error);
                }
                if (await AsyncStorage.getItem("refreshToken")) {
                    try {
                        api.interceptors.response.eject(interceptor);

                        const refreshToken = await AsyncStorage.getItem("refreshToken");
                        const headers = {"Content-Type": "application/x-www-form-urlencoded"};
                        const body = `refreshToken=${ refreshToken }`;

                        const response = await axios.post(YOUR_REFRESH_TOKEN_URL, body, {headers});

                        await AsyncStorage.setItem("token", "Bearer " + response.data.access.token);
                        await AsyncStorage.setItem("refreshToken", response.data.refresh.token);

                        error.response.config.headers["Authorization"] = "Bearer " + response.data.access.token;
                        return axios(error.response.config);
                    } catch (err) {
                        return Promise.reject(err);
                    } finally {
                        createAxiosResponseInterceptor();
                    }
                }
            }
        );
    }

    const get = (path, params) => api.get(path, {params});
    const post = (path, body, params) => api.post(path, body, params);
    const put = (path, body, params) => api.put(path, body, params);
    const patch = (path, body, params) => api.patch(path, body, params);
    const del = (path) => api.delete(path);

    return {get, post, patch, put, del};
};
