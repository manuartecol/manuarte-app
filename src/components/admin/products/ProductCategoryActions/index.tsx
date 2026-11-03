import { notification } from 'antd';
import { useDispatch } from 'react-redux';
import { productCategoryServices } from '@/services/productCategoryServices';
import { removeProductCategory } from '@/reducers/productCategories/productCategorySlice';
import { AxiosError } from 'axios';
import { ModalContent } from '@/types/enums';
import TableActions from '../../common/ui/TableActions';
import { useModalStore } from '@/stores/modalStore';

const ProductCategoryActions = ({ record }: { record: ProductCategory }) => {
	const { openModal } = useModalStore.getState();
	const dispatch = useDispatch();

	const handleEdit = () => {
		openModal({
			title: 'Editar Categoría',
			content: ModalContent.productCategories,
			dataToHandle: record
		});
	};

	const handleDelete = async () => {
		try {
			const res = await productCategoryServices.deleteProductCategory(
				record.id
			);
			if (res.status === 200) {
				dispatch(removeProductCategory(record.id));
				notification.success({
					message: res.data.message
				});
			}
		} catch (error) {
			console.error(error);
			const errorMsg =
				error instanceof AxiosError
					? error.response?.data.message
					: 'Ocurrió un error!';
			notification.error({ message: errorMsg });
		}
	};

	/**
	 * El conteo viene en la fila, así que el aviso dice qué va a pasar y la
	 * confirmación se apaga en vez de dejar al usuario confirmar y recibir un
	 * error. Si la respuesta no trae el conteo no se afirma nada: decide el
	 * backend, que rechaza con su mensaje
	 */
	const productsCount = record.productsCount;

	const deleteDescription =
		productsCount === undefined
			? '¿Estás seguro de que quieres eliminar esta categoría?'
			: productsCount > 0
				? `No se puede eliminar, porque tiene ${productsCount} ${
						productsCount === 1 ? 'producto' : 'productos'
					}. Muévelos a otra categoría o elimínalos primero.`
				: 'No tiene productos, así que se elimina.';

	return (
		<TableActions
			onEdit={handleEdit}
			onDelete={handleDelete}
			popTitle={`${record.name}`}
			popDescription={deleteDescription}
			canConfirmDelete={productsCount === undefined || productsCount === 0}
		/>
	);
};

export default ProductCategoryActions;
