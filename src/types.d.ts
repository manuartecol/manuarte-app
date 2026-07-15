/* eslint-disable no-unused-vars */

interface SubmitLoginDto {
	email: string;
	password: string;
}

interface ProductVariant {
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
	productName?: string;
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
	name: string;
	costCop?: number;
	costUsd?: number;
	priceCop?: number;
	priceUsd?: number;
	maxQty: number;
	minQty: number;
}

interface SubmitProductDto {
	type?: 'create' | 'update' | 'updateVariant';
	name: string;
	description: string;
	productCategoryId?: string;
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

interface SubmitProductVariantDto extends ProductVariantStockItem {
	productId: string;
	stockIds?: string[];
	stocks?: { id: string; currency: string }[];
}

interface ProductCategory {
	id: string;
	name: string;
	cId: string;
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
		productVariants: ProductVariant[];
		productVariantsPagination: Pagination;
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
