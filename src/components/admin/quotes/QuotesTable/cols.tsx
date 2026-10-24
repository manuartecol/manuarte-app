import { Button, TableColumnsType } from 'antd';
import CopyableText from '../../common/ui/CopyableText';
import useTable from '@/hooks/useTable';
import { QUOTE_STATUS_MAP } from '@/utils/mappings';
import { formatDate, formatToTitleCase } from '@/utils/formats';
import Link from 'next/link';
import { BsFileEarmarkPdf } from 'react-icons/bs';
import QuotesActions from '../QuotesActions';
import { usePathname } from 'next/navigation';
import { FilterValue } from 'antd/es/table/interface';
import { Dayjs } from 'dayjs';

const QuoteCols = ({
	tableFilters
}: {
	tableFilters: Record<string, FilterValue | null>;
}) => {
	const { getColumnSearchProps, getColumnDateFilterProps } = useTable();
	const pathname = usePathname();

	const quoteColumns: TableColumnsType<Quote> = [
		{
			title: 'SERIAL',
			dataIndex: 'serialNumber',
			key: 'serialNumber',
			filteredValue: tableFilters.serialNumber || null,
			...getColumnSearchProps('serialNumber'),
			render: value => <CopyableText text={value} />,
			width: 180
		},
		{
			title: 'ESTADO',
			dataIndex: 'status',
			key: 'status',
			filteredValue: tableFilters.status || null,
			filters: [
				{
					text: 'POR PAGAR',
					value: 'PENDING'
				},
				{
					text: 'ACEPTADA',
					value: 'ACCEPTED'
				},
				{
					text: 'CANCELADA',
					value: 'CANCELED'
				},
				{
					text: 'EN REVISIÓN',
					value: 'REVISION'
				},
				{
					text: 'VENCIDA',
					value: 'OVERDUE'
				}
			],
			// Sin `onFilter`: el estado lo filtra el backend. Con él, antd lo aplicaba
			// también a las filas que ya estaban en pantalla y se veía la tabla vacía
			// hasta que llegaba la respuesta del servidor
			render: value => QUOTE_STATUS_MAP[value],
			width: 140
		},
		{
			title: 'CLIENTE',
			dataIndex: 'customerName',
			key: 'customerName',
			filteredValue: tableFilters.customerName || null,
			...getColumnSearchProps('customerName'),
			render: (value: string = 'Consumidor final') =>
				value ? formatToTitleCase(value) : 'Consumidor final',
			width: 300
		},
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
			width: 140
		},
		{
			title: 'PDF',
			dataIndex: 'id',
			key: 'id',
			render: (value: string, record: Quote) => {
				return (
					<span>
						{value ? (
							<Link href={`${pathname}/${record.serialNumber}`}>
								<Button
									variant='filled'
									color='danger'
									icon={
										<BsFileEarmarkPdf
											size={24}
											style={{ display: 'flex', alignItems: 'center' }}
										/>
									}
								/>
							</Link>
						) : (
							'--'
						)}
					</span>
				);
			},
			width: 100
		},
		{
			title: 'ACCIONES',
			key: 'actions',
			className: 'actions',
			render: (_, record: Quote) => <QuotesActions record={record} />,
			width: 140
		}
	];

	return { quoteColumns };
};

export default QuoteCols;
