'use client';
import { useEffect } from 'react';
import CustomTable from '../../common/display-data/Table';
import { useDispatch, useSelector } from 'react-redux';
import { TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { CurrentCashSessionStatus, ModalContent } from '@/types/enums';
import { shopServices } from '@/services/shopServices';
import { setShops } from '@/reducers/shops/shopSlice';
import { financialFlowServices } from '@/services/financialFlowServices';
import { useModalStore } from '@/stores/modalStore';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/utils/routes';
import { BillingParams } from '@/libs/api/billing';
import useBillingService from '@/services/billing';
import useFilters from '@/hooks/useFilters';
import BillingCols from './cols';

interface Props {
	searchParams: BillingParams;
	shopSlug: string;
}

const BillingsTable = ({ searchParams, shopSlug }: Props) => {
	const { openModal } = useModalStore.getState();
	const { shops } = useSelector((state: RootState) => state.shop);
	const { billings, billingsPagination } = useSelector(
		(state: RootState) => state.billing
	);
	const { fetchBillings, isLoading } = useBillingService();
	const { updateFilterParams, synchronizeFilters, tableFilters } = useFilters();
	const { billingColumns } = BillingCols({ tableFilters, shopSlug });
	const dispatch = useDispatch();
	const router = useRouter();

	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	const filters = {
		shopId: searchParams.shopId,
		serialNumber: searchParams.serialNumber,
		status: searchParams.status,
		paymentMethods: searchParams.paymentMethods,
		customerName: searchParams.customerName,
		dateStart: searchParams.dateStart,
		dateEnd: searchParams.dateEnd
	};

	useEffect(() => {
		const fetchCashSession = async () => {
			if (!searchParams?.shopId) return;

			const data = await financialFlowServices.getCurrentCashSession(
				searchParams?.shopId
			);

			if (data) {
				if (data?.status !== CurrentCashSessionStatus.OPEN) {
					openModal({
						content: ModalContent.confirm,
						componentProps: {
							confirmTitle:
								'No puedes registrar movimientos en efectivo porque la caja del día de hoy está cerrada',
							confirmText: '¿Quieres abrirla ahora?',
							onConfirm: () =>
								router.push(`${ROUTES.FINANCIAL_FLOW_SHOPS}/${shopSlug}`),
							isPromise: false
						}
					});
				}
			}
		};

		fetchCashSession();
	}, [searchParams?.shopId]);

	useEffect(() => {
		synchronizeFilters(filters, 'effectiveDate');
	}, [searchParams]);

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
		fetchBillings({ page, pageSize, ...filters });
	}, [page, pageSize, ...Object.values(filters)]);

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		updateFilterParams(pagination, searchParams, filters);
	};

	return (
		<CustomTable
			columns={billingColumns}
			dataSource={billings}
			isLoading={isLoading}
			pagination={{
				current: billingsPagination.page,
				pageSize: billingsPagination.pageSize,
				total: billingsPagination.total,
				showSizeChanger: true
			}}
			onChange={handleTableChange}
		/>
	);
};

export default BillingsTable;
