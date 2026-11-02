import { customerAxios } from '../../customer-axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
const CUSTOMER_SERVICE_URL = `${API_BASE_URL}/api/v1/customer-session/customer-service`;

export type CustomerInformationPayload = {
  customer_full_name: string;
  customer_date_of_birth: string;
  customer_gender: string;
}; 

export type CustomerAddressPayload = {
  customer_address_line: string;
  customer_address_ward: string;
  customer_address_province: string;
  customer_address_default: boolean;
};

export const customerCustomerService = {
  async getCustomerInformation() {
    const response = await customerAxios.get(`${CUSTOMER_SERVICE_URL}/customer-information`);
    return response.data;
  },

  async updateCustomerInformation(data: CustomerInformationPayload) {
    const response = await customerAxios.patch(`${CUSTOMER_SERVICE_URL}/customer-information`, data);
    return response.data;
  },

  async createCustomerAddress(data: CustomerAddressPayload) {
    const response = await customerAxios.post(`${CUSTOMER_SERVICE_URL}/customer-address`, data);
    return response.data; 
  },

  async updateCustomerAddress(
    addressId: string,
    data: CustomerAddressPayload,
  ) {
    const response = await customerAxios.patch(
      `${CUSTOMER_SERVICE_URL}/customer-address/${addressId}`,
      data,
    );
    return response.data;
  },

  async deleteCustomerAddress(addressId: string) {
    const response = await customerAxios.delete(`${CUSTOMER_SERVICE_URL}/customer-address/${addressId}`);
    return response.data;
  },
};
