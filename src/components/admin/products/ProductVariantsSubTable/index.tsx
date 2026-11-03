import { Table } from 'antd';
import { productVariantNestedColumns } from '../TabsTableProducts/cols';

/**
 * Las presentaciones de un producto, dentro de su fila desplegada. Es una
 * `Table` de antd y no el `CustomTable` del panel porque aquí no hay que medir
 * alto ni paginar: son todas las presentaciones del producto.
 *
 * Va dentro de una tarjeta con filete a la izquierda y aire por abajo: a ras
 * del fondo no se veía dónde acababa un producto y empezaba el siguiente
 */
const ProductVariantsSubTable = ({
	product,
	onDeleted
}: {
	product: ProductWithVariants;
	onDeleted: () => Promise<void>;
}) => (
	<div className='my-2 ms-6 rounded-lg border border-gray-200 border-s-4 border-s-blue-400 bg-white p-3 shadow-sm'>
		<p className='mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400'>
			Presentaciones de {product.name}
		</p>
		<Table<NestedProductVariant>
			columns={productVariantNestedColumns(product, onDeleted)}
			dataSource={product.productVariants}
			rowKey='id'
			size='small'
			pagination={false}
			locale={{ emptyText: 'Este producto no tiene presentaciones' }}
		/>
	</div>
);

export default ProductVariantsSubTable;
