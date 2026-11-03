import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
	productLibs,
	ProductParams,
	ProductVariantParams
} from '@/libs/api/product';
import { setProductCategories } from '@/reducers/productCategories/productCategorySlice';
import {
	setProducts,
	setProductsWithVariants,
	setProductVariants
} from '@/reducers/products/productSlice';

const useProductServices = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingProducts, setIsLoadingProducts] = useState(true);
	// Solo la última consulta pinta la tabla: con clics rápidos en los filtros,
	// una respuesta lenta llegaba después y mostraba datos de otro filtro
	const lastRequestId = useRef(0);
	const lastProductsRequestId = useRef(0);
	const dispatch = useDispatch();

	/**
	 * Las tres guardas de abajo comprueban la forma de la respuesta antes de
	 * guardarla. Un cuerpo que no la cumpla deja los datos como estaban, que es
	 * recuperable, en vez de meter `undefined` en el store, que rompe la
	 * siguiente escritura y en un sitio que no tiene nada que ver
	 */
	const getProducts = async () => {
		const data = await productLibs.getAllProducts();
		if (!Array.isArray(data)) return;

		dispatch(setProducts(data));
	};

	// Misma guarda de obsoletos que en las presentaciones, con su propio contador
	const getProductsWithVariants = async (params?: ProductParams) => {
		const requestId = ++lastProductsRequestId.current;
		try {
			setIsLoadingProducts(true);
			const data = await productLibs.getProductsWithVariants(params);
			if (requestId !== lastProductsRequestId.current) return;
			if (!Array.isArray(data?.products)) return;

			dispatch(setProductsWithVariants(data));
		} catch (error) {
			console.error(error);
		} finally {
			if (requestId === lastProductsRequestId.current) {
				setIsLoadingProducts(false);
			}
		}
	};

	const getProductVariants = async (params?: ProductVariantParams) => {
		const requestId = ++lastRequestId.current;
		try {
			setIsLoading(true);
			const data = await productLibs.getAllProductVariants(params);
			if (requestId !== lastRequestId.current) return;
			if (!Array.isArray(data?.productVariants)) return;

			dispatch(setProductVariants(data));
		} catch (error) {
			console.error(error);
		} finally {
			if (requestId === lastRequestId.current) setIsLoading(false);
		}
	};

	const getProductCategories = (data: ProductCategory[]) => {
		dispatch(setProductCategories(data));
	};

	return {
		getProducts,
		getProductsWithVariants,
		getProductVariants,
		getProductCategories,
		isLoading,
		isLoadingProducts,
		setIsLoading
	};
};

export default useProductServices;
