import axios from 'axios';
import { ENV } from '@/config/env';
import { auth } from '@/auth';
import {
	clearCachedAccessToken,
	getClientAccessToken
} from '@/libs/api/access-token';
// import { authServices } from './authServices';
// import { doLogout } from '@/app/actions';

export const runtime = 'nodejs';

const BASE_URL = ENV.BASE_URL;

export default axios.create({
	baseURL: BASE_URL
});

export const axiosPrivate = axios.create({
	baseURL: BASE_URL,
	headers: {
		'Content-Type': 'application/json'
	}
});

// Misma caché de token que `libs/api/axios.ts`: las dos instancias comparten
// `libs/api/access-token.ts` para no pedir la sesión por red en cada petición.
// Aquí llegan dashboardServices, shopServices, cityServices,
// financialFlowServices y productCategoryServices.
axiosPrivate.interceptors.request.use(
	async config => {
		try {
			const accessToken = config?.server
				? (await auth())?.accessToken
				: await getClientAccessToken();

			if (accessToken) {
				config.headers.Authorization = `Bearer ${accessToken}`;
			}
		} catch (error) {
			console.error('Error al obtener el token de autenticación:', error);
			throw error;
		}
		return config;
	},
	error => {
		return Promise.reject(error);
	}
);

axiosPrivate.interceptors.response.use(
	response => response,
	error => {
		if (error?.response?.status === 401) clearCachedAccessToken();
		return Promise.reject(error);
	}
);

// axiosPrivate.interceptors.response.use(
// 	response => response,
// 	async error => {
// 		console.log('Interceptor response');
// 		console.log(error.response.status);
// 		if (error?.response?.status === 403 || error?.response?.status === 401) {
// 			const session = await auth();
// 			console.log({ session });
// 			const res = await authServices.logout(session?.refreshToken as string);
// 			console.log(res.status);
// 			if (res.status === 204) {
// 				await doLogout();
// 			}
// 		}
// 		return Promise.reject(error);
// 	}
// );
