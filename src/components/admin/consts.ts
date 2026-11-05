import { CashMovementCategory } from '@/types/enums';

export const CUSTOMER_INPUTS_PROPS = [
	{
		name: 'dni',
		label: 'Nro. de Documento',
		ruleMsg: 'El número de documento es requerido',
		placeholder: 'Ingresa el número de documento'
	},
	{
		name: 'fullName',
		label: 'Nombre',
		ruleMsg: 'El nombre del cliente es requerido',
		placeholder: 'Ingresa el nombre completo'
	},
	{
		name: 'email',
		label: 'Email',
		placeholder: 'Ingresa el email'
	},
	{
		name: 'phoneNumber',
		label: 'Nro. de Teléfono',
		ruleMsg: 'El número de teléfono es requerido',
		placeholder: 'Ingresa el número de teléfono'
	},
	{
		name: 'location',
		label: 'Dirección',
		ruleMsg: 'La dirección es requerida',
		placeholder: 'Ingresa la dirección'
	},
	{
		name: 'cityId',
		label: 'Ciudad',
		ruleMsg: 'La ciudad es requerida',
		placeholder: 'Ingresa la ciudad'
	}
];

export const PRODUCTS_LIST_INPUTS_PROPS = [
	{
		name: 'name',
		label: 'Nombre',
		type: 'text',
		minWidth: 360,
		width: '45%'
	},
	{
		name: 'quantity',
		label: 'Cantidad',
		type: 'number',
		ruleMsg: 'La cantidad es requerida',
		placeholder: 'Ingresa la cantidad del producto',
		minWidth: 80,
		width: '10%'
	},
	{
		name: 'currency',
		label: 'Moneda',
		type: 'text',
		minWidth: 80,
		width: '10%'
	},
	{
		name: 'price',
		label: 'Precio Unitario',
		type: 'number',
		ruleMsg: 'El precio es requerido',
		placeholder: 'Ingresa el precio del producto',
		minWidth: 120,
		width: '15%'
	},
	{
		name: 'totalPrice',
		label: 'Precio Total',
		type: 'number',
		minWidth: 120,
		width: '15%'
	}
];

export const TRANSACTIONS_PRODUCTS_LIST_INPUTS_PROPS = [
	{
		name: 'name',
		label: 'Nombre',
		type: 'text',
		width: '80%'
	},
	{
		name: 'quantity',
		label: 'Cantidad',
		type: 'number',
		ruleMsg: 'La cantidad es requerida',
		placeholder: 'Ingresa la cantidad del producto',
		width: '15%'
	}
];

export const QUOTE_CALCULATIONS_INPUTS_PROPS = [
	{
		name: 'subtotal',
		label: 'Subtotal',
		readOnly: true
	},
	{
		name: 'discountType',
		label: 'Calcular descuento por',
		readOnly: false
	},
	{
		name: 'discount',
		label: 'Descuento',
		readOnly: false
	},
	{
		name: 'shipping',
		label: 'Flete',
		readOnly: false
	},
	{
		name: 'total',
		label: 'Total',
		readOnly: true
	}
];

/**
 * El grupo de categorías cuyos productos se miden por capacidad del envase: una
 * Jarra de Aluminio de 250 ml contiene 250 ml, no está hecha de 250 ml. Aquí
 * solo cambia la etiqueta del campo; el flag que entra en la firma lo deduce el
 * backend del mismo grupo
 */
export const CAPACITY_CATEGORY_GROUP = 'ENVASES';

/**
 * Sin el campo `name`: desde el punto 4 la presentación se captura por ejes
 * (cantidad, unidad, envase, atributos) en `VariantAxesFields`, y el nombre lo
 * compone el backend. Las dos cosas no se suman, la una reemplaza a la otra
 */
export const PRODUCT_VARIANT_PROPS = [
	{
		name: 'minQty',
		label: 'Cant. Mínima',
		placeholder: '9',
		type: 'number',
		width: '140px'
	},
	{
		name: 'maxQty',
		label: 'Cant. Máxima',
		placeholder: '9',
		type: 'number',
		width: '140px'
	},
	{
		name: 'pvpCop',
		label: 'PVP - COP',
		placeholder: '$10.000',
		type: 'number',
		width: '47%',
		priceType: 'pvp',
		currency: 'cop'
	},
	{
		name: 'pvpUsd',
		label: 'PVP - USD',
		placeholder: '$10',
		type: 'number',
		width: '47%',
		priceType: 'pvp',
		currency: 'usd'
	},
	{
		name: 'disCop',
		label: 'DIS - COP',
		placeholder: '$8.000',
		type: 'number',
		width: '47%',
		priceType: 'dis',
		currency: 'cop'
	},
	{
		name: 'disUsd',
		label: 'DIS - USD',
		placeholder: '$8',
		type: 'number',
		width: '47%',
		priceType: 'dis',
		currency: 'usd'
	},
	{
		name: 'costCop',
		label: 'Costo COP',
		placeholder: '$5.000',
		type: 'number',
		width: '23%',
		currency: 'cop'
	},
	{
		name: 'costUsd',
		label: 'Costo USD',
		placeholder: '$5',
		type: 'number',
		width: '23%',
		currency: 'usd'
	}
];

export const QUOTE_STATUS_OPTIONS = [
	{ value: 'PENDING', label: 'Por pagar' },
	{ value: 'ACCEPTED', label: 'Aceptada' },
	{ value: 'REVISION', label: 'En revisión' }
];

export const BILLING_STATUS_OPTIONS = [
	{ value: 'PAID', label: 'Pagada' },
	{ value: 'PENDING_PAYMENT', label: 'Pago pendiente' },
	{ value: 'PARTIAL_PAYMENT', label: 'Pago parcial' },
	{ value: 'PENDING_DELIVERY', label: 'Por entregar' }
];

export const COL_PAYMENT_METHOD_OPTIONS = [
	{ value: 'CASH', label: 'Efectivo' },
	{ value: 'BANK_TRANSFER_RT', label: 'Transferencia RI' },
	{ value: 'BANK_TRANSFER_RBT', label: 'Transferencia RO' },
	{ value: 'NEQUI', label: 'Nequi' },
	{ value: 'BOLD', label: 'Bold' },
	{ value: 'EFECTY', label: 'Efecty' },
	{ value: 'WOMPI', label: 'Wompi' },
	{ value: 'OTHER', label: 'Otro' }
];

export const ECU_PAYMENT_METHOD_OPTIONS = [
	{ value: 'CASH', label: 'Efectivo' },
	{ value: 'BANK_TRANSFER_RT', label: 'Transferencia RI' },
	{ value: 'PAYPHONE', label: 'PayPhone' },
	{ value: 'BANK_DEPOSIT', label: 'Depósito' },
	{ value: 'OTHER', label: 'Otro' }
];

export const COL_PAYMENT_METHOD_FILTER = [
	{ text: 'EFECTIVO', value: 'CASH' },
	{ text: 'TRANSFERENCIA RI', value: 'BANK_TRANSFER_RT' },
	{ text: 'TRANSFERENCIA RO', value: 'BANK_TRANSFER_RBT' },
	{ text: 'NEQUI', value: 'NEQUI' },
	{ text: 'BOLD', value: 'BOLD' },
	{ text: 'EFECTY', value: 'EFECTY' },
	{ text: 'WOMPI', value: 'WOMPI' },
	{ text: 'SALDO A FAVOR', value: 'BALANCE' },
	{ text: 'OTRO', value: 'OTHER' }
];

export const ECU_PAYMENT_METHOD_FILTER = [
	{ text: 'EFECTIVO', value: 'CASH' },
	{ text: 'TRANSFERENCIA RI', value: 'BANK_TRANSFER_RT' },
	{ text: 'PAYPHONE', value: 'PAYPHONE' },
	{ text: 'DEPÓSITO', value: 'BANK_DEPOSIT' },
	{ text: 'SALDO A FAVOR', value: 'BALANCE' },
	{ text: 'OTRO', value: 'OTHER' }
];

export const CASH_MOVEMENT_CAT_FILTER = [
	{ text: 'VENTA', value: CashMovementCategory.SALE },
	{ text: 'ABONO', value: CashMovementCategory.ADVANCE_PAYMENT },
	{ text: 'DOMICILIO', value: CashMovementCategory.DELIVERY },
	{ text: 'PAGO DE FLETE', value: CashMovementCategory.INBOUND_SHIPPING },
	{ text: 'COMPRA', value: CashMovementCategory.PURCHASE },
	{ text: 'CAMBIO', value: CashMovementCategory.CHANGE },
	{ text: 'ALCANCÍA', value: CashMovementCategory.PIGGY_BANK },
	{ text: 'COBERTURA DE FALTANTE', value: CashMovementCategory.SHORTAGE_COVER },
	{ text: 'OTRO', value: CashMovementCategory.OTHER }
];

export const TAG_COLORS: Record<string, string> = {
	ENTER: '#0D6EFD',
	TRANSFER: '#eab308',
	EXIT: '#E53535',
	BILLING: '#10b981'
};
