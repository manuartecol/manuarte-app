import { useEffect } from 'react';
import { Form, Input } from 'antd';
import SearchCity from '../../common/input-data/SearchCity';
import FormButtons from '../../common/ui/FormButtons';
import useForm from '@/hooks/useForm';
import { customerSchema, validateForm } from '@/utils/validators';
import { z } from 'zod';
import { useModalStore } from '@/stores/modalStore';

const CustomersForm = () => {
	const { form, isLoading, submitRegisterCustomer, submitUpdateCustomer } =
		useForm();
	const { dataToHandle } = useModalStore.getState();

	useEffect(() => {
		if (dataToHandle) {
			form.setFieldsValue(dataToHandle);
		}
	}, []);

	const onSubmit = async (values: SubmitCustomerDto) => {
		const isValid = await validateForm(values, customerSchema, form);
		if (!isValid) return;

		if (!dataToHandle) {
			await submitRegisterCustomer(values);
		} else {
			await submitUpdateCustomer(values, dataToHandle.personId);
		}
	};

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
						message: 'El nombre del cliente es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el nombre completo' />
			</Form.Item>
			<Form.Item
				name='dni'
				label='Nro. de Documento'
				rules={[
					{
						required: true,
						message: 'El número de documento es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el número de documento' />
			</Form.Item>
			<Form.Item name='email' label='Email'>
				<Input
					placeholder='Ingresa el email del cliente'
					onChange={e => {
						const value = e.target.value;
						const isValid = z
							.string()
							.email()
							.or(z.literal(''))
							.safeParse(value).success;

						if (isValid) {
							form.setFields([{ name: ['email'], errors: [] }]);
						}
					}}
				/>
			</Form.Item>
			<Form.Item
				name='phoneNumber'
				label='Nro de teléfono'
				rules={[
					{
						required: true,
						message: 'El número de teléfono es requerido'
					}
				]}
			>
				<Input placeholder='Ingresa el número de teléfono del cliente' />
			</Form.Item>

			<Form.Item
				name='location'
				label='Dirección'
				rules={[
					{
						required: true,
						message: 'La dirección es requerida'
					}
				]}
			>
				<Input placeholder='Ingresa la dirección del cliente' />
			</Form.Item>

			<div className='flex flex-col gap-1 mb-2'>
				{dataToHandle && !dataToHandle?.cityId ? (
					<>
						<span className='text-blue-500'>
							▫ Por favor, actualiza la ciudad
						</span>
						{dataToHandle?.city ? (
							<span className='text-blue-500'>
								▫ Valor actual: {dataToHandle?.city}
							</span>
						) : null}
					</>
				) : null}
			</div>
			<SearchCity
				initialValue={
					dataToHandle?.cityId && dataToHandle.cityName
						? {
								cityId: dataToHandle.cityId,
								cityName: `${dataToHandle.cityName}, ${dataToHandle?.regionName}, ${dataToHandle?.countryIsoCode}`
							}
						: undefined
				}
			/>

			<FormButtons
				label={dataToHandle ? 'Editar' : 'Registrar'}
				isLoading={isLoading}
			/>
		</Form>
	);
};

export default CustomersForm;
