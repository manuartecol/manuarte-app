import { TableColumnsType, Tag, Tooltip } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { Dayjs } from 'dayjs';
import { IoInformationCircleOutline } from 'react-icons/io5';
import { TiArrowDown, TiArrowUp } from 'react-icons/ti';
import CopyableText from '../../common/ui/CopyableText';
import StockItemsHistoryActions from '../StockItemHistoryActions';
import useTable from '@/hooks/useTable';
import { formatDate, formatToTitleCase } from '@/utils/formats';
import { TRANSACTION_TYPES_MAP } from '@/utils/mappings';
import { TAG_COLORS } from '../../consts';

interface Props {
	tableFilters: Record<string, FilterValue | null>;
}

/**
 * Los tres filtros los resuelve el backend (`type`, `identifier` y el rango de
 * fechas), así que ninguna columna lleva `onFilter` y el estado llega por
 * `filteredValue` desde la URL, como en facturas y movimientos.
 */
const StockItemHistoryCols = ({ tableFilters }: Props) => {
	const { getColumnDateFilterProps, getColumnSearchProps } = useTable();

	const stockItemsHistoryColumns: TableColumnsType<StockItemHistory> = [
		{
			title: 'FECHA',
			dataIndex: 'createdDate',
			key: 'createdDate',
			filteredValue: tableFilters.createdDate || null,
			...getColumnDateFilterProps(
				'createdDate',
				false,
				tableFilters.createdDate as [Dayjs | null, Dayjs | null] | null
			),
			render: (value: string) => (
				<span>{value ? formatDate(value) : '--'}</span>
			),
			width: 100
		},
		{
			title: 'TIPO',
			dataIndex: 'type',
			key: 'type',
			filteredValue: tableFilters.type || null,
			filters: [
				{
					text: 'Entrada',
					value: 'ENTER'
				},
				{
					text: 'Salida',
					value: 'EXIT'
				},
				{
					text: 'Transferencia',
					value: 'TRANSFER'
				},
				{
					text: 'Factura',
					value: 'BILLING'
				}
			],
			render: (value, record) => {
				const toolTipTitle = `De ${record.fromName} a ${record.toName} `;

				return (
					<span className='flex items-center'>
						<Tag color={TAG_COLORS[value]}>
							{value === 'BILLING' ? 'Factura' : TRANSACTION_TYPES_MAP[value]}
						</Tag>
						{record?.fromName && record?.toName ? (
							<Tooltip title={toolTipTitle}>
								<span>
									<IoInformationCircleOutline size={18} />
								</span>
							</Tooltip>
						) : null}
					</span>
				);
			},
			width: 100
		},
		{
			title: 'IDENTIFICADOR',
			dataIndex: 'identifier',
			key: 'identifier',
			filteredValue: tableFilters.identifier || null,
			...getColumnSearchProps('identifier'),
			render: value =>
				value ? (
					<CopyableText text={formatToTitleCase(value) as string} />
				) : (
					'--'
				),
			width: 140
		},
		{
			title: 'STOCK ANTES',
			dataIndex: 'stockBefore',
			key: 'stockBefore',
			render: (value: string) => value ?? '--',
			width: 80,
			align: 'center'
		},
		{
			title: 'CANTIDAD',
			dataIndex: 'quantity',
			key: 'quantity',
			render: (value: string) => value ?? '--',
			width: 80,
			align: 'center'
		},
		{
			title: 'STOCK DESPUÉS',
			dataIndex: 'stockAfter',
			key: 'stockAfter',
			render: (_, record) => {
				const stockAfter =
					record.type === 'ENTER'
						? Number(record.stockBefore) + Number(record.quantity)
						: Number(record.stockBefore) - Number(record.quantity);

				const arrow =
					record.type === 'ENTER' ? (
						<TiArrowUp size={20} color='#10b981' />
					) : (
						<TiArrowDown size={20} color='#E53535' />
					);

				return (
					<span className='flex justify-center items-center'>
						{stockAfter ?? '--'}
						{arrow}
					</span>
				);
			},
			width: 80,
			align: 'center'
		},
		{
			title: 'ACCIONES',
			key: 'actions',
			className: 'actions',
			render: (_: any, record: StockItemHistory) => (
				<StockItemsHistoryActions record={record} />
			),
			width: 70,
			align: 'center'
		}
	];

	return { stockItemsHistoryColumns };
};

export default StockItemHistoryCols;
