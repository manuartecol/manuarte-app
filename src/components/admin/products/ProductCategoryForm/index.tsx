import { useEffect, useState } from 'react';
import { Form, Input, notification, Select } from 'antd';
import FormButtons from '../../common/ui/FormButtons';
import useForm from '@/hooks/useForm';
import { useModalStore } from '@/stores/modalStore';
import { productCategoryServices } from '@/services/productCategoryServices';
import { selectFilterOption } from '../../utils';

const ProductCategoryForm = () => {
	const {
		form,
		isLoading,
		submitCreateProductCategory,
		submitUpdateProductCategory
	} = useForm();
	const { dataToHandle } = useModalStore.getState();
	const [groups, setGroups] = useState<ProductCategoryGroup[]>([]);
	const [isLoadingGroups, setIsLoadingGroups] = useState(true);

	useEffect(() => {
		if (dataToHandle) {
			form.setFieldsValue({
				name: dataToHandle.name,
				productCategoryGroupId: dataToHandle.productCategoryGroupId
			});
		}

		const fetchGroups = async () => {
			const data = await productCategoryServices.getProductCategoryGroups();
			if (!data) {
				notification.error({
					message: 'No se pudieron cargar los grupos de categoría'
				});
			}
			setGroups(data ?? []);
			setIsLoadingGroups(false);
		};

		fetchGroups();
	}, []);

	/**
	 * El grupo actual va como opción aunque no esté en la lista: mientras cargan
	 * los grupos, o si el grupo fue eliminado, el select mostraba su UUID
	 */
	const currentGroupId = dataToHandle?.productCategoryGroupId;
	const groupOptions = groups.map(group => ({
		value: group.id,
		label: group.name
	}));
	if (currentGroupId && !groups.some(group => group.id === currentGroupId)) {
		groupOptions.push({
			value: currentGroupId,
			label: dataToHandle?.groupName ?? 'Grupo eliminado'
		});
	}

	const handleSubmit = async (values: SubmitProductCategoryDto) => {
		// Al limpiar el select llega undefined, que el backend ignora: null
		// es lo que quita el grupo
		const valuesToSubmit = {
			...values,
			productCategoryGroupId: values.productCategoryGroupId ?? null
		};

		if (!dataToHandle) {
			submitCreateProductCategory(valuesToSubmit);
		} else {
			submitUpdateProductCategory(valuesToSubmit, dataToHandle.id);
		}
	};

	return (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			initialValues={{ modifier: 'public' }}
			clearOnDestroy
			onFinish={values => handleSubmit(values)}
		>
			<Form.Item
				name='name'
				label='Categoría'
				rules={[
					{
						required: true,
						message: 'El nombre de la categoría es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el nombre de la categoría' />
			</Form.Item>

			<Form.Item name='productCategoryGroupId' label='Grupo'>
				<Select
					placeholder='Sin grupo'
					allowClear
					showSearch
					filterOption={selectFilterOption}
					loading={isLoadingGroups}
					options={groupOptions}
				/>
			</Form.Item>

			<FormButtons
				label={dataToHandle ? 'Editar' : undefined}
				isLoading={isLoading}
			/>
		</Form>
	);
};

export default ProductCategoryForm;
