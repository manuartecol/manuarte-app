import { ModalContent } from '@/enums';
import { Button, notification, Space, Tooltip } from 'antd';
import { AiOutlineEdit, AiOutlineDelete } from 'react-icons/ai';
import { useDispatch } from 'react-redux';
import PopConfirm from '../../common/PopConfirm';
import { ProductServices } from '@/services/productServices';
import { openModal } from '@/reducers/ui/uiSlice';
import { removeProduct } from '@/reducers/products/productSlice';
import { AxiosError } from 'axios';

const ActionsProduct = ({ record }: { record: ProductVariant }) => {
	const isEditable = true;
	const isDeletable = true;
	const dispatch = useDispatch();

	const handleEdit = () => {
		dispatch(
			openModal({
				title: 'Editar producto',
				content: ModalContent.products,
				dataToEdit: record
			})
		);
	};

	const handleDelete = async () => {
		try {
			const res = await ProductServices.deleteProduct(
				record.productId,
				record.id
			);
			if (res.status === 200) {
				dispatch(
					removeProduct({
						productId: res.data.productDeleted ? record.productId : undefined,
						productVariantId: record.id
					})
				);
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

	return (
		<Space size='small'>
			<Tooltip title={isEditable ? 'Editar' : ''}>
				<Button
					type='text'
					icon={
						<AiOutlineEdit
							size={20}
							color={isEditable ? '#0D6EFD' : '#A0AEC0'}
						/>
					}
					onClick={handleEdit}
				/>
			</Tooltip>
			<PopConfirm
				title={`${record.productName} - ${record.name}`}
				onConfirm={handleDelete}
			>
				<Tooltip title={isDeletable ? 'Eliminar' : ''}>
					<Button
						type='text'
						icon={
							<AiOutlineDelete
								size={20}
								color={isDeletable ? '#E53535' : '#FCBABA'}
							/>
						}
						disabled={!isDeletable}
					/>
				</Tooltip>
			</PopConfirm>
		</Space>
	);
};

export default ActionsProduct;
