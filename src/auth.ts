import { isAxiosError } from 'axios';
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authServices } from './services/authServices';
import { authConfig } from './config/auth';
import { jwtDecode } from 'jwt-decode';
import { ROUTES } from './utils/routes';

export const runtime = 'nodejs';

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth
} = NextAuth({
	...authConfig,
	trustHost: true,
	providers: [
		CredentialsProvider({
			credentials: {
				email: {},
				password: {}
			},
			async authorize(credentials) {
				if (!credentials) return null;

				try {
					const res = await authServices.login({
						email: credentials?.email as string,
						password: credentials?.password as string
					});
					if (res.status === 200) {
						return res.data;
					}

					return null;
				} catch (error) {
					/**
					 * Nunca el error completo. Un `AxiosError` serializa `config.data`,
					 * que en este endpoint es el cuerpo del login, así que cada intento
					 * fallido escribía la contraseña en claro en los logs de producción.
					 * Del error solo interesan el estado y el motivo.
					 */
					const status = isAxiosError(error)
						? error.response?.status
						: undefined;

					console.error(
						`[auth] login failed${status ? ` with status ${status}` : ''}: ${
							error instanceof Error ? error.message : 'unknown error'
						}`
					);

					return null;
				}
			}
		})
	],
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60
	},
	pages: {
		signIn: ROUTES.LOGIN
	},
	callbacks: {
		async jwt({ token, account, user }) {
			if (account && user) {
				const decodedToken = jwtDecode(user.accessToken);

				return {
					...token,
					accessToken: user.accessToken,
					accessTokenExpires: decodedToken.exp && decodedToken.exp * 1000,
					refreshToken: user.refreshToken,
					user: {
						id: user.userId,
						email: user.email,
						roleName: decodedToken.user.roleName,
						shop: decodedToken.user.shop,
						shopId: decodedToken.user.shopId,
						stockId: decodedToken.user.stockId,
						isoCode: decodedToken.user.isoCode,
						mainStock: decodedToken.user.mainStock,
						extraPermissions: decodedToken.user.extraPermissions
					}
				};
			}

			// if (token.accessTokenExpires) {
			// 	const expirationTimestamp = token.accessTokenExpires;
			// 	const expirationDate = new Date(expirationTimestamp as string);
			// 	console.log(
			// 		'********************* El accessToken vence el:',
			// 		expirationDate.toString()
			// 	);
			// }

			if (
				!token.accessToken ||
				Date.now() > (token.accessTokenExpires as number)
			) {
				return await authServices.refreshTokens(token);
			}

			return token;
		},
		async session({ session, token }) {
			if (token) {
				session.accessToken = token.accessToken as any;
				session.refreshToken = token.refreshToken as any;
				session.user = token.user as any;
			}

			return session;
		}
	}
});
