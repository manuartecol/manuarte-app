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
import { ProductsPageParams } from '@/libs/api/product';
import ProductVariantsSubTable from '../ProductVariantsSubTable';
import { useRouter } from 'next/navigation';
import { objectToSearchParams } from '@/utils/formats';

type TabsTableProductsProps = {
	searchParams: ProductsPageParams;
	productCategoriesData: ProductCategory[];
};

/**
 * La pestaña va en la URL, con su nombre y no con un número: así sobrevive a un
 * refresco, el botón de atrás funciona y un enlace compartido abre la pestaña
 * que se estaba viendo
 */
const TAB = {
	products: 'productos',
	variants: 'presentaciones',
	categories: 'categorias'
};

const TAB_KEYS = Object.values(TAB);

const TabsTableProducts = ({
	searchParams,
	productCategoriesData
}: TabsTableProductsProps) => {
	const tabParam =
		searchParams.tab && TAB_KEYS.includes(searchParams.tab)
			? searchParams.tab
			: TAB.products;
	/**
	 * Igual que el selector de estado: el estado local manda al pintar para que
	 * el cambio de pestaña sea inmediato, y la URL se sincroniza detrás. La
	 * página es `force-dynamic`, así que cambiar la URL vuelve a pasar por el
	 * servidor y esperar a eso se notaría
	 */
	const [activeTab, setActiveTab] = useState(tabParam);
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
	const {
		productsWithVariants,
		productsPagination,
		productVariants,
		productVariantsPagination
	} = useSelector((state: RootState) => state.product);
	const { productCategories } = useSelector(
		(state: RootState) => state.productCategory
	);
	const router = useRouter();
	/**
	 * Un solo producto desplegado a la vez. Con varios, la tabla deja de leerse
	 * como una lista y abrir uno de arriba desplaza lo que estabas mirando
	 */
	const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);
	const [visitedTabs, setVisitedTabs] = useState<string[]>([tabParam]);
	const productsVisited = visitedTabs.includes(TAB.products);
	const variantsVisited = visitedTabs.includes(TAB.variants);

	const toggleProduct = (productId: string) =>
		setExpandedProductIds(ids => (ids.includes(productId) ? [] : [productId]));
	const {
		getProductsWithVariants,
		getProductVariants,
		getProductCategories,
		isLoading,
		isLoadingProducts
	} = useProductServices();
	// Un juego de filtros por tabla: cada una pagina con sus propias claves, así
	// que la página 4 de una no se interpreta como página 4 de la otra
	const productsFilters = useFilters({
		pageKey: 'productsPage',
		pageSizeKey: 'productsPageSize'
	});
	const variantsFilters = useFilters();
	const { productColumns, productVariantColumns, productCategoryColumns } =
		ProductCols({
			tableFilters: variantsFilters.tableFilters,
			productTableFilters: productsFilters.tableFilters,
			expandedProductIds,
			onToggleProduct: toggleProduct,
			// Con un solo estado en la tabla, el icono no aporta nada
			showStatus: activeFilterParam === 'all'
		});

	const productsPage = Number(searchParams.productsPage) || 1;
	const productsPageSize = Number(searchParams.productsPageSize) || 30;
	const page = Number(searchParams.page) || 1;
	const pageSize = Number(searchParams.pageSize) || 30;

	// Los tres de abajo los comparten las dos tablas: significan lo mismo en las
	// dos, así que el filtro se mantiene al cambiar de pestaña
	const sharedFilters = {
		productName: searchParams.productName,
		productDescription: searchParams.productDescription,
		productCategoryName: searchParams.productCategoryName
	};

	const productFilters = { pId: searchParams.pId, ...sharedFilters };

	const variantFilters = {
		vId: searchParams.vId,
		name: searchParams.name,
		...sharedFilters,
		showActiveOnly: searchParams.showActiveOnly
	};

	const reloadProducts = () =>
		getProductsWithVariants({
			page: productsPage,
			pageSize: productsPageSize,
			...productFilters
		});

	const reloadVariants = () =>
		getProductVariants({ page, pageSize, ...variantFilters });

	// Cualquier acción sobre una presentación cambia lo que deben pintar las dos
	// tablas, así que las dos se recargan y ninguna se queda vieja
	const reloadTables = async () => {
		await Promise.all([reloadProducts(), reloadVariants()]);
	};

	/**
	 * Una tabla se consulta la primera vez que se visita su pestaña y cuando
	 * cambian sus propios parámetros, incluso estando en la otra, porque hay
	 * filtros compartidos. Ir y volver entre pestañas no cuesta ninguna
	 * petición: cada acción ya recarga las dos tablas
	 */
	useEffect(() => {
		setVisitedTabs(tabs =>
			tabs.includes(activeTab) ? tabs : [...tabs, activeTab]
		);
	}, [activeTab]);

	useEffect(() => {
		if (!productsVisited) return;

		reloadProducts();
	}, [
		productsVisited,
		productsPage,
		productsPageSize,
		...Object.values(productFilters)
	]);

	useEffect(() => {
		if (!variantsVisited) return;

		reloadVariants();
	}, [variantsVisited, page, pageSize, ...Object.values(variantFilters)]);

	useEffect(() => {
		getProductCategories(productCategoriesData);
	}, [productCategoriesData]);

	useEffect(() => {
		productsFilters.synchronizeFilters(productFilters);
		variantsFilters.synchronizeFilters(variantFilters);
	}, [searchParams]);

	useEffect(() => {
		setActiveFilter(activeFilterParam);
	}, [activeFilterParam]);

	useEffect(() => {
		setActiveTab(tabParam);
	}, [tabParam]);

	const handleTabChange = (key: string) => {
		setActiveTab(key);

		const params = objectToSearchParams(searchParams);
		params.set('tab', key);
		router.replace(`?${params.toString()}`);
	};

	const handleProductsTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		productsFilters.updateFilterParams(pagination, searchParams, filters);
	};

	const handleTableChange = (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => {
		variantsFilters.updateFilterParams(pagination, searchParams, filters);
	};

	const items: TabsProps['items'] = [
		{
			key: TAB.products,
			label: 'Productos',
			children: (
				<CustomTable
					columns={productColumns}
					dataSource={productsWithVariants}
					isLoading={isLoadingProducts}
					pagination={{
						current: productsPagination.page,
						pageSize: productsPagination.pageSize,
						total: productsPagination.total,
						showSizeChanger: true
					}}
					onChange={handleProductsTableChange}
					rowClassName={record =>
						record.variantsCount > 0 ? 'cursor-pointer' : ''
					}
					expandable={{
						expandedRowRender: record => (
							<ProductVariantsSubTable
								product={record}
								onDeleted={reloadTables}
							/>
						),
						rowExpandable: record => record.variantsCount > 0,
						// La fila entera despliega, y la señal visual es el chevron de la
						// columna PRESENTACIONES. Sin columna propia para una sola función
						expandRowByClick: true,
						showExpandColumn: false,
						expandedRowKeys: expandedProductIds,
						// `onExpand` y no `onExpandedRowsChange`: la lista la decide el
						// componente, que deja solo el último abierto
						onExpand: (expanded, record) =>
							setExpandedProductIds(expanded ? [record.id] : [])
					}}
				/>
			)
		},
		{
			key: TAB.variants,
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
			key: TAB.categories,
			label: 'Categorías',
			children: (
				<CustomTable
					columns={productCategoryColumns}
					dataSource={productCategories}
					isLoading={false}
				/>
			)
		}
	];

	const operations = {
		[TAB.products]: (
			<AddButton
				title='Agregar Producto'
				modalContent={ModalContent.products}
				buttonLabel='Producto'
				appendIcon={<BiPackage size={18} />}
			/>
		),
		[TAB.variants]: (
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
							variantsFilters.updateFilterParams(
								{ current: 1, pageSize },
								{ ...searchParams, showActiveOnly: value },
								{ ...variantsFilters.tableFilters, showActiveOnly: [value] }
							);
						}}
					/>
				</div>
				<AddButton
					title='Agregar Presentación'
					modalContent={ModalContent.productVariants}
					buttonLabel='Presentación'
					appendIcon={<AiOutlineAppstore size={18} />}
				/>
			</div>
		),
		[TAB.categories]: (
			<AddButton
				title='Agregar Categoría'
				modalContent={ModalContent.productCategories}
				buttonLabel='Categoría'
				appendIcon={<MdOutlineCategory size={18} />}
			/>
		)
	};

	return (
		<Tabs
			activeKey={activeTab}
			items={items}
			tabBarExtraContent={operations[activeTab]}
			onChange={handleTabChange}
		/>
	);
};

export default TabsTableProducts;
