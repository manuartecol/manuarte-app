'use client';
import CustomTable from '../../common/display-data/Table';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { shopServices } from '@/services/shopServices';
import { setShops } from '@/reducers/shops/shopSlice';
import QuoteCols from './cols';
import useQuoteService from '@/services/quote';
import useFilters from '@/hooks/useFilters';
import { QuoteParams } from '@/libs/api/quote';
import { TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';

interface Props {
	searchParams: QuoteParams;
}

const QuotesTable = ({ searchParams }: Props) => {
	const { shops } = useSelector((state: RootState) => state.shop);
	const { quotes, quotesPagination } = useSelector(
		(state: RootState) => state.quote
	);
	const dispatch = useDispatch();
	const { getQuotes, isLoading } = useQuoteService();
	const { updateFilterParams, synchronizeFilters, tableFilters } = useFilters();
	const { quoteColumns } = QuoteCols({ tableFilters });

	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	const filters = {
		shopId: searchParams.shopId,
		serialNumber: searchParams.serialNumber,
		status: searchParams.status,
		customerName: searchParams.customerName,
		dateStart: searchParams.dateStart,
		dateEnd: searchParams.dateEnd
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
		synchronizeFilters(filters, 'createdDate');
	}, [searchParams]);

	useEffect(() => {
		fetchShops();
		getQuotes({ page, pageSize, ...filters });
	}, [page, pageSize, ...Object.values(filters)]);

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		updateFilterParams(pagination, searchParams, filters);
	};

	return (
		<CustomTable
			columns={quoteColumns}
			dataSource={quotes}
			isLoading={isLoading}
			pagination={{
				current: quotesPagination.page,
				pageSize: quotesPagination.pageSize,
				total: quotesPagination.total,
				showSizeChanger: true
			}}
			onChange={handleTableChange}
		/>
	);
};

export default QuotesTable;
