import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	billings: [] as Billing[],
	filteredBillings: [] as Billing[]
};

const billingSlice = createSlice({
	name: 'billing',
	initialState,
	reducers: {
		setBillings: (state, action) => {
			state.billings = action.payload;
		},

		setFilteredBillings: (state, action) => {
			state.filteredBillings = action.payload;
		},

		addBilling: (state, action) => {
			state.billings = [action.payload, ...state.billings];
		},

		updateBilling: (state, action) => {
			const { id, status, effectiveDate, paymentMethods } = action.payload;

			state.billings = state.billings.map(billing =>
				billing.id === id
					? {
							...billing,
							status,
							effectiveDate,
							paymentMethods: Array.from(
								new Set([...billing.paymentMethods, ...paymentMethods])
							)
						}
					: billing
			);
		},

		cancelBilling: (state, action) => {
			const canceledBilling = action.payload;
			state.billings = state.billings.map(billing =>
				billing.id === canceledBilling.id ? canceledBilling : billing
			);
		},

		removeBilling: (state, action) => {
			state.billings = state.billings.filter(
				billing => billing.id !== action.payload
			);
		}
	}
});

export const {
	setBillings,
	addBilling,
	updateBilling,
	cancelBilling,
	removeBilling,
	setFilteredBillings
} = billingSlice.actions;
export default billingSlice.reducer;
