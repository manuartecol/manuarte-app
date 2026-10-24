import { Badge, TableColumnsType, Tag } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { Dayjs } from 'dayjs';
import { CheckCircleOutlined } from '@ant-design/icons';
import TransactionActions from '../TransactionAction';
import useTable from '@/hooks/useTable';
import { formatDate } from '@/utils/formats';
import { TAG_COLORS } from '../../consts';
import {
	TRANSACTION_STATES_MAP,
	TRANSACTION_TYPES_MAP
} from '@/utils/mappings';

interface Props {
	tableFilters: Record<string, FilterValue | null>;
}

/**
 * Los filtros los resuelve el backend, así que las columnas no llevan
 * `onFilter` y el estado de cada filtro llega por `filteredValue`, igual que en
 * facturas.
 *
 * Antes las cuatro columnas tenían `onFilter`, y antd filtraba además en el
 * cliente: al marcar un filtro lo aplicaba en el acto a las filas viejas de la
 * página, y si ninguna coincidía se veía la tabla vacía hasta que llegaba la
 * respuesta del servidor. Y sin `filteredValue`, al recargar los datos salían
 * filtrados (la petición usa la URL) pero el checkbox aparecía desmarcado,
 * porque antd arrancaba su estado interno vacío.
 */
const TransactionCols = ({ tableFilters }: Props) => {
	const { getColumnDateFilterProps } = useTable();

	const transactionsColumns: TableColumnsType<Transaction> = [
		{
			title: 'ESTADO',
			dataIndex: 'state',
			key: 'state',
			filteredValue: tableFilters.state || null,
			filters: [
				{
					text: 'Realizado',
					value: 'SUCCESS'
				},
				{
					text: 'En Progreso',
					value: 'PROGRESS'
				}
			],
			render: value => {
				return (
					<span className='flex items-center gap-1'>
						{TRANSACTION_STATES_MAP[value]}
						<Badge
							count={
								<CheckCircleOutlined
									style={{ color: value === 'SUCCESS' ? '#10b981' : '#808080' }}
								/>
							}
						/>
					</span>
				);
			},
			width: 120
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
				}
			],
			render: value => {
				return (
					<span className='flex items-center'>
						<Tag color={TAG_COLORS[value]}>{TRANSACTION_TYPES_MAP[value]}</Tag>
					</span>
				);
			},
			width: 120
		},
		{
			title: 'ORIGEN',
			dataIndex: 'fromId',
			key: 'fromId',
			filteredValue: tableFilters.fromId || null,
			filters: [
				{
					text: 'Fabrica Cascajal',
					value: '6de3518b-a625-4b3e-8907-782ab0bda193'
				},
				{
					text: 'Barranquilla',
					value: '8340352a-1202-4a2d-93c1-d9c267ac339d'
				},
				{
					text: 'Cartagena',
					value: '5f5940d4-669b-47fc-a2a7-68e222a75b98'
				},
				{
					text: 'Quito',
					value: '59999031-e678-4d76-849f-38489365aab0'
				}
			],
			render: (_value: string, record) => record?.fromName ?? '--',
			width: 120
		},
		{
			title: 'DESTINO',
			dataIndex: 'toId',
			key: 'toId',
			filteredValue: tableFilters.toId || null,
			filters: [
				{
					text: 'Fabrica Cascajal',
					value: '6de3518b-a625-4b3e-8907-782ab0bda193'
				},
				{
					text: 'Barranquilla',
					value: '8340352a-1202-4a2d-93c1-d9c267ac339d'
				},
				{
					text: 'Cartagena',
					value: '5f5940d4-669b-47fc-a2a7-68e222a75b98'
				},
				{
					text: 'Quito',
					value: '59999031-e678-4d76-849f-38489365aab0'
				}
			],
			render: (_value: string, record) => record?.toName ?? '--',
			width: 120
		},
		{
			title: 'DESCRIPCIÓN',
			dataIndex: 'description',
			key: 'description',
			render: (value: string) =>
				value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : '--',
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
			title: 'ACCIONES',
			key: 'actions',
			className: 'actions',
			render: (_, record: Transaction) => (
				<TransactionActions record={record} />
			),
			width: 100,
			align: 'center'
		}
	];

	return { transactionsColumns };
};

export default TransactionCols;
