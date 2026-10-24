'use client';

import { ReactNode, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { GiCardboardBox } from 'react-icons/gi';
import CustomTable from '../../common/display-data/Table';
import GenerateStockReportButton from '../GenerateStockReportButton';
import { getStockStatusColor } from '@/hooks/utils';
import useStockItemService from '@/services/stock-item';
import { useSelector } from 'react-redux';
import { StockItemHistoryParams } from '@/libs/api/stock-item';
import { TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import useFilters from '@/hooks/useFilters';
import StockItemHistoryCols from './cols';

interface StockItemHistoryProps {
	searchParams: StockItemHistoryParams;
	children: ReactNode;
}

const StockItemHistory = ({
	searchParams,
	children
}: StockItemHistoryProps) => {
	const { fetchStockItemHistory, isLoading } = useStockItemService();
	const { stockItem, stockItemHistory, stockItemHistoryPagination } =
		useSelector((state: RootState) => state.stock);
	const { productName, productVariantName, quantity, maxQty, minQty } =
		stockItem ?? {};
	const { updateFilterParams, synchronizeFilters, tableFilters } = useFilters();
	const { stockItemsHistoryColumns } = StockItemHistoryCols({ tableFilters });
	const { shopSlug } = useParams();

	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	const filters = {
		stockItemId: searchParams.stockItemId,
		dateStart: searchParams.dateStart,
		dateEnd: searchParams.dateEnd,
		type: searchParams.type,
		identifier: searchParams.identifier
	};

	useEffect(() => {
		if (searchParams?.stockItemId) {
			fetchStockItemHistory({
				page,
				pageSize,
				...filters
			});
		}
	}, [page, pageSize, ...Object.values(filters)]);

	// Lleva los filtros de la URL al estado de las columnas, para que al recargar
	// sigan marcados los que están aplicados
	useEffect(() => {
		synchronizeFilters(filters, 'createdDate');
	}, [searchParams]);

	const statusColor =
		quantity !== undefined && maxQty !== undefined && minQty !== undefined
			? getStockStatusColor({
					quantity,
					maxQty,
					minQty
				})
			: '';

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		updateFilterParams(pagination, searchParams, filters);
	};

	return (
		<section className='flex flex-col gap-6'>
			<div>
				{children}
				<div className='flex justify-between items-center'>
					{stockItem ? (
						<div className='ps-4 mt-4'>
							<span className='inline-flex items-center gap-2 px-4 py-2 uppercase text-blue-600 font-bold border border-blue-600 rounded'>
								<GiCardboardBox size={18} />
								<h3>
									{productName} - {productVariantName}
								</h3>
							</span>
							<h2
								className={`mt-4 ps-2 ${statusColor} font-semibold`}
							>{`Actualmente ${quantity && quantity > 0 ? `${quantity} unidades en stock` : 'sin stock'}`}</h2>
						</div>
					) : null}
					{productName && productVariantName ? (
						<div className='self-end'>
							<GenerateStockReportButton
								shopSlug={shopSlug as string}
								history={stockItemHistory}
								product={{ productName, productVariantName }}
							/>
						</div>
					) : null}
				</div>
			</div>
			<CustomTable
				columns={stockItemsHistoryColumns}
				dataSource={stockItemHistory}
				isLoading={isLoading}
				scrollMinus={400}
				pagination={{
					current: stockItemHistoryPagination.page,
					pageSize: stockItemHistoryPagination.pageSize,
					total: stockItemHistoryPagination.total,
					showSizeChanger: true
				}}
				onChange={handleTableChange}
			/>
		</section>
	);
};

export default StockItemHistory;
