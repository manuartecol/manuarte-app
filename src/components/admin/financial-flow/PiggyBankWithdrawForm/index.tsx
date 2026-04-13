import useForm from '@/hooks/useForm';
import { formatCurrency, formatInputCurrency } from '@/utils/formats';
import { Form, InputNumber } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import FormButtons from '../../common/ui/FormButtons';
import { ModalContent } from '@/types/enums';
import { useModalStore } from '@/stores/modalStore';

const PiggyBankWithdrawForm = ({ shopId }: { shopId: string }) => {
	const { form, isLoading, submitPiggyBankWithdraw } = useForm();

	const onFinish = async (values: { amount: number; comments?: string }) => {
		const { openModal } = useModalStore.getState();

		openModal({
			content: ModalContent.confirm,
			componentProps: {
				confirmTitle: `¿Estás seguro que quieres retirar ${formatCurrency(values?.amount)} de la alcancía?`,
				confirmText: 'Se descontará el valor del monto disponible',
				onConfirm: async () => await submitPiggyBankWithdraw(values, shopId)
			}
		});
	};

	return (
		<Form
			layout='vertical'
			form={form}
			name='form_in_modal'
			clearOnDestroy
			onFinish={onFinish}
		>
			<Form.Item
				name='amount'
				label='Monto a retirar'
				rules={[
					{
						required: true,
						message: 'Requerido'
					}
				]}
				style={{ width: '50%' }}
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

			<FormButtons isLoading={isLoading} label='Retirar' />
		</Form>
	);
};

export default PiggyBankWithdrawForm;
