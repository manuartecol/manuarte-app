import { useEffect, useState } from 'react';
import { Form, Select, Tag } from 'antd';
import { BiUserCircle } from 'react-icons/bi';
import FormButtons from '../../common/ui/FormButtons';
import useForm from '@/hooks/useForm';
import { staffLibs } from '@/libs/api/staff';
import { useModalStore } from '@/stores/modalStore';
import { generatePermissionOptions } from '@/utils/auth';
import { formatToTitleCase } from '@/utils/formats';
import { formatUserExtraPermissions } from '@/utils/permissions';
import { selectFilterOption } from '../../utils';

const PermissionsForm = () => {
	const { form, isLoading, submitEditPermissions } = useForm();
	const { dataToHandle } = useModalStore.getState();
	const [assignablePermissions, setAssignablePermissions] = useState([]);
	const [cleanPermissions, setCleanPermissions] = useState(false);
	const hasAssignablePermissions = assignablePermissions?.length > 0;

	const fetchAssignablePermissions = async () => {
		if (dataToHandle) {
			const data = await staffLibs.getAssignablePermissions(dataToHandle.id);
			setAssignablePermissions(data);

			const formattedExtraPermissions = formatUserExtraPermissions(
				dataToHandle?.extraPermissions
			);

			form.setFieldsValue({
				extraPermissions:
					formattedExtraPermissions?.map(
						(permission: { id: string }) => permission.id
					) || []
			});
		}
	};

	useEffect(() => {
		fetchAssignablePermissions();
	}, []);

	const onSubmit = (values: { extraPermissions: string[] }) => {
		if (dataToHandle) {
			submitEditPermissions(values, dataToHandle.id);
		}
	};

	return dataToHandle ? (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			initialValues={{ modifier: 'public' }}
			clearOnDestroy
			onFinish={values => onSubmit(values)}
		>
			<div className='flex gap-2 ps-1 my-4'>
				<h4 className='font-medium'>{dataToHandle?.fullName}</h4>
				<Tag
					icon={<BiUserCircle />}
					color='#10b981'
					style={{ display: 'flex', gap: 4, alignItems: 'center' }}
				>
					{formatToTitleCase(dataToHandle?.roleName)}
				</Tag>
			</div>

			{hasAssignablePermissions ? (
				<Form.Item
					name='extraPermissions'
					label='Permisos adicionales de usuario'
					help={
						cleanPermissions
							? 'Si envías el formulario vacío, se eliminarán todos los permisos actuales'
							: undefined
					}
				>
					<Select
						mode='multiple'
						placeholder='Selecciona los permisos'
						allowClear
						filterOption={selectFilterOption}
						options={
							assignablePermissions.length > 0
								? generatePermissionOptions(assignablePermissions)
								: undefined
						}
						onChange={value => setCleanPermissions(value?.length === 0)}
					/>
				</Form.Item>
			) : (
				<h4 className='mb-4 italic font-semibold'>
					No hay permisos adicionales para este usuario
				</h4>
			)}

			<FormButtons
				label='Editar'
				isLoading={isLoading}
				disabled={!hasAssignablePermissions}
			/>
		</Form>
	) : null;
};

export default PermissionsForm;
