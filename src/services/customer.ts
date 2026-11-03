import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { customerLibs, CustomerParams } from '@/libs/api/customer';
import {
	addCustomerBalanceMovement,
	setBalance,
	setCustomerBalanceMovements,
	setCustomers,
	setTopCustomersCO,
	setTopCustomersEC
} from '@/reducers/customer/customerSlice';
import useForm from '@/hooks/useForm';
import {
	BalanceMovementsParams,
	customerBalanceLibs
} from '@/libs/api/customer-balance';

const useCustomerService = () => {
	const [isLoading, setIsLoading] = useState(true);
	const { handleSubmit } = useForm();
	const dispatch = useDispatch();

	/**
	 * Las guardas de este archivo comprueban la forma de la respuesta antes de
	 * guardarla: un cuerpo que no la cumpla deja los datos como estaban, en vez
	 * de meter `undefined` en el store y romper la siguiente escritura
	 */
	const getAllCustomers = async (params?: CustomerParams) => {
		try {
			setIsLoading(true);
			const data = await customerLibs.getAllCustomers(params);
			if (!Array.isArray(data?.customers)) return;

			dispatch(setCustomers(data));
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const getTopCustomersCO = async (params?: CustomerParams) => {
		try {
			setIsLoading(true);
			const data = await customerLibs.getTopCustomers({
				...params
			});
			if (!Array.isArray(data?.topCustomers)) return;

			dispatch(setTopCustomersCO(data));

			return data.topCustomers;
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const getTopCustomersEC = async (params?: CustomerParams) => {
		try {
			setIsLoading(true);
			const data = await customerLibs.getTopCustomers({
				...params
			});
			if (!Array.isArray(data?.topCustomers)) return;

			dispatch(setTopCustomersEC(data));

			return data.topCustomers;
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchBalance = async (customerId: string, currency: string) => {
		try {
			setIsLoading(true);
			const data = await customerBalanceLibs.getBalance(customerId, currency);

			if (data) {
				dispatch(setBalance(data.balance));
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const fetchMovements = async (
		customerId: string,
		params: BalanceMovementsParams
	) => {
		try {
			setIsLoading(true);
			const data = await customerBalanceLibs.getMovements(customerId, params);

			if (data) {
				dispatch(setCustomerBalanceMovements(data));
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	const addMovement = async (
		actionType: 'credit' | 'debit',
		customerId: string,
		body: CustomerBalanceDto
	) => {
		try {
			const serviceFn =
				actionType === 'credit'
					? () => customerBalanceLibs.addCredit(customerId, body)
					: () => customerBalanceLibs.useBalance(customerId, body);

			await handleSubmit({
				serviceFn,
				values: body,
				onSuccess: async res => {
					if (res?.data?.movement) {
						dispatch(setBalance(res?.data?.movement?.balanceAfter));
					}
					dispatch(addCustomerBalanceMovement(res.data.movement));
				}
			});
		} catch (error) {
			console.error(error);
		}
	};

	return {
		getAllCustomers,
		getTopCustomersCO,
		getTopCustomersEC,
		fetchBalance,
		fetchMovements,
		addMovement,
		isLoading
	};
};

export default useCustomerService;
