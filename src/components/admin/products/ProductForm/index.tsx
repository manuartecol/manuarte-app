import { useEffect, useState } from 'react';
import { Form, Input, Select } from 'antd';
import { useWatch } from 'antd/es/form/Form';
import { useSelector } from 'react-redux';
import ProductVariantFormList from '../ProductVariantFormList';
import FormButtons from '../../common/ui/FormButtons';
import useForm from '@/hooks/useForm';
import SelectStocks from '../SelectStocks';
import { CAPACITY_CATEGORY_GROUP } from '../../consts';
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
	const { getProductVariants, getProductsWithVariants, getVariantCatalog } =
		useProductServices();
	const productCategoryId = useWatch('productCategoryId', form);
	const [catalogFailed, setCatalogFailed] = useState(false);
	// La primera presentación abierta; las demás se plegan
	const [openVariants, setOpenVariants] = useState<string[]>(['0']);

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
	 * páginas de distancia y parecer que no se guardó. Se limpian todos los demás
	 * filtros de las dos tablas porque el nuevo puede no cumplirlos y seguiría
	 * invisible: con el selector en Inactivas o un filtro de presentación puesto,
	 * el producto salía en Productos y en Presentaciones no.
	 *
	 * Las dos consultas se hacen aquí con los parámetros nuevos, y no se espera a
	 * que las dispare el cambio de URL. Los efectos de las tablas dependen de los
	 * valores de los filtros, así que creando un producto cuyo nombre ya estaba en
	 * el filtro la URL no cambiaba, no había consulta, y el producto recién creado
	 * no aparecía en ninguna de las dos pestañas
	 */
	const focusOnCreatedProduct = async (name: string) => {
		const params = new URLSearchParams(searchParams.toString());

		params.set('productName', name);
		params.set('productsPage', '1');
		params.set('page', '1');
		params.delete('pId');
		params.delete('productDescription');
		params.delete('productCategoryName');
		params.delete('vId');
		params.delete('name');
		params.delete('showActiveOnly');

		router.replace(`?${params.toString()}`);

		const nextParams = new URLSearchParams(params);

		await Promise.all([
			getProductVariants(Object.fromEntries(nextParams.entries())),
			getProductsWithVariants(productsParamsFromSearch(nextParams))
		]);
	};

	useEffect(() => {
		if (dataToHandle) {
			form.setFieldsValue({
				name: dataToHandle.productName,
				description: dataToHandle.productDescription,
				productCategoryId: dataToHandle.productCategoryId
			});

			return;
		}

		// Solo al crear: editar el producto no toca las presentaciones
		getVariantCatalog().then(loaded => setCatalogFailed(!loaded));
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

			submitCreateProduct({ ...cleanedValues, stocks }, async () =>
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

	/**
	 * En los productos de envases el número es la capacidad del recipiente y no
	 * la cantidad de producto, así que la etiqueta del campo cambia. Solo la
	 * etiqueta: el flag que entra en la firma lo deduce el backend del mismo
	 * grupo, para que no dependa de lo que mande el formulario
	 */
	const isCapacityCategory =
		productCategories?.find(pCat => pCat.id === productCategoryId)
			?.groupName === CAPACITY_CATEGORY_GROUP;

	return (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			initialValues={{ modifier: 'public' }}
			clearOnDestroy
			onFinish={values => onSubmit(values)}
			/**
			 * El panel de la presentación con el error se abre al fallar el guardado.
			 * Los campos de un panel plegado siguen montados y se validan, pero su
			 * aviso queda escondido, así que sin esto el formulario se negaba a
			 * guardar sin decir dónde
			 */
			onFinishFailed={({ errorFields }) => {
				const firstVariantError = errorFields.find(
					errorField => errorField.name[0] === 'productVariants'
				);

				if (!firstVariantError) return;

				setOpenVariants([String(firstVariantError.name[1])]);

				/**
				 * Y el campo a la vista. Abrir el panel no basta: con varias
				 * presentaciones el error puede quedar fuera de pantalla y el
				 * formulario parece negarse a guardar sin decir nada. El retardo es
				 * el de la animación del acordeón, porque un panel plegado sigue
				 * oculto y no se puede desplazar hasta él
				 */
				setTimeout(
					() =>
						form.scrollToField(firstVariantError.name, {
							behavior: 'smooth',
							block: 'center'
						}),
					300
				);
			}}
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
							form={form}
							isUpdating={isUpdating}
							isQuitoSelected={isQuitoSelected}
							isCapacity={isCapacityCategory}
							catalogFailed={catalogFailed}
							activeKey={openVariants}
							onActiveKeyChange={setOpenVariants}
						/>
					</Form.Item>
				</>
			)}

			<FormButtons
				label={isUpdating ? 'Editar' : undefined}
				isLoading={isLoading}
				// Fijos abajo: con varias presentaciones el formulario es más alto que
				// el modal, y guardar no debe depender de haber bajado del todo
				sticky={!isUpdating}
			/>
		</Form>
	);
};

export default ProductForm;
