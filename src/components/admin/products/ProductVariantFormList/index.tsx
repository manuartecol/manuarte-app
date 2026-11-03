import { Button, Divider, Form, Input, InputNumber, Tooltip } from 'antd';
import { IoAdd, IoRemoveCircleOutline } from 'react-icons/io5';
import { AiOutlineAppstore } from 'react-icons/ai';
import { formatInputCurrency } from '@/utils/formats';
import { PRODUCT_VARIANT_PROPS } from '../../consts';

const ProductVariantFormList = ({
	isUpdating,
	isQuitoSelected
}: {
	isUpdating: boolean;
	isQuitoSelected: boolean;
}) => {
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
	const basicInputs = filteredInputs.filter(
		input => input.type === 'text' || input.name.includes('Qty')
	);
	const pvpInputs = filteredInputs.filter(input => input.priceType === 'pvp');
	const disInputs = filteredInputs.filter(input => input.priceType === 'dis');
	const costInputs = filteredInputs.filter(input =>
		input.name.includes('cost')
	);

	return (
		<Form.List name='productVariants'>
			{(fields, { add, remove }, { errors }) => (
				<>
					{fields.map((field, index) => (
						<div key={field.key}>
							<Divider orientation='left' style={{ borderColor: '#00000032' }}>
								<div className='flex items-center gap-4'>
									Presentación {index + 1}{' '}
									{fields.length > 0 && !isUpdating ? (
										<Tooltip title='Remover presentación'>
											<IoRemoveCircleOutline
												className={`dynamic-delete-button cursor-pointer`}
												size={24}
												color='#FF4D4f'
												onClick={() => remove(field.name)}
											/>
										</Tooltip>
									) : null}
								</div>
							</Divider>
							<div className='flex flex-col'>
								<div className='flex flex-wrap items-center gap-x-4'>
									{/* Nombre y cantidades */}
									{basicInputs.map(input => (
										<Form.Item
											{...field}
											key={`${input.name}-${index}`}
											name={[field.name, input.name]}
											label={input.label}
											validateTrigger={['onChange', 'onBlur']}
											rules={[
												{
													required: true,
													message: 'Requerido'
												}
											]}
											style={{ width: input.width }}
										>
											{input.type === 'text' ? (
												<Input placeholder={input.placeholder} />
											) : (
												<InputNumber
													min={0}
													controls={false}
													placeholder={input.placeholder}
													className='textRight'
													style={{ width: '100%' }}
												/>
											)}
										</Form.Item>
									))}
								</div>

								<div className='flex gap-4'>
									{/* Precios PVP */}
									{pvpInputs.length > 0 && (
										<div className='flex flex-wrap items-center gap-x-4 border-b-2 border-gray-200 mb-4'>
											<span className='font-semibold'>
												Precio de venta al público
											</span>
											{pvpInputs.map(input => (
												<Form.Item
													{...field}
													key={`${input.name}-${index}`}
													name={[field.name, input.name]}
													label={input.label}
													validateTrigger={['onChange', 'onBlur']}
													rules={[
														{
															required: true,
															message: 'Requerido'
														}
													]}
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
									)}

									{/* Precios DIS */}
									{disInputs.length > 0 && (
										<div className='flex flex-wrap items-center gap-x-4 border-b-2 border-gray-200 mb-4'>
											<span className='font-semibold'>
												Precio para distribuidores
											</span>
											{disInputs.map(input => (
												<Form.Item
													{...field}
													key={`${input.name}-${index}`}
													name={[field.name, input.name]}
													label={input.label}
													validateTrigger={['onChange', 'onBlur']}
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
									)}
								</div>

								{/* Costos */}
								{costInputs.length > 0 && (
									<div className='flex flex-wrap items-center gap-x-4'>
										{costInputs.map(input => (
											<Form.Item
												{...field}
												key={`${input.name}-${index}`}
												name={[field.name, input.name]}
												label={input.label}
												validateTrigger={['onChange', 'onBlur']}
												rules={[
													{
														required: true,
														message: 'Requerido'
													}
												]}
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
								)}
							</div>
						</div>
					))}
					{!isUpdating ? (
						<Form.Item>
							<Button
								color='primary'
								variant='dashed'
								onClick={() => add()}
								icon={
									<IoAdd
										size={20}
										style={{ display: 'flex', alignItems: 'center' }}
									/>
								}
								className='mt-4'
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
