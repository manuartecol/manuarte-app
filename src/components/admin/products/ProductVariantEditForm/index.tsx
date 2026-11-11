import { useEffect, useState } from 'react';
import { Form, Input, Switch } from 'antd';
import { useSearchParams } from 'next/navigation';
import { useWatch } from 'antd/es/form/Form';
import { useSelector } from 'react-redux';
import FormButtons from '../../common/ui/FormButtons';
import SelectStocks from '../SelectStocks';
import VariantAxesFields from '../VariantAxesFields';
import { previewFromAxes } from '../VariantAxesFields/composeVariantName';
import useForm from '@/hooks/useForm';
import useProductServices from '@/services/product';
import { useModalStore } from '@/stores/modalStore';
import { CAPACITY_CATEGORY_GROUP } from '../../consts';
import { productsParamsFromSearch } from '../../utils';

/**
 * Editar una presentación: medida, estado y bodegas donde se ofrece. Nada del
 * producto, que tiene su propio formulario.
 *
 * Dos modos, nunca los dos a la vez. Si la presentación está estructurada se
 * edita por ejes y el nombre es la vista previa, no un campo. Si es texto libre,
 * que tras el backfill solo son casos que no son una medida, como "Descuento",
 * se edita su nombre tal cual
 */
const ProductVariantEditForm = () => {
	const { form, isLoading, submitUpdateProductVariant } = useForm();
	const { dataToHandle } = useModalStore.getState();
	const [active, setActive] = useState<boolean>(dataToHandle?.active ?? false);
	const [, setIsQuitoSelected] = useState(true);
	const searchParams = useSearchParams();
	const { getProductVariants, getProductsWithVariants, getVariantCatalog } =
		useProductServices();
	const { productCategories } = useSelector(
		(state: RootState) => state.productCategory
	);
	const { variantCatalog } = useSelector((state: RootState) => state.product);
	const [catalogFailed, setCatalogFailed] = useState(false);
	const stockIdsValues = useWatch('stockIds', form);

	/**
	 * Ruta estática: en este formulario `axes` cuelga de la raíz. Con `preserve`
	 * porque `useWatch` solo devuelve los campos montados, y envase y atributos
	 * deciden su visibilidad a partir de esta misma observación: una presentación
	 * guardada con envase abría sin él, y el nombre prometido tampoco lo llevaba
	 */
	const axes = useWatch('axes', { form, preserve: true }) as
		| VariantAxesDto
		| undefined;
	const namePreview = previewFromAxes(axes, variantCatalog);

	// Ya estructurada si tiene alguno de los ejes guardados
	const isStructured = Boolean(
		dataToHandle?.unitId ||
			dataToHandle?.containerId ||
			(dataToHandle?.attributes ?? []).length > 0
	);

	const isCapacityCategory =
		productCategories?.find(pCat => pCat.id === dataToHandle?.productCategoryId)
			?.groupName === CAPACITY_CATEGORY_GROUP;

	useEffect(() => {
		getVariantCatalog().then(loaded => setCatalogFailed(!loaded));

		form.setFieldsValue({
			name: dataToHandle?.name,
			stockIds: dataToHandle?.stockIds || [],
			// Los ejes guardados, para que el formulario abra con lo que ya tiene y
			// no con los selects vacíos
			...(isStructured
				? {
						axes: {
							quantityValue: dataToHandle?.quantityValue ?? undefined,
							unitId: dataToHandle?.unitId ?? undefined,
							containerId: dataToHandle?.containerId ?? undefined,
							attributes: (dataToHandle?.attributes ?? []).map(
								(attribute: VariantAttributeValue) => ({
									attributeTypeId: attribute.attributeTypeId,
									value: attribute.value
								})
							)
						}
					}
				: {})
		});
	}, []);

	// Las dos pestañas pueden estar mostrando esta presentación, y el nombre o el
	// estado cambian lo que cada una debe pintar
	const reloadTables = async () => {
		await Promise.all([
			getProductVariants(Object.fromEntries(searchParams.entries())),
			getProductsWithVariants(productsParamsFromSearch(searchParams))
		]);
	};

	const onSubmit = (values: {
		name?: string;
		stockIds?: string[];
		axes?: VariantAxesDto;
	}) => {
		submitUpdateProductVariant(
			{
				// Con ejes el nombre no se manda: lo compone el backend, y mandarlo
				// sería darle dos verdades para el mismo dato
				...(isStructured ? { axes: values.axes } : { name: values.name }),
				active,
				stockIds: values.stockIds || []
			},
			dataToHandle.id,
			reloadTables
		);
	};

	return (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			clearOnDestroy
			onFinish={onSubmit}
		>
			{/*
			 * El estado va en la cabecera, junto al producto, y no en una columna al
			 * lado de los campos: esa columna les quitaba la mitad del ancho y partía
			 * cantidad, unidad y envase en varias filas
			 */}
			<div className='mb-4 flex items-center justify-between gap-4'>
				<p className='text-gray-500'>
					{dataToHandle?.productName ? (
						<>
							Producto:{' '}
							<span className='font-semibold text-gray-700'>
								{dataToHandle.productName}
							</span>
						</>
					) : null}
				</p>

				<div className='flex shrink-0 items-center gap-2'>
					<Switch
						onChange={checked => setActive(checked)}
						id='active'
						style={active ? { backgroundColor: '#10b981' } : {}}
						checked={active}
					/>
					<label htmlFor='active'>{active ? 'Activa' : 'Inactiva'}</label>
				</div>
			</div>

			{isStructured ? (
				<>
					{/*
					 * El nombre que va a quedar, no el que ya hay: con los ejes vacíos no
					 * se repite el guardado, porque se leería como el resultado de lo que
					 * está en pantalla
					 */}
					<p className='mb-2 text-gray-500'>
						Presentación:{' '}
						{namePreview ? (
							<span className='font-semibold text-blue-500'>{namePreview}</span>
						) : (
							<span className='italic'>elige una medida</span>
						)}
					</p>
					<VariantAxesFields
						form={form}
						axes={axes}
						isCapacity={isCapacityCategory}
						catalogFailed={catalogFailed}
					/>
				</>
			) : (
				<Form.Item
					name='name'
					label='Presentación'
					rules={[
						{
							required: true,
							message: 'El nombre de la presentación es requerido'
						}
					]}
				>
					<Input placeholder='Ingresa el nombre de la presentación' />
				</Form.Item>
			)}

			<SelectStocks
				form={form}
				setIsQuitoSelected={setIsQuitoSelected}
				label='Activa en las siguientes bodegas:'
				canRemoveMainStock={true}
				stocks={dataToHandle?.stockIds}
				removalHint='Quitar una bodega desactiva ahí la presentación: deja de ofrecerse en esa bodega. No se borra nada ni se pierden movimientos, y no se puede quitar una bodega con unidades o con una transferencia sin aceptar.'
				helpText={
					stockIdsValues?.length === 0
						? 'La presentación no se mostrará en ninguna bodega'
						: undefined
				}
			/>

			<FormButtons label='Editar' isLoading={isLoading} />
		</Form>
	);
};

export default ProductVariantEditForm;
