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
	missingProducts
}: {
	search: string;
	stockId: string;
	missingProducts?: boolean;
}) => {
	try {
		const data = await productLibs.searchProductVariants({
			stockId,
			search,
			missingProducts
		});

		const formattedData = data.map((item: any) => {
			const quantity = 'quantity' in item ? `(${item?.quantity} unds)` : '';

			return {
				value: item.id,
				label: `${item.productName} - ${item.name} ${quantity}`
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

export const selectFilterOption = (
	input: string,
	option: { value: string; label: string | null } | undefined
) => {
	try {
		const label = (option?.label as string)?.toLowerCase();

		return label?.includes(input.toLowerCase());
	} catch (error) {
		console.error(error);
		return false;
	}
};

export const calculateTotalPayment = (payments: any[]) =>
	payments.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
