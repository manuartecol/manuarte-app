import {
	Button,
	Collapse,
	Form,
	FormInstance,
	InputNumber,
	Tooltip
} from 'antd';
import { useWatch } from 'antd/es/form/Form';
import { IoAdd, IoCopyOutline, IoRemoveCircleOutline } from 'react-icons/io5';
import { AiOutlineAppstore } from 'react-icons/ai';
import { useSelector } from 'react-redux';
import { formatCurrency, formatInputCurrency } from '@/utils/formats';
import { PRODUCT_VARIANT_PROPS } from '../../consts';
import VariantAxesFields from '../VariantAxesFields';
import { previewFromAxes } from '../VariantAxesFields/composeVariantName';

// Lo que el formulario tiene por presentación y este componente necesita leer
type VariantFormRow = {
	axes?: VariantAxesDto;
	pvpCop?: number;
	minQty?: number;
	maxQty?: number;
};

/**
 * Las presentaciones de un producto en un acordeón, una abierta a la vez.
 *
 * Apiladas una debajo de otra, cuatro presentaciones son unos cuarenta campos a
 * la vista y el botón de guardar queda a varias pantallas de scroll. Plegadas,
 * la cabecera lleva el nombre compuesto y un resumen de precio y límites, que es
 * lo que hace falta para reconocerlas sin abrirlas.
 *
 * Los paneles van con `forceRender`: un panel cerrado desmonta sus campos, y
 * `validateFields` solo valida los montados, así que una presentación inválida
 * se habría enviado sin avisar.
 */
const ProductVariantFormList = ({
	form,
	isUpdating,
	isQuitoSelected,
	isCapacity = false,
	catalogFailed = false,
	activeKey,
	onActiveKeyChange
}: {
	form: FormInstance;
	isUpdating: boolean;
	isQuitoSelected: boolean;
	isCapacity?: boolean;
	catalogFailed?: boolean;
	// Qué panel está abierto. Lo lleva el padre porque al fallar el guardado hay
	// que abrir el de la presentación con el error, y eso lo sabe el `Form`
	activeKey: string[];
	onActiveKeyChange: (keys: string[]) => void;
}) => {
	const { variantCatalog } = useSelector((state: RootState) => state.product);

	/**
	 * Una sola observación, de la lista entera y con ruta estática. Observar la de
	 * cada fila (`['productVariants', índice, 'axes']`) no sirve: `rc-field-form`
	 * registra el observador una vez y no admite rutas dinámicas, así que al
	 * duplicar una presentación las filas de abajo cambiaban de índice y seguían
	 * mirando el viejo, con la vista previa de otra fila.
	 *
	 * `preserve` lee el formulario entero y no solo los campos montados, que es
	 * lo que `useWatch` devuelve por defecto. Sin él, el envase y los atributos
	 * guardados no entraban en la observación mientras sus campos estuvieran
	 * escondidos, y como la visibilidad se decide con eso mismo, no se abrían
	 * nunca: el valor estaba, pero nadie lo veía
	 */
	const variants = useWatch('productVariants', { form, preserve: true }) as
		| VariantFormRow[]
		| undefined;

	// Filtrar inputs basados en la selección de la ciudad
	const getFilteredInputs = () => {
		if (isQuitoSelected) {
			return PRODUCT_VARIANT_PROPS;
		}
		// Si no es Quito, filtrar campos USD
		return PRODUCT_VARIANT_PROPS.filter(
			input => !input.name.toLowerCase().includes('usd')
		);
	};

	const filteredInputs = getFilteredInputs();

	// Agrupar inputs por tipo
	const basicInputs = filteredInputs.filter(input =>
		input.name.includes('Qty')
	);
	const pvpInputs = filteredInputs.filter(input => input.priceType === 'pvp');
	const disInputs = filteredInputs.filter(input => input.priceType === 'dis');
	const costInputs = filteredInputs.filter(input =>
		input.name.includes('cost')
	);

	/**
	 * Duplicar copia precios, costos, límites y la medida, y deja los atributos
	 * vacíos: es lo que resuelve Easy Color, donde ocho colores comparten todo
	 * menos el atributo. Ocho capturas completas pasan a una y siete selects
	 */
	const duplicateVariant = (
		add: (value?: unknown, index?: number) => void,
		index: number
	) => {
		const source = form.getFieldValue(['productVariants', index]) ?? {};
		const { axes, ...rest } = source;

		add(
			{
				...rest,
				// La medida se copia, el atributo no: duplicar sirve justo para
				// cambiar lo que distingue a las dos, y copiarlo dejaría dos filas
				// idénticas que el backend rechazaría como duplicadas
				axes: axes
					? {
							quantityValue: axes.quantityValue,
							unitId: axes.unitId,
							containerId: axes.containerId
						}
					: undefined
			},
			index + 1
		);

		// La copia se abre y las demás se plegan: el siguiente gesto es cambiarle
		// lo que la distingue
		onActiveKeyChange([String(index + 1)]);
	};

	// Lo que se lee de un panel cerrado, para no tener que abrirlo
	const collapsedSummary = (index: number) => {
		const variant = variants?.[index];
		const parts = [
			variant?.pvpCop ? formatCurrency(variant.pvpCop) : null,
			variant?.minQty !== undefined && variant?.maxQty !== undefined
				? `${variant.minQty} a ${variant.maxQty}`
				: null
		].filter(Boolean);

		return parts.length > 0 ? parts.join(' · ') : null;
	};

	const priceGroup = (
		label: string,
		inputs: typeof filteredInputs,
		fieldName: number,
		index: number,
		required: boolean
	) =>
		inputs.length > 0 ? (
			<div className='flex flex-wrap items-center gap-x-4'>
				<span className='font-semibold'>{label}</span>
				{inputs.map(input => (
					<Form.Item
						key={`${input.name}-${index}`}
						name={[fieldName, input.name]}
						label={input.label}
						validateTrigger={['onChange', 'onBlur']}
						rules={required ? [{ required: true, message: 'Requerido' }] : []}
						style={{ width: input.width }}
					>
						<InputNumber
							min={0}
							controls={false}
							placeholder={input.placeholder}
							formatter={value => formatInputCurrency(value)}
							className='textRight'
							style={{ width: '100%' }}
						/>
					</Form.Item>
				))}
			</div>
		) : null;

	return (
		<Form.List name='productVariants'>
			{(fields, { add, remove }, { errors }) => (
				<>
					{fields.length > 0 ? (
						<Collapse
							accordion
							activeKey={activeKey}
							onChange={keys => {
								// En modo acordeón antd devuelve una cadena, y vacía al plegar
								const next = Array.isArray(keys)
									? (keys as string[])
									: [keys as string];

								onActiveKeyChange(next.filter(Boolean));
							}}
							className='bg-white'
							items={fields.map((field, index) => {
								const axes = variants?.[index]?.axes;
								const preview = previewFromAxes(axes, variantCatalog);
								const summary = collapsedSummary(index);
								const isOpen = activeKey.includes(String(index));

								return {
									key: String(index),
									// Los campos siguen montados plegados, para que el guardado
									// valide también las presentaciones que no están a la vista
									forceRender: true,
									label: (
										<div className='flex flex-wrap items-center gap-x-3'>
											<span className='font-semibold'>
												Presentación {index + 1}
											</span>
											{preview ? (
												<span className='font-semibold text-blue-500'>
													{preview}
												</span>
											) : (
												<span className='italic text-gray-400'>sin medida</span>
											)}
											{!isOpen && summary ? (
												<span className='text-xs text-gray-500'>{summary}</span>
											) : null}
										</div>
									),
									extra: !isUpdating ? (
										<div className='flex items-center gap-2'>
											<Tooltip title='Duplicar presentación'>
												<IoCopyOutline
													className='cursor-pointer'
													size={18}
													color='#1677ff'
													onClick={event => {
														// Sin esto el clic además plegaría el panel
														event.stopPropagation();
														duplicateVariant(add, index);
													}}
												/>
											</Tooltip>
											{fields.length > 1 ? (
												<Tooltip title='Remover presentación'>
													<IoRemoveCircleOutline
														className='dynamic-delete-button cursor-pointer'
														size={20}
														color='#FF4D4f'
														onClick={event => {
															event.stopPropagation();
															remove(field.name);
															onActiveKeyChange([
																String(Math.max(0, index - 1))
															]);
														}}
													/>
												</Tooltip>
											) : null}
										</div>
									) : null,
									children: (
										<div className='flex flex-col'>
											<VariantAxesFields
												form={form}
												axes={axes}
												namePath={[field.name]}
												rootPath={['productVariants', field.name]}
												isCapacity={isCapacity}
												catalogFailed={catalogFailed}
											/>

											<div className='flex flex-wrap items-center gap-x-4 border-t border-gray-100 pt-4'>
												{basicInputs.map(input => (
													<Form.Item
														key={`${input.name}-${index}`}
														name={[field.name, input.name]}
														label={input.label}
														validateTrigger={['onChange', 'onBlur']}
														rules={[{ required: true, message: 'Requerido' }]}
														style={{ width: input.width }}
													>
														<InputNumber
															min={0}
															controls={false}
															placeholder={input.placeholder}
															className='textRight'
															style={{ width: '100%' }}
														/>
													</Form.Item>
												))}
											</div>

											<div className='flex gap-4 border-t border-gray-100 pt-4'>
												{priceGroup(
													'Precio de venta al público',
													pvpInputs,
													field.name,
													index,
													true
												)}
												{priceGroup(
													'Precio para distribuidores',
													disInputs,
													field.name,
													index,
													false
												)}
											</div>

											{costInputs.length > 0 ? (
												<div className='flex flex-wrap items-center gap-x-4 border-t border-gray-100 pt-4'>
													{costInputs.map(input => (
														<Form.Item
															key={`${input.name}-${index}`}
															name={[field.name, input.name]}
															label={input.label}
															validateTrigger={['onChange', 'onBlur']}
															rules={[{ required: true, message: 'Requerido' }]}
															style={{ width: input.width }}
														>
															<InputNumber
																min={0}
																controls={false}
																placeholder={input.placeholder}
																formatter={value => formatInputCurrency(value)}
																className='textRight'
																style={{ width: '100%' }}
															/>
														</Form.Item>
													))}
												</div>
											) : null}
										</div>
									)
								};
							})}
						/>
					) : null}

					{!isUpdating ? (
						/**
						 * El margen va en `style` porque antd reinicia el de `.ant-form-item`
						 * con más especificidad que las clases de Tailwind: `mt-6` quedaba
						 * en 0. Sin presentaciones el acordeón no ocupa nada, y el margen
						 * solo hace falta debajo de él
						 */
						<Form.Item style={{ marginTop: fields.length > 0 ? 24 : 0 }}>
							<Button
								color='primary'
								variant='dashed'
								onClick={() => {
									add();
									// La nueva se abre: es la que hay que rellenar
									onActiveKeyChange([String(fields.length)]);
								}}
								icon={
									<IoAdd
										size={20}
										style={{ display: 'flex', alignItems: 'center' }}
									/>
								}
							>
								<span>Presentación</span> <AiOutlineAppstore size={20} />
							</Button>
							<Form.ErrorList errors={errors} />
						</Form.Item>
					) : null}
				</>
			)}
		</Form.List>
	);
};

export default ProductVariantFormList;
