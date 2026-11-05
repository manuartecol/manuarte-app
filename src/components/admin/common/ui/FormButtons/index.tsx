import { Button, Form } from 'antd';
import { useModalStore } from '@/stores/modalStore';

interface FormButtonsProps {
	label?: string;
	isLoading: boolean;
	disabled?: boolean;
	onSubmit?: () => void;
	/**
	 * Pegados al fondo del contenedor con scroll. Para los formularios más altos
	 * que el modal, donde llegar al botón obliga a bajar hasta el final
	 */
	sticky?: boolean;
}

const FormButtons = ({
	label = 'Agregar',
	isLoading,
	disabled = false,
	onSubmit,
	sticky = false
}: FormButtonsProps) => {
	const { closeModal } = useModalStore.getState();

	return (
		<Form.Item
			style={{
				marginBottom: 4,
				/**
				 * `marginBottom` a 0 cuando va fijo: ese margen es espacio del
				 * contenedor por debajo de la botonera, y con `bottom: 0` se traduce en
				 * que al llegar al final del scroll los botones todavía se movían esos
				 * píxeles
				 */
				...(sticky
					? {
							position: 'sticky',
							bottom: 0,
							zIndex: 1,
							background: '#fff',
							borderTop: '1px solid #f0f0f0',
							marginBottom: 0,
							paddingTop: 12,
							paddingBottom: 12
						}
					: {})
			}}
			className='flex justify-end'
		>
			<Button
				color='danger'
				variant='outlined'
				ghost
				onClick={closeModal}
				className='w-[130px] mr-6'
				style={{ fontWeight: 600 }}
			>
				CANCELAR
			</Button>
			<Button
				type='primary'
				className='w-[130px]'
				style={{ fontWeight: 600 }}
				htmlType={onSubmit ? 'button' : 'submit'}
				loading={isLoading}
				disabled={disabled}
				onClick={onSubmit || undefined}
			>
				{label.toUpperCase()}
			</Button>
		</Form.Item>
	);
};

export default FormButtons;
