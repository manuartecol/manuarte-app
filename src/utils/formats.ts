import moment from 'moment';
import { PERMISSION_MAP } from './mappings';
import 'moment/locale/es';
moment.locale('es');

const units = ['cc', 'kg', 'mm', 'cm', 'm', 'l', 'ml'];

export const formatToTitleCase = (str: string) => {
	if (!str) return null;

	const unitSet = new Set(units.map(unit => unit.toLowerCase()));

	const isUnit = (word: string) => unitSet.has(word.toLowerCase());

	if (!/\s/.test(str)) {
		if (isUnit(str)) {
			return str.toLowerCase();
		}

		return (
			`${str?.charAt(0).toUpperCase()}${str?.slice(1).toLowerCase()}` || ''
		);
	}

	return str
		.split(' ')
		.map(word =>
			isUnit(word)
				? word.toLowerCase()
				: `${word?.charAt(0).toUpperCase()}${word?.slice(1).toLowerCase()}`
		)
		.join(' ');
};

export const formatCurrency = (amount: number | string) => {
	const currency = Number(amount);
	if (isNaN(currency)) return 'Invalid number';

	const [integerPart, decimalPart] = currency.toFixed(2).toString().split('.');

	const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

	return decimalPart && +decimalPart > 0
		? `$${formattedInteger},${decimalPart.padEnd(2, '0')}`
		: `$${formattedInteger}`;
};

export const formatInputCurrency = (value: number | undefined) => {
	if (!value) return '';

	const numericValue = parseFloat(value.toString());

	const [integerPart, decimalPart] = numericValue.toFixed(2).split('.');

	const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

	return decimalPart && parseInt(decimalPart) > 0
		? `$ ${formattedInteger}.${decimalPart}`
		: `$ ${formattedInteger}`;
};

export const normalizeAmount = (num: number, decimals = 2) =>
	Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);

export const formatUserExtraPermissions = (
	extraPermissions: { id: string; name: string }[]
) => {
	try {
		return extraPermissions?.map(permission => ({
			...permission,
			name: PERMISSION_MAP[permission.name] || permission.name
		}));
	} catch (error) {
		console.error(error);
	}
};

export const formatDate = (date: Date | string, showTime: boolean = false) => {
	try {
		if (!date) return '--';

		const m = moment(date);

		return showTime
			? m.format('DD-MMM-YYYY, h:mm A').toUpperCase()
			: m.startOf('day').format('DD-MMM-YYYY').toUpperCase();
	} catch (error) {
		console.error(error);
	}
};

export const formatMonthYear = (date: Date | string) => {
	try {
		if (!date) return '--';

		return moment(date).format('MMM-YYYY').toUpperCase();
	} catch (error) {
		console.error(error);
	}
};

export const objectToSearchParams = (
	obj: Record<string, any>
): URLSearchParams => {
	const params = new URLSearchParams();
	Object.entries(obj).forEach(([key, value]) => {
		if (value !== undefined) params.set(key, String(value));
	});
	return params;
};
