import { useEffect, useState } from 'react';
import { Form, Input, Select, Switch } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import FormButtons from '../../common/ui/FormButtons';
import useForm from '@/hooks/useForm';
import { userServices } from '@/services/userServices';
import { shopServices } from '@/services/shopServices';
import { formatToTitleCase } from '@/utils/formats';
import {
	createStaffSchema,
	editStaffSchema,
	validateForm
} from '@/utils/validators';
import { useModalStore } from '@/stores/modalStore';
import { setShops } from '@/reducers/shops/shopSlice';

const StaffForm = () => {
	const { form, isLoading, submitRegisterStaff, submitUpdateStaff } = useForm();
	const [staffRoles, setStaffRoles] = useState<Role[]>([]);
	const { shops } = useSelector((state: RootState) => state.shop);
	const [editPassword, setEditPassword] = useState(false);
	const [selectedRole, setSelectedRole] = useState('');
	const { dataToHandle } = useModalStore.getState();
	const dispatch = useDispatch();

	const fetchRoles = async () => {
		const data = await userServices.getStaffRoles();
		if (data.length > 0) {
			setStaffRoles(data);
		}
	};

	const fetchShops = async () => {
		if (shops?.length === 0) {
			const data = await shopServices.getAll(false);
			if (data) {
				dispatch(setShops(data));
			}
		}
	};

	useEffect(() => {
		if (dataToHandle) {
			form.setFieldsValue(dataToHandle);
		}
		fetchRoles();
		fetchShops();
	}, []);

	useEffect(() => {
		if (dataToHandle && staffRoles.length > 0) {
			const roleName = getRoleSelectedName(dataToHandle?.roleId);
			if (roleName) {
				setSelectedRole(roleName);
			}
		}
	}, [dataToHandle, staffRoles]);

	const onSubmit = async (values: SubmitStaffDto) => {
		const isValid = !dataToHandle
			? await validateForm(values, createStaffSchema, form)
			: await validateForm(values, editStaffSchema, form);
		if (!isValid) return;

		if ('confirmPassword' in values) {
			delete values.confirmPassword;
		}

		if (!dataToHandle) {
			await submitRegisterStaff(values);
		} else {
			await submitUpdateStaff(values, dataToHandle.personId);
		}
	};

	const onChangeSwitch = (checked: boolean) => {
		setEditPassword(checked);
	};

	const getRoleSelectedName = (roleId: string) => {
		return staffRoles.find(role => role.id === roleId)?.name ?? '';
	};

	const roleHandleChange = (value: string) => {
		const roleSelected = getRoleSelectedName(value);
		if (roleSelected) {
			setSelectedRole(roleSelected);
		}

		if (roleSelected === 'admin') {
			form.setFieldsValue({ shopId: undefined });
		}
	};

	const roleOptions = staffRoles.map(role => {
		return {
			value: role.id,
			label: formatToTitleCase(role.name)
		};
	});

	const shopOptions = shops.map(shop => {
		return {
			value: shop.id,
			label: formatToTitleCase(shop.name)
		};
	});

	const isShopDisabled = selectedRole === 'admin' || selectedRole === '';

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
				name='fullName'
				label='Nombre'
				rules={[
					{
						required: true,
						message: 'El nombre del usuario es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el nombre completo' />
			</Form.Item>
			<Form.Item
				name='dni'
				label='Documento'
				rules={[
					{
						required: true,
						message: 'El número de documento es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el número de documento' />
			</Form.Item>
			<Form.Item
				name='roleId'
				label='Rol de usuario'
				rules={[
					{
						required: true,
						message: 'El rol del usuario es requerido'
					}
				]}
			>
				<Select
					placeholder='Selecciona un rol de usuario'
					allowClear
					options={roleOptions}
					onChange={value => roleHandleChange(value)}
				/>
			</Form.Item>

			<Form.Item
				name='shopId'
				label='Tienda'
				rules={[
					{
						required: !isShopDisabled,
						message: !isShopDisabled ? 'La tienda es requerida' : ''
					}
				]}
			>
				<Select
					placeholder='Selecciona una tienda'
					allowClear
					options={shopOptions}
					disabled={isShopDisabled}
				/>
			</Form.Item>

			<Form.Item
				name='email'
				label='Email'
				rules={[
					{
						required: true,
						message: 'El email es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el email del usuario' />
			</Form.Item>

			{dataToHandle ? (
				<div className='flex gap-2 my-6 px-2 text-gray-500'>
					<Switch
						defaultChecked={false}
						onChange={onChangeSwitch}
						id='switch'
					/>
					<label htmlFor='switch'>Cambiar contraseña</label>
				</div>
			) : null}
			{!dataToHandle || editPassword ? (
				<div className='flex justify-between gap-4'>
					<Form.Item
						name='password'
						label='Contraseña'
						rules={[
							{
								required: !dataToHandle || editPassword,
								message: 'La contraseña es requerida'
							}
						]}
						hasFeedback
						style={{ width: '50%' }}
					>
						<Input.Password
							type='password'
							placeholder='Ingresa la contraseña del usuario'
						/>
					</Form.Item>
					<Form.Item
						name='confirmPassword'
						label='Confirmar contraseña'
						dependencies={['password']}
						hasFeedback
						style={{ width: '50%' }}
						rules={[
							{
								required: !dataToHandle || editPassword,
								message: 'Por favor, confirma la contraseña'
							},
							({ getFieldValue }) => ({
								validator(_, value) {
									if (!value || getFieldValue('password') === value) {
										return Promise.resolve();
									}
									return Promise.reject(
										new Error('Las contraseñas no coinciden')
									);
								}
							})
						]}
					>
						<Input.Password />
					</Form.Item>
				</div>
			) : null}

			<FormButtons
				label={dataToHandle ? 'Editar' : undefined}
				isLoading={isLoading}
			/>
		</Form>
	);
};

export default StaffForm;
