import useTable from '@/hooks/useTable';
import { FilterValue } from 'antd/es/table/interface';
import CopyableText from '../../common/ui/CopyableText';
import { QRCode, Space, TableColumnsType, Tooltip } from 'antd';
import { MdCheckCircle, MdRemoveCircle } from 'react-icons/md';
import { formatDate, formatToTitleCase } from '@/utils/formats';
import ProductActions from '../ProductActions';
import ProductCategoryActions from '../ProductCategoryActions';

const ProductCols = ({
	tableFilters,
	showStatus = false
}: {
	tableFilters?: Record<string, FilterValue | null>;
	showStatus?: boolean;
}) => {
	const { getColumnSearchProps } = useTable();

	const productVariantColumns: TableColumnsType<ProductVariant> = [
		{
			title: '#',
			dataIndex: 'vId',
			key: 'vId',
			filteredValue: tableFilters?.vId || null,
			...getColumnSearchProps('vId'),
			// Con "Todas", el estado va junto al vId: su ancho es fijo y sobra espacio
			render: (value, record) =>
				showStatus ? (
					<span className='flex items-center gap-1.5'>
						{record.active ? (
							<Tooltip title='Activa'>
								<span className='flex'>
									<MdCheckCircle
										size={16}
										className='shrink-0 text-emerald-500'
									/>
								</span>
							</Tooltip>
						) : (
							<Tooltip title='Inactiva'>
								<span className='flex'>
									<MdRemoveCircle
										size={16}
										className='shrink-0 text-amber-500'
									/>
								</span>
							</Tooltip>
						)}
						<CopyableText text={value} />
					</span>
				) : (
					<CopyableText text={value} />
				),
			width: 105
		},
		{
			title: 'NOMBRE',
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
			render: value => formatToTitleCase(value),
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
			title: 'FECHA DE CREACIÓN',
			dataIndex: 'createdDate',
			key: 'createdDate',
			render: (value: string) => (
				<span>{value ? formatDate(value) : '--'}</span>
			),
			width: 150
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

	return { productVariantColumns, productCategoryColumns };
};

export default ProductCols;
