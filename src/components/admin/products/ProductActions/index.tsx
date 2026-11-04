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

/**
 * Todos los estados del aviso pasan por aquí, con el ancho fijo y un alto
 * mínimo: el contenido cambia de tamaño entre "comprobando" y el resultado, y
 * sin esto la caja del popconfirm daba un salto al llegar los datos.
 *
 * Va fuera del componente a propósito: declarada dentro, React la trataría como
 * un tipo nuevo en cada render y desmontaría el subárbol cada vez
 */
const DescriptionBox = ({ children }: { children: React.ReactNode }) => (
	<span className='block w-[280px] min-h-[60px]'>{children}</span>
);

type ProductActionsProps = {
	record: ProductVariant;
	// Qué recargar después de borrar. Por defecto, la tabla de presentaciones
	onDeleted?: () => Promise<void> | void;
};

/**
 * Acciones de una presentación: editarla y eliminarla. Los datos del producto
 * se editan en su propia pestaña, donde la fila es el producto
 */
const ProductActions = ({ record, onDeleted }: ProductActionsProps) => {
	const { openModal } = useModalStore.getState();
	const dispatch = useDispatch();
	const searchParams = useSearchParams();
	const { getProductVariants } = useProductServices();
	const [preview, setPreview] = useState<ProductDeletionPreview | null>(null);
	const [previewError, setPreviewError] = useState<string | null>(null);
	const [isLoadingPreview, setIsLoadingPreview] = useState(false);

	const handleEdit = () => {
		openModal({
			title: 'Editar Presentación',
			content: ModalContent.productVariantEdit,
			dataToHandle: record
		});
	};

	/**
	 * Qué va a pasar con esta presentación, preguntado al abrir el aviso: la
	 * tabla no sabe cuántas presentaciones tiene el producto ni qué historial
	 * arrastra, y el aviso sale del mismo cálculo que hace el borrado
	 */
	/**
	 * La vista previa anterior no se borra al reabrir: se deja a la vista y se
	 * refresca por detrás, así el aviso no vuelve a nacer vacío. Es seguro
	 * porque no decide nada, el backend recalcula el plan al borrar
	 */
	const handlePopOpenChange = async (open: boolean) => {
		if (!open) return;

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
				if (onDeleted) {
					await onDeleted();
				} else {
					await getProductVariants(Object.fromEntries(searchParams.entries()));
				}
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
		if (!preview && isLoadingPreview) {
			return <DescriptionBox>Comprobando qué pasará...</DescriptionBox>;
		}

		// Sin vista previa no se puede decir qué va a pasar, así que tampoco se
		// deja confirmar: el botón Sí se apaga desde `canConfirmDelete`
		if (!preview) {
			return (
				<DescriptionBox>
					{previewError ?? 'No se pudo comprobar qué pasará si la eliminas'}.
					Cierra este aviso y vuelve a intentarlo.
				</DescriptionBox>
			);
		}

		/**
		 * El motivo lo redacta el backend y viaja en `blockedMessage`: es el mismo
		 * texto que lanza el borrado si se confirma de todas formas, así que el
		 * aviso y el error no pueden decir cosas distintas. Las unidades en stock y
		 * las transferencias sin aceptar salen las dos ahí cuando se dan juntas
		 */
		if (preview.mode === 'blocked') {
			return (
				<DescriptionBox>
					{preview.blockedMessage ??
						'No se puede eliminar la presentación todavía.'}
				</DescriptionBox>
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
			<DescriptionBox>
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
			</DescriptionBox>
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
