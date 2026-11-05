import { useEffect, useState } from 'react';
import { Divider, Form, InputNumber, Select } from 'antd';
import { useWatch } from 'antd/es/form/Form';
import { useSelector } from 'react-redux';
import FormButtons from '../../common/ui/FormButtons';
import SelectStocks from '../SelectStocks';
import VariantAxesFields from '../VariantAxesFields';
import { previewFromAxes } from '../VariantAxesFields/composeVariantName';
import useProductServices from '@/services/product';
import useForm from '@/hooks/useForm';
import { formatInputCurrency } from '@/utils/formats';
import { productsParamsFromSearch, selectFilterOption } from '../../utils';
import { CAPACITY_CATEGORY_GROUP, PRODUCT_VARIANT_PROPS } from '../../consts';
import { useModalStore } from '@/stores/modalStore';
import { useSearchParams } from 'next/navigation';

const ProductVariantForm = () => {
	const { form, isLoading, submitAddProductVariant } = useForm();
	const { products, variantCatalog } = useSelector(
		(state: RootState) => state.product
	);
	const { shops } = useSelector((state: RootState) => state.shop);
	const [isQuitoSelected, setIsQuitoSelected] = useState(true);
	const {
		getProducts,
		getProductVariants,
		getProductsWithVariants,
		getVariantCatalog
	} = useProductServices();
	const { productCategories } = useSelector(
		(state: RootState) => state.productCategory
	);
	const { dataToHandle } = useModalStore.getState();
	const searchParams = useSearchParams();
	const [catalogFailed, setCatalogFailed] = useState(false);

	/**
	 * Ruta estática: en este formulario `axes` cuelga de la raíz. Con `preserve`
	 * porque `useWatch` solo devuelve los campos montados, y envase y atributos
	 * deciden su visibilidad a partir de esta misma observación
	 */
	const axes = useWatch('axes', { form, preserve: true }) as
		| VariantAxesDto
		| undefined;
	const namePreview = previewFromAxes(axes, variantCatalog);
	const selectedProductId = useWatch('productId', form) as string | undefined;

	/**
	 * Solo cambia la etiqueta del campo de medida, y sale del producto elegido en
	 * vez de cómo se abrió el modal: antes la categoría solo llegaba abriendo
	 * desde la fila de un producto, así que el mismo producto de envases decía
	 * "Cantidad" o "Capacidad" según el camino. El flag que entra en la firma lo
	 * deduce el backend, así que la etiqueta no decide nada
	 */
	const productCategoryId =
		products?.find(p => p.id === selectedProductId)?.productCategoryId ??
		(dataToHandle?.productCategoryId as string | undefined);
	const isCapacityCategory =
		productCategories?.find(pCat => pCat.id === productCategoryId)
			?.groupName === CAPACITY_CATEGORY_GROUP;
	// Abierto desde la fila de un producto: ese producto ya está decidido
	const fixedProduct = dataToHandle?.productId
		? { id: dataToHandle.productId as string, name: dataToHandle.productName }
		: null;

	useEffect(() => {
		getVariantCatalog().then(loaded => setCatalogFailed(!loaded));

		if (fixedProduct) {
			form.setFieldsValue({ productId: fixedProduct.id });
			return;
		}

		if (products.length > 0) return;

		getProducts();
	}, []);

	// La presentación nueva entra en las dos pestañas
	const reloadTables = async () => {
		await Promise.all([
			getProductVariants(Object.fromEntries(searchParams.entries())),
			getProductsWithVariants(productsParamsFromSearch(searchParams))
		]);
	};

	const onSubmit = (values: SubmitProductVariantDto) => {
		const { productId, priceUsd, costUsd, stockIds, ...restValues } = values;

		const cleanedValues = isQuitoSelected
			? { ...restValues, priceUsd, costUsd }
			: restValues;

		const stocks = shops
			.filter(shop => stockIds?.includes(shop.stockId))
			.map(filtShop => {
				return { id: filtShop.stockId, currency: filtShop.currency };
			});

		submitAddProductVariant(
			{ ...cleanedValues, stocks },
			productId,
			stockIds,
			reloadTables
		);
	};

	const productOptions = fixedProduct
		? [{ value: fixedProduct.id, label: fixedProduct.name }]
		: products?.map(p => {
				return {
					value: p.id,
					label: p.name
				};
			});

	const getFilteredInputs = () => {
		if (isQuitoSelected) {
			return PRODUCT_VARIANT_PROPS;
		}
		// Si no es Quito, filtrar campos USD
		return PRODUCT_VARIANT_PROPS.filter(
			input => !input.name.toLowerCase().includes('usd')
		);
	};

	const filteredInputs = getFilteredInputs();

	// Agrupar inputs por tipo
	const basicInputs = filteredInputs.filter(input =>
		input.name.includes('Qty')
	);
	const pvpInputs = filteredInputs.filter(input => input.priceType === 'pvp');
	const disInputs = filteredInputs.filter(input => input.priceType === 'dis');
	const costInputs = filteredInputs.filter(input =>
		input.name.includes('cost')
	);

	return (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			initialValues={{ modifier: 'public' }}
			clearOnDestroy
			onFinish={values => onSubmit(values)}
		>
			<Form.Item
				name='productId'
				label='Producto'
				rules={[
					{
						required: true,
						message: 'El producto es requerido'
					}
				]}
			>
				<Select
					placeholder='Selecciona un producto'
					allowClear={!fixedProduct}
					showSearch
					filterOption={selectFilterOption}
					options={productOptions}
					disabled={Boolean(fixedProduct)}
				/>
			</Form.Item>

			<SelectStocks
				form={form}
				setIsQuitoSelected={setIsQuitoSelected}
				label='Crear en las siguientes bodegas:'
			/>

			<Divider orientation='left' style={{ borderColor: '#00000032' }}>
				<div className='flex items-center gap-3'>
					<span>Presentación</span>
					{namePreview ? (
						<span className='font-semibold text-blue-500'>{namePreview}</span>
					) : null}
				</div>
			</Divider>
			<div className='flex flex-col'>
				<VariantAxesFields
					form={form}
					axes={axes}
					isCapacity={isCapacityCategory}
					catalogFailed={catalogFailed}
				/>

				{/* Límites de stock */}
				<div className='flex flex-wrap items-center gap-x-4 border-t border-gray-100 pt-4'>
					{basicInputs.map((input, index) => (
						<Form.Item
							key={`${input.name}-${index}`}
							name={input.name}
							label={input.label}
							validateTrigger={['onChange', 'onBlur']}
							rules={[
								{
									required: true,
									message: 'Requerido'
								}
							]}
							style={{ width: input.width }}
						>
							<InputNumber
								min={0}
								controls={false}
								placeholder={input.placeholder}
								className='textRight'
								style={{ width: '100%' }}
							/>
						</Form.Item>
					))}
				</div>

				<div className='flex gap-4 border-t border-gray-100 pt-4'>
					{/* Precios PVP */}
					{pvpInputs.length > 0 && (
						<div className='flex flex-wrap items-center gap-x-4'>
							<span className='font-semibold'>Precio de venta al público</span>
							{pvpInputs.map((input, index) => (
								<Form.Item
									key={`${input.name}-${index}`}
									name={input.name}
									label={input.label}
									validateTrigger={['onChange', 'onBlur']}
									rules={[
										{
											required: true,
											message: 'Requerido'
										}
									]}
									style={{ width: input.width }}
								>
									<InputNumber
										min={0}
										controls={false}
										placeholder={input.placeholder}
										formatter={value => formatInputCurrency(value)}
										className='textRight'
										style={{ width: '100%' }}
									/>
								</Form.Item>
							))}
						</div>
					)}

					{/* Precios DIS */}
					{disInputs.length > 0 && (
						<div className='flex flex-wrap items-center gap-x-4'>
							<span className='font-semibold'>Precio para distribuidores</span>
							{disInputs.map((input, index) => (
								<Form.Item
									key={`${input.name}-${index}`}
									name={input.name}
									label={input.label}
									validateTrigger={['onChange', 'onBlur']}
									style={{ width: input.width }}
								>
									<InputNumber
										min={0}
										controls={false}
										placeholder={input.placeholder}
										formatter={value => formatInputCurrency(value)}
										className='textRight'
										style={{ width: '100%' }}
									/>
								</Form.Item>
							))}
						</div>
					)}
				</div>

				{/* Costos */}
				{costInputs.length > 0 && (
					<div className='flex flex-wrap items-center gap-x-4 border-t border-gray-100 pt-4'>
						{costInputs.map((input, index) => (
							<Form.Item
								key={`${input.name}-${index}`}
								name={input.name}
								label={input.label}
								validateTrigger={['onChange', 'onBlur']}
								rules={[
									{
										required: true,
										message: 'Requerido'
									}
								]}
								style={{ width: input.width }}
							>
								<InputNumber
									min={0}
									controls={false}
									placeholder={input.placeholder}
									formatter={value => formatInputCurrency(value)}
									className='textRight'
									style={{ width: '100%' }}
								/>
							</Form.Item>
						))}
					</div>
				)}
			</div>

			{/* Fijos abajo: el formulario entero no cabe en el modal */}
			<FormButtons isLoading={isLoading} sticky />
		</Form>
	);
};

export default ProductVariantForm;
