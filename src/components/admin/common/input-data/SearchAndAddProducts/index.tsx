import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Form, notification, Select, SelectProps, Spin } from 'antd';
import { MehOutlined } from '@ant-design/icons';
import { getProductsData } from '@/components/admin/utils';
import useDebouncedSearch from '@/hooks/useDebouncedSearch';

const MIN_SEARCH_LENGTH = 3;

interface SearchAndAddProductsProps {
	onAdd: () => void;
	selectedProduct: ProductVariantWithStock | null;
	setSelectedProduct: Dispatch<SetStateAction<ProductVariantWithStock | null>>;
	stockId: string | undefined;
}

const SearchAndAddProducts = ({
	onAdd,
	selectedProduct,
	setSelectedProduct,
	stockId
}: SearchAndAddProductsProps) => {
	const [productsOptions, setProductsOptions] = useState<
		SelectProps['options']
	>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);
	const [productsData, setProductsData] = useState<ProductVariant[]>([]);

	const { schedule, cancel } = useDebouncedSearch();

	const handleSearch = (newValue: string) => {
		if (!newValue || newValue.length < MIN_SEARCH_LENGTH) {
			cancel();
			setProductsOptions([]);
			setIsSearching(false);
			return;
		}

		setIsSearching(true);
		setHasSearched(true);

		schedule(async isCurrent => {
			if (!stockId) {
				notification.error({
					message: 'No se cargó correctamente el ID del stock',
					key: 'stock_id_error'
				});
				setIsSearching(false);
				return;
			}

			const res = await getProductsData({ search: newValue, stockId });

			// Mientras esta petición estaba en vuelo llegó otra búsqueda, así que
			// este resultado ya no corresponde a lo que el usuario tiene escrito
			if (!isCurrent()) return;

			if (res?.formattedData && res.data) {
				setProductsOptions(res.formattedData);
				setProductsData(res.data);
			}

			setIsSearching(false);
		});
	};

	const handleSelect = (newValue: string) => {
		const product = productsData?.find(p => p.id === newValue);
		setSelectedProduct(product as ProductVariantWithStock);
	};

	useEffect(() => {
		if (selectedProduct) {
			onAdd();
			setHasSearched(false);
			setProductsOptions([]);
			setProductsData([]);
			setSelectedProduct(null);
		}
	}, [selectedProduct]);

	const searchingOrNoContent = isSearching ? (
		<div className='flex justify-center text-center'>
			<Spin style={{ padding: '14px 0' }} />
		</div>
	) : (
		hasSearched && (
			<div className='text-center'>
				<MehOutlined style={{ fontSize: 24 }} />
				<p>Sin resultados</p>
			</div>
		)
	);

	return (
		<Form.Item name='product' label='Buscar producto' style={{ maxWidth: 500 }}>
			<Select
				allowClear
				showSearch
				placeholder='Nombre o código del producto'
				defaultActiveFirstOption={false}
				suffixIcon={null}
				filterOption={false}
				onSearch={handleSearch}
				onSelect={handleSelect}
				notFoundContent={searchingOrNoContent}
				options={(productsOptions || []).map(d => ({
					value: d.value,
					label: d.label
				}))}
			/>
		</Form.Item>
	);
};

export default SearchAndAddProducts;
