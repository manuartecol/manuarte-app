import { ENV } from '@/config/env';
import { axiosPrivate } from './axios';

export const transactionServices = {
	getAll: async (toId?: string) => {
		try {
			const res = await axiosPrivate.get(ENV.API.TRANSACTIONS, {
				params: { toId }
			});

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	getItems: async (transactionId: string, stockId: string) => {
		try {
			const res = await axiosPrivate.get(
				`${ENV.API.TRANSACTIONS}/items/${transactionId}`,
				{
					params: { stockId }
				}
			);

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	create: async (body: SubmitTransactionDto) => {
		return await axiosPrivate.post(ENV.API.TRANSACTIONS, body);
	},

	update: async (body: SubmitTransactionDto, transactionId: string) => {
		return await axiosPrivate.put(
			`${ENV.API.TRANSACTIONS}/transfer/${transactionId}`,
			body
		);
	}
};
