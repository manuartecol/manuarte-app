import { useDrawerStore } from '@/stores/drawerStore';
import TableActions from '../../common/ui/TableActions';
import { DrawerContent } from '@/types/enums';
import { TRANSACTION_TYPES_MAP } from '@/utils/mappings';

const StockItemsHistoryActions = ({ record }: { record: StockItemHistory }) => {
	const { openDrawer } = useDrawerStore.getState();

	const handleShowDetails = () => {
		openDrawer({
			title: TRANSACTION_TYPES_MAP[record?.type] ?? 'Factura',
			content: DrawerContent.transactionHistoryDetails,
			dataToHandle: record
		});
	};

	return <TableActions onShowDetails={handleShowDetails} />;
};

export default StockItemsHistoryActions;
