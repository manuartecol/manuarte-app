import { ENV } from '@/config/env';
import { axiosPrivate } from './axios';

type ProductVariantApiResponse = {
	productVariants: ProductVariant[];
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

export type ProductParams = {
	page?: number;
	pageSize?: number;
	pId?: string;
	productName?: string;
	productDescription?: string;
	productCategoryName?: string;
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

// Todas las claves que la página de Productos lee de la URL: las de las dos
// tablas juntas, porque comparte una sola barra de direcciones
export type ProductsPageParams = ProductVariantParams & {
	tab?: string;
	productsPage?: string;
	productsPageSize?: string;
	pId?: string;
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

	// Los productos con sus presentaciones anidadas, paginando por producto
	getProductsWithVariants: async (params?: ProductParams) => {
		try {
			const res = await axiosPrivate.get<{
				products: ProductWithVariants[];
				total: number;
				page: number;
				pageSize: number;
				totalPages: number;
			}>(`${ENV.API.PRODUCTS}/with-variants`, { params });

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

	// Las listas fijas del formulario de presentaciones: unidades, envases y
	// tipos de atributo. El error sube porque sin catálogo el formulario no se
	// puede capturar, y hay que decirlo en vez de mostrar selects vacíos
	getVariantSuggestions: async (
		productCategoryId: string
	): Promise<VariantSuggestion[]> => {
		const res = await axiosPrivate.get<VariantSuggestion[]>(
			`${ENV.API.PRODUCT_VARIANTS}/suggestions`,
			{ params: { productCategoryId } }
		);

		return res.data;
	},

	getVariantCatalog: async (): Promise<VariantCatalog> => {
		const res = await axiosPrivate.get<VariantCatalog>(
			`${ENV.API.PRODUCT_VARIANTS}/catalog`
		);

		return res.data;
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

	addProductVariant: async (
		body: Omit<SubmitProductVariantDto, 'productId'>,
		productId: string
	) => {
		return axiosPrivate.post(
			`${ENV.API.PRODUCTS}/add-variant/${productId}`,
			body
		);
	},

	updateProductVariant: async (
		body: SubmitProductVariantUpdateDto,
		productVariantId: string
	) => {
		return await axiosPrivate.put(
			`${ENV.API.PRODUCT_VARIANTS}/${productVariantId}`,
			body
		);
	},

	// El error sube: quien lo pide necesita distinguir "no hay historial" de "no
	// se pudo comprobar", y el mensaje del backend es el que explica por qué
	getProductDeletionPreview: async (
		productId: string,
		productVariantId: string
	): Promise<ProductDeletionPreview> => {
		const res = await axiosPrivate.get<ProductDeletionPreview>(
			`${ENV.API.PRODUCTS}/deletion-preview`,
			{ params: { productId, productVariantId } }
		);

		return res.data;
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
