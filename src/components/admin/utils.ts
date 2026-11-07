import { customerLibs } from '@/libs/api/customer';
import { productLibs } from '@/libs/api/product';
import { cityServices } from '@/services/cityServices';
import { FormInstance } from 'antd';

export const updateCalculations = (
	form: FormInstance,
	discountByPercent: boolean = false,
	billingSubtotal?: number
) => {
	const items: ProductVariantWithStock[] = form.getFieldValue('items') || [];
	const shipping = parseFloat(form.getFieldValue('shipping')) || 0;
	const discount = parseFloat(form.getFieldValue('discount')) || 0;
	let totalDiscount = discount;

	const subtotal =
		billingSubtotal ??
		items.reduce((total, item) => {
			const totalPrice = item?.totalPrice || 0;
			return Number(total) + Number(totalPrice);
		}, 0);

	if (discountByPercent) {
		totalDiscount = subtotal * (discount / 100);
	}

	const total = Math.round((subtotal - totalDiscount + shipping) * 100) / 100;

	form.setFieldsValue({
		subtotal,
		total
	});
};

export const getProductsData = async ({
	search,
	stockId,
	missingProducts,
	includeInactive
}: {
	search: string;
	stockId: string;
	missingProducts?: boolean;
	includeInactive?: boolean;
}) => {
	try {
		const data = await productLibs.searchProductVariants({
			stockId,
			search,
			missingProducts,
			includeInactive
		});

		const formattedData = data.map((item: any) => {
			const quantity = 'quantity' in item ? `(${item?.quantity} unds)` : '';
			// Un item desactivado en la bodega se lista pero no se puede elegir: así
			// se ve que el código existe y por qué no sirve, en vez de no ver nada.
			// El motivo viaja como dato y lo pinta quien renderiza: este archivo es
			// .ts y no puede construir JSX.
			const inactiveInOrigin = item?.activeInOrigin === false;

			return {
				value: item.id,
				label: inactiveInOrigin
					? `${item.productName} - ${item.name}`
					: `${item.productName} - ${item.name} ${quantity}`,
				disabled: inactiveInOrigin,
				inactiveInOrigin,
				// Para agrupar las opciones en el buscador. `<= 0` por si hay
				// existencias negativas
				outOfStock: 'quantity' in item && Number(item.quantity) <= 0
			};
		});

		return { formattedData, data };
	} catch (error) {
		console.error(error);
	}
};

export const getCustomersData = async ({
	currentValue,
	newValue,
	isoCode
}: {
	currentValue: string;
	newValue: string;
	isoCode: string;
}) => {
	try {
		const data = await customerLibs.searchCustomer(newValue, isoCode);

		let formattedData;
		if (currentValue === newValue) {
			formattedData = data.map((item: any) => ({
				value: item.personId,
				label: `${item.fullName} - ${item.dni}`
			}));
		}

		return { formattedData, data };
	} catch (error) {
		console.error(error);
	}
};

export const getCitiesData = async ({
	currentValue,
	newValue
}: {
	currentValue: string;
	newValue: string;
}) => {
	try {
		const data = await cityServices.search(newValue);

		let formattedData;
		if (currentValue === newValue) {
			formattedData = data.map((item: any) => ({
				value: item.id,
				label: `${item?.name}, ${item?.regionName}, ${item?.countryIsoCode}`
			}));
		}

		return { formattedData, data };
	} catch (error) {
		console.error(error);
	}
};

/**
 * La tabla de Productos pagina con sus propias claves en la URL, para no
 * compartir la página con la de Presentaciones. Esto traduce la URL a los
 * parámetros del endpoint
 */
export const productsParamsFromSearch = (searchParams: URLSearchParams) => ({
	page: Number(searchParams.get('productsPage')) || 1,
	pageSize: Number(searchParams.get('productsPageSize')) || 30,
	pId: searchParams.get('pId') ?? undefined,
	productName: searchParams.get('productName') ?? undefined,
	productDescription: searchParams.get('productDescription') ?? undefined,
	productCategoryName: searchParams.get('productCategoryName') ?? undefined
});

// Sin tildes ni mayúsculas: buscar "velon" tiene que encontrar "Velón"
const normalizeSearch = (text: string) =>
	text
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.toLowerCase();

export const selectFilterOption = (
	input: string,
	option: { value: string; label: string | null } | undefined
) => {
	try {
		const label = normalizeSearch(option?.label as string);

		return label?.includes(normalizeSearch(input));
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const calculateTotalPayment = (payments: any[]) =>
	payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

/**
 * Si la presentación tiene sus ejes guardados, o sigue siendo texto libre.
 *
 * Lo usan las dos tablas para decidir si pasan el nombre por
 * `formatToTitleCase`. Un nombre compuesto por el backend ya viene bien escrito
 * y titularlo lo estropea: la lista de unidades de ese helper no conoce `g`,
 * `lt` ni la `x` del envase, así que "Bolsa x 50 g" salía "Bolsa X 50 G" y
 * "1 lt" salía "1 Lt". El título hace falta en las de texto libre, que están
 * escritas en mayúsculas, y deja de hacer falta en cuanto el backfill del punto
 * 5 las estructure
 */
export const isStructuredVariant = (variant: {
	unitId?: string | null;
	containerId?: string | null;
	attributes?: unknown[];
}) =>
	Boolean(
		variant?.unitId ||
			variant?.containerId ||
			(variant?.attributes ?? []).length > 0
	);
