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
		products: 600,
		productVariants: 600,
		productVariantEdit: 600,
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
		>
			{modalContent}
		</Modal>
	);
};

export default CustomModal;
