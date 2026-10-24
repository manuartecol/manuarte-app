import { TableColumnsType, Tag } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { Dayjs } from 'dayjs';
import useTable from '@/hooks/useTable';
import { formatCurrency, formatDate } from '@/utils/formats';
import {
	BALANCE_MOVEMENT_CATEGORY_MAP,
	PAYMENT_METHOD_MAP
} from '@/utils/mappings';
import {
	COL_PAYMENT_METHOD_FILTER,
	ECU_PAYMENT_METHOD_FILTER
} from '../../consts';

interface Props {
	currency: string;
	tableFilters: Record<string, FilterValue | null>;
}

/**
 * `type`, `category` y el rango de fechas los filtra el backend, así que esas
 * columnas no llevan `onFilter`. El método de pago es la excepción: el endpoint
 * de movimientos no lo admite (solo `currency`, `type` y `category`), así que
 * su `onFilter` se queda, porque es el único filtro que tiene. Eso significa
 * que solo filtra la página que está en pantalla, no todo el historial.
 */
const BalanceCols = ({ currency, tableFilters }: Props) => {
	const { getColumnDateFilterProps } = useTable();

	const balanceMovementColumns: TableColumnsType<CustomerBalanceMovement> = [
		{
			title: 'TIPO',
			dataIndex: 'type',
			key: 'type',
			filteredValue: tableFilters.type || null,
			filters: [
				{
					text: 'Crédito',
					value: 'CREDIT'
				},
				{
					text: 'Débito',
					value: 'DEBIT'
				}
			],
			render: value => (
				<Tag color={value === 'CREDIT' ? '#10b981' : '#E53535'}>
					{value === 'CREDIT' ? 'CRÉDITO' : 'DÉBITO'}
				</Tag>
			),
			width: 100
		},
		{
			title: 'CATEGORÍA',
			dataIndex: 'category',
			key: 'category',
			filteredValue: tableFilters.category || null,
			filters: [
				{
					text: 'Abono',
					value: 'ADVANCE_PAYMENT'
				},
				{
					text: 'Reembolso',
					value: 'REFUND'
				},
				{
					text: 'Pago aplicado',
					value: 'PAYMENT_APPLIED'
				},
				{
					text: 'Ajuste',
					value: 'ADJUSTMENT'
				},
				{
					text: 'Otro',
					value: 'OTHER'
				}
			],
			render: value => (
				<Tag color='blue'>{BALANCE_MOVEMENT_CATEGORY_MAP[value]}</Tag>
			),
			width: 100
		},
		{
			title: 'MÉTODO DE PAGO',
			dataIndex: 'paymentMethod',
			key: 'paymentMethod',
			filteredValue: tableFilters.paymentMethod || null,
			filters:
				currency === 'COP'
					? COL_PAYMENT_METHOD_FILTER
					: ECU_PAYMENT_METHOD_FILTER,
			onFilter: (value, record) =>
				record.paymentMethod?.indexOf(value as string) === 0,
			render: value =>
				value ? <Tag color='blue'>{PAYMENT_METHOD_MAP[value]}</Tag> : '--',
			width: 100
		},
		{
			title: 'MONTO',
			dataIndex: 'amount',
			key: 'amount',
			render: (value, record: CustomerBalanceMovement) => (
				<span
					className={`${record.type === 'DEBIT' ? 'text-red-500' : 'text-green-500'}`}
				>
					{formatCurrency(value)}
				</span>
			),
			width: 100
		},
		{
			title: 'BALANCE ANTERIOR',
			dataIndex: 'balanceBefore',
			key: 'balanceBefore',
			render: value => <span>{formatCurrency(value)}</span>,
			width: 100
		},
		{
			title: 'BALANCE',
			dataIndex: 'balanceAfter',
			key: 'balanceAfter',
			render: value => <span>{formatCurrency(value)}</span>,
			width: 100
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
			render: value => <span>{formatDate(value)}</span>,
			width: 120
		}
	];

	return { balanceMovementColumns };
};

export default BalanceCols;
