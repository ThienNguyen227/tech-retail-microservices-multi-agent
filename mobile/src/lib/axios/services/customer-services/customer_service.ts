import { customerAxios } from '../../customer-axios';
import { CUSTOMER_URLS } from '@/constants/api';

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
    const response = await customerAxios.get(`${CUSTOMER_URLS.customer}/customer-information`);
    return response.data;
  },

  async updateCustomerInformation(data: CustomerInformationPayload) {
    const response = await customerAxios.patch(`${CUSTOMER_URLS.customer}/customer-information`, data);
    return response.data;
  },

  async createCustomerAddress(data: CustomerAddressPayload) {
    const response = await customerAxios.post(`${CUSTOMER_URLS.customer}/customer-address`, data);
    return response.data; 
  },

  async updateCustomerAddress(
    addressId: string,
    data: CustomerAddressPayload,
  ) {
    const response = await customerAxios.patch(
      `${CUSTOMER_URLS.customer}/customer-address/${addressId}`,
      data,
    );
    return response.data;
  },

  async deleteCustomerAddress(addressId: string) {
    const response = await customerAxios.delete(`${CUSTOMER_URLS.customer}/customer-address/${addressId}`);
    return response.data;
  },
};
