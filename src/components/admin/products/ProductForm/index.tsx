import { useEffect, useState } from 'react';
import { Form, Input, Select } from 'antd';
import { useSelector } from 'react-redux';
import ProductVariantFormList from '../ProductVariantFormList';
import FormButtons from '../../common/ui/FormButtons';
import useForm from '@/hooks/useForm';
import SelectStocks from '../SelectStocks';
import { productsParamsFromSearch, selectFilterOption } from '../../utils';
import { useModalStore } from '@/stores/modalStore';
import { useRouter, useSearchParams } from 'next/navigation';
import useProductServices from '@/services/product';

/**
 * Crear un producto con sus presentaciones, o editar los datos del producto:
 * nombre, descripción y categoría. Las presentaciones tienen su propio
 * formulario desde que el modal está separado, así que aquí ya no hay switch de
 * "editar información general" ni campos de presentación
 */
const ProductForm = () => {
	const { form, isLoading, submitCreateProduct, submitUpdateProduct } =
		useForm();
	const { productCategories } = useSelector(
		(state: RootState) => state.productCategory
	);
	const { shops } = useSelector((state: RootState) => state.shop);
	const { dataToHandle } = useModalStore.getState();
	const isUpdating = Boolean(dataToHandle);
	const [isQuitoSelected, setIsQuitoSelected] = useState(true);
	const searchParams = useSearchParams();
	const router = useRouter();
	const { getProductVariants, getProductsWithVariants } = useProductServices();

	/**
	 * Tras editar se recargan las dos tablas con sus filtros. Ajustar la lista a
	 * mano obligaba a replicar cada filtro en el cliente: una fila que dejaba de
	 * cumplir el de categoría o nombre se quedaba, y el total de la paginación no
	 * cambiaba
	 */
	const reloadTables = async () => {
		await Promise.all([
			getProductVariants(Object.fromEntries(searchParams.entries())),
			getProductsWithVariants(productsParamsFromSearch(searchParams))
		]);
	};

	/**
	 * Tras crear, la tabla se queda filtrada por el producto nuevo. Ordena por
	 * nombre y pagina de 30, así que una fila recién creada puede caer a veinte
	 * páginas de distancia y parecer que no se guardó. Se limpian los otros
	 * filtros de producto porque el nuevo puede no cumplirlos y seguiría
	 * invisible; cambiar la URL ya dispara la consulta de las dos tablas
	 */
	const focusOnCreatedProduct = (name: string) => {
		const params = new URLSearchParams(searchParams.toString());

		params.set('productName', name);
		params.set('productsPage', '1');
		params.set('page', '1');
		params.delete('pId');
		params.delete('productDescription');
		params.delete('productCategoryName');

		router.replace(`?${params.toString()}`);
	};

	useEffect(() => {
		if (dataToHandle) {
			form.setFieldsValue({
				name: dataToHandle.productName,
				description: dataToHandle.productDescription,
				productCategoryId: dataToHandle.productCategoryId
			});
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

			submitCreateProduct({ ...cleanedValues, stocks }, stockIds, async () =>
				focusOnCreatedProduct(values.name.trim())
			);

			return;
		}

		submitUpdateProduct(
			{
				name: values.name,
				description: values.description,
				productCategoryId: values.productCategoryId,
				productCategoryName: productCategories?.find(
					pCat => pCat.id === values.productCategoryId
				)?.name
			},
			dataToHandle.productId,
			reloadTables
		);
	};

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
			<Form.Item
				name='name'
				label='Nombre'
				rules={[
					{
						required: true,
						message: 'El nombre del producto es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el nombre del producto' />
			</Form.Item>
			<Form.Item name='description' label='Descripción'>
				<Input.TextArea placeholder='Ingresa una descripción para el producto' />
			</Form.Item>
			<Form.Item
				name='productCategoryId'
				label='Categoría'
				rules={[
					{
						required: true,
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
				/>
			</Form.Item>

			{isUpdating ? null : (
				<>
					<SelectStocks
						form={form}
						setIsQuitoSelected={setIsQuitoSelected}
						label='Crear en las siguientes bodegas:'
					/>

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
				</>
			)}

			<FormButtons
				label={isUpdating ? 'Editar' : undefined}
				isLoading={isLoading}
			/>
		</Form>
	);
};

export default ProductForm;
