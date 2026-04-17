import { useState } from 'react';
import { Form, notification } from 'antd';
import { useDispatch } from 'react-redux';
import { AxiosError, AxiosResponse } from 'axios';
import { productLibs } from '@/libs/api/product';
import { productCategoryServices } from '@/services/productCategoryServices';
import {
	addProduct,
	addProductVariant,
	removeProduct,
	updateProduct,
	updateProductVariant
} from '@/reducers/products/productSlice';
import {
	addProductCategory,
	updateProductCategory
} from '@/reducers/productCategories/productCategorySlice';
import { staffLibs } from '@/libs/api/staff';
import { customerLibs } from '@/libs/api/customer';
import {
	addStaff,
	updateStaff,
	updateStaffPermissions
} from '@/reducers/staff/staffSlice';
import { addCustomer, updateCustomer } from '@/reducers/customer/customerSlice';
import { quoteLibs } from '@/libs/api/quote';
import { addQuote, updateQuote } from '@/reducers/quotes/quoteSlice';
import { billingLibs } from '@/libs/api/billing';
import { addBilling, updateBilling } from '@/reducers/billings/billingSlice';
import { stockItemLibs } from '@/libs/api/stock-item';
import {
	addStockItem,
	updateStockItem
} from '@/reducers/stockItems/stockItemSlice';
import { transactionLibs } from '@/libs/api/transaction';
import {
	addTransaction,
	updateTransaction,
	updateTransactionState
} from '@/reducers/transactions/transactionSlice';
import { useModalStore } from '@/stores/modalStore';
import { useDrawerStore } from '@/stores/drawerStore';
import usePdf from './usePdf';
import { validateUniqueProductVariantsName } from './utils';
import { BillingStatus } from '@/types/enums';
import { financialFlowServices } from '@/services/financialFlowServices';
import { setCurrentCashSession } from '@/reducers/financialFlow/financialFlowSlice';

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
	const { closeModal } = useModalStore.getState();
	const { closeDrawer } = useDrawerStore.getState();
	const { sendPdf } = usePdf();

	const handleSubmit = async ({
		serviceFn,
		values,
		onSuccess
	}: handleSubmitProps) => {
		try {
			setIsLoading(true);
			const res = await serviceFn(values);

			if (res?.status === 200 || res?.status === 201) {
				notification.success({
					message: res.data.message ?? 'Operación realizada con éxito'
				});
				onSuccess(res);
				closeModal();
				closeDrawer();
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

	const submitCreateProduct = async (
		values: SubmitProductDto,
		stockIds?: string[]
	) => {
		const pVariantsAreUnique =
			values.productVariants &&
			validateUniqueProductVariantsName(values.productVariants);

		if (!pVariantsAreUnique) {
			return notification.error({
				message:
					'Estás intentando crear más de una presentación con el mismo nombre'
			});
		}

		await handleSubmit({
			serviceFn: productLibs.createProduct,
			values,
			onSuccess: res =>
				dispatch(addProduct({ newProduct: res.data.newProduct, stockIds }))
		});
	};

	const submitUpdateProduct = async (
		values: SubmitProductDto,
		productId: string
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				productLibs.updateProduct(valuesToUpdate, productId),
			values,
			onSuccess: async () => {
				dispatch(updateProduct({ ...values, id: productId }));
			}
		});
	};

	const submitAddProductVariant = async (
		values: Omit<SubmitProductVariantDto, 'productId'>,
		productId: string,
		stockIds?: string[]
	) => {
		await handleSubmit({
			serviceFn: async newVariantValues =>
				productLibs.addProductVariant(newVariantValues, productId),
			values,
			onSuccess: res =>
				dispatch(addProductVariant({ ...res.data.newProductVariant, stockIds }))
		});
	};

	const submitUpdateProductVariant = async (
		values: SubmitProductDto,
		productVariantId: string,
		activeProducts?: boolean
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				productLibs.updateProductVariant(valuesToUpdate, productVariantId),
			values,
			onSuccess: async () => {
				if (activeProducts !== values?.productVariant?.active) {
					dispatch(removeProduct({ productVariantId }));
					return;
				}

				dispatch(
					updateProductVariant({
						...values.productVariant,
						stockIds: values.stockIds
					})
				);
			}
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
			serviceFn: staffLibs.registerStaff,
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
				staffLibs.updateStaff(valuesToUpdate, personId),
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
				staffLibs.setPermissions(valuesToUpdate, userId),
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
			serviceFn: customerLibs.registerCustomer,
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
				customerLibs.updateCustomer(valuesToUpdate, personId),
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
			serviceFn: quoteLibs.create,
			values,
			onSuccess: async res => {
				dispatch(addQuote(res?.data?.newQuote));

				if (values?.phoneNumber) {
					await sendPdf({
						isQuote: true,
						serialNumber: res?.data?.newQuote?.serialNumber
					});
				}
			}
		});
	};

	const submitUpdateQuote = async (values: SubmitQuoteDto, quoteId: string) => {
		if (values?.items?.length < 1) {
			setItemsError(true);
			return;
		}

		await handleSubmit({
			serviceFn: valuesToUpdate => quoteLibs.update(valuesToUpdate, quoteId),
			values,
			onSuccess: async res => {
				dispatch(updateQuote(res.data.updatedQuote));

				if (values?.phoneNumber) {
					await sendPdf({
						isQuote: true,
						serialNumber: res?.data?.updatedQuote?.serialNumber
					});
				}
			}
		});
	};

	const submitCreateBilling = async ({
		values,
		fetchBillings = undefined
	}: {
		values: SubmitBillingDto;
		fetchBillings?: () => void;
	}) => {
		return await handleSubmit({
			serviceFn: billingLibs.create,
			values,
			onSuccess: async res => {
				if (fetchBillings) {
					fetchBillings();
				}
				dispatch(addBilling(res.data.newBilling));
				const { status, serialNumber } = res?.data?.newBilling;

				if (values?.phoneNumber && status === BillingStatus.PAID) {
					await sendPdf({
						isQuote: false,
						serialNumber
					});
				}
			}
		});
	};

	const submitUpdateBilling = async (
		values: {
			status: string;
			payments: Payment[];
			stockId: string;
			items: BillingItem[];
			comments: string;
		},
		currentBillingData: {
			billingId: string;
			currentStatus: BillingStatus;
			serialNumber: string;
			phoneNumber: string;
		}
	) => {
		const { billingId, currentStatus, serialNumber, phoneNumber } =
			currentBillingData;

		await handleSubmit({
			serviceFn: valuesToUpdate =>
				billingLibs.update(valuesToUpdate, billingId),
			values,
			onSuccess: async _res => {
				dispatch(
					updateBilling({
						id: billingId,
						status: values?.status,
						effectiveDate: new Date().toISOString(),
						paymentMethods: values?.payments?.map(p => p?.paymentMethod) || []
					})
				);

				if (
					phoneNumber &&
					currentStatus !== BillingStatus.PAID &&
					values?.status === BillingStatus.PAID
				) {
					await sendPdf({
						isQuote: false,
						serialNumber
					});
				}
			}
		});
	};

	const submitCreateStockItem = async (values: SubmitStockItemDto) => {
		await handleSubmit({
			serviceFn: stockItemLibs.create,
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
				stockItemLibs.update(valuesToUpdate, stockItemId),
			values,
			onSuccess: res => dispatch(updateStockItem(res.data.updatedStockItem))
		});
	};

	const submitTransaction = async (
		values: SubmitTransactionDto,
		shops: Shop[]
	) => {
		await handleSubmit({
			serviceFn: transactionLibs.create,
			values,
			onSuccess: res => {
				const fromName = shops.find(
					shop => shop.stockId === res.data.newTransaction?.fromId
				)?.stockName;
				const toName = shops.find(
					shop => shop.stockId === res.data.newTransaction?.toId
				)?.stockName;

				const newTransaction = {
					...res.data.newTransaction,
					fromName,
					toName
				};

				dispatch(addTransaction(newTransaction));

				if (values?.transferId) {
					dispatch(
						updateTransactionState({
							id: values?.transferId,
							state: 'SUCCESS'
						})
					);
				}
			}
		});
	};

	const submitUpdateTransaction = async (
		values: SubmitTransactionDto,
		transactionId: string,
		shops: Shop[]
	) => {
		await handleSubmit({
			serviceFn: valuesToUpdate =>
				transactionLibs.update(valuesToUpdate, transactionId),
			values,
			onSuccess: res => {
				const fromName = shops.find(
					shop => shop.stockId === res.data.updatedTransaction?.fromId
				)?.stockName;
				const toName = shops.find(
					shop => shop.stockId === res.data.updatedTransaction?.toId
				)?.stockName;

				const updatedTransaction = {
					...res.data.updatedTransaction,
					fromName,
					toName
				};

				dispatch(updateTransaction(updatedTransaction));
			}
		});
	};

	const submitOpenCashSession = async (
		values: {
			declaredOpeningAmount: number;
			initialPiggyBankAmount?: number;
			comments?: string;
		},
		shopId: string
	) => {
		await handleSubmit({
			serviceFn: body => financialFlowServices.openCashSession(body, shopId),
			values,
			onSuccess: res => dispatch(setCurrentCashSession(res?.data?.cashSession))
		});
	};

	const submitCloseCashSession = async (
		values: { declaredClosingAmount: number; comments?: string },
		shopId: string
	) => {
		await handleSubmit({
			serviceFn: body => financialFlowServices.closeCashSession(body, shopId),
			values,
			onSuccess: res => dispatch(setCurrentCashSession(res?.data?.cashSession))
		});
	};

	const submitCreateCashMovement = async (
		values: SubmitCashMovementDto,
		shopId: string
	) => {
		await handleSubmit({
			serviceFn: body => financialFlowServices.createCashMovement(body, shopId),
			values,
			onSuccess: res =>
				dispatch(setCurrentCashSession(res?.data?.currentSessionUpdated))
		});
	};

	const submitPiggyBankWithdraw = async (
		values: { amount: number; comments?: string },
		shopId: string
	) => {
		await handleSubmit({
			serviceFn: body =>
				financialFlowServices.withdrawFromPiggyBank(body, shopId),
			values,
			onSuccess: res =>
				dispatch(setCurrentCashSession(res?.data?.currentSessionUpdated))
		});
	};

	return {
		form,
		isLoading,
		itemsError,
		handleSubmit,
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
		submitTransaction,
		submitUpdateTransaction,
		submitCreateCashMovement,
		submitOpenCashSession,
		submitCloseCashSession,
		submitPiggyBankWithdraw
	};
};

export default useForm;
