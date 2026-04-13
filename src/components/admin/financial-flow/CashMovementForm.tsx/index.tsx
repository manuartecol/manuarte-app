import { Form, InputNumber, Select } from 'antd';
import FormButtons from '../../common/ui/FormButtons';
import { formatInputCurrency } from '@/utils/formats';
import TextArea from 'antd/es/input/TextArea';
import { useModalStore } from '@/stores/modalStore';
import { CashMovementCategory, ModalContent } from '@/types/enums';
import useForm from '@/hooks/useForm';
import { selectFilterOption } from '../../utils';

const CashMovementForm = ({ shopId }: { shopId: string }) => {
	const { form, isLoading, submitCreateCashMovement } = useForm();
	const { content } = useModalStore();

	const isIncome = content === ModalContent.cashIncome;
	const movementType = isIncome ? 'INCOME' : 'EXPENSE';

	const cashMovemenCatOptions = [
		{ value: CashMovementCategory.SALE, label: 'Venta' },
		{ value: CashMovementCategory.DELIVERY, label: 'Domicilio' },
		{ value: CashMovementCategory.INBOUND_SHIPPING, label: 'Pago de Flete' },
		{ value: CashMovementCategory.PURCHASE, label: 'Compra' },
		{ value: CashMovementCategory.CHANGE, label: 'Cambio' },
		{ value: CashMovementCategory.PIGGY_BANK, label: 'Alcancía' },
		{
			value: CashMovementCategory.SHORTAGE_COVER,
			label: 'Cobertura de faltante'
		},
		{ value: CashMovementCategory.OTHER, label: 'Otro' }
	];

	const filteredOptions = isIncome
		? cashMovemenCatOptions.filter(
				opt =>
					opt.value === CashMovementCategory.OTHER ||
					opt.value === CashMovementCategory.SHORTAGE_COVER
			)
		: cashMovemenCatOptions.filter(
				opt =>
					opt.value !== CashMovementCategory.SALE &&
					opt.value !== CashMovementCategory.SHORTAGE_COVER
			);

	return (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			clearOnDestroy
			onFinish={values =>
				submitCreateCashMovement({ ...values, type: movementType }, shopId)
			}
		>
			<div className='flex gap-4'>
				<Form.Item
					name='category'
					label='Categoría'
					rules={[
						{
							required: true,
							message: 'La categoría es requeridoa'
						}
					]}
					style={{ width: '100%' }}
				>
					<Select
						placeholder='Selecciona una categoría...'
						allowClear
						showSearch
						filterOption={selectFilterOption}
						options={filteredOptions}
					/>
				</Form.Item>

				<Form.Item
					name='amount'
					label='Monto'
					rules={[
						{
							required: true,
							message: 'Requerido'
						}
					]}
					style={{ width: '100%' }}
				>
					<InputNumber
						min={0}
						controls={false}
						placeholder='Ingresa el monto'
						formatter={value => formatInputCurrency(value)}
						className='textRight'
						style={{ width: '100%' }}
					/>
				</Form.Item>
			</div>

			<Form.Item
				name='comments'
				label='Comentarios'
				rules={[
					{
						required: true,
						message: 'Requerido'
					}
				]}
			>
				<TextArea rows={2} />
			</Form.Item>

			<FormButtons isLoading={isLoading} label='Registrar' />
		</Form>
	);
};

export default CashMovementForm;
