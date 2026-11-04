import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Form, FormInstance, Select } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import CustomTag from './CustomTag';
import { shopServices } from '@/services/shopServices';
import { setShops } from '@/reducers/shops/shopSlice';
import { formatToTitleCase } from '@/utils/formats';
import { selectFilterOption } from '../../utils';

interface Props {
	form: FormInstance;
	setIsQuitoSelected: Dispatch<SetStateAction<boolean>>;
	label?: string;
	updatingStockItem?: boolean;
	stocks?: string[];
	canRemoveMainStock?: boolean;
	helpText?: string;
	/**
	 * Aviso fijo bajo el selector. Lo pone quien lo usa porque quitar una bodega
	 * no significa lo mismo en los dos sitios: editando una presentación la
	 * desactiva ahí, y creándola solo evita crearla en esa bodega
	 */
	removalHint?: string;
}

const SelectStocks = ({
	form,
	setIsQuitoSelected,
	label = 'Crear stock en:',
	updatingStockItem,
	stocks,
	canRemoveMainStock,
	helpText,
	removalHint
}: Props) => {
	const { shops } = useSelector((state: RootState) => state.shop);
	const [stockOptions, setStockOptions] = useState<
		{ value: string; label: string | null }[] | undefined
	>();
	const dispatch = useDispatch();

	const fetchShops = async () => {
		if (shops?.length === 0) {
			const data = await shopServices.getAll(false);
			if (data) {
				dispatch(setShops(data));
				initializeStockOptions(data);
			}
		}
	};

	const initializeStockOptions = (data: Shop[]) => {
		const filteredData = updatingStockItem
			? data.filter(item => !item.mainStock)
			: data;

		const options = filteredData?.map((shop: Shop) => {
			return {
				value: shop?.stockId,
				label: formatToTitleCase(shop?.name)
			};
		});
		setStockOptions(options);

		// Valores por defecto
		let defaultValues: string[];

		if (stocks) {
			if (updatingStockItem) {
				// Remover mainStock de los valores por defecto
				const mainStockId = data.find(sh => sh.mainStock)?.stockId;

				defaultValues = mainStockId
					? stocks.filter(stockId => stockId !== mainStockId)
					: stocks;
			} else {
				defaultValues = stocks;
			}
		} else {
			defaultValues = options.map(opt => opt.value);
		}

		form.setFieldsValue({
			stockIds: defaultValues
		});
	};

	useEffect(() => {
		fetchShops();
		initializeStockOptions(shops);
	}, [stocks]);

	const mainStockId = shops.find(sh => sh.mainStock)?.stockId;
	const quitoStockId = shops.find(sh => sh.slug === 'manuarte-quito')?.stockId;

	return (
		<Form.Item
			name='stockIds'
			label={label}
			rules={[
				{
					required: !updatingStockItem && !canRemoveMainStock,
					message: 'Debe seleccionar al menos 1 bodega (Fabrica Cascajal)'
				}
			]}
			help={
				helpText ? <span className='text-blue-400'>{helpText}</span> : undefined
			}
			extra={
				removalHint ? (
					<span className='text-xs text-gray-500'>{removalHint}</span>
				) : undefined
			}
		>
			<Select
				placeholder='Seleccione las bodegas'
				/**
				 * Sin `allowClear`. En la edición de una presentación un clic en la
				 * aspa de limpiar vaciaba la lista entera, o sea que la desactivaba en
				 * todas las bodegas de golpe, sin confirmación y con el único aviso
				 * apareciendo después. Se quitan de una en una, que es lo que se quiere
				 * hacer de verdad
				 */
				showSearch
				mode='multiple'
				tagRender={({ label, value, closable, onClose }) => {
					const isFixed = value === mainStockId && !canRemoveMainStock;

					return (
						<CustomTag label={label} isFixed={isFixed} onClose={onClose} />
					);
				}}
				filterOption={selectFilterOption}
				options={stockOptions}
				onChange={values => {
					const newValues =
						values.includes(mainStockId) ||
						updatingStockItem ||
						canRemoveMainStock
							? values
							: [mainStockId, ...values];

					form.setFieldsValue({ stockIds: newValues });
					setIsQuitoSelected(
						newValues?.some((opt: string) => opt === quitoStockId)
					);
				}}
			/>
		</Form.Item>
	);
};

export default SelectStocks;
