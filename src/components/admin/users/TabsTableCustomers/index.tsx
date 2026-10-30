'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { TablePaginationConfig, Tabs, TabsProps } from 'antd';
import { HiOutlineUser } from 'react-icons/hi';
import CustomTable from '../../common/display-data/Table';
import AddButton from '../../common/ui/AddButton';
import GenerateTopCustomersReportButton from '../GenerateTopCustomersReportButton';
import { ModalContent } from '@/types/enums';
import CustomerCols from './cols';
import useCustomerService from '@/services/customer';
import useFilters from '@/hooks/useFilters';
import { FilterValue } from 'antd/es/table/interface';
import { Session } from 'next-auth';
import { CustomerParams } from '@/libs/api/customer';

interface TabsTableCustomersProps {
	session: Session | null;
	searchParams: {
		isoCode?: string;
		page?: string;
		pageSize?: string;
	} & CustomerParams;
	isAdmin?: boolean;
}

const TabsTableCustomers = ({
	session,
	searchParams,
	isAdmin
}: TabsTableCustomersProps) => {
	const {
		customers,
		customersPagination,
		topCustomersCO,
		topCustomersCoPagination,
		topCustomersEC,
		topCustomersEcPagination
	} = useSelector((state: RootState) => state.customer);
	const { getAllCustomers, getTopCustomersCO, getTopCustomersEC, isLoading } =
		useCustomerService();
	const { updateFilterParams, synchronizeFilters, tableFilters } = useFilters();
	const { customerColumns, topCustomerColumns } = CustomerCols({
		isAdmin,
		tableFilters
	});
	const router = useRouter();

	const [tabState, setTabState] = useState<
		Record<
			string,
			{
				page: number;
				pageSize: number;
				filters: Record<string, FilterValue | null>;
				loaded: boolean;
			}
		>
	>({
		All: {
			page: Number(searchParams.page) || 1,
			pageSize: Number(searchParams.pageSize) || 30,
			filters: {},
			loaded: false
		},
		CO: { page: 1, pageSize: 30, filters: {}, loaded: false },
		EC: { page: 1, pageSize: 30, filters: {}, loaded: false }
	});

	const activeKey = searchParams.isoCode || 'All';

	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	const filters = {
		isoCode: searchParams.isoCode,
		dni: searchParams.dni,
		fullName: searchParams.fullName,
		email: searchParams.email,
		phoneNumber: searchParams.phoneNumber,
		cityName: searchParams.cityName
	};

	// Sincronizar el tabState con los searchParams solo para el tab activo
	useEffect(() => {
		setTabState(prev => ({
			...prev,
			[activeKey]: {
				page,
				pageSize,
				filters: Object.fromEntries(
					Object.entries(filters)
						.filter(([key]) => key !== 'isoCode')
						.map(([key, value]) => [key, value ? [value] : null])
				),
				loaded: prev[activeKey].loaded
			}
		}));

		synchronizeFilters(filters);
	}, [searchParams]);

	// Cargar los datos solo cuando es necesario
	useEffect(() => {
		const currentTab = tabState[activeKey];

		// Si el tab ya fue cargado y no hay cambios en filtros/paginación, no hacer nada
		if (currentTab.loaded) {
			// Verificar si hay cambios en filtros o paginación
			const hasChanges =
				currentTab.page !== page ||
				currentTab.pageSize !== pageSize ||
				JSON.stringify(currentTab.filters) !==
					JSON.stringify(
						Object.fromEntries(
							Object.entries(filters)
								.filter(([key]) => key !== 'isoCode')
								.map(([key, value]) => [key, value ? [value] : null])
						)
					);

			if (!hasChanges) return;
		}

		// Cargar datos según el tab activo
		if (activeKey === 'All') {
			if (session?.user?.roleName === 'admin') {
				getAllCustomers({ page, pageSize, ...filters, isoCode: undefined });
			} else {
				getAllCustomers({
					page,
					pageSize,
					...filters,
					isoCode: session?.user?.isoCode
				});
			}
		} else if (activeKey === 'CO') {
			getTopCustomersCO({ page, pageSize, ...filters });
		} else if (activeKey === 'EC') {
			getTopCustomersEC({ page, pageSize, ...filters });
		}

		// Marcar el tab como cargado
		setTabState(prev => ({
			...prev,
			[activeKey]: {
				...prev[activeKey],
				loaded: true
			}
		}));
	}, [activeKey, page, pageSize, ...Object.values(filters)]);

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		setTabState(prev => ({
			...prev,
			[activeKey]: {
				page: pagination.current ?? 1,
				pageSize: pagination.pageSize ?? 30,
				filters,
				loaded: false // Marcar como no cargado para forzar recarga con nuevos filtros
			}
		}));

		updateFilterParams(pagination, searchParams, filters);
	};

	if (!isAdmin) {
		return (
			<CustomTable
				columns={customerColumns}
				dataSource={customers}
				isLoading={isLoading}
				pagination={{
					current: customersPagination.page,
					pageSize: customersPagination.pageSize,
					total: customersPagination.total,
					showSizeChanger: true
				}}
				onChange={handleTableChange}
			/>
		);
	}

	const handleTabChange = (key: string) => {
		const tab = tabState[key];
		const params = new URLSearchParams();
		params.set('isoCode', key);
		params.set('page', String(tab.page));
		params.set('pageSize', String(tab.pageSize));
		Object.entries(tab.filters).forEach(([filterKey, value]) => {
			if (value && value.length > 0) params.set(filterKey, String(value[0]));
		});
		router.replace(`?${params.toString()}`);
	};

	const items: TabsProps['items'] = [
		{
			key: 'All',
			label: 'Todos',
			children: (
				<CustomTable
					columns={customerColumns}
					dataSource={customers}
					isLoading={isLoading}
					pagination={{
						current: customersPagination.page,
						pageSize: customersPagination.pageSize,
						total: customersPagination.total,
						showSizeChanger: true
					}}
					onChange={handleTableChange}
				/>
			)
		},
		{
			key: 'CO',
			label: 'Top Colombia',
			children: (
				<CustomTable
					columns={topCustomerColumns}
					dataSource={topCustomersCO}
					isLoading={isLoading}
					pagination={{
						current: topCustomersCoPagination.page,
						pageSize: topCustomersCoPagination.pageSize,
						total: topCustomersCoPagination.total,
						showSizeChanger: true
					}}
					onChange={handleTableChange}
				/>
			)
		},
		{
			key: 'EC',
			label: 'Top Ecuador',
			children: (
				<CustomTable
					columns={topCustomerColumns}
					dataSource={topCustomersEC}
					isLoading={isLoading}
					pagination={{
						current: topCustomersEcPagination.page,
						pageSize: topCustomersEcPagination.pageSize,
						total: topCustomersEcPagination.total,
						showSizeChanger: true
					}}
					onChange={handleTableChange}
				/>
			)
		}
	];

	return (
		<Tabs
			defaultActiveKey={activeKey}
			activeKey={activeKey}
			onChange={handleTabChange}
			items={items}
			tabBarExtraContent={
				<div className='flex gap-2'>
					{activeKey === 'All' ? null : (
						<GenerateTopCustomersReportButton
							reportParams={{
								page,
								pageSize:
									activeKey === 'CO'
										? topCustomersCoPagination.total
										: topCustomersEcPagination.total,
								...filters
							}}
						/>
					)}
					<AddButton
						title='Registrar Cliente'
						modalContent={ModalContent.customers}
						buttonLabel='Cliente'
						appendIcon={<HiOutlineUser size={18} />}
					/>
				</div>
			}
		/>
	);
};

export default TabsTableCustomers;
