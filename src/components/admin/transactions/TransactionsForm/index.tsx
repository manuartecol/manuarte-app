import useForm from '@/hooks/useForm';
import { Button, Col, Divider, Form, Input, Row, Select } from 'antd';
import { HiChevronDoubleRight } from 'react-icons/hi';
import TransactionsProductFormList from '../../common/input-data/TransactionsProductFormList';
import DrawerLayout from '../../common/layout/DrawerLayout';
import { useSelector } from 'react-redux';
import { DrawerContent, ModalContent, TransactionState } from '@/types/enums';
import { useWatch } from 'antd/es/form/Form';
import { useEffect, useState } from 'react';
import { formatDate, formatToTitleCase } from '@/utils/formats';
import { transactionLibs } from '@/libs/api/transaction';
import { useSession } from 'next-auth/react';
import useTransactionSubmits from '@/hooks/useTransactionSubmits';
import { useDrawerStore } from '@/stores/drawerStore';
import { useModalStore } from '@/stores/modalStore';
import { v4 as uuidv4 } from 'uuid';

const TransactionsForm = () => {
	const { form, itemsError, setItemsError } = useForm();
	const { content, dataToHandle } = useDrawerStore.getState();
	const { openModal } = useModalStore.getState();
	const { shops } = useSelector((state: RootState) => state.shop);
	const [transfers, setTransfers] = useState<Transaction[]>([]);
	const [selectedTransfer, setSelectedTransfer] = useState<Transaction | null>(
		null
	);
	const [clientRequestId, setClientRequestId] = useState<string>('');
	const { data: session } = useSession();
	const isAdmin = session?.user?.roleName === 'admin';
	const shopName =
		session?.user?.shop && session?.user?.shop.toUpperCase().replace('-', ' ');
	const { TRANSACTION_SUBMITS } = useTransactionSubmits({
		shops,
		selectedTransfer
	});

	const fetchTransfers = async (toId: string) => {
		try {
			const data = await transactionLibs.getAll({
				toId,
				state: TransactionState.PROGRESS
			});
			if (data?.transactions) {
				setTransfers(data?.transactions);
			}
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		if (
			shops?.length > 0 &&
			content === DrawerContent.directEnter &&
			!isAdmin
		) {
			form.setFieldsValue({
				fromId: shops?.find(shop => shop.slug === session?.user?.shop)?.stockId
			});
		}

		if (shops?.length > 0 && content === DrawerContent.transfer) {
			form.setFieldsValue({
				fromId: shops?.find(shop => shop.mainStock)?.stockId
			});
		}

		if (dataToHandle) {
			form.setFieldsValue({
				fromId: dataToHandle?.fromId,
				toId: dataToHandle?.toId,
				description: dataToHandle?.description,
				items: dataToHandle?.items?.map((item: TransactionItem) => {
					return {
						id: item?.id,
						quantity: item?.quantity,
						productVariantId: item?.productVariantId,
						stockItemId: item?.stockItemId,
						stockItemQuantity: item?.stockItemQuantity,
						name: `${item?.productName} ${item?.productVariantName}`
					};
				})
			});
		}

		if (content === DrawerContent.enterByTransfer && !isAdmin) {
			const defaultToId = shops.find(
				shp => shp?.slug === session?.user?.shop
			)?.stockId;
			form.setFieldsValue({
				toId: defaultToId
			});

			if (defaultToId) {
				fetchTransfers(defaultToId);
			}
		}

		if (content === DrawerContent.exit && !isAdmin) {
			const defaultFromId = shops.find(
				shp => shp?.slug === session?.user?.shop
			)?.stockId;
			form.setFieldsValue({
				fromId: defaultFromId
			});
		}
	}, []);

	const handleStockToChange = async (toId: string) => {
		if (content === DrawerContent.enterByTransfer && toId) {
			fetchTransfers(toId);

			setSelectedTransfer(null);
			form.setFieldsValue({ transferId: undefined });
		}
	};

	const transferId = useWatch('transferId', form);
	useEffect(() => {
		if (content === DrawerContent.enterByTransfer && transferId) {
			const toId = form.getFieldValue('toId');
			const fetchItems = async () => {
				const items: TransactionItem[] =
					transferId && (await transactionLibs.getItems(transferId, toId));

				form.setFieldsValue({
					items: items?.map(item => {
						return {
							quantity: item?.quantity,
							productVariantId: item?.productVariantId,
							stockItemId: item?.stockItemId,
							name: `${item?.productName} ${item?.productVariantName}`
						};
					})
				});
			};

			fetchItems();
			const transfer = transfers?.find(transf => transf.id === transferId);
			if (transfer) {
				setSelectedTransfer(transfer);
			}
		}
	}, [transferId]);

	const stockOptions = shops?.map(shop => {
		return {
			value: shop?.stockId,
			label: formatToTitleCase(shop?.stockName)
		};
	});

	const fromId = useWatch('fromId', form);
	const filteredStockOptions = stockOptions?.filter(
		opt => opt.value !== fromId
	);

	const transferOptions =
		transfers?.length > 0
			? transfers?.map(transf => {
					return {
						value: transf?.id,
						label: formatToTitleCase(transf?.description)
					};
				})
			: [];

	const transactionSubmit = TRANSACTION_SUBMITS[content as string];

	const onFinish = async (values: SubmitTransactionDto) => {
		if (values?.items?.length < 1) {
			setItemsError(true);
			return;
		}

		let uniqueId: string = clientRequestId;
		if (!clientRequestId) {
			uniqueId = uuidv4();
			setClientRequestId(uniqueId);
		}

		if (transactionSubmit?.fn) {
			openModal({
				title: '',
				content: ModalContent.confirm,
				componentProps: {
					confirmTitle: transactionSubmit?.confirmTitle,
					confirmText: transactionSubmit?.confirmText,
					onConfirm: async () =>
						await transactionSubmit?.fn({
							...values,
							clientRequestId: uniqueId
						})
				}
			});
		}
	};

	return (
		<Form
			layout='vertical'
			form={form}
			initialValues={{
				items: []
			}}
			onFinish={onFinish}
			className='h-full'
		>
			<DrawerLayout
				footer={
					<div className='flex flex-col items-end'>
						<Button
							type='primary'
							className='w-[90%] max-w-[200px]'
							style={{ fontWeight: 600 }}
							onClick={() => form.submit()}
						>
							{transactionSubmit?.label ?? 'ENVIAR'}
						</Button>
					</div>
				}
			>
				<Row gutter={16} className='items-center'>
					{content === DrawerContent.directEnter ? (
						<Col span={12}>
							<div className='flex flex-col flex-1 gap-2 pb-6'>
								<span>Destino</span>
								<span className='h-[32px] px-3 py-1 bg-[#e5e5e5] rounded-md'>
									{isAdmin
										? 'Fabrica Cascajal'
										: shopName && formatToTitleCase(shopName)}
								</span>
							</div>
						</Col>
					) : null}

					{content === DrawerContent.transfer ? (
						<Col span={24}>
							<div className='flex justify-between gap-4 pb-6'>
								<Form.Item
									name='fromId'
									label='Origen'
									rules={[
										{
											required: true,
											message: 'El origen es requerido'
										}
									]}
									className='flex-1 custom-disabled-select'
								>
									<Select
										options={stockOptions}
										onChange={value => {
											if (value === form.getFieldValue('toId')) {
												form.setFieldsValue({ toId: undefined });
											}
										}}
										disabled={dataToHandle}
									/>
								</Form.Item>
								<HiChevronDoubleRight
									size={24}
									style={{ margin: '32px auto 0 auto' }}
								/>
								<Form.Item
									name='toId'
									label='Destino'
									rules={[
										{
											required: true,
											message: 'El destino es requerido'
										}
									]}
									className='flex-1 custom-disabled-select'
								>
									<Select
										placeholder='Seleccionar destino...'
										options={filteredStockOptions}
										disabled={dataToHandle}
									/>
								</Form.Item>
							</div>
						</Col>
					) : null}

					{content === DrawerContent.enterByTransfer ? (
						<>
							<Col span={12}>
								<Form.Item
									name='toId'
									label='Destino'
									rules={[
										{
											required: true,
											message: 'El destino es requerido'
										}
									]}
									className='custom-disabled-select'
								>
									<Select
										placeholder='Seleccionar destino...'
										options={stockOptions}
										onChange={value => handleStockToChange(value)}
										disabled={!isAdmin}
									/>
								</Form.Item>
							</Col>
							<Col span={24}>
								<Form.Item
									name='transferId'
									label='Lista de transferencias'
									rules={[
										{
											required: true,
											message: 'La transferencia es requerida'
										}
									]}
								>
									<Select
										placeholder='Seleccionar transferencia...'
										options={transferOptions}
									/>
								</Form.Item>
							</Col>
							{selectedTransfer?.id ? (
								<Col span={24}>
									<div className='flex justify-between gap-4 mb-4'>
										<div className='flex flex-col flex-1 gap-2'>
											<span>Origen</span>
											<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
												{selectedTransfer?.fromName}
											</span>
										</div>
										<div className='flex flex-col flex-1 gap-2'>
											<span>Fecha</span>
											<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
												{formatDate(selectedTransfer?.createdDate) ?? '--'}
											</span>
										</div>
									</div>
								</Col>
							) : null}
						</>
					) : null}

					{content === DrawerContent.exit ? (
						<Col xs={24} sm={12}>
							<Form.Item
								name='fromId'
								label='Stock'
								rules={[
									{
										required: true,
										message: 'El stock es requerido'
									}
								]}
								className='flex-1 custom-disabled-select'
							>
								<Select
									placeholder='Seleccionar stock...'
									options={stockOptions}
									disabled={!isAdmin}
								/>
							</Form.Item>
						</Col>
					) : null}

					<>
						{content !== DrawerContent.enterByTransfer ? (
							<Col span={24}>
								<Form.Item
									name='description'
									label='Descripción'
									rules={[
										{
											required: content !== DrawerContent.directEnter,
											message: 'La descripción es requerida'
										}
									]}
								>
									<Input.TextArea placeholder='Ingresa una descripción' />
								</Form.Item>
							</Col>
						) : null}

						{selectedTransfer?.id ? (
							<Divider orientation='left'>Productos</Divider>
						) : null}

						<Col span={24}>
							{content === DrawerContent.directEnter ||
							fromId ||
							selectedTransfer?.id ||
							dataToHandle ? (
								<TransactionsProductFormList
									form={form}
									itemsError={itemsError}
									setItemsError={setItemsError}
									shops={shops}
								/>
							) : null}
						</Col>
					</>
				</Row>
			</DrawerLayout>
		</Form>
	);
};

export default TransactionsForm;
