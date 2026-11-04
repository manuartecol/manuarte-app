import { useEffect, useState } from 'react';
import { Form, Input, Switch } from 'antd';
import { useSearchParams } from 'next/navigation';
import { useWatch } from 'antd/es/form/Form';
import FormButtons from '../../common/ui/FormButtons';
import SelectStocks from '../SelectStocks';
import useForm from '@/hooks/useForm';
import useProductServices from '@/services/product';
import { useModalStore } from '@/stores/modalStore';
import { productsParamsFromSearch } from '../../utils';

/**
 * Editar una presentación: nombre, estado y bodegas donde se ofrece. Nada del
 * producto, que tiene su propio formulario. Antes las dos cosas vivían en el
 * mismo modal detrás de un switch, y la presentación viajaba al backend dentro
 * del cuerpo del producto
 */
const ProductVariantEditForm = () => {
	const { form, isLoading, submitUpdateProductVariant } = useForm();
	const { dataToHandle } = useModalStore.getState();
	const [active, setActive] = useState<boolean>(dataToHandle?.active ?? false);
	const [, setIsQuitoSelected] = useState(true);
	const searchParams = useSearchParams();
	const { getProductVariants, getProductsWithVariants } = useProductServices();
	const stockIdsValues = useWatch('stockIds', form);

	useEffect(() => {
		form.setFieldsValue({
			name: dataToHandle?.name,
			stockIds: dataToHandle?.stockIds || []
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

	const onSubmit = (values: { name: string; stockIds?: string[] }) => {
		submitUpdateProductVariant(
			{
				name: values.name,
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
			{dataToHandle?.productName ? (
				<p className='mb-4 text-gray-500'>
					Producto:{' '}
					<span className='font-semibold text-gray-700'>
						{dataToHandle.productName}
					</span>
				</p>
			) : null}

			<div className='flex items-center gap-4'>
				<Form.Item
					name='name'
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
						onChange={checked => setActive(checked)}
						id='active'
						style={active ? { backgroundColor: '#10b981' } : {}}
						checked={active}
					/>
					<label htmlFor='active'>{active ? 'Activa' : 'Inactiva'}</label>
				</div>
			</div>

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
