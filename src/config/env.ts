export const ENV = {
	BASE_URL: process.env.NEXT_PUBLIC_API_URL,
	API: {
		AUTH: '/auth',
		DASHBOARD: '/dashboard',
		PRODUCTS: '/products',
		PRODUCT_VARIANTS: '/product-variants',
		PRODUCT_CATEGORIES: '/product-categories',
		USERS: '/users',
		CUSTOMERS: '/customers',
		CUSTOMER_BALANCE: '/customer-balance',
		SHOPS: '/shops',
		QUOTES: '/quotes',
		BILLINGS: '/billings',
		STOCK_ITEMS: '/stock-items',
		TRANSACTIONS: '/transactions',
		CITIES: '/cities',
		CASH_SESSION: '/cash-sessions',
		WA_SEND_QUOTE: (serialNumber: string) =>
			`/docs/${serialNumber}/send-quote-pdf`,
		WA_SEND_BILLING: (serialNumber: string) =>
			`/docs/${serialNumber}/send-billing-pdf`
	}
};
