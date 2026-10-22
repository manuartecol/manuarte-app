import {
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

interface TransactionsProductFormListProps {
	form: FormInstance;
	itemsError: boolean;
	setItemsError: Dispatch<SetStateAction<boolean>>;
	shops: Shop[];
}

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
				const inList = itemsList.some(
					(product: ProductVariantWithStock) =>
						product.productVariantId === selectedProduct.id
				);

				if (inList) {
					return notification.error({
						message: 'El producto ya se encuentra en la lista!'
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

			const originOutOfStock: string[] = [];
			const destinationNotExist: string[] = [];

			productList.forEach(product => {
				if (product) {
					const inList = itemsList.some(
						(product: ProductVariantWithStock) =>
							product.productVariantId === product.id
					);

					if (inList) {
						return notification.error({
							message: 'El producto ya se encuentra en la lista!'
						});
					}

					if (content === DrawerContent.transfer) {
						if (product.quantity === 0) {
							originOutOfStock.push(product.name);
							return;
						}

						if (!product?.stocks?.includes(toId)) {
							destinationNotExist.push(product.name);
							return;
						}
					}

					setAddedProducts(prev => ({
						...prev,
						[product.id]: product.quantity
					}));

					setItemsError(false);

					add({
						productVariantId: product?.id,
						stockItemId: product?.stockItemId,
						name: product.name,
						quantity: product.requiredQty
					});
				}
			});

			if (originOutOfStock?.length > 0) {
				return notification.info({
					message: `Los siguientes items no tienen stock en origen: ◾ ${originOutOfStock.join(' ◾ ')}`,
					duration: null
				});
			}

			if (destinationNotExist?.length > 0) {
				return notification.info({
					message: `Los siguientes items no están activos en destino: ◾${destinationNotExist.join(' - ')}`
				});
			}

			notification.success({
				message: 'Archivo procesado exitosamente'
			});
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
								/>
								{isAdmin ? (
									<>
										<div className='flex gap-2 my-6 px-2 text-gray-500'>
											<Switch
												defaultChecked={false}
												onChange={checked => setShowExcelUploader(checked)}
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
