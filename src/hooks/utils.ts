/**
 * Mismo criterio que el backend, que compara con `LOWER` y guarda el nombre
 * recortado: comparando tal cual, "Unidad" y "unidad" pasaban esta validación
 * y la transacción se caía después, al crear la segunda presentación
 */
export const validateUniqueProductVariantsName = (
	array: ProductVariantStockItem[]
): boolean => {
	const seen = new Set<string>();

	for (const item of array) {
		const name = item.name?.trim().toLowerCase();

		if (seen.has(name)) {
			return false;
		}
		seen.add(name);
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
