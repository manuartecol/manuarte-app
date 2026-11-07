import { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
	productLibs,
	ProductParams,
	ProductVariantParams
} from '@/libs/api/product';
import { setProductCategories } from '@/reducers/productCategories/productCategorySlice';
import {
	setProducts,
	setProductsWithVariants,
	setProductVariants,
	setVariantCatalog
} from '@/reducers/products/productSlice';

/**
 * La última consulta de cada tabla, compartida entre todas las instancias del
 * hook. La tabla y los formularios tienen cada uno la suya, y con un contador
 * por instancia una respuesta vieja de la tabla podía pisar la que acababa de
 * pedir el formulario después de guardar
 */
let latestProductsRequest = 0;
let latestVariantsRequest = 0;

const useProductServices = () => {
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingProducts, setIsLoadingProducts] = useState(true);
	// Solo la última consulta pinta la tabla: con clics rápidos en los filtros,
	// una respuesta lenta llegaba después y mostraba datos de otro filtro
	const lastRequestId = useRef(0);
	const lastProductsRequestId = useRef(0);
	const dispatch = useDispatch();
	const { variantCatalog } = useSelector((state: RootState) => state.product);

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
		const paintId = ++latestProductsRequest;
		try {
			setIsLoadingProducts(true);
			const data = await productLibs.getProductsWithVariants(params);
			if (paintId !== latestProductsRequest) return;
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
		const paintId = ++latestVariantsRequest;
		try {
			setIsLoading(true);
			const data = await productLibs.getAllProductVariants(params);
			if (paintId !== latestVariantsRequest) return;
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

	/**
	 * El catálogo de ejes. Devuelve si se pudo cargar, porque el formulario no se
	 * puede capturar sin él y tiene que avisar en vez de pintar selects vacíos.
	 *
	 * Una sola vez por sesión: son tres listas fijas que mantiene un seeder, sin
	 * administración en el panel, así que volver a pedirlas en cada apertura de
	 * modal era una petición por nada
	 */
	/**
	 * Se pide cada vez que abre un formulario, aunque ya haya una copia: una
	 * pestaña abierta antes de agregar una unidad no la ofrecía, y una presentación
	 * con esa unidad mostraba su id. Si falla, la copia que haya sigue sirviendo
	 */
	const getVariantCatalog = async () => {
		try {
			const data = await productLibs.getVariantCatalog();
			if (!Array.isArray(data?.units)) return Boolean(variantCatalog);

			dispatch(setVariantCatalog(data));

			return true;
		} catch (error) {
			console.error(error);

			return Boolean(variantCatalog);
		}
	};

	return {
		getProducts,
		getProductsWithVariants,
		getProductVariants,
		getProductCategories,
		getVariantCatalog,
		isLoading,
		isLoadingProducts,
		setIsLoading
	};
};

export default useProductServices;
