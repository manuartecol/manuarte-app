import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { notification } from 'antd';
import { useSearchParams } from 'next/navigation';
import TableActions from '../../common/ui/TableActions';
import { productLibs } from '@/libs/api/product';
import { removeProduct } from '@/reducers/products/productSlice';
import { useModalStore } from '@/stores/modalStore';
import { AxiosError } from 'axios';
import { ModalContent } from '@/types/enums';
import useProductServices from '@/services/product';

const pluralize = (count: number, singular: string, plural: string) =>
	`${count} ${count === 1 ? singular : plural}`;

const ProductActions = ({ record }: { record: ProductVariant }) => {
	const { openModal } = useModalStore.getState();
	const dispatch = useDispatch();
	const searchParams = useSearchParams();
	const { getProductVariants } = useProductServices();
	const [preview, setPreview] = useState<ProductDeletionPreview | null>(null);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);

	const handleEdit = () => {
		openModal({
			title: 'Editar Producto',
			content: ModalContent.products,
			dataToHandle: record
		});
	};

	/**
	 * Qué va a pasar con esta presentación, preguntado al abrir el aviso: la
	 * tabla no sabe cuántas presentaciones tiene el producto ni qué historial
	 * arrastra, y el aviso sale del mismo cálculo que hace el borrado
	 */
	const handlePopOpenChange = async (open: boolean) => {
		if (!open) return;

		setPreview(null);
		setPreviewError(null);
		setIsLoadingPreview(true);
		try {
			const data = await productLibs.getProductDeletionPreview(
				record.productId,
				record.id
			);
			setPreview(data);
		} catch (error) {
			console.error(error);
			setPreviewError(
				error instanceof AxiosError
					? (error.response?.data.message ??
							'No se pudo comprobar qué pasará si la eliminas')
					: 'No se pudo comprobar qué pasará si la eliminas'
			);
		} finally {
			setIsLoadingPreview(false);
		}
	};

	const handleDelete = async () => {
		try {
			const res = await productLibs.deleteProduct(record.productId, record.id);
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
				// Recarga la página actual para que el total de la paginación baje
				await getProductVariants(Object.fromEntries(searchParams.entries()));
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

	const deleteDescription = () => {
		if (isLoadingPreview) return 'Comprobando qué pasará...';

		// Sin vista previa no se puede decir qué va a pasar, así que tampoco se
		// deja confirmar: el botón Sí se apaga desde `canConfirmDelete`
		if (!preview) {
			return (
				<span className='block max-w-[280px]'>
					{previewError ?? 'No se pudo comprobar qué pasará si la eliminas'}.
					Cierra este aviso y vuelve a intentarlo.
				</span>
			);
		}

		if (preview.mode === 'blocked') {
			const detail = preview.stocksWithUnits
				.map(stock => `${stock.name} (${stock.quantity})`)
				.join(', ');

			return (
				<span className='block max-w-[280px]'>
					No se puede eliminar, porque tiene unidades en {detail}. Sácalas con
					un movimiento de salida y vuelve a intentarlo.
				</span>
			);
		}

		const documents = [
			preview.billingItems > 0
				? pluralize(preview.billingItems, 'factura', 'facturas')
				: null,
			preview.quoteItems > 0
				? pluralize(preview.quoteItems, 'cotización', 'cotizaciones')
				: null,
			preview.transactionItems > 0
				? pluralize(preview.transactionItems, 'movimiento', 'movimientos')
				: null
		].filter(Boolean);

		return (
			<span className='block max-w-[280px]'>
				{preview.mode === 'logical' ? (
					<>
						{documents.length > 0
							? `Aparece en ${documents.join(', ')}.`
							: 'Solo aparece en documentos anulados o borrados.'}{' '}
						Se conserva el historial: deja de estar en el catálogo, pero sus
						ventas siguen en los reportes.
					</>
				) : (
					<>No tiene historial, así que se elimina definitivamente.</>
				)}

				{preview.deletesProduct ? (
					<>
						<br />
						<br />
						Es la última presentación: el producto {record.productName} también
						se elimina.
					</>
				) : null}
			</span>
		);
	};

	return (
		<TableActions
			onEdit={handleEdit}
			onDelete={handleDelete}
			popTitle={`${record.productName} - ${record.name}`}
			popDescription={deleteDescription()}
			onPopOpenChange={handlePopOpenChange}
			canConfirmDelete={
				!isLoadingPreview && preview !== null && preview.mode !== 'blocked'
			}
		/>
	);
};

export default ProductActions;
