'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CustomTable from '../../common/display-data/Table';
import { shopServices } from '@/services/shopServices';
import { setShops } from '@/reducers/shops/shopSlice';
import { StockItemParams } from '@/libs/api/stock-item';
import useStockItemService from '@/services/stock-item';
import { TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import useFilters from '@/hooks/useFilters';
import StockItemCols from './cols';

const StockItemsTable = ({
	searchParams
}: {
	searchParams: StockItemParams;
}) => {
	const { shops } = useSelector((state: RootState) => state.shop);
	const { stockItems, stockItemsPagination } = useSelector(
		(state: RootState) => state.stock
	);
	const { fetchStockItems, isLoading } = useStockItemService();
	const { updateFilterParams, synchronizeFilters, tableFilters } = useFilters();
	const { stockItemsColumns } = StockItemCols({ tableFilters });
	const dispatch = useDispatch();

	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	const filters = {
		stockId: searchParams.stockId,
		productName: searchParams.productName,
		productVariantName: searchParams.productVariantName
	};

	const fetchShops = async () => {
		if (shops?.length === 0) {
			const data = await shopServices.getAll(false);
			if (data) {
				dispatch(setShops(data));
			}
		}
	};

	useEffect(() => {
		synchronizeFilters(filters);
	}, [searchParams]);

	useEffect(() => {
		fetchShops();
		fetchStockItems({ page, pageSize, ...filters });
	}, [page, pageSize, ...Object.values(filters)]);

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		updateFilterParams(pagination, searchParams, filters);
	};

	return (
		<CustomTable
			columns={stockItemsColumns}
			dataSource={stockItems}
			isLoading={isLoading}
			pagination={{
				current: stockItemsPagination.page,
				pageSize: stockItemsPagination.pageSize,
				total: stockItemsPagination.total,
				showSizeChanger: true
			}}
			onChange={handleTableChange}
		/>
	);
};

export default StockItemsTable;
