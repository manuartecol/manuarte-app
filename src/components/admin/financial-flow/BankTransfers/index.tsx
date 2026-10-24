import { useSelector } from 'react-redux';
import CustomTable from '../../common/display-data/Table';
import BankTransfersCols from './cols';
// El `DatePicker` de antd ya trabaja con dayjs, así que no hace falta el
// adaptador de moment (`generatePicker` más `rc-picker/lib/generate/moment`)
// que había aquí. El locale lo pone el `ConfigProvider` del layout raíz.
import { DatePicker } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

interface Props {
	isLoading: boolean;
	onChangeDate: (date: Dayjs) => void;
	selectedDate: Dayjs | null;
}

const BankTransfers = ({ isLoading, onChangeDate, selectedDate }: Props) => {
	const { bankTransferMovements } = useSelector(
		(state: RootState) => state.financialFlow
	);
	const { bankTransferMovementsColumns } = BankTransfersCols();

	return (
		<div className='space-y-4'>
			<div className='flex items-center gap-4 ps-3'>
				<DatePicker
					value={selectedDate || dayjs()}
					format={value => value.format('DD-MMM-YYYY').toUpperCase()}
					disabledDate={current => {
						return current && current > dayjs().endOf('day');
					}}
					onChange={onChangeDate}
					allowClear={false}
				/>
			</div>

			<CustomTable
				columns={bankTransferMovementsColumns}
				dataSource={isLoading ? [] : bankTransferMovements}
				isLoading={isLoading}
			/>
		</div>
	);
};

export default BankTransfers;
