'use client';
import { useEffect, useState } from 'react';
import { Switch, TablePaginationConfig, Tabs, TabsProps } from 'antd';
import { useSelector } from 'react-redux';
import { AiOutlineAppstore } from 'react-icons/ai';
import { BiPackage } from 'react-icons/bi';
import { MdOutlineCategory } from 'react-icons/md';
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
	const [showActiveOnly, setShowActiveOnly] = useState(
		searchParams.showActiveOnly === 'true'
	);
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
		tableFilters
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
			<div className='flex-1 flex items-center gap-2 me-4'>
				<label htmlFor='showActiveOnly' className='cursor-pointer'>
					Productos
					{showActiveOnly ? ' activos' : ' inactivos'}
				</label>
				<Switch
					defaultChecked={showActiveOnly}
					onChange={checked => {
						setShowActiveOnly(checked);
						updateFilterParams(
							{ current: page, pageSize },
							{ ...searchParams, showActiveOnly: checked ? 'true' : 'false' },
							{
								...tableFilters,
								showActiveOnly: checked ? ['true'] : ['false']
							}
						);
					}}
					id='showActiveOnly'
					style={showActiveOnly ? { backgroundColor: '#10b981' } : {}}
					checked={showActiveOnly}
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
