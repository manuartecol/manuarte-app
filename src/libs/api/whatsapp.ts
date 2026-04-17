import { ENV } from '@/config/env';
import { axiosPrivate } from './axios';

export const whatsAppLibs = {
	sendQuote: async (serialNumber: string) => {
		const res = await axiosPrivate.post(ENV.API.WA_SEND_QUOTE(serialNumber));

		return res;
	},

	sendBilling: async (serialNumber: string) => {
		const res = await axiosPrivate.post(ENV.API.WA_SEND_BILLING(serialNumber));
		return res;
	}
};
