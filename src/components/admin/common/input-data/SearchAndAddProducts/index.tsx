import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Form, notification, Select, SelectProps, Spin, Tag } from 'antd';
import { MehOutlined } from '@ant-design/icons';
import { getProductsData } from '@/components/admin/utils';
import useDebouncedSearch from '@/hooks/useDebouncedSearch';

const MIN_SEARCH_LENGTH = 3;

interface SearchAndAddProductsProps {
	onAdd: () => void;
	selectedProduct: ProductVariantWithStock | null;
	setSelectedProduct: Dispatch<SetStateAction<ProductVariantWithStock | null>>;
	stockId: string | undefined;
	/**
	 * Lista también los items desactivados en la bodega, atenuados y no
	 * seleccionables. Apagado por defecto: en factura y cotización un item
	 * desactivado no se puede vender, así que no tiene sentido ofrecerlo.
	 */
	includeInactive?: boolean;
}

const SearchAndAddProducts = ({
	onAdd,
	selectedProduct,
	setSelectedProduct,
	stockId,
	includeInactive = false
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

			const res = await getProductsData({
				search: newValue,
				stockId,
				includeInactive
			});

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
				<p className='text-xs text-gray-400'>
					Si el código existe pero no aparece, puede estar desactivado en esta
					bodega
				</p>
			</div>
		)
	);

	// Se conserva el resto de la opción con el spread: reconstruirla solo con
	// {value, label} descartaba `disabled`, que es lo que impide elegir un item
	// desactivado. El motivo va en un Tag y no entre paréntesis porque la fila
	// entera está atenuada y el texto suelto se perdía dentro de ella.
	const options = (productsOptions ?? []).map(option =>
		option.inactiveInOrigin
			? {
					...option,
					label: (
						<span className='flex items-center justify-between gap-2'>
							<span className='truncate'>{option.label}</span>
							<Tag color='warning' className='!mr-0 shrink-0'>
								Desactivado en bodega
							</Tag>
						</span>
					)
				}
			: option
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
				options={options}
			/>
		</Form.Item>
	);
};

export default SearchAndAddProducts;
