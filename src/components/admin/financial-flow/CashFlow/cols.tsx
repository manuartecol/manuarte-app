import { TableColumnsType, Tag, Tooltip } from 'antd';
import { DollarCircleOutlined } from '@ant-design/icons';
import { IoInformationCircleOutline } from 'react-icons/io5';
import CopyableText from '../../common/ui/CopyableText';
import useTable from '@/hooks/useTable';
import { CASH_MOVEMENT_CAT_FILTER } from '../../consts';
import { CASH_MOVEMENT_CAT_MAP } from '@/utils/mappings';
import { formatCurrency } from '@/utils/formats';

const CashMovementCols = () => {
	const { getColumnSearchProps } = useTable();

	const cashMovementsColumns: TableColumnsType<CashMovement> = [
		{
			title: 'TIPO',
			dataIndex: 'type',
			key: 'type',
			filters: [
				{ text: 'INGRESO', value: 'INCOME' },
				{ text: 'EGRESO', value: 'EXPENSE' }
			],
			onFilter: (value, record) => record.type.indexOf(value as string) === 0,
			render: value => {
				return (
					<span className='flex items-center justify-center'>
						<DollarCircleOutlined
							style={{ color: value === 'INCOME' ? '#10b981' : '#E53535' }}
						/>
					</span>
				);
			},
			width: 80,
			align: 'center'
		},
		{
			title: 'CATEGORÍA',
			dataIndex: 'category',
			key: 'category',
			filters: CASH_MOVEMENT_CAT_FILTER,
			onFilter: (value, record) =>
				record.category.indexOf(value as string) === 0,
			render: (value, record) => {
				return (
					<span className='flex items-center'>
						<Tag color='blue'>{CASH_MOVEMENT_CAT_MAP[value]}</Tag>
						{record?.comments && (
							<Tooltip title={record?.comments}>
								<span>
									<IoInformationCircleOutline size={18} />
								</span>
							</Tooltip>
						)}
					</span>
				);
			},
			width: 160
		},
		{
			title: 'MONTO',
			dataIndex: 'amount',
			key: 'amount',
			render: (value: number, record) => (
				<span
					className={`${record.type === 'INCOME' ? 'text-[#10b981]' : 'text-[#E53535]'}`}
				>
					{formatCurrency(value) ?? '--'}
				</span>
			),
			width: 120
		},
		{
			title: 'CLIENTE',
			dataIndex: 'customerName',
			key: 'customerName',
			// `true` porque esta tabla filtra en el cliente: carga los movimientos
			// de la caja completos y no manda los filtros al backend. Sin él la
			// búsqueda no llevaba `onFilter` y no filtraba nada
			...getColumnSearchProps('customerName', true),
			render: (value: string) => (value ? <CopyableText text={value} /> : '--'),
			width: 160
		},
		{
			title: 'REFERENCIA',
			dataIndex: 'reference',
			key: 'reference',
			...getColumnSearchProps('reference', true),
			render: (value: string) => (value ? <CopyableText text={value} /> : '--'),
			width: 160
		}
	];

	return { cashMovementsColumns };
};

export default CashMovementCols;
