import { useEffect, useState } from 'react';
import { Form, Input, Select, Switch } from 'antd';
import { useSelector } from 'react-redux';
import ProductVariantFormList from '../ProductVariantFormList';
import FormButtons from '../../common/ui/FormButtons';
import useForm from '@/hooks/useForm';
import SelectStocks from '../SelectStocks';
import { selectFilterOption } from '../../utils';
import { useModalStore } from '@/stores/modalStore';
import { useSearchParams } from 'next/navigation';
import { useWatch } from 'antd/es/form/Form';
import useProductServices from '@/services/product';

const ProductForm = () => {
	const {
		form,
		isLoading,
		submitCreateProduct,
		submitUpdateProduct,
		submitUpdateProductVariant
	} = useForm();
	const { productCategories } = useSelector(
		(state: RootState) => state.productCategory
	);
	const { shops } = useSelector((state: RootState) => state.shop);
	const { dataToHandle } = useModalStore.getState();
	const isUpdating = Boolean(dataToHandle);
	const [editGeneralProduct, setEditGeneralProduct] = useState(false);
	const [active, setActive] = useState(dataToHandle?.active ?? false);
	const [isQuitoSelected, setIsQuitoSelected] = useState(true);
	const searchParams = useSearchParams();
	const { getProductVariants } = useProductServices();
	const stockIdsValues = useWatch('stockIds', form);

	/**
	 * Tras editar se recarga la página actual de la tabla con sus filtros. Ajustar
	 * la lista a mano obligaba a replicar cada filtro en el cliente: una fila que
	 * dejaba de cumplir el de categoría, nombre o estado se quedaba, y el total
	 * de la paginación no cambiaba
	 */
	const reloadTable = () =>
		getProductVariants(Object.fromEntries(searchParams.entries()));

	useEffect(() => {
		if (dataToHandle) {
			const preparedFields = {
				name: dataToHandle.productName,
				description: dataToHandle.productDescription,
				productCategoryId: dataToHandle.productCategoryId,
				productVariants: [dataToHandle.name],
				productVariantName: dataToHandle.name,
				stockIds: dataToHandle.stockIds || []
			};
			form.setFieldsValue(preparedFields);
		}
	}, []);

	const onSubmit = (values: SubmitProductDto) => {
		if (!isUpdating) {
			const { stockIds, ...restValues } = values;

			const cleanedValues = isQuitoSelected
				? restValues
				: {
						...restValues,
						productVariants:
							restValues?.productVariants &&
							restValues?.productVariants.map(
								({ priceUsd, costUsd, ...rest }) => rest
							)
					};

			const stocks = shops
				.filter(shop => stockIds?.includes(shop.stockId))
				.map(filtShop => {
					return { id: filtShop.stockId, currency: filtShop.currency };
				});

			submitCreateProduct({ ...cleanedValues, stocks }, stockIds);
		} else {
			const { productVariantName, productCategoryId, stockIds, ...rest } =
				values ?? {};
			const valuesToUpdate = {
				...rest,
				// La categoría solo viaja al editar la información general
				...(editGeneralProduct && {
					productCategoryId,
					productCategoryName: productCategories?.find(
						pCat => pCat.id === productCategoryId
					)?.name
				}),
				productVariant: {
					id: dataToHandle.id,
					name: productVariantName,
					active
				},
				stockIds: stockIds || []
			};
			if (editGeneralProduct) {
				submitUpdateProduct(
					valuesToUpdate,
					dataToHandle.productId,
					reloadTable
				);
			} else {
				submitUpdateProductVariant(
					{ ...valuesToUpdate, stockIds: stockIds || [] },
					dataToHandle.id,
					reloadTable
				);
			}
		}
	};

	const inputDisabled = isUpdating && !editGeneralProduct;

	const pCategoryOptions = productCategories?.map(pCat => {
		return {
			value: pCat.id,
			label: pCat.name
		};
	});

	return (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			initialValues={{ modifier: 'public' }}
			clearOnDestroy
			onFinish={values => onSubmit(values)}
		>
			{isUpdating ? (
				<div className='flex gap-2 my-6 px-2 text-gray-500'>
					<Switch
						defaultChecked={false}
						onChange={checked => setEditGeneralProduct(checked)}
						id='switch'
					/>
					<label htmlFor='switch'>
						Editar información general del producto
					</label>
				</div>
			) : null}

			<Form.Item
				name='name'
				label='Nombre'
				rules={[
					{
						required: !inputDisabled,
						message: 'El nombre del producto es requerido'
					}
				]}
			>
				<Input
					placeholder='Ingresa el nombre del producto'
					disabled={inputDisabled}
				/>
			</Form.Item>
			<Form.Item name='description' label='Descripción'>
				<Input.TextArea
					placeholder='Ingresa una descripción para el producto'
					disabled={inputDisabled}
				/>
			</Form.Item>
			<Form.Item
				name='productCategoryId'
				label='Categoría'
				rules={[
					{
						required: !inputDisabled,
						message: 'La categoría del producto es requerida'
					}
				]}
			>
				<Select
					placeholder='Selecciona una categoría'
					allowClear={!isUpdating}
					showSearch
					filterOption={selectFilterOption}
					options={pCategoryOptions}
					disabled={inputDisabled}
				/>
			</Form.Item>

			{isUpdating ? null : (
				<SelectStocks form={form} setIsQuitoSelected={setIsQuitoSelected} />
			)}

			{isUpdating ? (
				<>
					<div className='flex items-center gap-4'>
						<Form.Item
							name='productVariantName'
							label='Presentación'
							rules={[
								{
									required: true,
									message: 'El nombre de la presentación es requerido'
								}
							]}
							className='flex-1'
						>
							<Input placeholder='Ingresa el nombre de la presentación' />
						</Form.Item>

						<div className='flex-1 flex items-center gap-2 my-6 px-2'>
							<Switch
								defaultChecked={false}
								onChange={checked => setActive(checked)}
								id='active'
								style={active ? { backgroundColor: '#10b981' } : {}}
								checked={active}
							/>
							<label htmlFor='active'>{active ? 'Activo' : 'Inactivo'}</label>
						</div>
					</div>

					<SelectStocks
						form={form}
						setIsQuitoSelected={setIsQuitoSelected}
						label='Activo en los siguientes stocks:'
						canRemoveMainStock={true}
						stocks={dataToHandle?.stockIds}
						helpText={
							stockIdsValues?.length === 0
								? 'El producto no se mostrará en ningún stock'
								: undefined
						}
					/>
				</>
			) : (
				<Form.Item
					name='productVariants'
					rules={[
						{
							validator: async (_, value) => {
								if (!value || value.length === 0) {
									return Promise.reject(
										new Error('Debe haber al menos 1 presentación')
									);
								}
							}
						}
					]}
				>
					<ProductVariantFormList
						isUpdating={isUpdating}
						isQuitoSelected={isQuitoSelected}
					/>
				</Form.Item>
			)}

			<FormButtons
				label={isUpdating ? 'Editar' : undefined}
				isLoading={isLoading}
			/>
		</Form>
	);
};

export default ProductForm;
