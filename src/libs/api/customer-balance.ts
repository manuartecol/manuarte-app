import { ENV } from '@/config/env';
import { axiosPrivate } from './axios';

export type BalanceMovementsParams = {
	page?: number;
	pageSize?: number;
	currency: string;
	type?: string;
	category?: string;
	/**
	 * Puede llegar en la URL porque la tabla escribe ahí todos sus filtros, pero
	 * el backend no filtra por él: la columna lo resuelve en el cliente.
	 */
	paymentMethod?: string;
	dateStart?: string;
	dateEnd?: string;
};

export const customerBalanceLibs = {
	getBalance: async (customerId: string, currency: string) => {
		try {
			const res = await axiosPrivate.get(
				`${ENV.API.CUSTOMER_BALANCE}/${customerId}`,
				{ params: { currency } }
			);

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	getMovements: async (customerId: string, params: BalanceMovementsParams) => {
		try {
			const res = await axiosPrivate.get(
				`${ENV.API.CUSTOMER_BALANCE}/${customerId}/movements`,
				{ params }
			);

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	addCredit: async (customerId: string, body: CustomerBalanceDto) => {
		return await axiosPrivate.post(
			`${ENV.API.CUSTOMER_BALANCE}/${customerId}/credit`,
			body
		);
	},

	useBalance: async (customerId: string, body: CustomerBalanceDto) => {
		return await axiosPrivate.post(
			`${ENV.API.CUSTOMER_BALANCE}/${customerId}/use-balance`,
			body
		);
	}
};
