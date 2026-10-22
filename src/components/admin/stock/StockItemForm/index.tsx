import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
	Form,
	Input,
	InputNumber,
	notification,
	Select,
	SelectProps,
	Spin
} from 'antd';
import { MehOutlined } from '@ant-design/icons';
import { useSelector } from 'react-redux';
import FormButtons from '../../common/ui/FormButtons';
import SelectStocks from '../../products/SelectStocks';
import useForm from '@/hooks/useForm';
import { useModalStore } from '@/stores/modalStore';
import { getProductsData } from '../../utils';
import useDebouncedSearch from '@/hooks/useDebouncedSearch';
import { formatInputCurrency } from '@/utils/formats';
import { stockItemLibs } from '@/libs/api/stock-item';

const MIN_SEARCH_LENGTH = 3;

const StockItemForm = () => {
	const { form, isLoading, submitCreateStockItem, submitUpdateStockItem } =
		useForm();
	const { schedule, cancel } = useDebouncedSearch();
	const { dataToHandle } = useModalStore.getState();
	const { shops } = useSelector((state: RootState) => state.shop);
	const [productsOptions, setProductsOptions] = useState<
		SelectProps['options']
	>([]);
	const [search, setSearch] = useState<string>('');
	const [isSearching, setIsSearching] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [isQuitoSelected, setIsQuitoSelected] = useState(true);
	const [isUsdSet, setIsUsdSet] = useState(false);
	const [stocks, setStocks] = useState<string[]>([]);
	const params = useParams() ?? {};
	const searchParams = useSearchParams();
	const isUsd = params?.shopSlug.includes('quito');
	const isMainStock = searchParams.get('main') === 'true';
	const isInQuito = stocks.includes(
		shops.find(sh => sh.currency === 'USD')?.stockId as string
	);

	const getStockIds = async () => {
		if (isMainStock && dataToHandle) {
			const { productVariantId, stockId } = dataToHandle ?? {};

			if (!productVariantId || !stockId) return;

			const data = await stockItemLibs.getOneByStock(productVariantId, stockId);

			if (data) {
				setStocks(data?.stocks || []);
			}
		}
	};

	const getStockItemInfo = async () => {
		if (shops?.length > 0 && isMainStock && dataToHandle && isQuitoSelected) {
			const { productVariantId } = dataToHandle ?? {};

			// Obtener info del stockId de USD
			const stockId = shops.find(sh => sh.currency === 'USD')?.stockId;
			if (!productVariantId || !stockId) return;

			const data = await stockItemLibs.getOneByStock(productVariantId, stockId);

			if (data && data?.currency === 'USD') {
				form.setFieldsValue({
					pvpUsd: data?.pricePvp,
					disUsd: data?.priceDis,
					costUsd: data?.cost
				});

				setIsUsdSet(true);
			}
		}
	};

	useEffect(() => {
		if (dataToHandle) {
			getStockIds();

			form.setFieldsValue({
				product: `${dataToHandle?.productName} - ${dataToHandle?.productVariantName}`,
				minQty: dataToHandle?.minQty,
				maxQty: dataToHandle?.maxQty
			});

			if (dataToHandle?.currency === 'USD') {
				form.setFieldsValue({
					pvpUsd: dataToHandle?.pricePvp,
					disUsd: dataToHandle?.priceDis,
					costUsd: dataToHandle?.cost
				});
			} else {
				form.setFieldsValue({
					pvpCop: dataToHandle?.pricePvp,
					disCop: dataToHandle?.priceDis,
					costCop: dataToHandle?.cost
				});
			}
		}
	}, []);

	useEffect(() => {
		if (isQuitoSelected && !isUsdSet) {
			getStockItemInfo();
		}
	}, [isQuitoSelected]);

	const shopInfo = shops?.find(sh => sh.slug === params?.shopSlug);

	const onSubmit = async (values: SubmitStockItemDto) => {
		if (!dataToHandle) {
			await submitCreateStockItem({
				...values,
				stockId: shopInfo?.stockId as string,
				currency: shopInfo?.currency as string
			});
		} else {
			if ('product' in values) delete values.product;
			await submitUpdateStockItem(
				{
					...values,
					productVariantId: dataToHandle.productVariantId,
					currency: dataToHandle.currency
				},
				dataToHandle.id
			);
		}
	};

	const handleSearch = (newValue: string) => {
		if (!newValue || newValue.length < MIN_SEARCH_LENGTH) {
			cancel();
			setProductsOptions([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		setHasSearched(true);

		schedule(async isCurrent => {
			if (!shopInfo?.stockId) {
				notification.error({
					message: 'No se cargó correctamente el ID del stock',
					key: 'stock_id_error'
				});
				setIsSearching(false);
				return;
			}

			const res = await getProductsData({
				search: newValue,
				stockId: shopInfo.stockId,
				missingProducts: true
			});

			// Mientras esta petición estaba en vuelo llegó otra búsqueda, así que
			// este resultado ya no corresponde a lo que el usuario tiene escrito
			if (!isCurrent()) return;

			if (res?.formattedData) {
				setProductsOptions(res.formattedData);
			}

			setIsSearching(false);
		});
	};

	const handleChange = (newValue: string) => {
		setSearch(newValue);
	};

	const searchingOrNoContent = isSearching ? (
		<div className='flex justify-center text-center'>
			<Spin style={{ padding: '14px 0' }} />
		</div>
	) : (
		hasSearched && (
			<div className='text-center'>
				<MehOutlined style={{ fontSize: 24 }} />
				<p>Sin resultados</p>
			</div>
		)
	);

	const showUsd = dataToHandle && isMainStock && isQuitoSelected && isInQuito;

	return (
		<Form layout='vertical' form={form} onFinish={values => onSubmit(values)}>
			{!dataToHandle ? (
				<Form.Item
					name='productVariantId'
					label='Buscar producto'
					rules={[
						{
							required: true,
							message: 'El producto es requerido'
						}
					]}
				>
					<Select
						allowClear
						showSearch
						value={search}
						placeholder='Nombre o código del producto'
						defaultActiveFirstOption={false}
						suffixIcon={null}
						filterOption={false}
						onSearch={handleSearch}
						onChange={handleChange}
						notFoundContent={searchingOrNoContent}
						options={(productsOptions || []).map(d => ({
							value: d.value,
							label: d.label
						}))}
					/>
				</Form.Item>
			) : (
				<Form.Item name='product' label='Producto'>
					<Input
						readOnly
						style={{
							backgroundColor: '#e5e5e5'
						}}
					/>
				</Form.Item>
			)}

			{search || dataToHandle ? (
				<>
					<div className='flex gap-4'>
						{/* Precios PVP */}
						<div className='flex-1 flex flex-wrap gap-x-4 border-b-2 border-gray-200 mb-4'>
							<span className='font-semibold'>Precio de venta al público</span>
							<Form.Item
								name={isUsd ? 'pvpUsd' : 'pvpCop'}
								label={`PVP ${isUsd ? 'USD' : 'COP'}`}
								rules={[
									{
										required: true,
										message: 'Campo requerido'
									}
								]}
								style={{ width: '47%' }}
							>
								<InputNumber
									min={0}
									controls={false}
									className='textRight'
									style={{ width: '100%' }}
									formatter={value => formatInputCurrency(value)}
								/>
							</Form.Item>

							{showUsd && (
								<Form.Item
									name='pvpUsd'
									label='PVP USD'
									rules={[
										{
											required: true,
											message: 'Campo requerido'
										}
									]}
									style={{
										width: '47%'
									}}
								>
									<InputNumber
										min={0}
										controls={false}
										className='textRight'
										style={{ width: '100%' }}
										formatter={value => formatInputCurrency(value)}
									/>
								</Form.Item>
							)}
						</div>

						{/* Precios DIS */}
						<div className='flex-1 flex flex-wrap gap-x-4 border-b-2 border-gray-200 mb-4'>
							<span className='font-semibold'>Precio para distribuidores</span>
							<Form.Item
								name={isUsd ? 'disUsd' : 'disCop'}
								label={`DIS ${isUsd ? 'USD' : 'COP'}`}
								style={{ width: '47%' }}
							>
								<InputNumber
									min={0}
									controls={false}
									className='textRight'
									style={{ width: '100%' }}
									formatter={value => formatInputCurrency(value)}
								/>
							</Form.Item>

							{showUsd && (
								<Form.Item
									name='disUsd'
									label='DIS USD'
									style={{ width: '47%' }}
								>
									<InputNumber
										min={0}
										controls={false}
										className='textRight'
										style={{ width: '100%' }}
										formatter={value => formatInputCurrency(value)}
									/>
								</Form.Item>
							)}
						</div>
					</div>

					<div className='flex gap-4'>
						{/* Costos */}
						<div className='flex-1 flex gap-x-4'>
							<Form.Item
								name={isUsd ? 'costUsd' : 'costCop'}
								label={`Costo ${isUsd ? 'USD' : 'COP'}`}
								rules={[
									{
										required: true,
										message: 'Campo requerido'
									}
								]}
								style={{
									width: '47%'
								}}
							>
								<InputNumber
									min={0}
									controls={false}
									className='textRight'
									style={{ width: '100%' }}
									formatter={value => formatInputCurrency(value)}
								/>
							</Form.Item>

							{showUsd ? (
								<Form.Item
									name='costUsd'
									label='Costo USD'
									rules={[
										{
											required: true,
											message: 'Campo requerido'
										}
									]}
									style={{ width: '47%' }}
								>
									<InputNumber
										min={0}
										controls={false}
										className='textRight'
										style={{ width: '100%' }}
										formatter={value => formatInputCurrency(value)}
									/>
								</Form.Item>
							) : null}
						</div>

						{/* Cantidades */}
						<div className='flex-1 flex gap-4'>
							<Form.Item
								name='minQty'
								label='Cantidad Mín.'
								rules={[
									{
										required: true,
										message: 'Campo requerido'
									}
								]}
								style={{
									width: '47%'
								}}
							>
								<InputNumber
									min={0}
									controls={false}
									className='textRight'
									style={{ width: '100%' }}
								/>
							</Form.Item>

							<Form.Item
								name='maxQty'
								label='Cantidad Máx.'
								rules={[
									{
										required: true,
										message: 'Campo requerido'
									}
								]}
								style={{
									width: '47%'
								}}
							>
								<InputNumber
									min={0}
									controls={false}
									className='textRight'
									style={{ width: '100%' }}
								/>
							</Form.Item>
						</div>
					</div>
				</>
			) : null}

			{dataToHandle && isMainStock && stocks?.length > 1 && (
				<Form.Item>
					<SelectStocks
						form={form}
						setIsQuitoSelected={setIsQuitoSelected}
						label='Aplicar cambios en:'
						updatingStockItem={true}
						stocks={stocks}
					/>
				</Form.Item>
			)}

			<FormButtons
				label={dataToHandle ? 'Editar' : undefined}
				isLoading={isLoading}
			/>
		</Form>
	);
};

export default StockItemForm;
