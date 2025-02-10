import { useState } from 'react';
import { Form, notification } from 'antd';
import { useDispatch } from 'react-redux';
import { AxiosError, AxiosResponse } from 'axios';
import { productServices } from '@/services/productServices';
import { productCategoryServices } from '@/services/productCategoryServices';
import { userServices } from '@/services/userServices';
import {
	addProduct,
	addProductVariant,
	getProductVariants
} from '@/reducers/products/productSlice';
import { closeDrawer, closeModal } from '@/reducers/ui/uiSlice';
import {
	addProductCategory,
	updateProductCategory
} from '@/reducers/productCategories/productCategorySlice';
import {
	addCustomer,
	addStaff,
	updateCustomer,
	updateStaff,
	updateStaffPermissions
} from '@/reducers/users/userSlice';
import { quoteServices } from '@/services/quoteServices';
import { addQuote, updateQuote } from '@/reducers/quotes/quoteSlice';
import { billingServices } from '@/services/billingServices';
import { addBilling, updateBilling } from '@/reducers/billings/billingSlice';
import { stockItemServices } from '@/services/stockItemServices';
import {
	addStockItem,
	updateStockItem
} from '@/reducers/stockItems/stockItemSlice';
import { transactionServices } from '@/services/transactionServices';
import { addTransaction } from '@/reducers/transactions/transactionSlice';

notification.config({
	placement: 'topRight',
	duration: 3
});

interface handleSubmitProps {
	serviceFn: (values: any) => Promise<AxiosResponse>;
	values: any;
	onSuccess: (res: AxiosResponse) => void;
	modal?: boolean;
}

const useForm = () => {
	const [form] = Form.useForm();
	const [isLoading, setIsLoading] = useState(false);
	const [itemsError, setItemsError] = useState(false);
	const dispatch = useDispatch();

	const handleSubmit = async ({
		serviceFn,
		values,
		onSuccess,
		modal = true
	}: handleSubmitProps) => {
		try {
			setIsLoading(true);
			const res = await serviceFn(values);

			if (res?.status === 200 || res?.status === 201) {
				notification.success({
					message: res.data.message ?? 'Operación realizada con éxito'
				});
				onSuccess(res);
				dispatch(modal ? closeModal() : closeDrawer());
			}
			return res;
		} catch (error) {
			console.error(error);
			const message =
				error instanceof AxiosError
					? error?.response?.data.message
					: 'Ocurrió un error. Inténtalo más tarde';
			notification.error({ message });
		} finally {
			setIsLoading(false);
		}
	};

	const submitCreateProduct = async (values: SubmitProductDto) => {
		await handleSubmit({
			serviceFn: productServices.createProduct,
			values,
			onSuccess: res => dispatch(addProduct(res.data.newProduct))
		});
	};

	const submitUpdateProduct = async (
		values: SubmitProductDto,
		productId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				productServices.updateProduct(valuesToUpdate, productId),
			values,
			onSuccess: async () => {
				const productVariantsData =
					await productServices.getAllProductVariants(false);
				dispatch(getProductVariants(productVariantsData));
			}
		});
	};

	const submitUpdateProductVariant = async (
		values: SubmitProductDto,
		productVariantId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				productServices.updateProductVariant(valuesToUpdate, productVariantId),
			values,
			onSuccess: async () => {
				const productVariantsData =
					await productServices.getAllProductVariants(false);
				dispatch(getProductVariants(productVariantsData));
			}
		});
	};

	const submitAddProductVariant = async (
		values: { name: string },
		productId: string
	) => {
		await handleSubmit({
			serviceFn: async newVariantValues =>
				productServices.addProductVariant(newVariantValues, productId),
			values,
			onSuccess: res => dispatch(addProductVariant(res.data.newProductVariant))
		});
	};

	const submitCreateProductCategory = async (values: { name: string }) => {
		await handleSubmit({
			serviceFn: productCategoryServices.createProductCategory,
			values,
			onSuccess: res =>
				dispatch(addProductCategory(res.data.newProductCategory))
		});
	};

	const submitUpdateProductCategory = async (
		values: { name: string },
		productCategoryId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				productCategoryServices.updateProductCategory(
					valuesToUpdate,
					productCategoryId
				),
			values,
			onSuccess: res =>
				dispatch(updateProductCategory(res.data.updatedProductCategory))
		});
	};

	const submitRegisterStaff = async (values: SubmitStaffDto) => {
		await handleSubmit({
			serviceFn: userServices.registerStaff,
			values,
			onSuccess: res => dispatch(addStaff(res.data.newUser))
		});
	};

	const submitUpdateStaff = async (
		values: SubmitStaffDto,
		personId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				userServices.updateStaff(valuesToUpdate, personId),
			values,
			onSuccess: res => dispatch(updateStaff(res.data.updatedUser))
		});
	};

	const submitEditPermissions = async (
		values: { extraPermissions: string[] },
		userId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				userServices.setPermissions(valuesToUpdate, userId),
			values,
			onSuccess: () =>
				dispatch(
					updateStaffPermissions({
						extraPermissions: values.extraPermissions,
						userId
					})
				)
		});
	};

	const submitRegisterCustomer = async (values: SubmitCustomerDto) => {
		await handleSubmit({
			serviceFn: userServices.registerCustomer,
			values,
			onSuccess: res => dispatch(addCustomer(res.data.newCustomer))
		});
	};

	const submitUpdateCustomer = async (
		values: SubmitCustomerDto,
		personId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				userServices.updateCustomer(valuesToUpdate, personId),
			values,
			onSuccess: res => dispatch(updateCustomer(res.data.updatedCustomer))
		});
	};

	const submitCreateQuote = async (values: SubmitQuoteDto) => {
		if (values?.items?.length < 1) {
			setItemsError(true);
			return;
		}

		await handleSubmit({
			serviceFn: quoteServices.create,
			values,
			onSuccess: res => dispatch(addQuote(res.data.newQuote)),
			modal: false
		});
	};

	const submitUpdateQuote = async (values: SubmitQuoteDto, quoteId: string) => {
		if (values?.items?.length < 1) {
			setItemsError(true);
			return;
		}

		await handleSubmit({
			serviceFn: valuesToUpdate =>
				quoteServices.update(valuesToUpdate, quoteId),
			values,
			onSuccess: res => dispatch(updateQuote(res.data.updatedQuote)),
			modal: false
		});
	};

	const submitCreateBilling = async ({
		values,
		modal = false
	}: {
		values: SubmitBillingDto;
		modal?: boolean;
	}) => {
		if (values?.items?.length < 1) {
			setItemsError(true);
			return;
		}

		return await handleSubmit({
			serviceFn: billingServices.create,
			values,
			onSuccess: res => dispatch(addBilling(res.data.newBilling)),
			modal
		});
	};

	const submitUpdateBilling = async (
		values: { status: string; paymentMethod: string },
		billingId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				billingServices.update(valuesToUpdate, billingId),
			values,
			onSuccess: _res => dispatch(updateBilling({ id: billingId, ...values })),
			modal: true
		});
	};

	const submitCreateStockItem = async (values: SubmitStockItemDto) => {
		await handleSubmit({
			serviceFn: stockItemServices.create,
			values,
			onSuccess: res => dispatch(addStockItem(res.data.newStockItem))
		});
	};

	const submitUpdateStockItem = async (
		values: SubmitStockItemDto,
		stockItemId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				stockItemServices.update(valuesToUpdate, stockItemId),
			values,
			onSuccess: res => dispatch(updateStockItem(res.data.updatedStockItem))
		});
	};

	const submitTransaction = async (
		values: SubmitTransactionDto,
		shops: Shop[]
	) => {
		if (values?.items?.length < 1) {
			setItemsError(true);
			return;
		}

		await handleSubmit({
			serviceFn: transactionServices.create,
			values,
			onSuccess: res => {
				const fromName = shops.find(
					shop => shop.stockId === res.data.newTransaction?.fromId
				)?.stockName;
				const toName = shops.find(
					shop => shop.stockId === res.data.newTransaction?.toId
				)?.stockName;
				const newTransaction = { ...res.data.newTransaction, fromName, toName };

				dispatch(addTransaction(newTransaction));
			},
			modal: false
		});
	};

	return {
		form,
		isLoading,
		itemsError,
		setItemsError,
		submitCreateProduct,
		submitUpdateProduct,
		submitUpdateProductVariant,
		submitAddProductVariant,
		submitCreateProductCategory,
		submitUpdateProductCategory,
		submitRegisterStaff,
		submitUpdateStaff,
		submitEditPermissions,
		submitRegisterCustomer,
		submitUpdateCustomer,
		submitCreateQuote,
		submitUpdateQuote,
		submitCreateBilling,
		submitUpdateBilling,
		submitCreateStockItem,
		submitUpdateStockItem,
		submitTransaction
	};
};

export default useForm;
