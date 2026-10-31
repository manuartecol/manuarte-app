'use client';
import { useEffect, useState } from 'react';
import { Segmented, TablePaginationConfig, Tabs, TabsProps } from 'antd';
import { useSelector } from 'react-redux';
import { AiOutlineAppstore } from 'react-icons/ai';
import { BiPackage } from 'react-icons/bi';
import {
	MdCheckCircle,
	MdOutlineCategory,
	MdOutlineList,
	MdRemoveCircle
} from 'react-icons/md';
import CustomTable from '../../common/display-data/Table';
import { ModalContent } from '@/types/enums';
import AddButton from '../../common/ui/AddButton';
import useProductServices from '@/services/product';
import { FilterValue } from 'antd/es/table/interface';
import ProductCols from './cols';
import useFilters from '@/hooks/useFilters';
import { ProductVariantParams } from '@/libs/api/product';

type TabsTableProductsProps = {
	searchParams: ProductVariantParams;
	productCategoriesData: ProductCategory[];
};

const TabsTableProducts = ({
	searchParams,
	productCategoriesData
}: TabsTableProductsProps) => {
	const [isProducts, setIsProducts] = useState(true);
	// Sin el parámetro, solo activas: igual que el backend
	const activeFilterParam =
		searchParams.showActiveOnly === 'false' ||
		searchParams.showActiveOnly === 'all'
			? searchParams.showActiveOnly
			: 'true';
	/**
	 * Estado local para que el selector se mueva al instante. Si dependiera solo
	 * de la URL, se quedaba en el valor anterior mientras el servidor respondía y
	 * con varios clics seguidos pasaba por valores intermedios.
	 */
	const [activeFilter, setActiveFilter] = useState(activeFilterParam);
	const { productVariants, productVariantsPagination } = useSelector(
		(state: RootState) => state.product
	);
	const { productCategories } = useSelector(
		(state: RootState) => state.productCategory
	);
	const { getProductVariants, getProductCategories, isLoading } =
		useProductServices();
	const { updateFilterParams, synchronizeFilters, tableFilters } = useFilters();
	const { productVariantColumns, productCategoryColumns } = ProductCols({
		tableFilters,
		// Con un solo estado en la tabla, la columna no aporta nada
		showStatus: activeFilterParam === 'all'
	});

	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	const filters = {
		vId: searchParams.vId,
		productName: searchParams.productName,
		name: searchParams.name,
		productDescription: searchParams.productDescription,
		productCategoryName: searchParams.productCategoryName,
		showActiveOnly: searchParams.showActiveOnly
	};

	useEffect(() => {
		getProductVariants({ page, pageSize, ...filters });
		getProductCategories(productCategoriesData);
	}, [page, pageSize, ...Object.values(filters)]);

	useEffect(() => {
		synchronizeFilters(filters);
	}, [searchParams]);

	useEffect(() => {
		setActiveFilter(activeFilterParam);
	}, [activeFilterParam]);

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		updateFilterParams(pagination, searchParams, filters);
	};

	const onTabChange = (key: string) => {
		setIsProducts(key === '1');
	};

	const items: TabsProps['items'] = [
		{
			key: '1',
			label: 'Presentaciones',
			children: (
				<CustomTable
					columns={productVariantColumns}
					dataSource={productVariants}
					isLoading={isLoading}
					pagination={{
						current: productVariantsPagination.page,
						pageSize: productVariantsPagination.pageSize,
						total: productVariantsPagination.total,
						showSizeChanger: true
					}}
					onChange={handleTableChange}
				/>
			)
		},
		{
			key: '2',
			label: 'Categorías',
			children: (
				<CustomTable
					columns={productCategoryColumns}
					dataSource={isLoading ? [] : productCategories}
					isLoading={isLoading}
				/>
			)
		}
	];

	const operations = isProducts ? (
		<div className='flex gap-2 max-[460px]:flex-col'>
			<div className='flex-1 flex items-center me-4'>
				<Segmented
					value={activeFilter}
					options={[
						{
							label: (
								<span className='flex items-center gap-1.5'>
									<MdCheckCircle size={16} className='text-emerald-500' />
									<span className='max-[460px]:hidden'>Activas</span>
								</span>
							),
							title: 'Activas',
							value: 'true'
						},
						{
							label: (
								<span className='flex items-center gap-1.5'>
									<MdRemoveCircle size={16} className='text-amber-500' />
									<span className='max-[460px]:hidden'>Inactivas</span>
								</span>
							),
							title: 'Inactivas',
							value: 'false'
						},
						{
							label: (
								<span className='flex items-center gap-1.5'>
									<MdOutlineList size={16} className='text-gray-500' />
									<span className='max-[460px]:hidden'>Todas</span>
								</span>
							),
							title: 'Todas',
							value: 'all'
						}
					]}
					onChange={value => {
						if (value === activeFilter) return;
						setActiveFilter(value);
						// Vuelve a la página 1: la actual puede no existir con otro filtro
						updateFilterParams(
							{ current: 1, pageSize },
							{ ...searchParams, showActiveOnly: value },
							{ ...tableFilters, showActiveOnly: [value] }
						);
					}}
				/>
			</div>
			<AddButton
				title='Agregar Presentación de Producto'
				modalContent={ModalContent.productVariants}
				buttonLabel='Presentación'
				appendIcon={<AiOutlineAppstore size={18} />}
			/>
			<AddButton
				title='Agregar Producto'
				modalContent={ModalContent.products}
				buttonLabel='Producto'
				appendIcon={<BiPackage size={18} />}
			/>
		</div>
	) : (
		<AddButton
			title='Agregar Categoría de Producto'
			modalContent={ModalContent.productCategories}
			buttonLabel='Categoría'
			appendIcon={<MdOutlineCategory size={18} />}
		/>
	);

	return (
		<Tabs
			defaultActiveKey='1'
			items={items}
			tabBarExtraContent={operations}
			onChange={onTabChange}
		/>
	);
};

export default TabsTableProducts;
