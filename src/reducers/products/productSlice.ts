import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	products: [] as Product[],
	// La pestaña Productos: cada producto con sus presentaciones anidadas. Va
	// aparte de `products`, que es la lista plana que alimenta los selects
	productsWithVariants: [] as ProductWithVariants[],
	productsPagination: {
		total: 0,
		page: 1,
		pageSize: 30,
		totalPages: 1
	} as Pagination,
	productVariants: [] as ProductVariant[],
	/**
	 * Unidades, envases y tipos de atributo. Son tres listas fijas mantenidas por
	 * seeder, sin administración en el panel, y los tres formularios de
	 * presentación las necesitan a la vez. Se refrescan al abrir cada formulario
	 */
	variantCatalog: null as VariantCatalog | null,
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

		setProductsWithVariants: (state, action) => {
			state.productsWithVariants = action.payload.products;
			state.productsPagination = {
				total: action.payload.total,
				page: action.payload.page,
				pageSize: action.payload.pageSize,
				totalPages: action.payload.totalPages
			};
		},

		setVariantCatalog: (state, action) => {
			state.variantCatalog = action.payload;
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

		// Solo el selector de productos, y solo si ya se cargó: vacío significa que
		// se pedirá entero la próxima vez que haga falta
		addProduct: (state, action) => {
			state.products =
				state.products.length > 0 ? [action.payload, ...state.products] : [];
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

			/**
			 * Lo del producto va a todas sus presentaciones; el nombre y los
			 * `stockIds` son solo de la editada. Antes los `stockIds` se copiaban a
			 * las hermanas, que en la tabla aparecían en bodegas donde no estaban.
			 *
			 * `productVariant` puede no venir: editar el producto ya no arrastra
			 * ninguna presentación
			 */
			const newProductVariantData = state.productVariants.map(pv => {
				if (pv.productId !== product.id) return pv;

				const isEdited = productVariant ? pv.id === productVariant.id : false;

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

		/**
		 * La presentación llega tal como la devolvió el backend, con sus ejes ya
		 * resueltos. Antes se refrescaba con lo que el formulario había enviado, y
		 * editando por ejes no envía `name` (lo compone el backend), así que la
		 * fila se quedaba sin nombre; y los ejes nunca se actualizaban, así que una
		 * segunda edición sin recarga por medio cargaba los viejos
		 */
		updateProductVariant: (state, action) => {
			const { productVariant, stockIds } = action.payload;

			state.productVariants = state.productVariants.map(pv =>
				pv.id === productVariant.id
					? { ...pv, ...productVariant, stockIds }
					: pv
			);
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
	setProductsWithVariants,
	setProductVariants,
	setVariantCatalog,
	addProduct,
	updateProduct,
	addProductVariant,
	updateProductVariant,
	removeProduct
} = productSlice.actions;
export default productSlice.reducer;
