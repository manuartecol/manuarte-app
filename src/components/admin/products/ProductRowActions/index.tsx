import { Button, Tooltip } from 'antd';
import { AiOutlineAppstore } from 'react-icons/ai';
import TableActions from '../../common/ui/TableActions';
import { useModalStore } from '@/stores/modalStore';
import { ModalContent } from '@/types/enums';

/**
 * Acciones de la fila de producto: editar sus datos y agregarle una
 * presentación. No lleva borrado: un producto se va cuando se borra su última
 * presentación, desde la fila de esta
 */
const ProductRowActions = ({ record }: { record: ProductWithVariants }) => {
	const { openModal } = useModalStore.getState();

	const handleEdit = () => {
		openModal({
			title: 'Editar Producto',
			content: ModalContent.products,
			dataToHandle: {
				productId: record.id,
				productName: record.name,
				productDescription: record.description,
				productCategoryId: record.productCategoryId
			}
		});
	};

	const handleAddVariant = () => {
		openModal({
			title: 'Agregar Presentación',
			content: ModalContent.productVariants,
			dataToHandle: {
				productId: record.id,
				productName: record.name,
				// Para la etiqueta del campo de medida: Capacidad en los envases
				productCategoryId: record.productCategoryId
			}
		});
	};

	return (
		<TableActions
			onEdit={handleEdit}
			extraActions={
				<Tooltip title='Agregar presentación'>
					<Button
						type='text'
						icon={<AiOutlineAppstore size={20} color='#10b981' />}
						onClick={handleAddVariant}
					/>
				</Tooltip>
			}
		/>
	);
};

export default ProductRowActions;
