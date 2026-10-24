import { DollarCircleOutlined } from '@ant-design/icons';
import useTable from '@/hooks/useTable';
import { TableColumnsType, Tag } from 'antd';
import { formatCurrency } from '@/utils/formats';
import CopyableText from '../../common/ui/CopyableText';
import { useParams } from 'next/navigation';
import { PAYMENT_METHOD_MAP } from '@/utils/mappings';
import { PaymentMethod } from '@/types/enums';
import {
	COL_PAYMENT_METHOD_FILTER,
	ECU_PAYMENT_METHOD_FILTER
} from '../../consts';

const BankTransfersCols = () => {
	const { getColumnSearchProps } = useTable();
	const params = useParams();

	const bankTransferMovementsColumns: TableColumnsType<BankTransferMovement> = [
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
			// del día completos y no manda los filtros al backend. Sin él la búsqueda
			// no llevaba `onFilter` y no filtraba nada
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
		},
		{
			title: 'MÉTODO DE PAGO',
			dataIndex: 'paymentMethod',
			key: 'paymentMethod',
			filters: !params?.shopSlug?.includes('quito')
				? COL_PAYMENT_METHOD_FILTER.filter(
						pm =>
							pm.value !== PaymentMethod.CASH &&
							pm.value !== PaymentMethod.BALANCE
					)
				: ECU_PAYMENT_METHOD_FILTER.filter(
						pm =>
							pm.value !== PaymentMethod.CASH &&
							pm.value !== PaymentMethod.BALANCE
					),
			onFilter: (value, record) =>
				record.paymentMethod.indexOf(value as string) === 0,
			render: (value: string) => (
				<Tag color='blue'>{PAYMENT_METHOD_MAP[value] ?? '--'}</Tag>
			),
			width: 200
		},
		{
			title: 'OBSERVACIONES',
			dataIndex: 'comments',
			key: 'comments',
			render: (value: string) => value ?? '--'
		}
	];

	return { bankTransferMovementsColumns };
};

export default BankTransfersCols;
