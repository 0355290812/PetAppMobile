import React, {useState, useEffect} from 'react';
import {View, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform} from 'react-native';
import {Input, InputField} from "@/components/ui/input";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText
} from "@/components/ui/form-control";
import {Button, ButtonText} from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectInput,
  SelectIcon,
  SelectPortal,
  SelectBackdrop,
  SelectContent,
  SelectItem,
  SelectScrollView
} from "@/components/ui/select";
import {
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel
} from "@/components/ui/checkbox";
import {Icon, ChevronDownIcon} from "@/components/ui/icon";
import {Check} from "lucide-react-native";
import {useAuth} from "@/contexts/AuthContext";
import {ApiClient} from '@/config/api';
import {router, useLocalSearchParams} from 'expo-router';

const EditAddress = () => {
  const {id} = useLocalSearchParams();
  const {user} = useAuth();
  const api = ApiClient();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isOriginallyDefault, setIsOriginallyDefault] = useState(false);

  // Location data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(false);

  // Validation states
  const [errors, setErrors] = useState({});

  useEffect(() => {
    initializeData();
  }, []);

  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.code);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedDistrict) {
      fetchWards(selectedDistrict.code);
    }
  }, [selectedDistrict]);

  const initializeData = async () => {
    setLoading(true);
    try {
      const provincesData = await fetchProvincesData();
      if (provincesData && provincesData.length > 0) {
        await fetchAddressDetails(provincesData);
      } else {
        throw new Error('Không thể tải thông tin tỉnh thành');
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể khởi tạo dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProvincesData = async () => {
    setLoadingLocations(true);
    try {
      const response = await fetch('https://provinces.open-api.vn/api/p/');
      const data = await response.json();
      setProvinces(data);
      return data;
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh/thành phố.');
      return null;
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchAddressDetails = async (provincesData) => {
    try {
      const response = await api.get(`/users/me/addresses/${ id }`);
      if (response) {
        setFullName(response.fullName);
        setPhone(response.phone);
        setStreetAddress(response.streetAddress);

        const defaultValue = response.isDefault === true || response.isDefault === 'true';
        setIsDefault(defaultValue);
        setIsOriginallyDefault(defaultValue);

        await setLocationData(response.city, response.district, response.ward, provincesData);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải thông tin địa chỉ. Vui lòng thử lại sau.');
    }
  };

  const setLocationData = async (cityName, districtName, wardName, provincesData) => {
    try {
      const provincesList = provincesData || provinces;
      const provinceObj = provincesList.find(p => p.name === cityName);

      if (provinceObj) {
        setSelectedProvince(provinceObj);

        const districtsResponse = await fetch(`https://provinces.open-api.vn/api/p/${ provinceObj.code }?depth=2`);
        const districtsData = await districtsResponse.json();
        const districtsList = districtsData.districts || [];
        setDistricts(districtsList);

        const districtObj = districtsList.find(d => d.name === districtName);
        if (districtObj) {
          setSelectedDistrict(districtObj);

          const wardsResponse = await fetch(`https://provinces.open-api.vn/api/d/${ districtObj.code }?depth=2`);
          const wardsData = await wardsResponse.json();
          const wardsList = wardsData.wards || [];
          setWards(wardsList);

          const wardObj = wardsList.find(w => w.name === wardName);
          if (wardObj) {
            setSelectedWard(wardObj);
          }
        }
      }
    } catch (error) {
      // Error handled silently
    }
  };

  const fetchDistricts = async (provinceCode) => {
    setLoadingLocations(true);
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/p/${ provinceCode }?depth=2`);
      const data = await response.json();
      setDistricts(data.districts || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách quận/huyện.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchWards = async (districtCode) => {
    setLoadingLocations(true);
    try {
      const response = await fetch(`https://provinces.open-api.vn/api/d/${ districtCode }?depth=2`);
      const data = await response.json();
      setWards(data.wards || []);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách phường/xã.');
    } finally {
      setLoadingLocations(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ tên';
    if (!phone.trim()) newErrors.phone = 'Vui lòng nhập số điện thoại';
    else if (!/^(0|\+84)[3|5|7|8|9][0-9]{8}$/.test(phone.trim()))
      newErrors.phone = 'Số điện thoại không hợp lệ';

    if (!streetAddress.trim()) newErrors.streetAddress = 'Vui lòng nhập địa chỉ';
    if (!selectedProvince) newErrors.city = 'Vui lòng chọn tỉnh/thành phố';
    if (!selectedDistrict) newErrors.district = 'Vui lòng chọn quận/huyện';
    if (!selectedWard) newErrors.ward = 'Vui lòng chọn phường/xã';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const addressData = {
        fullName,
        phone,
        streetAddress,
        city: selectedProvince.name,
        district: selectedDistrict.name,
        ward: selectedWard.name,
        isDefault,
      };

      const response = await api.patch(`/users/me/addresses/${ id }`, addressData);

      if (response) {
        Alert.alert('Thành công', 'Đã cập nhật địa chỉ', [
          {text: 'OK', onPress: () => router.back()}
        ]);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể cập nhật địa chỉ. Vui lòng thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView
        className="flex-1 bg-gray-50 p-4"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerClassName='pb-24'
      >
        <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
          <FormControl isInvalid={!!errors.fullName} className="mb-4">
            <FormControlLabel>
              <FormControlLabelText>Họ và tên</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Nhập họ và tên người nhận"
                value={fullName}
                onChangeText={setFullName}
              />
            </Input>
            <FormControlError>
              <FormControlErrorText>{errors.fullName}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          <FormControl isInvalid={!!errors.phone} className="mb-4">
            <FormControlLabel>
              <FormControlLabelText>Số điện thoại</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Nhập số điện thoại"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </Input>
            <FormControlError>
              <FormControlErrorText>{errors.phone}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          <FormControl isInvalid={!!errors.city} className="mb-4">
            <FormControlLabel>
              <FormControlLabelText>Tỉnh/Thành phố</FormControlLabelText>
            </FormControlLabel>
            <Select
              onValueChange={(value) => {
                const province = provinces.find(p => p.code === parseInt(value));
                setSelectedProvince(province);
              }}
              selectedValue={selectedProvince ? selectedProvince.name.toString() : undefined}
            >
              <SelectTrigger variant="outline" size="md">
                <SelectInput placeholder="Chọn Tỉnh/Thành phố" />
                <SelectIcon mr="$3">
                  <Icon as={ChevronDownIcon} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal className=''>
                <SelectBackdrop className='' />
                <SelectContent className="max-h-[50%]">
                  <SelectScrollView>
                    {provinces.map((province) => (
                      <SelectItem
                        key={province.code}
                        label={province.name}
                        value={province.code.toString()}
                      />
                    ))}
                  </SelectScrollView>
                </SelectContent>
              </SelectPortal>
            </Select>
            <FormControlError>
              <FormControlErrorText>{errors.city}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          <FormControl isInvalid={!!errors.district} className="mb-4">
            <FormControlLabel>
              <FormControlLabelText>Quận/Huyện</FormControlLabelText>
            </FormControlLabel>
            <Select
              isDisabled={!selectedProvince}
              onValueChange={(value) => {
                const district = districts.find(d => d.code === parseInt(value));
                setSelectedDistrict(district);
              }}
              selectedValue={selectedDistrict ? selectedDistrict.name.toString() : undefined}
            >
              <SelectTrigger variant="outline" size="md">
                <SelectInput placeholder="Chọn Quận/Huyện" />
                <SelectIcon mr="$3">
                  <Icon as={ChevronDownIcon} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent className="max-h-[50%]">
                  <SelectScrollView>
                    {districts.map((district) => (
                      <SelectItem
                        key={district.code}
                        label={district.name}
                        value={district.code.toString()}
                      />
                    ))}
                  </SelectScrollView>
                </SelectContent>
              </SelectPortal>
            </Select>
            <FormControlError>
              <FormControlErrorText>{errors.district}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          <FormControl isInvalid={!!errors.ward} className="mb-4">
            <FormControlLabel>
              <FormControlLabelText>Phường/Xã</FormControlLabelText>
            </FormControlLabel>
            <Select
              isDisabled={!selectedDistrict}
              onValueChange={(value) => {
                const ward = wards.find(w => w.code === parseInt(value));
                setSelectedWard(ward);
              }}
              selectedValue={selectedWard ? selectedWard.name.toString() : undefined}
            >
              <SelectTrigger variant="outline" size="md">
                <SelectInput placeholder="Chọn Phường/Xã" />
                <SelectIcon mr="$3">
                  <Icon as={ChevronDownIcon} />
                </SelectIcon>
              </SelectTrigger>
              <SelectPortal>
                <SelectBackdrop />
                <SelectContent className="max-h-[50%]">
                  <SelectScrollView>
                    {wards.map((ward) => (
                      <SelectItem
                        key={ward.code}
                        label={ward.name}
                        value={ward.code.toString()}
                      />
                    ))}
                  </SelectScrollView>
                </SelectContent>
              </SelectPortal>
            </Select>
            <FormControlError>
              <FormControlErrorText>{errors.ward}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          <FormControl isInvalid={!!errors.streetAddress} className="mb-4">
            <FormControlLabel>
              <FormControlLabelText>Địa chỉ cụ thể</FormControlLabelText>
            </FormControlLabel>
            <Input>
              <InputField
                placeholder="Số nhà, tên đường..."
                value={streetAddress}
                onChangeText={setStreetAddress}
              />
            </Input>
            <FormControlError>
              <FormControlErrorText>{errors.streetAddress}</FormControlErrorText>
            </FormControlError>
          </FormControl>

          <View className="mt-2 mb-2">
            <Checkbox
              isChecked={isDefault}
              onChange={(newValue) => {
                if (!isOriginallyDefault) {
                  setIsDefault(newValue);
                }
              }}
              size="md"
              isDisabled={isOriginallyDefault}
            >
              <CheckboxIndicator mr="$2" className=''>
                <CheckboxIcon as={Check} className='' />
              </CheckboxIndicator>
              <CheckboxLabel>{isOriginallyDefault ? "Địa chỉ mặc định" : "Đặt làm địa chỉ mặc định"}</CheckboxLabel>
            </Checkbox>
          </View>
        </View>

        <Button
          className="mb-4 bg-blue-400 p-3 h-fit rounded-lg"
          onPress={handleSubmit}
          isDisabled={submitting || loadingLocations}
        >
          {submitting ? (
            <ActivityIndicator size="small" className='bg-blue-400' />
          ) : (
            <ButtonText>Lưu địa chỉ</ButtonText>
          )}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditAddress;
