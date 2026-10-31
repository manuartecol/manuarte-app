import { createSlice } from '@reduxjs/toolkit';
import { formatProductVariantState } from '../utils';

const initialState = {
	products: [] as Product[],
	productVariants: [] as ProductVariant[],
	productVariantsPagination: {
		total: 0,
		page: 1,
		pageSize: 10,
		totalPages: 1
	} as Pagination
};

export const productSlice = createSlice({
	name: 'product',
	initialState,
	reducers: {
		setProducts: (state, action) => {
			state.products = action.payload;
		},

		setProductVariants: (state, action) => {
			state.productVariants = action.payload.productVariants;
			state.productVariantsPagination = {
				total: action.payload.total,
				page: action.payload.page,
				pageSize: action.payload.pageSize,
				totalPages: action.payload.totalPages
			};
		},

		addProduct: (state, action) => {
			const { newProduct, stockIds } = action.payload;
			const newProductVariants = formatProductVariantState(
				newProduct,
				stockIds
			);

			state.products =
				state.products.length > 0 ? [newProduct, ...state.products] : [];
			state.productVariants = [
				...newProductVariants,
				...state.productVariants
			].slice(0, state.productVariantsPagination.pageSize);
			state.productVariantsPagination.total += newProductVariants.length;
		},

		updateProduct: (state, action) => {
			const {
				productVariant,
				stockIds,
				productCategoryId,
				productCategoryName,
				...product
			} = action.payload;

			const newProductData =
				state.products.length > 0
					? state.products.map(p =>
							p.id === product.id ? { ...p, name: product.name } : p
						)
					: [];

			// Lo del producto va a todas sus presentaciones; el nombre y los
			// `stockIds` son solo de la editada. Antes los `stockIds` se copiaban a
			// las hermanas, que en la tabla aparecían en bodegas donde no estaban
			const newProductVariantData = state.productVariants.map(pv => {
				if (pv.productId !== product.id) return pv;

				const isEdited = pv.id === productVariant.id;

				return {
					...pv,
					name: isEdited ? productVariant.name : pv.name,
					active: isEdited ? productVariant.active : pv.active,
					productName: product.name,
					productDescription: product.description,
					...(productCategoryId && { productCategoryId, productCategoryName }),
					stockIds: isEdited ? stockIds : pv.stockIds
				};
			});

			state.products = newProductData;
			state.productVariants = newProductVariantData;
		},

		addProductVariant: (state, action) => {
			state.productVariants = [action.payload, ...state.productVariants].slice(
				0,
				state.productVariantsPagination.pageSize
			);
			state.productVariantsPagination.total += 1;
		},

		updateProductVariant: (state, action) => {
			const productVariant = action.payload;

			const newData = state.productVariants.map(pv =>
				pv.id === productVariant.id
					? {
							...pv,
							name: productVariant.name,
							active: productVariant.active,
							stockIds: productVariant.stockIds
						}
					: pv
			);

			state.productVariants = newData;
		},

		removeProduct: (state, action) => {
			const { productId, productVariantId } = action.payload ?? {};

			state.productVariants = state.productVariants.filter(
				productV => productV.id !== productVariantId
			);

			if (productId) {
				state.products = state.products.filter(
					product => product.id !== productId
				);
			}
		}
	}
});

export const {
	setProducts,
	setProductVariants,
	addProduct,
	updateProduct,
	addProductVariant,
	updateProductVariant,
	removeProduct
} = productSlice.actions;
export default productSlice.reducer;
