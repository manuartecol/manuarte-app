import { useState } from 'react';
import {
	Alert,
	Button,
	Form,
	FormInstance,
	Input,
	InputNumber,
	Select,
	Tooltip
} from 'antd';
import { IoAdd, IoClose } from 'react-icons/io5';
import { useSelector } from 'react-redux';
import { selectFilterOption } from '../../utils';

/**
 * Los ejes de una presentación: cantidad y unidad, y de forma opcional envase y
 * atributos. Reemplaza el campo de texto libre del nombre, no se suma a él: con
 * ejes el nombre lo compone el backend, y el formulario solo lo muestra.
 *
 * Por defecto solo cantidad y unidad. Envase y atributos aparecen con un enlace
 * discreto, porque los necesita una minoría de las presentaciones y a cambio
 * triplicaban los campos a la vista en todas las demás.
 *
 * Los ejes llegan por `axes` y no se observan aquí: el padre los observa con una
 * ruta estática y los reparte. Dentro de un `Form.List`, observar
 * `['productVariants', índice, ...]` no funciona, porque `rc-field-form` no
 * admite rutas dinámicas y el observador se quedaba en el índice viejo al
 * duplicar una fila.
 *
 * Las dos rutas son distintas a propósito. `namePath` es la de `Form.Item`, que
 * dentro de un `Form.List` es relativa a la lista (`[field.name]`). `rootPath`
 * es la que entienden `getFieldValue`, `setFields` y `dependencies`, que siempre
 * son absolutas contra el formulario (`['productVariants', índice]`).
 */
const VariantAxesFields = ({
	form,
	axes,
	namePath = [],
	rootPath = [],
	isCapacity = false,
	catalogFailed = false
}: {
	form: FormInstance;
	// Lo que el formulario tiene ahora en estos ejes, observado por el padre
	axes?: VariantAxesDto;
	// Relativa: la que recibe `Form.Item`
	namePath?: (string | number)[];
	// Absoluta: la que reciben `getFieldValue`, `setFields` y `dependencies`
	rootPath?: (string | number)[];
	// Solo cambia la etiqueta: el flag lo deduce el backend del grupo de la
	// categoría del producto, no se pregunta aquí
	isCapacity?: boolean;
	catalogFailed?: boolean;
}) => {
	const { variantCatalog } = useSelector((state: RootState) => state.product);

	const axesPath = [...rootPath, 'axes'];
	const attributes = axes?.attributes ?? [];

	/**
	 * Abiertos cuando ya traen valor, sin estado que se adelante a los datos. La
	 * versión anterior leía el formulario en su primer render, y el formulario de
	 * edición carga los valores en un efecto que corre después: una presentación
	 * con envase o atributos abría con esas secciones cerradas, con los valores
	 * guardados pero invisibles
	 */
	const [containerOpened, setContainerOpened] = useState(false);
	const [attributesOpened, setAttributesOpened] = useState(false);
	const showContainer = containerOpened || Boolean(axes?.containerId);
	const showAttributes = attributesOpened || attributes.length > 0;

	const unit = variantCatalog?.units.find(u => u.id === axes?.unitId);

	/**
	 * Con la unidad "unidad" la cantidad no aporta nada: el nombre queda "Unidad"
	 * igual, y un campo que no cambia el resultado solo invita a rellenarlo
	 */
	const hidesQuantity = unit?.code === 'unidad';

	/**
	 * En el orden que trae el catálogo, que es el `sortOrder` del seeder: conteo,
	 * masa, volumen y longitud. Ya quedan agrupadas por dimensión sin tener que
	 * dibujar grupos
	 */
	const unitOptions = (variantCatalog?.units ?? []).map(u => ({
		value: u.id,
		// "Gramo (g)", pero "Unidad" sin repetirse cuando el nombre y la
		// abreviatura son la misma palabra
		label:
			u.name.toLowerCase() === u.label.toLowerCase()
				? u.name
				: `${u.name} (${u.label})`
	}));

	const containerOptions = (variantCatalog?.containers ?? []).map(
		container => ({
			value: container.id,
			label: container.label
		})
	);

	/**
	 * Cada fila ofrece los tipos que no estén ya usados en otra. El UNIQUE de
	 * `product_variant_attribute` no admite dos valores del mismo tipo, así que
	 * sin esto se podía elegir Color dos veces y enterarse al guardar
	 */
	const attributeTypeOptionsFor = (rowIndex: number) => {
		const usedElsewhere = attributes
			.map((attribute, index) =>
				index === rowIndex ? null : attribute?.attributeTypeId
			)
			.filter(Boolean);

		return (variantCatalog?.attributeTypes ?? [])
			.filter(type => !usedElsewhere.includes(type.id))
			.map(type => ({ value: type.id, label: type.label }));
	};

	// Ni más filas que tipos, ni una fila nueva mientras haya otra sin elegir
	const canAddAttribute =
		attributes.length < (variantCatalog?.attributeTypes ?? []).length &&
		attributes.every(attribute => attribute?.attributeTypeId);

	/**
	 * Al menos un eje. No se exige la unidad porque hay presentaciones que son
	 * solo un atributo ("6 cavidades") o solo un envase ("Bolsa")
	 */
	const validateHasAxes = () => {
		const current = form.getFieldValue(axesPath) as VariantAxesDto | undefined;
		const hasAttribute = (current?.attributes ?? []).some(
			attribute => attribute?.attributeTypeId && attribute?.value?.trim()
		);

		if (current?.unitId || current?.containerId || hasAttribute) {
			return Promise.resolve();
		}

		return Promise.reject(
			new Error('Elige una unidad, un envase o un atributo')
		);
	};

	const clearContainer = () => {
		form.setFields([{ name: [...axesPath, 'containerId'], value: undefined }]);
		setContainerOpened(false);
	};

	/**
	 * Una fila más de atributo. No usa el `add` del `Form.List` para que el botón
	 * viva en un solo sitio: el de dentro de la lista y el de abajo eran dos
	 * botones distintos para la misma acción, en dos posiciones y con dos estilos
	 */
	const addAttributeRow = () => {
		const current = (form.getFieldValue([...axesPath, 'attributes']) ??
			[]) as unknown[];

		setAttributesOpened(true);
		form.setFields([
			{ name: [...axesPath, 'attributes'], value: [...current, {}] }
		]);
	};

	/**
	 * Agregar y quitar con la misma forma en los dos ejes: un botón pequeño con
	 * borde para agregar, abajo, y un icono junto al campo para quitarlo. Antes el
	 * envase se quitaba con un enlace al final del bloque y el atributo con un
	 * aspa en su fila, así que la misma acción se pedía de dos maneras
	 */
	const addButton = (label: string, onClick: () => void) => (
		<Button
			color='primary'
			variant='outlined'
			size='small'
			icon={<IoAdd size={14} style={{ display: 'block' }} />}
			onClick={onClick}
		>
			{label}
		</Button>
	);

	/**
	 * Del alto del campo (32) y bajado lo que ocupa su etiqueta (30), así que el
	 * icono queda centrado con el campo. Si el campo muestra un error no se mueve:
	 * el aviso crece hacia abajo
	 */
	const removeButton = (title: string, onClick: () => void) => (
		<Tooltip title={title}>
			<Button
				type='text'
				danger
				aria-label={title}
				style={{ marginTop: 30 }}
				icon={<IoClose size={18} style={{ display: 'block' }} />}
				onClick={onClick}
			/>
		</Tooltip>
	);

	if (catalogFailed) {
		return (
			<Alert
				type='error'
				showIcon
				className='mb-4'
				message='No se pudo cargar la lista de unidades y envases'
				description='Sin ella no se puede capturar la presentación. Cierra el formulario y vuelve a intentarlo.'
			/>
		);
	}

	return (
		<div className='flex w-full flex-col'>
			<div className='flex flex-wrap items-start gap-x-4'>
				{!hidesQuantity ? (
					<Form.Item
						name={[...namePath, 'axes', 'quantityValue']}
						label={isCapacity ? 'Capacidad' : 'Cantidad'}
						validateTrigger={['onChange', 'onBlur']}
						rules={[
							{
								validator: (_, value) =>
									value === undefined || value === null || Number(value) > 0
										? Promise.resolve()
										: Promise.reject(new Error('Mayor que 0'))
							}
						]}
						style={{ width: 130 }}
					>
						<InputNumber
							min={0}
							controls={false}
							// Coma decimal, como los importes del resto del panel
							decimalSeparator=','
							placeholder='500'
							className='textRight'
							style={{ width: '100%' }}
						/>
					</Form.Item>
				) : null}

				<Form.Item
					name={[...namePath, 'axes', 'unitId']}
					label='Unidad'
					validateTrigger={['onChange', 'onBlur']}
					rules={[{ validator: validateHasAxes }]}
					/**
					 * Absolutas: `rc-field-form` no les aplica el prefijo de la lista, al
					 * contrario que a `name`. Sin esto, añadir un atributo o quitar el
					 * envase no volvía a evaluar la regla, y el error ya resuelto se
					 * quedaba en pantalla hasta intentar guardar
					 */
					dependencies={[
						[...axesPath, 'containerId'],
						[...axesPath, 'attributes']
					]}
					style={{ width: 200 }}
				>
					<Select
						placeholder='Selecciona'
						allowClear
						showSearch
						filterOption={selectFilterOption}
						options={unitOptions}
						onChange={value => {
							const selected = variantCatalog?.units.find(u => u.id === value);

							// La cantidad se limpia al pasar a "unidad": si se queda escrita
							// viajaría oculta y el nombre no la mostraría
							if (selected?.code === 'unidad') {
								form.setFields([
									{ name: [...axesPath, 'quantityValue'], value: undefined }
								]);
							}
						}}
					/>
				</Form.Item>

				{showContainer ? (
					/**
					 * Ocupa lo que queda de la fila, igual que el valor de un atributo, y
					 * con la misma separación: las aspas de los dos ejes caen en la misma
					 * columna y a la misma distancia de su campo. El mínimo es el campo
					 * más el aspa, para que en poco ancho baje entero a la fila siguiente
					 */
					<div className='flex min-w-[228px] flex-1 items-start gap-4'>
						<Form.Item
							name={[...namePath, 'axes', 'containerId']}
							label='Envase'
							style={{ flex: 1, minWidth: 0 }}
						>
							<Select
								placeholder='Selecciona'
								allowClear
								showSearch
								filterOption={selectFilterOption}
								options={containerOptions}
							/>
						</Form.Item>
						{removeButton('Quitar envase', clearContainer)}
					</div>
				) : null}
			</div>

			{showAttributes ? (
				<Form.List name={[...namePath, 'axes', 'attributes']}>
					{(attributeFields, { remove }) => (
						<>
							{attributeFields.map(({ key, name: attributeName }) => (
								<div key={key} className='flex items-start gap-4'>
									<Form.Item
										name={[attributeName, 'attributeTypeId']}
										label='Atributo'
										rules={[{ required: true, message: 'Requerido' }]}
										style={{ width: 200 }}
									>
										<Select
											placeholder='Selecciona'
											options={attributeTypeOptionsFor(attributeName)}
										/>
									</Form.Item>

									<Form.Item
										name={[attributeName, 'value']}
										label='Valor'
										rules={[{ required: true, message: 'Requerido' }]}
										style={{ flex: 1 }}
									>
										<Input placeholder='Amarillo' />
									</Form.Item>

									{removeButton('Quitar atributo', () => {
										remove(attributeName);

										// Cerrado al quitar el último, para volver al estado
										// mínimo en vez de dejar una lista vacía a la vista
										if (attributeFields.length === 1) {
											setAttributesOpened(false);
										}
									})}
								</div>
							))}
						</>
					)}
				</Form.List>
			) : null}

			{/*
			 * Aire propio arriba y abajo: los `Form.Item` traen su margen inferior y
			 * estos botones no, así que quedaban a ras del campo siguiente y parecía
			 * que se estorbaban. La fila no se dibuja vacía
			 */}
			{!showContainer || canAddAttribute ? (
				<div className='mb-4 mt-1 flex flex-wrap gap-2'>
					{!showContainer
						? addButton('Envase', () => setContainerOpened(true))
						: null}
					{canAddAttribute ? addButton('Atributo', addAttributeRow) : null}
				</div>
			) : null}
		</div>
	);
};

export default VariantAxesFields;
