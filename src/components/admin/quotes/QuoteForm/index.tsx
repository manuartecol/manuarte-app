import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button, Divider, Form } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import CustomerInfoInputs from '../../common/input-data/CustomerInfoInputs';
import ProductFormList from '../../common/input-data/ProductFormList';
import DrawerFormFooter from '../../common/input-data/DrawerFormFooter';
import DrawerLayout from '../../common/layout/DrawerLayout';
import CalculationInputs from '../../common/input-data/CalculationInputs';
import useForm from '@/hooks/useForm';
import { DiscountType, QuoteStatus } from '@/types/enums';
import { customerSchema, validateForm } from '@/utils/validators';
import { useDrawerStore } from '@/stores/drawerStore';
import { updateCalculations } from '../../utils';
import { useSelector } from 'react-redux';

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
		customerInfo: searchedCustomer,
		noCustomer,
		updateDrawer
	} = useDrawerStore.getState();
	const [isCleanCustomer, setIsCleanCustomer] = useState(false);
	const [priceType, setPriceType] = useState<'PVP' | 'DIS'>('PVP');
	const searchParams = useSearchParams();
	const shopId = searchParams.get('shopId');
	const { shops } = useSelector((state: RootState) => state.shop);
	const shop = shops.find(sh => sh.id === shopId);

	useEffect(() => {
		if (dataToHandle) {
			let fieldsData = dataToHandle;

			if (searchedCustomer?.personId) {
				fieldsData = { ...dataToHandle, ...searchedCustomer };
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

			// Setear el priceType desde dataToHandle
			if (dataToHandle?.priceTypeCode) {
				setPriceType(dataToHandle.priceTypeCode);
			}
		} else {
			if (searchedCustomer?.personId) {
				form.setFieldsValue({
					...searchedCustomer,
					city: searchedCustomer?.cityName
						? `${searchedCustomer?.cityName}, ${searchedCustomer?.regionName}, ${searchedCustomer?.countryIsoCode}`
						: searchedCustomer?.city
				});
			}
		}
	}, [searchedCustomer]);

	const onSubmit = async (values: SubmitQuoteDto) => {
		const isValid = !noCustomer
			? await validateForm(values, customerSchema, form)
			: true;
		if (!isValid) return;

		const { subtotal, total, ...restValues } = values;

		if (!shopId) return;

		if (!dataToHandle) {
			await submitCreateQuote({
				...restValues,
				priceType,
				shopId,
				currency: shop?.currency as 'COP' | 'USD',
				personId: (searchedCustomer as ExistingCustomer)?.personId ?? null,
				customerId: (searchedCustomer?.customerId as string) ?? null
			});
		} else {
			submitUpdateQuote(
				{
					...restValues,
					priceType,
					stockId: shop?.stockId,
					personId:
						noCustomer || isCleanCustomer
							? null
							: searchedCustomer?.personId || dataToHandle?.personId,
					customerId:
						noCustomer || isCleanCustomer
							? null
							: searchedCustomer?.customerId || dataToHandle?.customerId
				},
				dataToHandle.id
			);
		}

		setIsCleanCustomer(false);
	};

	const cleanCustomer = () => {
		form.setFieldsValue({
			dni: '',
			fullName: '',
			email: '',
			phoneNumber: '',
			location: '',
			cityId: ''
		});

		updateDrawer({ customerInfo: null });
		setIsCleanCustomer(true);
	};

	// Resetear isCleanCustomer si se selecciona un cliente existente después de limpiar
	useEffect(() => {
		if (
			isCleanCustomer &&
			searchedCustomer?.personId &&
			searchedCustomer?.customerId
		) {
			setIsCleanCustomer(false);
		}
	}, [searchedCustomer]);

	const showCleanCustomerBtn =
		(dataToHandle?.dni || searchedCustomer) && !isCleanCustomer;

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
			className='h-full'
			onFinish={values => onSubmit(values)}
			scrollToFirstError={{ behavior: 'smooth', block: 'end', focus: true }}
		>
			<DrawerLayout
				footer={
					<div className='flex justify-end'>
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
				}
			>
				{!noCustomer ? (
					<>
						<Divider orientation='left' style={{ marginTop: 0 }}>
							Datos del Cliente
						</Divider>

						{showCleanCustomerBtn && (
							<div className='flex gap-1 items-center justify-end mb-3'>
								<label htmlFor='cleanCustBtn'>Limpiar cliente</label>
								<Button
									id='cleanCustBtn'
									type='text'
									danger
									icon={<CloseOutlined style={{ fontSize: 20 }} />}
									onClick={cleanCustomer}
								/>
							</div>
						)}

						<CustomerInfoInputs />
					</>
				) : null}

				<Divider orientation='left'>Productos</Divider>
				<ProductFormList
					form={form}
					itemsError={itemsError}
					setItemsError={setItemsError}
					isQuote={true}
					priceType={priceType}
					setPriceType={setPriceType}
				/>

				<DrawerFormFooter isQuote={true}>
					<CalculationInputs
						form={form}
						discountType={dataToHandle?.discountType}
					/>
				</DrawerFormFooter>
			</DrawerLayout>
		</Form>
	);
};

export default QuoteForm;
