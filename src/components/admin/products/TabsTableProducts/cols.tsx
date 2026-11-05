import useTable from '@/hooks/useTable';
import { FilterValue } from 'antd/es/table/interface';
import CopyableText from '../../common/ui/CopyableText';
import { QRCode, Space, Tag, TableColumnsType, Tooltip } from 'antd';
import {
	MdCheckCircle,
	MdKeyboardArrowDown,
	MdRemoveCircle
} from 'react-icons/md';
import { formatToTitleCase } from '@/utils/formats';
import { isStructuredVariant } from '../../utils';
import ProductActions from '../ProductActions';
import ProductCategoryActions from '../ProductCategoryActions';
import ProductRowActions from '../ProductRowActions';

// El estado junto al código: su ancho es fijo y sobra espacio
const StatusIcon = ({ active }: { active: boolean }) =>
	active ? (
		<Tooltip title='Activa'>
			<span className='flex'>
				<MdCheckCircle size={16} className='shrink-0 text-emerald-500' />
			</span>
		</Tooltip>
	) : (
		<Tooltip title='Inactiva'>
			<span className='flex'>
				<MdRemoveCircle size={16} className='shrink-0 text-amber-500' />
			</span>
		</Tooltip>
	);

/**
 * Las presentaciones dentro de la fila de su producto. Sin buscador por columna
 * ni QR: para eso está la pestaña Presentaciones, que es la vista operativa
 */
export const productVariantNestedColumns = (
	product: ProductWithVariants,
	onDeleted: () => Promise<void>
): TableColumnsType<NestedProductVariant> => [
	{
		title: '#',
		dataIndex: 'vId',
		key: 'vId',
		render: (value: string, record) => (
			<span className='flex items-center gap-1.5'>
				<StatusIcon active={record.active} />
				<CopyableText text={value} />
			</span>
		),
		width: 150
	},
	{
		title: 'PRESENTACIÓN',
		dataIndex: 'name',
		key: 'name',
		// Las estructuradas van tal cual: el backend ya las compone bien escritas,
		// y titularlas estropea "Bolsa x 50 g" y "1 lt"
		render: (value: string, record) =>
			isStructuredVariant(record) ? value : formatToTitleCase(value),
		width: 220
	},
	{
		// Activas sobre el total donde existe: un 0 a secas no distingue "no está
		// en ninguna bodega" de "está en cuatro y desactivada en todas"
		title: 'BODEGAS',
		dataIndex: 'stockIds',
		key: 'stockIds',
		render: (value: string[], record) => {
			const active = value?.length ?? 0;
			const total = Number(record.stocksCount ?? 0);

			if (total === 0) {
				return (
					<Tooltip title='No está creada en ninguna bodega'>
						<span className='text-gray-400'>--</span>
					</Tooltip>
				);
			}

			return (
				<Tooltip
					title={
						active === 0
							? `Creada en ${total} ${total === 1 ? 'bodega' : 'bodegas'}, desactivada en todas`
							: `Activa en ${active} de ${total} ${total === 1 ? 'bodega' : 'bodegas'}`
					}
				>
					<span className={active === 0 ? 'text-amber-600' : undefined}>
						{active} / {total}
					</span>
				</Tooltip>
			);
		},
		width: 110
	},
	{
		title: 'ACCIONES',
		key: 'actions',
		className: 'actions',
		render: (_, record) => (
			<ProductActions
				record={{
					...record,
					productName: product.name,
					// La categoría del producto: el formulario de edición la usa para
					// decidir si el campo se llama Cantidad o Capacidad
					productCategoryId: product.productCategoryId
				}}
				onDeleted={onDeleted}
			/>
		),
		width: 100
	}
];

const ProductCols = ({
	tableFilters,
	productTableFilters,
	expandedProductIds = [],
	onToggleProduct,
	showStatus = false
}: {
	tableFilters?: Record<string, FilterValue | null>;
	productTableFilters?: Record<string, FilterValue | null>;
	expandedProductIds?: string[];
	onToggleProduct?: (productId: string) => void;
	showStatus?: boolean;
}) => {
	const { getColumnSearchProps } = useTable();

	const productColumns: TableColumnsType<ProductWithVariants> = [
		{
			title: '#',
			dataIndex: 'pId',
			key: 'pId',
			filteredValue: productTableFilters?.pId || null,
			...getColumnSearchProps('pId'),
			// Copiar el código no debe desplegar la fila de paso, y el cursor no
			// debe prometer un clic que aquí está bloqueado
			onCell: () => ({
				onClick: (event: React.MouseEvent) => event.stopPropagation(),
				style: { cursor: 'default' }
			}),
			render: (value: string) => <CopyableText text={value} />,
			width: 110
		},
		{
			title: 'PRODUCTO',
			dataIndex: 'name',
			key: 'productName',
			filteredValue: productTableFilters?.productName || null,
			...getColumnSearchProps('productName'),
			width: 220
		},
		{
			title: 'DESCRIPCIÓN',
			dataIndex: 'description',
			key: 'productDescription',
			filteredValue: productTableFilters?.productDescription || null,
			...getColumnSearchProps('productDescription'),
			render: (value: string | null) => value ?? '--',
			width: 180
		},
		{
			title: 'CATEGORÍA',
			dataIndex: 'productCategoryName',
			key: 'productCategoryName',
			filteredValue: productTableFilters?.productCategoryName || null,
			...getColumnSearchProps('productCategoryName'),
			width: 180
		},
		{
			title: 'PRESENTACIONES',
			dataIndex: 'variantsCount',
			key: 'variantsCount',
			/**
			 * El chevron es la señal de que la fila se despliega, y además es un
			 * botón de verdad: la fila entera responde al ratón, pero sin un control
			 * enfocable no habría forma de desplegar con el teclado
			 */
			render: (value: number, record) =>
				value > 0 ? (
					<span className='flex items-center gap-1'>
						<Tag color='blue' className='!me-0'>
							{value}
						</Tag>
						<button
							type='button'
							aria-expanded={expandedProductIds.includes(record.id)}
							aria-label={
								expandedProductIds.includes(record.id)
									? 'Ocultar presentaciones'
									: 'Ver presentaciones'
							}
							onClick={event => {
								// La fila ya alterna por su cuenta: sin esto se alternaría dos
								// veces y se quedaría como estaba
								event.stopPropagation();
								onToggleProduct?.(record.id);
							}}
							className='flex items-center text-gray-400 hover:text-gray-600'
						>
							<MdKeyboardArrowDown
								size={18}
								className={`shrink-0 transition-transform ${
									expandedProductIds.includes(record.id) ? 'rotate-180' : ''
								}`}
							/>
						</button>
					</span>
				) : (
					<Tooltip title='Este producto no tiene ninguna presentación, así que no se puede vender'>
						<Tag color='orange'>Sin presentaciones</Tag>
					</Tooltip>
				),
			width: 140
		},
		{
			title: 'ACCIONES',
			key: 'actions',
			className: 'actions',
			// El clic en un botón no debe desplegar la fila de paso, y el cursor no
			// debe prometer un clic que aquí está bloqueado
			onCell: () => ({
				onClick: (event: React.MouseEvent) => event.stopPropagation(),
				style: { cursor: 'default' }
			}),
			render: (_, record) => <ProductRowActions record={record} />,
			width: 100
		}
	];

	const productVariantColumns: TableColumnsType<ProductVariant> = [
		{
			title: '#',
			dataIndex: 'vId',
			key: 'vId',
			filteredValue: tableFilters?.vId || null,
			...getColumnSearchProps('vId'),
			render: (value, record) =>
				showStatus ? (
					<span className='flex items-center gap-1.5'>
						<StatusIcon active={record.active} />
						<CopyableText text={value} />
					</span>
				) : (
					<CopyableText text={value} />
				),
			width: 105
		},
		{
			title: 'PRODUCTO',
			dataIndex: 'productName',
			key: 'productName',
			filteredValue: tableFilters?.productName || null,
			...getColumnSearchProps('productName'),
			width: 150
		},
		{
			title: 'PRESENTACIÓN',
			dataIndex: 'name',
			key: 'name',
			filteredValue: tableFilters?.name || null,
			...getColumnSearchProps('name'),
			render: (value, record) =>
				isStructuredVariant(record) ? value : formatToTitleCase(value),
			width: 140
		},
		{
			title: 'DESCRIPCIÓN',
			dataIndex: 'productDescription',
			key: 'productDescription',
			filteredValue: tableFilters?.productDescription || null,
			...getColumnSearchProps('productDescription'),
			width: 150
		},

		{
			title: 'CATEGORÍA',
			dataIndex: 'productCategoryName',
			key: 'productCategoryName',
			filteredValue: tableFilters?.productCategoryName || null,
			...getColumnSearchProps('productCategoryName'),
			width: 150
		},
		{
			title: 'CÓDIGO QR',
			dataIndex: 'vId',
			key: 'vId',
			render: (value: string) => {
				return (
					<Space align='center'>
						<QRCode value={value || 'NO vID'} size={80} />
					</Space>
				);
			},
			width: 100
		},
		{
			title: 'ACCIONES',
			key: 'actions',
			className: 'actions',
			render: (_, record: ProductVariant) => <ProductActions record={record} />,
			width: 100
		}
	];

	const productCategoryColumns: TableColumnsType<ProductCategory> = [
		{
			title: '#',
			dataIndex: 'cId',
			key: 'cId',
			...getColumnSearchProps('cId', true),
			width: 50
		},
		{
			title: 'NOMBRE',
			dataIndex: 'name',
			key: 'name',
			...getColumnSearchProps('name', true),
			width: 200
		},
		{
			title: 'GRUPO',
			dataIndex: 'groupName',
			key: 'groupName',
			...getColumnSearchProps('groupName', true),
			render: (value: string) => value ?? '--',
			width: 150
		},
		{
			title: 'PRODUCTOS',
			dataIndex: 'productsCount',
			key: 'productsCount',
			render: (value?: number) => value ?? '--',
			width: 110
		},
		{
			title: 'ACCIONES',
			key: 'actions',
			className: 'actions',
			render: (_, record: ProductCategory) => (
				<ProductCategoryActions record={record} />
			),
			width: 100
		}
	];

	return { productColumns, productVariantColumns, productCategoryColumns };
};

export default ProductCols;
