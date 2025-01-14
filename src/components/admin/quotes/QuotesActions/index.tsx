import { openDrawer } from '@/reducers/ui/uiSlice';
import TableActions from '../../common/TableActions';
import { useDispatch } from 'react-redux';
import { DrawerContent } from '@/types/enums';
import { AxiosError } from 'axios';
import { notification } from 'antd';
import { quoteServices } from '@/services/quoteServices';
import { removeQuote } from '@/reducers/quotes/quoteSlice';

const QuotesActions = ({ record }: { record: Quote }) => {
	const dispatch = useDispatch();

	const handleEdit = async () => {
		dispatch(
			openDrawer({
				title: `Editar Cotización - ${record.serialNumber}`,
				content: DrawerContent.quotes,
				dataToEdit: await quoteServices.getOneQuote({
					serialNumber: record.serialNumber,
					server: false
				})
			})
		);
	};

	const handleDelete = async () => {
		try {
			const res = await quoteServices.deleteQuote(record.id);
			if (res.status === 200) {
				dispatch(removeQuote(record.id));
				notification.success({
					message: res.data.message
				});
			}
		} catch (error) {
			console.error(error);
			const errorMsg =
				error instanceof AxiosError
					? error.response?.data.message
					: 'Ocurrió un error!';
			notification.error({ message: errorMsg });
		}
	};

	return (
		<TableActions
			onEdit={handleEdit}
			onDelete={handleDelete}
			popTitle={`${record.serialNumber} - ${record.customerName ?? 'Consumidor final'}`}
		/>
	);
};

export default QuotesActions;
