import { ENV } from '@/config/env';
import { axiosPrivate } from './axios';

export const productCategoryServices = {
	getAllProductCategories: async () => {
		try {
			const res = await axiosPrivate.get(ENV.API.PRODUCT_CATEGORIES, {
				server: true
			});

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	getProductCategoryGroups: async (): Promise<
		ProductCategoryGroup[] | undefined
	> => {
		try {
			const res = await axiosPrivate.get(
				`${ENV.API.PRODUCT_CATEGORIES}/groups`
			);

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	createProductCategory: async (body: SubmitProductCategoryDto) => {
		return await axiosPrivate.post(ENV.API.PRODUCT_CATEGORIES, body);
	},

	updateProductCategory: async (
		body: SubmitProductCategoryDto,
		productCategoryId: string
	) => {
		return await axiosPrivate.put(
			`${ENV.API.PRODUCT_CATEGORIES}/${productCategoryId}`,
			body
		);
	},

	deleteProductCategory: async (productCategoryId: string) => {
		return await axiosPrivate.delete(
			`${ENV.API.PRODUCT_CATEGORIES}/${productCategoryId}`
		);
	}
};
