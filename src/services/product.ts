import { useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { productLibs, ProductVariantParams } from '@/libs/api/product';
import { setProductCategories } from '@/reducers/productCategories/productCategorySlice';
import {
	setProducts,
	setProductVariants
} from '@/reducers/products/productSlice';

const useProductServices = () => {
	const [isLoading, setIsLoading] = useState(true);
	// Solo la última consulta pinta la tabla: con clics rápidos en los filtros,
	// una respuesta lenta llegaba después y mostraba datos de otro filtro
	const lastRequestId = useRef(0);
	const dispatch = useDispatch();

	const getProducts = async () => {
		const data = await productLibs.getAllProducts();
		dispatch(setProducts(data));
	};

	const getProductVariants = async (params?: ProductVariantParams) => {
		const requestId = ++lastRequestId.current;
		try {
			setIsLoading(true);
			const data = await productLibs.getAllProductVariants(params);
			if (requestId !== lastRequestId.current) return;

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
		getProductVariants,
		getProductCategories,
		isLoading,
		setIsLoading
	};
};

export default useProductServices;
