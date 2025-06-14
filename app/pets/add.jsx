import React, {useState, useEffect} from 'react';
import {ScrollView, StyleSheet, Platform} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {router, useLocalSearchParams} from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {format} from 'date-fns';
import {Camera, CalendarDays, Plus, ArrowLeft} from 'lucide-react-native';

import {
    Actionsheet,
    ActionsheetBackdrop,
    ActionsheetContent,
    ActionsheetDragIndicator,
    ActionsheetDragIndicatorWrapper,
    ActionsheetItem,
    ActionsheetItemText,
} from "@/components/ui/actionsheet";

import {Box} from "@/components/ui/box";

import {
    Button,
    ButtonText,
} from "@/components/ui/button";

import {
    FormControl,
    FormControlLabel,
    FormControlError,
    FormControlErrorText,
} from "@/components/ui/form-control";

import {Heading} from "@/components/ui/heading";

import {HStack} from "@/components/ui/hstack";

import {Icon} from "@/components/ui/icon";

import {Image} from "@/components/ui/image";

import {
    Input,
    InputField,
} from "@/components/ui/input";

import {Pressable} from "@/components/ui/pressable";

import {Spinner} from "@/components/ui/spinner";

import {Text} from "@/components/ui/text";

import {VStack} from "@/components/ui/vstack";

import {ApiClient} from '@/config/api';

const AddPetScreen = () => {
    const [formData, setFormData] = useState({
        name: '',
        species: '',
        breed: '',
        birthDate: new Date(),
        weight: '',
        gender: '',
        color: '',
    });

    const params = useLocalSearchParams();
    console.log("params", params);

    const source = params?.source || 'pets';

    const [image, setImage] = useState(null);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [showSpeciesActionsheet, setShowSpeciesActionsheet] = useState(false);
    const [showBreedActionsheet, setShowBreedActionsheet] = useState(false);
    const [showGenderActionsheet, setShowGenderActionsheet] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [breeds, setBreeds] = useState([]);

    const species = ['Dog', 'Cat'];

    const translations = {
        species: {
            'Dog': 'Chó',
            'Cat': 'Mèo'
        },
        gender: {
            'Male': 'Đực',
            'Female': 'Cái'
        }
    };

    const dogBreeds = ['Labrador', 'German Shepherd', 'Golden Retriever', 'Bulldog', 'Poodle', 'Beagle', 'Rottweiler', 'Other'];
    const catBreeds = ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Sphynx', 'British Shorthair', 'Other'];

    const genders = ['Male', 'Female'];

    useEffect(() => {
        if (formData.species === 'Dog') {
            setBreeds(dogBreeds);
        } else if (formData.species === 'Cat') {
            setBreeds(catBreeds);
        } else {
            setBreeds([]);
        }
        setFormData(prev => ({...prev, breed: ''}));
    }, [formData.species]);

    const handleChange = (name, value) => {
        setFormData(prev => ({...prev, [name]: value}));
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: null}));
        }
    };

    const handleDateChange = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            handleChange('birthDate', selectedDate);
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.species) newErrors.species = 'Species is required';

        if (formData.weight && isNaN(Number(formData.weight))) {
            newErrors.weight = 'Weight must be a number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const pickImage = async () => {
        const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            alert('Sorry, we need camera roll permissions to make this work!');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                console.log("Selected image:", result.assets[0]);
                setImage(result.assets[0]);
            }
        } catch (error) {
            console.error("Image picking error:", error);
            alert('Có lỗi khi chọn ảnh. Vui lòng thử lại.');
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const api = ApiClient();
            const data = new FormData();

            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    if (key === 'birthDate') {
                        data.append(key, formData[key].toISOString());
                    } else {
                        data.append(key, formData[key]);
                    }
                }
            });

            if (image) {
                const imageFile = {
                    uri: image.uri,
                    type: 'image/jpeg',
                    name: `pet-${ Date.now() }.jpg`
                };

                data.append('avatar', imageFile);
            }

            const response = await api.post('/pets', data, {
                headers: {'Content-Type': 'multipart/form-data'}
            });

            alert('Thêm thú cưng thành công!');
            if (source === 'home') {
                router.replace('/');
            } else {
                router.replace('/pets');
            }
        } catch (error) {
            console.error('Error adding pet:', error);
            alert('Không thể thêm thú cưng. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        // if (source === 'home') {
        //     router.replace('/');
        // } else {
        //     // router.back();
        //     router.replace('/pets');
        // }
        // router.push('/pets');
        router.back()
    };

    const showDatePickerImmediately = () => {
        if (Platform.OS === 'android') {
            setShowDatePicker(true);
        } else {
            setShowDatePicker(true);
        }
    };

    const translateValue = (type, value) => {
        if (!value) return '';
        return translations[type] && translations[type][value] ? translations[type][value] : value;
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            {/* Header with Back Button */}
            <HStack className="w-full px-4 py-2 items-center">
                <Pressable onPress={handleBack} className="p-2">
                    <Icon as={ArrowLeft} size="md" className='text-gray-800' />
                </Pressable>
                <Heading className="flex-1 text-center text-xl font-bold mr-8">Thêm Thú Cưng</Heading>
            </HStack>

            <ScrollView contentContainerStyle={styles.container} className="px-5 pb-8" contentContainerClassName="pb-16">
                <VStack className="w-full space-y-6 pt-2">
                    <Text className="text-gray-600 mb-2">Điền thông tin thú cưng của bạn dưới đây</Text>

                    {/* Pet Image */}
                    <Box className="items-center my-6">
                        <Pressable
                            onPress={pickImage}
                            accessibilityLabel="Thêm ảnh thú cưng"
                            className="active:opacity-70"
                        >
                            {image ? (
                                <Box className="relative">
                                    <Image
                                        source={{uri: image.uri}}
                                        alt="Pet image"
                                        className="h-36 w-36 rounded-full"
                                    />
                                    <Box className="absolute right-0 bottom-0 bg-blue-400 p-2 rounded-full">
                                        <Icon as={Camera} className="text-white" size="sm" />
                                    </Box>
                                </Box>
                            ) : (
                                <Box className="bg-gray-100 h-32 w-32 rounded-full justify-center items-center border border-gray-200">
                                    <Icon as={Plus} className="text-blue-400" size="lg" />
                                    <Text className="text-blue-400 text-sm mt-2">Thêm Ảnh</Text>
                                </Box>
                            )}
                        </Pressable>
                    </Box>

                    {/* Name Field */}
                    <FormControl isInvalid={!!errors.name} className="mb-4">
                        <FormControlLabel>
                            <Text className="text-gray-700 font-medium text-base mb-1">Tên Thú Cưng</Text>
                        </FormControlLabel>
                        <Input className="border border-gray-300 rounded-2xl mt-1 h-fit">
                            <InputField
                                placeholder="Nhập tên thú cưng"
                                value={formData.name}
                                onChangeText={(text) => handleChange('name', text)}
                                className="px-5 py-4 text-base"
                            />
                        </Input>
                        {errors.name && (
                            <FormControlError>
                                <FormControlErrorText>Vui lòng nhập tên thú cưng</FormControlErrorText>
                            </FormControlError>
                        )}
                    </FormControl>

                    {/* Species Field */}
                    <FormControl isInvalid={!!errors.species} className="mb-4">
                        <FormControlLabel>
                            <Text className="text-gray-700 font-medium text-base mb-1">Loài</Text>
                        </FormControlLabel>
                        <Pressable
                            onPress={() => setShowSpeciesActionsheet(true)}
                            className={`border ${ errors.species ? "border-red-500" : "border-gray-300" } rounded-2xl px-5 py-4 bg-white mt-1`}
                        >
                            <Text className={`${ formData.species ? "text-gray-800" : "text-gray-400" } text-base`}>
                                {formData.species ? translateValue('species', formData.species) : "Chọn loài"}
                            </Text>
                        </Pressable>
                        {errors.species && (
                            <FormControlError>
                                <FormControlErrorText>Vui lòng chọn loài</FormControlErrorText>
                            </FormControlError>
                        )}
                    </FormControl>

                    {/* Breed Field - Changed to use Actionsheet */}
                    <FormControl className="mb-4" isDisabled={!formData.species}>
                        <FormControlLabel>
                            <Text className="text-gray-700 font-medium text-base mb-1">Giống</Text>
                        </FormControlLabel>
                        <Pressable
                            onPress={() => formData.species ? setShowBreedActionsheet(true) : null}
                            className={`border border-gray-300 rounded-2xl px-5 py-4 bg-white mt-1 ${ !formData.species ? 'opacity-50' : '' }`}
                        >
                            <Text className={`${ formData.breed ? "text-gray-800" : "text-gray-400" } text-base`}>
                                {formData.breed || "Chọn giống"}
                            </Text>
                        </Pressable>
                    </FormControl>

                    {/* Birth Date Field - Use a better date picker approach */}
                    <FormControl className="mb-4">
                        <FormControlLabel>
                            <Text className="text-gray-700 font-medium text-base mb-1">Ngày Sinh</Text>
                        </FormControlLabel>
                        <Pressable
                            onPress={showDatePickerImmediately}
                            className="border border-gray-300 rounded-2xl px-5 py-4 bg-white flex-row justify-between items-center mt-1"
                        >
                            <Text className="text-gray-800 text-base">
                                {format(formData.birthDate, 'dd/MM/yyyy')}
                            </Text>
                            <Icon as={CalendarDays} className="text-gray-400" size="sm" />
                        </Pressable>
                        {showDatePicker && Platform.OS === 'ios' && (
                            <Box className="border border-gray-200 rounded-2xl p-2 mt-2 bg-white">
                                <DateTimePicker
                                    value={formData.birthDate}
                                    mode="date"
                                    display="spinner"
                                    onChange={handleDateChange}
                                    maximumDate={new Date()}
                                    style={{width: '100%', height: 120}}
                                />
                                <HStack className="justify-end mt-2">
                                    <Pressable
                                        onPress={() => setShowDatePicker(false)}
                                        className="px-4 py-2 rounded-lg bg-blue-400"
                                    >
                                        <Text className="text-white font-medium">Xác Nhận</Text>
                                    </Pressable>
                                </HStack>
                            </Box>
                        )}
                        {showDatePicker && Platform.OS === 'android' && (
                            <DateTimePicker
                                value={formData.birthDate}
                                mode="date"
                                display="default"
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}
                    </FormControl>

                    {/* Gender Field - Changed to use Actionsheet */}
                    <FormControl className="mb-4">
                        <FormControlLabel>
                            <Text className="text-gray-700 font-medium text-base mb-1">Giới Tính</Text>
                        </FormControlLabel>
                        <Pressable
                            onPress={() => setShowGenderActionsheet(true)}
                            className="border border-gray-300 rounded-2xl px-5 py-4 bg-white mt-1"
                        >
                            <Text className={`${ formData.gender ? "text-gray-800" : "text-gray-400" } text-base`}>
                                {formData.gender ? translateValue('gender', formData.gender) : "Chọn giới tính"}
                            </Text>
                        </Pressable>
                    </FormControl>

                    {/* Weight Field */}
                    <FormControl isInvalid={!!errors.weight} className="mb-4">
                        <FormControlLabel>
                            <Text className="text-gray-700 font-medium text-base mb-1">Cân Nặng (kg)</Text>
                        </FormControlLabel>
                        <Input className="border border-gray-300 rounded-2xl mt-1 h-fit">
                            <InputField
                                placeholder="Nhập cân nặng"
                                keyboardType="numeric"
                                value={formData.weight}
                                onChangeText={(text) => handleChange('weight', text)}
                                className="px-5 py-4 text-base"
                            />
                        </Input>
                        {errors.weight && (
                            <FormControlError>
                                <FormControlErrorText>Cân nặng phải là số</FormControlErrorText>
                            </FormControlError>
                        )}
                    </FormControl>

                    {/* Color Field */}
                    <FormControl className="mb-6">
                        <FormControlLabel>
                            <Text className="text-gray-700 font-medium text-base mb-1">Màu Sắc</Text>
                        </FormControlLabel>
                        <Input className="border border-gray-300 rounded-2xl mt-1 h-fit">
                            <InputField
                                placeholder="Nhập màu sắc"
                                value={formData.color}
                                onChangeText={(text) => handleChange('color', text)}
                                className="px-5 py-4 text-base"
                            />
                        </Input>
                    </FormControl>

                    {/* Submit Button */}
                    <Button
                        onPress={handleSubmit}
                        className="bg-blue-400 rounded-2xl py-4 mb-8 shadow-sm h-fit"
                        disabled={loading}
                    >
                        {loading ? (
                            <Spinner className="text-white" />
                        ) : (
                            <ButtonText className="text-white font-medium text-lg">Thêm Thú Cưng</ButtonText>
                        )}
                    </Button>
                </VStack>
            </ScrollView>

            {/* Species Selection Actionsheet */}
            <Actionsheet isOpen={showSpeciesActionsheet} onClose={() => setShowSpeciesActionsheet(false)}>
                <ActionsheetBackdrop />
                <ActionsheetContent className="rounded-t-3xl pb-6">
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Text className="text-center font-semibold text-lg py-2 mb-2">Chọn Loài</Text>
                    {species.map((item) => (
                        <ActionsheetItem
                            key={item}
                            onPress={() => {
                                handleChange('species', item);
                                setShowSpeciesActionsheet(false);
                            }}
                            className="py-5"
                        >
                            <ActionsheetItemText className="text-center text-base font-medium text-gray-800">
                                {translateValue('species', item)}
                            </ActionsheetItemText>
                        </ActionsheetItem>
                    ))}
                </ActionsheetContent>
            </Actionsheet>

            {/* Breed Selection Actionsheet */}
            <Actionsheet isOpen={showBreedActionsheet} onClose={() => setShowBreedActionsheet(false)}>
                <ActionsheetBackdrop />
                <ActionsheetContent className="rounded-t-3xl pb-6">
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Text className="text-center font-semibold text-lg py-2 mb-2">Chọn Giống</Text>
                    {breeds.map((item) => (
                        <ActionsheetItem
                            key={item}
                            onPress={() => {
                                handleChange('breed', item);
                                setShowBreedActionsheet(false);
                            }}
                            className="py-4"
                        >
                            <ActionsheetItemText className="text-center text-base font-medium text-gray-800">
                                {item}
                            </ActionsheetItemText>
                        </ActionsheetItem>
                    ))}
                </ActionsheetContent>
            </Actionsheet>

            {/* Gender Selection Actionsheet */}
            <Actionsheet isOpen={showGenderActionsheet} onClose={() => setShowGenderActionsheet(false)}>
                <ActionsheetBackdrop />
                <ActionsheetContent className="rounded-t-3xl pb-6">
                    <ActionsheetDragIndicatorWrapper>
                        <ActionsheetDragIndicator />
                    </ActionsheetDragIndicatorWrapper>
                    <Text className="text-center font-semibold text-lg py-2 mb-2">Chọn Giới Tính</Text>
                    {genders.map((item) => (
                        <ActionsheetItem
                            key={item}
                            onPress={() => {
                                handleChange('gender', item);
                                setShowGenderActionsheet(false);
                            }}
                            className="py-4"
                        >
                            <ActionsheetItemText className="text-center text-base font-medium text-gray-800">
                                {translateValue('gender', item)}
                            </ActionsheetItemText>
                        </ActionsheetItem>
                    ))}
                </ActionsheetContent>
            </Actionsheet>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: 'white',
    },
});

export default AddPetScreen;
