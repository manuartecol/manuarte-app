/**
 * Vista previa del nombre de una presentación a partir de sus ejes.
 *
 * Es un espejo de `product-variant/helpers/composition.ts` en el backend, que
 * es quien compone el nombre que de verdad se guarda. Aquí solo se calcula para
 * mostrarlo mientras se captura: pedirle la vista previa al backend sería una
 * petición por tecla pulsada, y lo que se guarda nunca sale de este archivo.
 *
 * Si se cambia la composición, hay que cambiarla en los dos sitios. Lo que no
 * se duplica es la firma (`variantKey`) ni `quantityBase`: esas deciden
 * unicidad y orden, y viven solo en el backend.
 */

type PreviewUnit = Pick<VariantUnit, 'label' | 'labelPlural' | 'dimension'>;
type PreviewContainer = Pick<VariantContainer, 'label'>;
type PreviewAttribute = {
	type: Pick<VariantAttributeType, 'code' | 'valueTemplate' | 'sortOrder'>;
	value: string;
};

export type VariantNameAxes = {
	quantityValue?: number | null;
	unit?: PreviewUnit | null;
	container?: PreviewContainer | null;
	attributes?: PreviewAttribute[];
};

/**
 * `50.000` se muestra como `50`, `3.500` como `3.5`, igual que en el backend
 */
const trimZeros = (fixed: string): string => {
	const trimmed = fixed.replace(/0+$/, '').replace(/\.$/, '');

	return trimmed === '-0' ? '0' : trimmed;
};

const formatQuantity = (value: number): string => trimZeros(value.toFixed(3));

const capitalize = (value: string): string =>
	value.charAt(0).toUpperCase() + value.slice(1);

const sortAttributes = (attributes: PreviewAttribute[]) =>
	[...attributes].sort(
		(a, b) =>
			a.type.sortOrder - b.type.sortOrder ||
			a.type.code.localeCompare(b.type.code)
	);

/**
 * El segmento de medida. Una unidad de conteo con cantidad 1 o sin cantidad se
 * imprime sola ("Unidad", "Docena")
 */
const composeMeasure = (axes: VariantNameAxes): string | null => {
	const { unit, quantityValue } = axes;
	if (!unit) return null;

	const hasPlainQuantity =
		quantityValue !== null &&
		quantityValue !== undefined &&
		quantityValue !== 1;

	if (unit.dimension === 'count' && !hasPlainQuantity) {
		return capitalize(unit.label);
	}

	if (quantityValue === null || quantityValue === undefined) {
		return capitalize(unit.label);
	}

	return `${formatQuantity(quantityValue)} ${unitLabelFor(unit, quantityValue)}`;
};

/**
 * El plural solo cuando la unidad es una palabra y la cantidad no es 1:
 * "3 docenas", "2 galones", pero "1 docena" y "500 g"
 */
const unitLabelFor = (unit: PreviewUnit, quantityValue: number): string =>
	quantityValue !== 1 && unit.labelPlural ? unit.labelPlural : unit.label;

export const composeVariantName = (axes: VariantNameAxes): string => {
	const measure = composeMeasure(axes);
	const container = axes.container;

	// "Bolsa x 50 g". Sin medida, el envase va solo: "Bolsa"
	const head = container
		? measure
			? `${container.label} x ${measure}`
			: container.label
		: measure;

	// El valor capitalizado, igual que la unidad de conteo: se teclea "rojo" y el
	// nombre tiene que decir "Rojo"
	const attributes = sortAttributes(axes.attributes ?? []).map(attribute =>
		attribute.type.valueTemplate.replace(
			'{value}',
			capitalize(attribute.value.trim())
		)
	);

	const parts = [head, ...attributes].filter((part): part is string =>
		Boolean(part?.trim())
	);

	// Sin ningún eje la presentación es el producto a secas, que es "Unidad"
	return parts.length > 0 ? parts.join(' · ') : 'Unidad';
};

/**
 * La vista previa a partir de lo que tiene el formulario: identificadores
 * sueltos más el catálogo. Devuelve null cuando no hay ningún eje elegido,
 * porque entonces el bloque está vacío y no hay nombre que prometer.
 *
 * Es una función y no un hook a propósito. Observar la ruta de cada fila
 * (`['productVariants', índice, 'axes']`) parecía lo natural, pero
 * `rc-field-form` registra el `useWatch` una sola vez y no admite rutas
 * dinámicas: al duplicar una presentación, las filas de abajo cambian de índice
 * conservando su `key`, y su observador se quedaba apuntando al índice viejo.
 * Ahora el padre observa `productVariants` entero, que es una ruta estática, y
 * reparte los ejes por índice.
 */
export const previewFromAxes = (
	axes: VariantAxesDto | undefined,
	catalog: VariantCatalog | null
): string | null => {
	const unit = catalog?.units.find(u => u.id === axes?.unitId) ?? null;
	const container =
		catalog?.containers.find(c => c.id === axes?.containerId) ?? null;

	const attributes = (axes?.attributes ?? [])
		.map(attribute => {
			const type = catalog?.attributeTypes.find(
				candidate => candidate.id === attribute?.attributeTypeId
			);

			return type && attribute?.value?.trim()
				? { type, value: attribute.value }
				: null;
		})
		.filter(
			(attribute): attribute is { type: VariantAttributeType; value: string } =>
				Boolean(attribute)
		);

	if (!unit && !container && attributes.length === 0) return null;

	return composeVariantName({
		quantityValue: axes?.quantityValue ?? null,
		unit,
		container,
		attributes
	});
};
