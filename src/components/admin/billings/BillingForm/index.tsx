import useForm from '@/hooks/useForm';
import { Button, Divider, Form, Input } from 'antd';
import CustomerInfoInputs from '../../common/input-data/CustomerInfoInputs';
import ProductFormList from '../../common/input-data/ProductFormList';
import DrawerFormFooter from '../../common/input-data/DrawerFormFooter';
import CalculationInputs from '../../common/input-data/CalculationInputs';
import { useEffect, useState } from 'react';
import { updateCalculations } from '../../utils';
import { useParams } from 'next/navigation';
import { customerSchema, validateForm } from '@/utils/validators';
import { useModalStore } from '@/stores/modalStore';
import {
	BillingStatus,
	DiscountType,
	DrawerContent,
	ModalContent
} from '@/types/enums';
import { useDrawerStore } from '@/stores/drawerStore';
import { v4 as uuidv4 } from 'uuid';
const { TextArea } = Input;

const BillingForm = () => {
	const { form, itemsError, setItemsError, submitCreateBilling } = useForm();
	const {
		content,
		dataToHandle,
		customerInfo: existingCustomer,
		noCustomer
	} = useDrawerStore.getState();
	const params = useParams() ?? {};
	const { openModal } = useModalStore.getState();
	const [clientRequestId, setClientRequestId] = useState<string>('');

	const isPreOrder = content === DrawerContent.preOrder;

	useEffect(() => {
		if (dataToHandle) {
			let fieldsData = dataToHandle;

			if (existingCustomer?.personId) {
				fieldsData = { ...dataToHandle, ...existingCustomer };
			}

			const preparedFields = {
				...fieldsData,
				items: fieldsData?.items?.map((item: QuoteItem) => {
					return {
						...item,
						currency: fieldsData.currency,
						price: Number(item.price),
						totalPrice: Number(item.totalPrice)
					};
				}),
				shipping: fieldsData.shipping ?? 0
			};
			form.setFieldsValue(preparedFields);
			updateCalculations(form);
		} else {
			if (existingCustomer?.personId) {
				form.setFieldsValue(existingCustomer);
			}
		}
	}, [existingCustomer]);

	const onFinish = async (values: SubmitBillingDto) => {
		if (values?.items?.length < 1) {
			setItemsError(true);
			return;
		}

		const isValid = !noCustomer
			? await validateForm(values, customerSchema, form)
			: true;
		if (!isValid) return;

		if ('selectedMethods' in values) delete values.selectedMethods;
		if ('total' in values) delete values.total;

		let uniqueId: string = clientRequestId;
		if (!clientRequestId) {
			uniqueId = uuidv4();
			setClientRequestId(uniqueId);
		}

		openModal({
			title: '',
			content: ModalContent.confirm,
			componentProps: {
				confirmTitle: `¿Estás seguro de que quieres generar esta factura${isPreOrder ? ' como venta bajo pedido/abono?' : '?'}`,
				confirmText: !isPreOrder
					? 'Se descontarán del stock los items agregados'
					: 'No se descontarán del stock los items agregados',
				onConfirm: async () => {
					await submitCreateBilling({
						values: {
							...values,
							shopSlug: params?.shopSlug as string,
							personId: existingCustomer?.personId || dataToHandle?.personId,
							customerId: existingCustomer?.customerId as string,
							clientRequestId: uniqueId
						}
					});
				}
			}
		});
	};

	return (
		<Form
			form={form}
			layout='vertical'
			initialValues={{
				items: [],
				status: isPreOrder ? BillingStatus.PARTIAL_PAYMENT : BillingStatus.PAID,
				subtotal: 0,
				total: 0,
				discountType: DiscountType.FIXED
			}}
			style={{ padding: '0 16px' }}
			onFinish={onFinish}
			scrollToFirstError={{ behavior: 'smooth', block: 'end', focus: true }}
		>
			{!noCustomer ? <CustomerInfoInputs /> : null}

			<Divider orientation='left'>Productos</Divider>
			<ProductFormList
				form={form}
				itemsError={itemsError}
				setItemsError={setItemsError}
				isQuote={false}
				isPreOrder={isPreOrder}
			/>

			<DrawerFormFooter
				form={form}
				isQuote={false}
				shopSlug={params?.shopSlug as string}
			>
				<CalculationInputs form={form} />
			</DrawerFormFooter>

			<div className='flex flex-col items-end'>
				<Form.Item name='comments' label='Comentarios' className='w-[50%]'>
					<TextArea rows={2} />
				</Form.Item>

				<Button
					type='primary'
					className='w-[90%] max-w-[250px]'
					style={{ fontWeight: 600 }}
					onClick={() => form.submit()}
				>
					GENERAR
				</Button>
			</div>
		</Form>
	);
};

export default BillingForm;
