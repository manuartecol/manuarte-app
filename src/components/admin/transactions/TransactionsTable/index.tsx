'use client';

import { useEffect } from 'react';
import CustomTable from '../../common/display-data/Table';
import { useDispatch, useSelector } from 'react-redux';
import { shopServices } from '@/services/shopServices';
import { setShops } from '@/reducers/shops/shopSlice';
import useTransactionService from '@/services/transaction';
import { TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { TransactionParams } from '@/libs/api/transaction';
import useFilters from '@/hooks/useFilters';
import TransactionCols from './cols';

const TransactionsTable = ({
	searchParams
}: {
	searchParams: TransactionParams;
}) => {
	const { shops } = useSelector((state: RootState) => state.shop);
	const { transactions, transactionsPagination } = useSelector(
		(state: RootState) => state.transaction
	);
	const { fetchTransactions, isLoading } = useTransactionService();
	const { updateFilterParams, synchronizeFilters, tableFilters } = useFilters();
	const { transactionsColumns } = TransactionCols({ tableFilters });
	const dispatch = useDispatch();

	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	const filters = {
		state: searchParams.state,
		type: searchParams.type,
		stockId: searchParams.stockId,
		fromId: searchParams.fromId,
		toId: searchParams.toId,
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
		fetchShops();
		fetchTransactions({ page, pageSize, ...filters });
	}, [page, pageSize, ...Object.values(filters)]);

	// Lleva los filtros de la URL al estado de las columnas. Sin esto, al recargar
	// los datos salían filtrados pero los checkboxes aparecían desmarcados
	useEffect(() => {
		synchronizeFilters(filters, 'createdDate');
	}, [searchParams]);

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		updateFilterParams(pagination, searchParams, filters);
	};

	return (
		<CustomTable
			columns={transactionsColumns}
			dataSource={transactions}
			isLoading={isLoading}
			pagination={{
				current: transactionsPagination.page,
				pageSize: transactionsPagination.pageSize,
				total: transactionsPagination.total,
				showSizeChanger: true
			}}
			onChange={handleTableChange}
		/>
	);
};

export default TransactionsTable;
