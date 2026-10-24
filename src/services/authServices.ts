import { ENV } from '@/config/env';
import axios from './axios';
import { jwtDecode } from 'jwt-decode';

export const runtime = 'nodejs';

export const authServices = {
	login: async (body: SubmitLoginDto) => {
		return await axios.post(`${ENV.API.AUTH}/login`, body);
	},

	logout: async (refreshToken: string) => {
		return await axios.get(`${ENV.API.AUTH}/logout`, {
			headers: {
				Authorization: `Bearer ${refreshToken}`
			}
		});
	},

	refreshTokens: async (token: any) => {
		try {
			const { refreshToken } = token;
			const res = await axios.get(`${ENV.API.AUTH}/refresh`, {
				headers: {
					Authorization: `Bearer ${refreshToken}`
				}
			});

			if (res.status === 200) {
				const decodedToken = jwtDecode(res.data.accessToken);

				return {
					...token,
					accessToken: res.data.accessToken,
					accessTokenExpires: decodedToken.exp && decodedToken.exp * 1000,
					refreshToken: res.data.refreshToken
				};
			}

			return null;
		} catch (error) {
			// Mismo motivo que en auth.ts: el error completo de axios serializa la
			// configuración de la petición, y aquí eso incluye la cabecera
			// Authorization con el refresh token
			console.error(
				`[auth] token refresh failed: ${
					error instanceof Error ? error.message : 'unknown error'
				}`
			);
			return null;
		}
	}
};
