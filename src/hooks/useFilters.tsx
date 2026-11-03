import { useState } from 'react';
import { objectToSearchParams } from '@/utils/formats';
import { TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

/**
 * `pageKey` y `pageSizeKey` existen para que dos tablas en la misma pantalla no
 * compartan la página: la de Productos y la de Presentaciones tienen distinto
 * número de filas, así que una página 4 de una no significa nada en la otra
 */
const useFilters = ({
	pageKey = 'page',
	pageSizeKey = 'pageSize'
}: { pageKey?: string; pageSizeKey?: string } = {}) => {
	const [tableFilters, setTableFilters] = useState<
		Record<string, FilterValue | null>
	>({});
	const router = useRouter();

	const updateFilterParams = (
		pagination: TablePaginationConfig,
		searchParams: Record<string, any>,
		filters: Record<string, FilterValue | null>
	) => {
		const params = objectToSearchParams(searchParams);

		params.set(pageKey, String(pagination.current ?? 1));
		params.set(pageSizeKey, String(pagination.pageSize ?? 10));

		Object.entries(filters).forEach(([key, value]) => {
			if (key.toLocaleLowerCase().includes('date')) {
				if (
					Array.isArray(value) &&
					value.length === 2 &&
					value[0] &&
					value[1]
				) {
					const start = dayjs.isDayjs(value[0])
						? value[0].format('YYYY-MM-DD')
						: String(value[0]);
					const end = dayjs.isDayjs(value[1])
						? value[1].format('YYYY-MM-DD')
						: String(value[1]);

					params.set('dateStart', start);
					params.set('dateEnd', end);
				} else {
					params.delete('dateStart');
					params.delete('dateEnd');
				}
			} else if (Array.isArray(value) && value.length > 0) {
				params.delete(key);
				value.forEach(v => params.append(key, String(v)));
			} else if (value && value.length > 0) params.set(key, String(value[0]));
			else params.delete(key);
		});

		router.replace(`?${params.toString()}`);
	};

	const synchronizeFilters = (
		filters: Record<string, any>,
		dateFilterName?: string
	) => {
		const initialFilters: Record<string, FilterValue | null> = {};

		Object.entries(filters).forEach(([key, value]) => {
			if (key === 'dateStart' || key === 'dateEnd') {
				return;
			}

			// Si el valor es un array, úsalo directamente
			if (Array.isArray(value)) {
				initialFilters[key] = value;
			} else if (value !== undefined && value !== null && value !== '') {
				initialFilters[key] = [value];
			}
		});

		if (filters.dateStart && filters.dateEnd && dateFilterName) {
			const dateStart = Array.isArray(filters.dateStart)
				? filters.dateStart[0]
				: filters.dateStart;
			const dateEnd = Array.isArray(filters.dateEnd)
				? filters.dateEnd[0]
				: filters.dateEnd;

			initialFilters[dateFilterName] = [
				dayjs(dateStart),
				dayjs(dateEnd)
			] as any;
		}

		setTableFilters(initialFilters);
	};

	return { updateFilterParams, synchronizeFilters, tableFilters };
};

export default useFilters;
