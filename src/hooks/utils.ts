/**
 * Dos presentaciones del mismo producto no pueden repetirse dentro del mismo
 * formulario. Se compara por ejes y no por nombre, porque el nombre ya no se
 * escribe: lo compone el backend, y aquí todavía no existe.
 *
 * Compara lo que el formulario tiene, no equivalencias: "0.5 kg" y "500 g" son
 * la misma presentación y esto no lo ve. Eso lo detecta el UNIQUE del backend
 * por la firma, que es el único sitio que puede hacerlo bien. Esta validación
 * está para el caso frecuente, que es duplicar un bloque y olvidar cambiarlo.
 *
 * Se sigue mirando `name` para las presentaciones sin estructurar, que todavía
 * pueden llegar por texto libre desde la edición
 */
export const validateUniqueProductVariantsName = (
	array: ProductVariantStockItem[]
): boolean => {
	const seen = new Set<string>();

	for (const item of array) {
		const attributes = [...(item.axes?.attributes ?? [])]
			.filter(attribute => attribute?.attributeTypeId)
			.map(
				attribute =>
					`${attribute.attributeTypeId}=${attribute.value?.trim().toLowerCase() ?? ''}`
			)
			.sort()
			.join(',');

		const signature = item.axes
			? [
					item.axes.quantityValue ?? '',
					item.axes.unitId ?? '',
					item.axes.containerId ?? '',
					attributes
				].join('|')
			: (item.name?.trim().toLowerCase() ?? '');

		if (seen.has(signature)) {
			return false;
		}
		seen.add(signature);
	}

	return true;
};

export const getStockStatusColor = ({
	quantity,
	maxQty,
	minQty
}: {
	quantity: number;
	maxQty: number;
	minQty: number;
}) => {
	let stockStatusColor = 'text-emerald-500';

	const stockPercentage = (quantity / maxQty) * 100;

	if (quantity <= minQty) {
		stockStatusColor = 'text-red-500';
	} else if (stockPercentage <= 75) {
		stockStatusColor = 'text-yellow-500';
	}

	return stockStatusColor;
};
