import {
	Alert,
	Button,
	Form,
	FormInstance,
	Input,
	InputNumber,
	notification,
	Switch,
	Tooltip
} from 'antd';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import SearchAndAddProducts from '../SearchAndAddProducts';
import { TRANSACTIONS_PRODUCTS_LIST_INPUTS_PROPS } from '@/components/admin/consts';
import { AiOutlineDelete } from 'react-icons/ai';
import { StoreValue } from 'antd/es/form/interface';
import { DrawerContent } from '@/types/enums';
import { useWatch } from 'antd/es/form/Form';
import { useSession } from 'next-auth/react';
import { useDrawerStore } from '@/stores/drawerStore';
import ProductsExcelUploader from '../ProductsExcelUploader';
import CopyableText from '../../ui/CopyableText';

interface TransactionsProductFormListProps {
	form: FormInstance;
	itemsError: boolean;
	setItemsError: Dispatch<SetStateAction<boolean>>;
	shops: Shop[];
}

/**
 * Una fila del resumen de la carga masiva. El código va aparte del resto para
 * poder copiarlo y buscarlo en el Excel, y las cantidades como números para
 * pintarlas en su propia línea: metidas en el texto se confundían con el
 * nombre del producto.
 */
type BulkUploadEntry = {
	code: string;
	name: string;
	shortage?: { requested: number; available: number };
};

type AddItemFormListFn = (
	defaultValue?: StoreValue,
	insertIndex?: number
) => void;

const TransactionsProductFormList = ({
	form,
	itemsError,
	setItemsError,
	shops
}: TransactionsProductFormListProps) => {
	const [selectedProduct, setSelectedProduct] =
		useState<ProductVariantWithStock | null>(null);
	const [addedProducts, setAddedProducts] = useState<Record<string, number>>(
		{}
	);
	/**
	 * Resultado de la última carga por archivo. Vive en el formulario y no en una
	 * notificación porque es una lista de trabajo: el usuario la necesita a la
	 * vista mientras corrige el Excel, y con un archivo de 50 filas no cabe en un
	 * aviso flotante. Además de los rechazados incluye los que entraron con menos
	 * cantidad de la pedida por falta de stock.
	 */
	const [bulkRejected, setBulkRejected] = useState<{
		added: number;
		total: number;
		groups: { reason: string; items: BulkUploadEntry[] }[];
	} | null>(null);
	const { content, dataToHandle } = useDrawerStore.getState();
	const itemsList: ProductVariantWithStock[] = Form.useWatch('items', form);
	const toId = useWatch('toId', form);
	const fromId = useWatch('fromId', form);
	const isEnter = content === DrawerContent.enterByTransfer;
	const { data: session } = useSession();
	const isAdmin = session?.user?.roleName === 'admin';
	const [showExcelUploader, setShowExcelUploader] = useState(false);

	useEffect(() => {
		if (!dataToHandle) {
			form.setFieldsValue({ items: [] });
		}
	}, [fromId, toId]);

	const shopSlug = isAdmin ? 'fabrica-cascajal' : session?.user?.shop;

	const stockId =
		content === DrawerContent.directEnter
			? shops?.find(shop => shop.slug === shopSlug)?.stockId
			: fromId;

	const handleAddProduct = (add: AddItemFormListFn) => {
		try {
			if (selectedProduct) {
				// `?? []` porque Form.useWatch devuelve undefined hasta que el
				// Form.List se inicializa, y ahí el .some lanzaría
				const inList = (itemsList ?? []).some(
					(product: ProductVariantWithStock) =>
						product.productVariantId === selectedProduct.id
				);

				if (inList) {
					return notification.error({
						message: 'El producto ya se encuentra en la lista!'
					});
				}

				// Va antes que la comprobación de stock y aplica a todos los
				// movimientos: un item desactivado también tiene cantidad 0, así que
				// al revés siempre se reportaría como un problema de existencias.
				// El buscador ya lo muestra deshabilitado, pero la regla queda aquí
				// explícita para no depender de eso.
				if (selectedProduct.activeInOrigin === false) {
					return notification.error({
						message: 'El producto está desactivado en esta bodega!'
					});
				}

				if (content === DrawerContent.exit) {
					if (selectedProduct.quantity === 0) {
						return notification.error({
							message: 'Producto sin stock!'
						});
					}
				}

				if (content === DrawerContent.transfer) {
					if (!toId) {
						return notification.error({
							message: 'Selecciona el stock de destino!'
						});
					}

					if (selectedProduct.quantity === 0) {
						return notification.error({
							message: 'Producto sin stock en origen!'
						});
					}

					if (!selectedProduct?.stocks?.includes(toId)) {
						return notification.error({
							message: 'El item no está activo en el stock de destino!'
						});
					}
				}

				setAddedProducts(prev => ({
					...prev,
					[selectedProduct.id]: selectedProduct.quantity
				}));

				setItemsError(false);

				add({
					productVariantId: selectedProduct.id,
					stockItemId: selectedProduct.stockItemId,
					name: `${selectedProduct.productName} - ${selectedProduct.name}`,
					quantity: ''
				});
			}
		} catch (error) {
			console.error(error);
		}
	};

	const handleAddBulkProduct = (add: AddItemFormListFn, productList: any[]) => {
		try {
			// Se limpia antes de cualquier salida temprana: si no, un archivo vacío
			// o un destino sin elegir dejarían a la vista el detalle de la carga
			// anterior junto a un error que no tiene nada que ver
			setBulkRejected(null)

			if (productList.length === 0) {
				return notification.error({
					message: 'No se encontraron productos en el archivo!'
				});
			}

			if (content === DrawerContent.transfer && !toId) {
				return notification.error({
					message: 'Selecciona el stock de destino!'
				});
			}

			const added: BulkUploadEntry[] = []
			const inactiveInOrigin: BulkUploadEntry[] = []
			const originOutOfStock: BulkUploadEntry[] = []
			const destinationNotActive: BulkUploadEntry[] = []
			const alreadyInList: BulkUploadEntry[] = []
			const partialStock: BulkUploadEntry[] = []
			const repeatedInFile: BulkUploadEntry[] = []
			/**
			 * Presentaciones ya procesadas en esta misma carga. `itemsList` es el
			 * estado del formulario antes del archivo y no se actualiza dentro de
			 * este bucle, así que un código repetido en el Excel pasaba los dos
			 * filtros y entraba dos veces. Con el ajuste a lo disponible era peor:
			 * cada copia se llevaba todo el stock y cada fila por separado pasaba la
			 * validación, aunque entre las dos pidieran el doble de lo que hay.
			 */
			const seenInFile = new Set<string>()

			// Se lista con el código delante: es lo que permite encontrar la fila en
			// el Excel para corregirla. Con el nombre solo hay que ir adivinando.
			const label = (
				product: any,
				shortage?: BulkUploadEntry['shortage']
			): BulkUploadEntry => ({
				code: String(product.productCode),
				name: product.name,
				shortage
			})

			productList.forEach(product => {
				if (!product) return

				// El parámetro se llamaba igual que la variable del forEach, así que
				// comparaba cada item de la lista contra sí mismo y nunca detectaba
				// un repetido
				const inList = (itemsList ?? []).some(
					(item: ProductVariantWithStock) =>
						item.productVariantId === product.id
				)

				if (inList) {
					alreadyInList.push(label(product))
					return
				}

				// La cantidad de las dos filas ya es la de la primera (el cargador
				// toma la primera coincidencia), así que no se pierde nada al quedarse
				// con una
				if (seenInFile.has(product.id)) {
					repeatedInFile.push(label(product))
					return
				}
				seenInFile.add(product.id)

				// Primero el estado y después las existencias: un item desactivado
				// también tiene cantidad 0, así que al revés siempre se reportaría
				// como un problema de stock. Aplica a todos los movimientos, no solo
				// a las transferencias
				if (product.activeInOrigin === false) {
					inactiveInOrigin.push(label(product))
					return
				}

				const takesFromOrigin =
					content === DrawerContent.exit ||
					content === DrawerContent.transfer
				const available = Number(product.quantity)
				const requested = Number(product.requiredQty)

				// `<= 0` y no `=== 0`: con existencias negativas, el ajuste a lo
				// disponible de más abajo agregaría una cantidad negativa
				if (takesFromOrigin && available <= 0) {
					originOutOfStock.push(label(product))
					return
				}

				if (
					content === DrawerContent.transfer &&
					!product?.stocks?.includes(toId)
				) {
					destinationNotActive.push(label(product))
					return
				}

				// Hay stock pero no alcanza: se agrega lo que hay en vez de lo que pide
				// el archivo, para que el movimiento quede listo para enviar lo
				// disponible. Antes entraba con la cantidad pedida, el resumen lo
				// contaba como agregado sin más y el problema solo aparecía al guardar,
				// como un error en la fila. Va después de la comprobación del destino
				// para no anunciar como agregado algo que luego se rechaza
				let quantity = requested
				if (takesFromOrigin && requested > available) {
					quantity = available
					partialStock.push(label(product, { requested, available }))
				}

				setAddedProducts(prev => ({
					...prev,
					[product.id]: product.quantity
				}))

				setItemsError(false)

				add({
					productVariantId: product?.id,
					stockItemId: product?.stockItemId,
					name: product.name,
					quantity
				})

				added.push(label(product))
			})

			// Todos los grupos juntos. Antes cada bloque hacía `return`, así que un
			// archivo con dos problemas distintos solo mostraba el primero y había
			// que subirlo otra vez para descubrir el segundo
			// Los de stock insuficiente van primero: son los únicos que sí entraron,
			// y su cantidad no es la del archivo, así que es lo que más conviene ver
			const groups = [
				{
					reason: 'con stock insuficiente (se agregó lo disponible)',
					items: partialStock
				},
				{ reason: 'desactivados en esta bodega', items: inactiveInOrigin },
				{ reason: 'sin stock en origen', items: originOutOfStock },
				{
					reason: 'no activos en la bodega de destino',
					items: destinationNotActive
				},
				{ reason: 'ya estaban en la lista', items: alreadyInList },
				{
					reason: 'repetidos en el archivo (se usó la primera fila)',
					items: repeatedInFile
				}
			].filter(group => group.items.length > 0)

			if (groups.length === 0) {
				return notification.success({
					message: `Archivo procesado: se agregaron ${added.length} items`
				})
			}

			// La notificación solo da el resultado, que es corto, y se cierra sola:
			// el listado vive en el bloque del formulario, que no se desvanece, así
			// que no hay nada que perder si el aviso pasa desapercibido
			// Si todo entró y solo hay ajustes de cantidad, "los que quedaron fuera"
			// sería falso
			notification.warning({
				message: `Se agregaron ${added.length} de ${productList.length} items`,
				description:
					added.length === productList.length
						? 'Abajo está el detalle de los que entraron con menos cantidad.'
						: 'Abajo está el detalle de los que quedaron fuera o entraron con menos cantidad.'
			})

			setBulkRejected({
				added: added.length,
				total: productList.length,
				groups
			})
		} catch (error) {
			console.error(error);
		}
	};

	const itemsCount = itemsList?.reduce((acc, item) => {
		return acc + Number(item.quantity);
	}, 0);

	return (
		<Form.List name='items'>
			{(fields, { add, remove }) => {
				return (
					<>
						{!isEnter && !dataToHandle ? (
							<>
								<SearchAndAddProducts
									onAdd={() => handleAddProduct(add)}
									selectedProduct={selectedProduct}
									setSelectedProduct={setSelectedProduct}
									stockId={stockId}
									includeInactive
								/>
								{isAdmin ? (
									<>
										<div className='flex gap-2 my-6 px-2 text-gray-500'>
											<Switch
												defaultChecked={false}
												onChange={checked => {
													setShowExcelUploader(checked)
													// Sin esto el detalle de la última carga queda a la
													// vista sin el cargador que lo originó
													if (!checked) setBulkRejected(null)
												}}
												id='switch'
											/>
											<label htmlFor='switch'>
												Cargar productos masivamente
											</label>
										</div>
										{showExcelUploader ? (
											<ProductsExcelUploader
												onAddBulkProduct={(productList: any[]) =>
													handleAddBulkProduct(add, productList)
												}
												fromStockId={stockId}
											/>
										) : null}

										{bulkRejected ? (
											<Alert
												className='!mb-2'
												type='warning'
												showIcon
												closable
												onClose={() => setBulkRejected(null)}
												message={`Se agregaron ${bulkRejected.added} de ${bulkRejected.total} items`}
												description={
													<div className='max-h-48 overflow-y-auto custom-scrollbar text-xs'>
														{bulkRejected.groups.map(group => (
															<div key={group.reason} className='mb-3'>
																<p className='font-medium'>
																	{group.items.length} {group.reason}
																</p>
																<ul className='list-disc pl-5'>
																	{/* Con índice: un código que aparece tres veces en
																		el archivo deja dos entradas iguales en "repetidos" */}
																	{group.items.map((item, index) => (
																		<li key={`${index}-${item.code}`} className="mt-1">
																			<CopyableText text={item.code} badge /> ·{' '}
																			{item.name}
																			{/* En su propia línea y con la etiqueta en gris,
																				para que no se lea como parte del nombre. Ámbar
																				oscuro y no amarillo: el aviso ya tiene fondo
																				amarillo y encima no se leería */}
																			{item.shortage ? (
																				<div className='flex gap-4 mt-0.5 text-gray-500'>
																					<span>
																						Pide{' '}
																						<b className='text-blue-600'>
																							{item.shortage.requested}
																						</b>
																					</span>
																					<span>
																						Hay{' '}
																						<b className='text-amber-700'>
																							{item.shortage.available}
																						</b>
																					</span>
																					<span>
																						Faltan{' '}
																						<b className='text-red-600'>
																							{item.shortage.requested -
																								item.shortage.available}
																						</b>
																					</span>
																				</div>
																			) : null}
																		</li>
																	))}
																</ul>
															</div>
														))}
													</div>
												}
											/>
										) : null}
									</>
								) : null}
							</>
						) : null}

						{itemsList?.length > 0 ? (
							<p className='pb-6'># Total de Items: {itemsCount}</p>
						) : null}

						<div className='overflow-x-auto custom-scrollbar'>
							{fields.reverse().map(({ key, name, ...restField }) => {
								const item = dataToHandle
									? dataToHandle?.items[name]
									: form.getFieldValue('items')[name];

								const maxQuantity = !dataToHandle
									? addedProducts[item?.productVariantId]
									: Number(item?.quantity) + Number(item?.stockItemQuantity) ||
										1;

								return (
									<div key={key} className='flex items-center gap-2'>
										{TRANSACTIONS_PRODUCTS_LIST_INPUTS_PROPS?.map(
											(input, index) => {
												const isQuantity = input.name === 'quantity';

												return (
													<Form.Item
														{...restField}
														key={`${input.name}-${index}`}
														name={[name, input.name]}
														label={
															name === fields?.length - 1 ? input.label : null
														}
														rules={[
															{
																required: isQuantity && !isEnter,
																message: ''
															},
															{
																validator: (_, value) => {
																	if (
																		content !== DrawerContent.directEnter &&
																		content !== DrawerContent.enterByTransfer &&
																		isQuantity &&
																		value &&
																		value > maxQuantity
																	) {
																		return Promise.reject(
																			new Error(`Stock: ${maxQuantity}`)
																		);
																	}
																	return Promise.resolve();
																}
															}
														]}
														style={{
															width: input.width
														}}
													>
														{input.type === 'number' ? (
															<InputNumber
																min={1}
																controls={false}
																variant={isEnter ? 'borderless' : undefined}
																className='textRight'
																style={{
																	width: '100%',
																	backgroundColor: isEnter
																		? '#e5e5e5'
																		: undefined
																}}
																readOnly={isEnter}
															/>
														) : (
															<Input
																variant='borderless'
																style={{
																	backgroundColor: '#e5e5e5',
																	textAlign:
																		input.name === 'currency'
																			? 'center'
																			: undefined
																}}
																readOnly={true}
																onChange={() => null}
															/>
														)}
													</Form.Item>
												);
											}
										)}
										{!isEnter && !dataToHandle ? (
											<Tooltip title='Eliminar producto'>
												<Button
													style={{
														marginTop: name === fields?.length - 1 ? 4 : -24
													}}
													type='text'
													icon={<AiOutlineDelete size={28} color={'#E53535'} />}
													onClick={() => {
														remove(name);
													}}
												/>
											</Tooltip>
										) : null}
									</div>
								);
							})}
							{itemsError ? (
								<Form.Item>
									<Form.ErrorList
										errors={['Es necesario al menos un producto']}
									/>
								</Form.Item>
							) : null}
						</div>
					</>
				);
			}}
		</Form.List>
	);
};

export default TransactionsProductFormList;
