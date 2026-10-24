import { formatUserExtraPermissions } from './permissions';
import { ROUTES } from './routes';

export const generatePermissionOptions = (
	permissions: { id: string; name: string }[]
) => {
	const formattedPermissions = formatUserExtraPermissions(permissions);
	if (!formattedPermissions) return undefined;

	return formattedPermissions?.length > 0
		? formattedPermissions?.map(perm => {
				return {
					value: perm.id,
					label: perm.name
				};
			})
		: undefined;
};

export const AUTH_RULES = (
	shop: string,
	shopId: string
): Record<string, { defaultPath: string; allowedPaths: string[] }> => {
	return {
		admin: {
			defaultPath: ROUTES.DASHBOARD,
			allowedPaths: [
				ROUTES.DASHBOARD,
				ROUTES.PRODUCTS,
				ROUTES.STAFF,
				ROUTES.CUSTOMERS,
				ROUTES.CUSTOMER_DETAILS,
				ROUTES.CUSTOMER_BALANCE,
				ROUTES.QUOTE_SHOPS,
				ROUTES.QUOTES,
				ROUTES.QUOTE_DETAIL,
				ROUTES.BILLING_SHOPS,
				ROUTES.BILLINGS,
				ROUTES.BILLING_DETAIL,
				ROUTES.STOCKS,
				ROUTES.STOCK_ITEMS,
				ROUTES.STOCK_ITEM_HISTORY,
				ROUTES.TRANSACTIONS,
				ROUTES.FINANCIAL_FLOW_SHOPS,
				ROUTES.FINANCIAL_FLOW
			]
		},
		cajero: {
			defaultPath: `${ROUTES.QUOTE_SHOPS}/${shop}?shopId=${shopId}`,
			allowedPaths: [
				`${ROUTES.QUOTE_SHOPS}/${shop}?shopId=${shopId}`,
				ROUTES.QUOTE_DETAIL,
				`${ROUTES.BILLING_SHOPS}/${shop}?shopId=${shopId}`,
				ROUTES.BILLING_DETAIL,
				`${ROUTES.STOCKS}/${shop}`,
				`${ROUTES.STOCKS}/${shop}/historial`,
				ROUTES.TRANSACTIONS,
				`${ROUTES.FINANCIAL_FLOW_SHOPS}/${shop}`
			]
		},
		bodeguero: {
			defaultPath: ROUTES.PRODUCTS,
			allowedPaths: [
				ROUTES.PRODUCTS,
				`${ROUTES.STOCKS}/${shop}`,
				ROUTES.TRANSACTIONS
			]
		}
	};
};
