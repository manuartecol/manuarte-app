/* eslint-disable no-unused-vars */
export enum ModalContent {
	products = 'products',
	productVariants = 'productVariants',
	productCategories = 'productCategories',
	staff = 'staff',
	permissions = 'permissions',
	customers = 'customers',
	billings = 'billings',
	preOrder = 'preOrder',
	stockItems = 'stockItems',
	openCashSession = 'openCashSession',
	closeCashSession = 'closeCashSession',
	cashIncome = 'cashIncome',
	cashExpense = 'cashExpense',
	piggyBankWithdraw = 'piggyBankWithdraw',
	confirm = 'confirm',
	balance = 'balance'
}

export enum DrawerContent {
	quotes = 'quotes',
	billings = 'billings',
	preOrder = 'preOrder',
	directEnter = 'directEnter',
	transfer = 'transfer',
	enterByTransfer = 'enterByTransfer',
	exit = 'exit',
	transactionDetails = 'transactionDetails',
	transactionHistoryDetails = 'transactionHistoryDetails',
	recentActivityDetails = 'recentActivityDetails'
}

export enum QuoteStatus {
	ACCEPTED = 'ACCEPTED',
	PENDING = 'PENDING',
	CANCELED = 'CANCELED',
	REVISION = 'REVISION',
	OVERDUE = 'OVERDUE'
}

export enum BillingStatus {
	PAID = 'PAID',
	PENDING_PAYMENT = 'PENDING_PAYMENT',
	PARTIAL_PAYMENT = 'PARTIAL_PAYMENT',
	PENDING_DELIVERY = 'PENDING_DELIVERY',
	CANCELED = 'CANCELED'
}

export enum PaymentMethod {
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
	BALANCE = 'BALANCE',
	OTHER = 'OTHER'
}

export enum TransactionType {
	ENTER = 'ENTER',
	TRANSFER = 'TRANSFER',
	EXIT = 'EXIT'
}

export enum TransactionState {
	SUCCESS = 'SUCCESS',
	PROGRESS = 'PROGRESS'
}

export enum DiscountType {
	FIXED = 'FIXED',
	PERCENTAGE = 'PERCENTAGE'
}

export enum CurrentCashSessionStatus {
	FIRST_SESSION = 'first-session',
	OPEN = 'open',
	CLOSED = 'closed',
	NO_SESSION = 'no-session',
	BLOCKED = 'blocked',
	OVERDUE = 'OVERDUE'
}

export enum CashMovementCategory {
	SALE = 'SALE',
	ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
	DELIVERY = 'DELIVERY',
	INBOUND_SHIPPING = 'INBOUND_SHIPPING',
	PURCHASE = 'PURCHASE',
	CHANGE = 'CHANGE',
	PIGGY_BANK = 'PIGGY_BANK',
	SHORTAGE_COVER = 'SHORTAGE_COVER',
	OTHER = 'OTHER'
}

export enum CustomerBalanceMovementCategory {
	ADVANCE_PAYMENT = 'ADVANCE_PAYMENT',
	REFUND = 'REFUND',
	PAYMENT_APPLIED = 'PAYMENT_APPLIED',
	ADJUSTMENT = 'ADJUSTMENT',
	OTHER = 'OTHER'
}

/**
 * Motivo de un login fallido. Viaja de `authorize` al formulario como `code`
 * de `CredentialsSignin`. Nunca distingue correo inexistente de contraseña
 * incorrecta: eso permitiría averiguar qué correos tienen cuenta.
 */
export enum LoginErrorCode {
	INVALID_CREDENTIALS = 'invalid_credentials',
	SERVER_UNAVAILABLE = 'server_unavailable',
	SERVER_ERROR = 'server_error'
}
