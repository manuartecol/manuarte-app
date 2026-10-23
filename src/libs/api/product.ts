import { ENV } from '@/config/env';
import { axiosPrivate } from './axios';

type ProductVariantApiResponse = {
	productVariants: ProductVariant[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type ProductVariantParams = {
	page?: number;
	pageSize?: number;
	vId?: string;
	productName?: string;
	name?: string;
	productDescription?: string;
	productCategoryName?: string;
	showActiveOnly?: string;
};

export const productLibs = {
	getAllProducts: async () => {
		try {
			const res = await axiosPrivate.get(ENV.API.PRODUCTS);

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	getAllProductVariants: async (params?: ProductVariantParams) => {
		try {
			const res = await axiosPrivate.get<ProductVariantApiResponse>(
				ENV.API.PRODUCT_VARIANTS,
				{ params }
			);

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	searchProductVariants: async ({
		stockId,
		search,
		missingProducts = false,
		includeInactive = false
	}: {
		stockId: string;
		search: string;
		missingProducts?: boolean;
		includeInactive?: boolean;
	}) => {
		try {
			const res = await axiosPrivate.get(
				`${ENV.API.PRODUCT_VARIANTS}/search/${stockId}`,
				{
					params: { search, missingProducts, includeInactive }
				}
			);

			return res.data;
		} catch (error) {
			console.error(error);
		}
	},

	bulkSearchProductVariants: async (body: string[], stockId: string) => {
		const res = await axiosPrivate.post(
			`${ENV.API.PRODUCT_VARIANTS}/bulkSearch/${stockId}`,
			body
		);

		return res.data;
	},

	createProduct: async (body: SubmitProductDto) => {
		return await axiosPrivate.post(ENV.API.PRODUCTS, body);
	},

	updateProduct: async (body: SubmitProductDto, productId: string) => {
		return await axiosPrivate.put(`${ENV.API.PRODUCTS}/${productId}`, body);
	},

	addProductVariant: async (body: { name: string }, productId: string) => {
		return axiosPrivate.post(
			`${ENV.API.PRODUCTS}/add-variant/${productId}`,
			body
		);
	},

	updateProductVariant: async (
		body: SubmitProductDto,
		productVariantId: string
	) => {
		return await axiosPrivate.put(
			`${ENV.API.PRODUCT_VARIANTS}/${productVariantId}`,
			{
				name: body?.productVariant?.name,
				active: body?.productVariant?.active,
				stockIds: body?.stockIds
			}
		);
	},

	deleteProduct: async (productId: string, productVariantId: string) => {
		return await axiosPrivate.delete(`${ENV.API.PRODUCTS}`, {
			params: {
				productId,
				productVariantId
			}
		});
	}
};
