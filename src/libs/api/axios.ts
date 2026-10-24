import axios from 'axios';
import { ENV } from '@/config/env';
import { auth } from '@/auth';
import {
	clearCachedAccessToken,
	getClientAccessToken
} from './access-token';

export const runtime = 'nodejs';

const BASE_URL = ENV.BASE_URL;

export default axios.create({
	baseURL: BASE_URL
});

export const axiosPrivate = axios.create({
	baseURL: BASE_URL
});

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

// Un 401 significa que el token cacheado ya no sirve, por vencimiento o porque
// se cerró la sesión. Se descarta para que la siguiente petición vuelva a
// pedirlo en vez de reintentar con el mismo. El error se propaga igual que
// antes: aquí no se cambia el manejo de errores de nadie.
axiosPrivate.interceptors.response.use(
	response => response,
	error => {
		if (error?.response?.status === 401) clearCachedAccessToken();
		return Promise.reject(error);
	}
);
