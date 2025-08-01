import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button, Divider, Form } from 'antd';
import CustomerInfoInputs from '../../common/input-data/CustomerInfoInputs';
import ProductFormList from '../../common/input-data/ProductFormList';
import DrawerFormFooter from '../../common/input-data/DrawerFormFooter';
import CalculationInputs from '../../common/input-data/CalculationInputs';
import useForm from '@/hooks/useForm';
import { DiscountType, QuoteStatus } from '@/types/enums';
import { customerSchema, validateForm } from '@/utils/validators';
import { useDrawerStore } from '@/stores/drawerStore';
import { updateCalculations } from '../../utils';

const QuoteForm = () => {
	const {
		form,
		isLoading,
		itemsError,
		setItemsError,
		submitCreateQuote,
		submitUpdateQuote
	} = useForm();
	const {
		dataToHandle,
		customerInfo: existingCustomer,
		noCustomer
	} = useDrawerStore.getState();
	const params = useParams() ?? {};

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
				shipping: fieldsData.shipping ?? 0,
				discountType: fieldsData.discountType || DiscountType.FIXED
			};

			form.setFieldsValue(preparedFields);
			const discountByPercent =
				dataToHandle?.discountType === DiscountType.PERCENTAGE;
			updateCalculations(form, discountByPercent);
		} else {
			if (existingCustomer?.personId) {
				form.setFieldsValue({
					...existingCustomer,
					city: existingCustomer?.cityName
						? `${existingCustomer?.cityName}, ${existingCustomer?.regionName}, ${existingCustomer?.countryIsoCode}`
						: existingCustomer?.city
				});
			}
		}
	}, [existingCustomer]);

	const onSubmit = async (values: SubmitQuoteDto) => {
		const isValid = !noCustomer
			? await validateForm(values, customerSchema, form)
			: true;
		if (!isValid) return;

		const { subtotal, total, ...restValues } = values;

		if (!dataToHandle) {
			await submitCreateQuote({
				...restValues,
				shopSlug: params?.shopSlug as string,
				personId: (existingCustomer as ExistingCustomer)?.personId,
				customerId: existingCustomer?.customerId as string
			});
		} else {
			submitUpdateQuote(
				{
					...restValues,
					shopSlug: params?.shopSlug as string,
					personId: existingCustomer?.personId || dataToHandle?.personId,
					customerId: existingCustomer?.customerId || dataToHandle?.customerId
				},
				dataToHandle.id
			);
		}
	};

	return (
		<Form
			form={form}
			layout='vertical'
			initialValues={{
				items: [],
				status: QuoteStatus.PENDING,
				subtotal: 0,
				total: 0,
				discountType: DiscountType.FIXED
			}}
			style={{ padding: '0 16px' }}
			onFinish={values => onSubmit(values)}
			scrollToFirstError={{ behavior: 'smooth', block: 'end', focus: true }}
		>
			{!noCustomer ? (
				<>
					<Divider orientation='left' style={{ marginTop: 0 }}>
						Datos del Cliente
					</Divider>
					<CustomerInfoInputs />
				</>
			) : null}

			<Divider orientation='left'>Productos</Divider>
			<ProductFormList
				form={form}
				itemsError={itemsError}
				setItemsError={setItemsError}
				isQuote={true}
			/>

			<DrawerFormFooter isQuote={true}>
				<CalculationInputs
					form={form}
					discountType={dataToHandle?.discountType}
				/>
			</DrawerFormFooter>

			<div className='flex justify-end mt-4'>
				<Button
					type='primary'
					className='w-[90%] max-w-[250px]'
					style={{ fontWeight: 600 }}
					htmlType='submit'
					loading={isLoading}
				>
					{!dataToHandle ? 'CREAR' : 'EDITAR'}
				</Button>
			</div>
		</Form>
	);
};

export default QuoteForm;
