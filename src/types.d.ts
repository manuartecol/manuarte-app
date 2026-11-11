/* eslint-disable no-unused-vars */

interface SubmitLoginDto {
	email: string;
	password: string;
}

type MeasurementDimension = 'mass' | 'volume' | 'count' | 'length';

interface VariantUnit {
	id: string;
	code: string;
	label: string;
	// Solo las unidades que son palabras ("docenas", "galones"); null en las
	// abreviaturas, porque "3 g" es correcto y "3 gs" no
	labelPlural?: string | null;
	name: string;
	dimension: MeasurementDimension;
	factorToBase: number | string;
}

interface VariantContainer {
	id: string;
	code: string;
	label: string;
}

interface VariantAttributeType {
	id: string;
	code: string;
	label: string;
	// 'Rojo' con '{value}', '6 cavidades' con '{value} cavidades'
	valueTemplate: string;
	sortOrder: number;
}

/**
 * Las tres listas fijas del formulario de presentaciones. No hay administración
 * de unidades ni de envases: se mantienen por seeder y solo se leen
 */
// Una medida usada en la categoría, para ofrecerla al crear un producto
interface VariantSuggestion {
	quantityValue: number | null;
	unitId: string | null;
	containerId: string | null;
	name: string;
	products: number;
}

interface VariantCatalog {
	units: VariantUnit[];
	containers: VariantContainer[];
	attributeTypes: VariantAttributeType[];
}

/**
 * Los ejes de una presentación tal como los manda el formulario. Sin
 * `isCapacity`: lo deduce el backend del grupo de la categoría del producto
 */
interface VariantAxesDto {
	quantityValue?: number | null;
	unitId?: string | null;
	containerId?: string | null;
	attributes?: { attributeTypeId: string; value: string }[];
}

/**
 * Un atributo tal como lo devuelve el backend en una presentación ya guardada
 */
interface VariantAttributeValue {
	attributeTypeId: string;
	code: string;
	label: string;
	value: string;
}

/**
 * Los ejes resueltos que viajan en cada presentación. Todo en null mientras no
 * esté estructurada, que es el caso de las 946 de hoy hasta el backfill
 */
interface VariantAxesValues {
	quantityValue: number | null;
	unitId: string | null;
	unitCode?: string | null;
	unitLabel?: string | null;
	containerId: string | null;
	containerLabel?: string | null;
	isCapacity: boolean;
	quantityBase: number | null;
	attributes: VariantAttributeValue[];
}

interface ProductVariant extends Partial<VariantAxesValues> {
	id: string;
	name: string;
	productId: string;
	vId: string;
	active: boolean;
	createdBy?: string;
	updatedBy?: string;
	createdDate?: string;
	updatedDate?: string;
	deletedDate?: string;
	// Los del producto al que pertenece, que la tabla de presentaciones trae
	// aplanados en cada fila
	productName?: string;
	productDescription?: string | null;
	productCategoryId?: string;
	productCategoryName?: string;
	stockIds?: string[];
}

interface ProductVariantWithStock extends ProductVariant {
	productVariantId: string;
	quantity: number;
	currency: string;
	price: number;
	pricePvp: number;
	priceDis: number;
	totalPrice: number;
	stockItemId: string;
	stocks: string[];
	/**
	 * Si el item de stock está activo en la bodega consultada. Solo viene cuando
	 * la búsqueda se pidió con `includeInactive`; en el resto de los casos el
	 * backend ya devuelve únicamente activos.
	 */
	activeInOrigin?: boolean;
}

interface Product {
	id: string;
	name: string;
	description: string;
	productCategoryId: string;
	productCategoryName: string;
	productVariants: ProductVariant[];
}

interface ProductVariantStockItem {
	// Opcional desde que la presentación se captura por ejes: con `axes` el
	// nombre lo compone el backend y lo que venga aquí se ignora
	name?: string;
	axes?: VariantAxesDto;
	costCop?: number;
	costUsd?: number;
	priceCop?: number;
	priceUsd?: number;
	maxQty: number;
	minQty: number;
}

/**
 * Una presentación tal como llega anidada en su producto. No trae los campos
 * del producto que sí lleva `ProductVariant`, porque ahí ya los tiene el padre
 */
interface NestedProductVariant extends VariantAxesValues {
	id: string;
	vId: string;
	name: string;
	active: boolean;
	productId: string;
	// Las bodegas donde está activa, y en cuántas existe en total
	stockIds: string[];
	stocksCount: number;
}

interface ProductWithVariants {
	id: string;
	pId: string;
	name: string;
	description: string | null;
	productCategoryId: string;
	productCategoryName: string;
	variantsCount: number;
	productVariants: NestedProductVariant[];
}

interface SubmitProductDto {
	type?: 'create' | 'update' | 'updateVariant';
	name: string;
	description?: string;
	productCategoryId?: string;
	productCategoryName?: string;
	productVariants?: ProductVariantStockItem[];
	productVariantName?: string;
	productVariant?: {
		id: string;
		name?: string;
		active?: boolean;
	};
	stockIds?: string[];
	stocks?: { id: string; currency: string }[];
}

// Lo que viaja al editar una presentación, que desde que el modal está separado
// es una acción propia y no un añadido a la del producto
interface SubmitProductVariantUpdateDto {
	// `name` solo para las presentaciones todavía sin estructurar. Con `axes` el
	// backend compone el nombre e ignora este campo
	name?: string;
	axes?: VariantAxesDto;
	active: boolean;
	stockIds: string[];
}

interface SubmitProductCategoryDto {
	name: string;
	// null quita el grupo
	productCategoryGroupId: string | null;
}

interface SubmitProductVariantDto extends ProductVariantStockItem {
	productId: string;
	stockIds?: string[];
	stocks?: { id: string; currency: string }[];
}

/**
 * Lo que el backend responde antes de confirmar un borrado. `blocked` es
 * inventario vivo, `logical` conserva la fila porque hay documentos que la
 * referencian, y `physical` la quita
 */
interface ProductDeletionPreview {
	mode: 'physical' | 'logical' | 'blocked';
	// El motivo ya redactado por el backend, o null si no está bloqueado. Es el
	// mismo texto que lanza el borrado al confirmar, para que el aviso previo y
	// el error no puedan discrepar
	blockedMessage: string | null;
	// Todas las filas que la referencian, incluidas las de documentos anulados o
	// borrados: deciden el modo. Los tres conteos de abajo son solo documentos
	// vivos y pueden sumar menos
	historyRows: number;
	billingItems: number;
	quoteItems: number;
	transactionItems: number;
	stocksWithUnits: { name: string; quantity: number }[];
	// Transferencias creadas y sin aceptar. Sus unidades salieron del origen y
	// aún no entraron al destino, así que no están en `stocksWithUnits`
	pendingTransfers: {
		id: string;
		name: string;
		createdDate: string;
		fromId: string | null;
		fromName: string | null;
		toId: string | null;
		toName: string | null;
		quantity: number;
	}[];
	deletesProduct: boolean;
}

interface ProductCategoryGroup {
	id: string;
	name: string;
}

interface ProductCategory {
	id: string;
	name: string;
	cId: string;
	productCategoryGroupId?: string | null;
	groupName?: string | null;
	// Productos vivos que cuelgan de la categoría. Opcional porque una respuesta
	// vieja en caché puede no traerlo, y entonces el aviso de borrado no afirma
	productsCount?: number;
	createdBy: string;
	updatedBy: string;
	createdDate: string;
	updatedDate: string;
	deletedDate?: string;
}

interface Staff {
	id: string;
	email: string;
	roleId: string;
	isActive: boolean;
	personId: string;
	createdDate: string;
	fullName: string;
	docId: string;
	roleName: string;
}

interface Role {
	id: string;
	name: string;
}

interface SubmitStaffDto {
	fullName: string;
	dni: string;
	roleId: string;
	shopId?: string;
	email: string;
	password: string;
}

interface Customer {
	id: string;
	personId: string;
	email: string;
	phoneNumber: string;
	createdDate: string;
	city: string;
	cityName: string;
	fullName: string;
	dni: string;
	totalSpent: number;
	billingCount: number;
	currency: string;
	balance?: number;
}

interface ExistingCustomer extends Customer {
	customerId?: string;
	cityId?: string;
	cityName?: string;
	regionName?: string;
	countryIsoCode?: string;
}

interface TopCustomer extends Customer {
	billingCount: number;
	totalSpent: number;
}

interface SubmitCustomerDto {
	fullName: string;
	dni: string;
	email: string;
	phoneNumber: string;
	location: string;
	city: string;
	cityId: string;
	personId: string?;
	customerId: string?;
}

interface TopProductCustomer {
	productVariantId: string;
	name: string;
	totalQty: number;
}

interface Shop {
	id: string;
	name: string;
	slug: string;
	currency: string;
	stockId: string;
	stockName: string;
	mainStock?: boolean;
	isoCode?: string;
}

enum QuoteStatus {
	ACCEPTED = 'ACCEPTED',
	PENDING = 'PENDING',
	CANCELED = 'CANCELED',
	REVISION = 'REVISION',
	OVERDUE = 'OVERDUE'
}

interface QuoteItem {
	id: string;
	name: string;
	quantity: number;
	price: number;
	totalPrice: number;
}

interface Quote {
	id: string;
	serialNumber: string;
	shopId: string;
	customerId: string;
	status: QuoteStatus;
	currency: string;
	fullName: string;
	customerName: string;
	dni: string;
	email: string;
	phoneNumber: string;
	location: string;
	city: string;
	cityId: string;
	cityName: string;
	regionName: string;
	countryIsoCode: string;
	callingCode: string;
	createdDate: string;
	updatedDate: string;
	items: QuoteItem[];
	shipping: number;
	discountType: string;
	discount: number;
}

interface SubmitQuoteDto extends SubmitCustomerDto {
	shopSlug?: string;
	shopId?: string;
	stockId?: string;
	items: ProductVariantWithStock[];
	status: QuoteStatus;
	discountType: string;
	discount: number;
	shipping: number;
	subtotal?: number;
	total?: number;
	currency: 'COP' | 'USD';
	priceType: 'PVP' | 'DIS';
}

enum BillingStatus {
	PAID = 'PAID',
	PENDING_PAYMENT = 'PENDING_PAYMENT',
	PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
	PENDING_DELIVERY = 'PENDING_DELIVERY',
	CANCELED = 'CANCELED'
}

enum PaymentMethod {
	CASH = 'CASH',
	BANK_TRANSFER = 'BANK_TRANSFER',
	BANK_TRANSFER_RT = 'BANK_TRANSFER_RT',
	BANK_TRANSFER_RBT = 'BANK_TRANSFER_RBT',
	DEBIT_CARD = 'DEBIT_CARD',
	CREDIT_CARD = 'CREDIT_CARD',
	NEQUI = 'NEQUI',
	BOLD = 'BOLD',
	EFECTY = 'EFECTY',
	WOMPI = 'WOMPI',
	PAYPHONE = 'PAYPHONE',
	PAYPAL = 'PAYPAL',
	BANK_DEPOSIT = 'BANK_DEPOSIT',
	OTHER = 'OTHER'
}

interface Payment {
	paymentMethod: PaymentMethod;
	amount: number;
	createdDate: string;
}

enum CustomerBalanceMovementCategory {
	ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
	REFUND = 'REFUND',
	PAYMENT_APPLIED = 'PAYMENT_APPLIED',
	ADJUSTMENT = 'ADJUSTMENT',
	OTHER = 'OTHER'
}

interface CustomerBalanceDto {
	currency: 'COP' | 'USD';
	amount: number;
	category: CustomerBalanceMovementCategory;
	quoteId?: string;
	billingId?: string;
	comments?: string;
}

interface CustomerBalanceMovement {
	type: 'CREDIT' | 'DEBIT';
	category: CustomerBalanceMovementCategory;
	paymentMethod: PaymentMethod;
	amount: number;
	balanceBefore: number;
	balanceAfter: number;
	createdDate: string;
	billingId?: string;
	quoteId?: string;
	comments?: string;
}

interface BillingItem extends QuoteItem {}
interface Billing extends Omit<Quote, 'status'> {
	status: BillingStatus;
	paymentMethods: string[];
	subtotal: number;
	effectiveDate: string;
}

interface SubmitBillingDto extends SubmitCustomerDto {
	shopSlug?: string;
	shopId?: string;
	stockId?: string;
	items: ProductVariantWithStock[];
	status: BillingStatus;
	payments: Payment[];
	discountType: string;
	discount: number;
	shipping: number;
	subtotal: number;
	total?: number;
	currency: string;
	clientRequestId: string;
	comments: string;
	balanceToUse?: number;
	priceType: 'PVP' | 'DIS';
}

interface StockItem {
	id: string;
	productName: string;
	vId: string;
	productVariantId: string;
	productVariantName: string;
	currency: string;
	price: number;
	pricePvp: number;
	priceDis: number;
	quantity: number;
	quantityInTransit: number;
	cost: number;
	maxQty: number;
	minQty: number;
	createdDate: string;
	updatedDate: string;
	stockId: string;
	qtyInTransit: number;
	productCategoryGroupName: string;
	mainStockQuantity?: number;
}

interface StockItemHistory extends StockItem {
	type: string;
	stockBefore: number;
	fromId: string;
	fromName: string;
	toId: string;
	toName: string;
}

interface SubmitStockItemDto {
	stockId: string;
	productVariantId: string;
	currency: string;
	price: number;
	quantity: number;
	cost: number;
	minQty: number;
	maxQty: number;
}

interface Transaction {
	id: string;
	name: string;
	state: string;
	type: string;
	fromName: string;
	fromId: string;
	toName: string;
	toId: string;
	description: string;
	shippingDate: string;
	createdDate: string;
	updatedDate: string;
}

enum TransactionType {
	ENTER = 'ENTER',
	TRANSFER = 'TRANSFER',
	EXIT = 'EXIT'
}

interface SubmitTransactionDto {
	supplierId: string;
	fromId: string;
	toId: string;
	description: string;
	type: TransactionType;
	items: ProductVariantWithStock[];
	transferId?: string;
	clientRequestId: string;
}

interface TransactionItem {
	id: string;
	productVariantId: string;
	stockItemId: string;
	productVariantName: string;
	productName: string;
	quantity: string;
	stockItemQuantity: string;
}

enum CashMovementCategory {
	SALE = 'SALE',
	DELIVERY = 'DELIVERY',
	INBOUND_SHIPPING = 'INBOUND_SHIPPING',
	PURCHASE = 'PURCHASE',
	CHANGE = 'CHANGE',
	PIGGY_BANK = 'PIGGY_BANK',
	SHORTAGE_COVER = 'SHORTAGE_COVER',
	OTHER = 'OTHER'
}

interface CashMovement {
	id: string;
	cashSessionId: string;
	billingPaymentId: string | null;
	amount: number;
	type: 'INCOME' | 'EXPENSE';
	category: CashMovementCategory;
	reference: string;
	comments: string | null;
	createdBy: string;
	createdDate: string;
	updatedDate: string;
	deletedDate: string | null;
	customerName: string | null;
}

interface PiggyBankMovement {
	id: string;
	cashSessionId: string;
	type: 'DEPOSIT' | 'WITHDRAW';
	amount: number;
	comments: string | null;
	createdBy: string;
	createdDate: string;
	updatedDate: string;
	deletedDate: string | null;
}

interface BankTransferMovement {
	id: string;
	sessionId: string;
	billingPaymentId: string | null;
	amount: number;
	type: 'INCOME' | 'EXPENSE';
	reference: string;
	paymentMethod: string;
	comments: string | null;
	createdBy: string;
	createdDate: string;
	updatedDate: string;
	deletedDate: string | null;
	customerName: string | null;
}

interface CashSession {
	id: string;
	shopId: string;
	openingAmount: number;
	declaredOpeningAmount: number;
	openingDifference: number;
	openedBy: string;
	closingAmount: number | null;
	declaredClosingAmount: number | null;
	closingDifference: number | null;
	accumulatedDifference: number;
	piggyBankAmount: number | null;
	closedBy: string | null;
	openingComments: string | null;
	closingComments: string | null;
	openedAt: string;
	closedAt: string | null;
	createdDate: string;
	updatedDate: string;
	deletedDate: string | null;
	movements: CashMovement[];
	piggyBankMovements: PiggyBankMovement[];
}

enum CurrentCashSessionStatus {
	FIRST_SESSION = 'first-session',
	OPEN = 'open',
	CLOSED = 'closed',
	NO_SESSION = 'no-session',
	BLOCKED = 'blocked',
	OVERDUE = 'OVERDUE'
}

interface CurrentCashSession {
	status: CurrentCashSessionStatus;
	canOpen: boolean;
	canClose: boolean;
	reason: string;
	balance?: number;
	accumulatedDifference?: number;
	data: CashSession;
}

interface SubmitCashMovementDto {
	type: string;
	category: string;
	amount: number;
	comments?: string;
}

interface ProductSalesReportItem {
	productVariantId: string;
	productName: string;
	baseProductName: string;
	categoryName: string;
	groupName: string;
	totalQuantity: number;
	avgUnitPrice: number;
	pricePvp: number;
	priceDis: number;
	totalRevenue: number;
}

interface SalesReport {
	period: {
		start: string;
		end: string;
		currency: 'COP' | 'USD';
	};
	products: ProductSalesReportItem[];
	comparison: {
		current: {
			revenue: number;
			quantity: number;
			orders: number;
		};
		previous: {
			revenue: number;
			quantity: number;
			orders: number;
		};
		growth: {
			revenue: number;
			quantity: number;
		};
	};
}

type DataTable =
	| ProductVariant
	| ProductWithVariants
	| ProductCategory
	| Staff
	| Customer
	| Quote
	| Billing
	| StockItem
	| Transaction
	| CashMovement
	| BankTransferMovement
	| CustomerBalanceMovement;

type Pagination = {
	total: number;
	page: number;
	pageSize: number;
	totalPages: number;
};

interface RootState {
	product: {
		products: Product[];
		productsWithVariants: ProductWithVariants[];
		productsPagination: Pagination;
		productVariants: ProductVariant[];
		productVariantsPagination: Pagination;
		variantCatalog: VariantCatalog | null;
	};
	productCategory: {
		productCategories: ProductCategory[];
	};
	staff: {
		staff: Staff[];
	};
	customer: {
		customers: Customer[];
		customersPagination: Pagination;
		customerBalanceMovements: CustomerBalanceMovement[];
		customerBalanceMovementsPagination: Pagination;
		topCustomersCO: Customer[];
		topCustomersCoPagination: Pagination;
		topCustomersEC: Customer[];
		topCustomersEcPagination: Pagination;
		balance: number;
	};
	quote: {
		quotes: Quote[];
		quotesPagination: Pagination;
	};
	billing: {
		billings: Billing[];
		billingsPagination: Pagination;
	};
	stock: {
		stockItems: StockItem[];
		stockItemsPagination: Pagination;
		stockItem: StockItem;
		stockItemHistory: StockItemHistory[];
		stockItemHistoryPagination: Pagination;
	};
	transaction: {
		transactions: Transaction[];
		transactionsPagination: Pagination;
	};
	shop: {
		shops: Shop[];
	};
	financialFlow: {
		currentCashSession: CurrentCashSession;
		bankTransferMovements: BankTransferMovement[];
	};
}
