import { useEffect, useState } from 'react';
import { Modal } from 'antd';
import { useModalStore } from '@/stores/modalStore';
import useModal from '@/hooks/useModal';
import { ModalContent } from '@/types/enums';

const CustomModal = () => {
	const { isOpen, title, content, closeModal } = useModalStore();
	const { MODAL_CONTENT } = useModal();
	const [width, setWidth] = useState(500);

	const WIDTH: Record<string, number> = {
		// Crear un producto lleva el bloque de ejes de cada presentación (cantidad,
		// unidad, envase) además de precios y límites: a 600 se partía en dos filas
		products: 760,
		productVariants: 700,
		productVariantEdit: 700,
		stockItems: 600,
		billings: 600
	};

	useEffect(() => {
		if (content) {
			setWidth(WIDTH[content]);
		}
	}, [content]);

	const modalContent = MODAL_CONTENT[content as ModalContent] ?? null;

	return (
		<Modal
			open={isOpen}
			title={title}
			onCancel={closeModal}
			destroyOnClose
			centered
			width={width}
			footer={null}
			/**
			 * El scroll va en el cuerpo y no en la ventana: un formulario alto hacía
			 * desplazar el diálogo entero, con el título fuera de vista y los botones
			 * a varias pantallas. Los desplegables de antd se montan en `body`, así
			 * que no los recorta
			 */
			styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
		>
			{modalContent}
		</Modal>
	);
};

export default CustomModal;
