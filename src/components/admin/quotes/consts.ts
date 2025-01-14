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
		ruleMsg: 'El email es requerido',
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
		name: 'city',
		label: 'Ciudad',
		ruleMsg: 'La ciudad es requerida',
		placeholder: 'Ingresa la ciudad'
	}
];

export const QUOTE_PRODUCTS_INPUTS_PROPS = [
	{
		name: 'name',
		label: 'Nombre',
		type: 'text',
		minWidth: 380,
		width: '40%'
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
		width: '20%'
	},
	{
		name: 'totalPrice',
		label: 'Precio Total',
		type: 'number',
		minWidth: 120,
		width: '20%'
	}
];

export const FOOTER_PRODUCTS_INPUTS_PROPS = [
	{
		name: 'left',
		minWidth: 200,
		width: '30%'
	},
	{
		name: 'empty',
		minWidth: 0,
		width: '10%'
	},
	{
		name: 'empty',
		minWidth: 0,
		width: '10%'
	},
	{
		name: 'empty',
		minWidth: 0,
		width: '10%'
	},
	{
		name: 'empty',
		minWidth: 0,
		width: '20%'
	},
	{
		name: 'totalPrice',
		label: 'Precio Total',
		type: 'number',
		minWidth: 200,
		width: '20%'
	}
];

export const QUOTE_CALCULATIONS_INPUTS_PROPS = [
	{
		name: 'subtotal',
		label: 'Subtotal',
		readOnly: true
	},
	// {
	// 	name: 'iva',
	// 	label: 'IVA (19%)',
	// 	readOnly: true
	// },
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
