import { isAxiosError } from 'axios';
import NextAuth, { CredentialsSignin } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authServices } from './services/authServices';
import { authConfig } from './config/auth';
import { jwtDecode } from 'jwt-decode';
import { ROUTES } from './utils/routes';
import { LoginErrorCode } from './types/enums';

export const runtime = 'nodejs';

/**
 * NextAuth reduce cualquier `null` de `authorize` a un `CredentialsSignin`
 * genérico, así que el formulario no podía distinguir una contraseña mala de un
 * backend caído. El `code` sí llega hasta `signIn`.
 */
class LoginError extends CredentialsSignin {
	constructor(code: LoginErrorCode) {
		super();
		this.code = code;
	}
}

const toLoginErrorCode = (error: unknown): LoginErrorCode => {
	if (!isAxiosError(error)) return LoginErrorCode.SERVER_ERROR;

	const status = error.response?.status;
	if (status === 401) return LoginErrorCode.INVALID_CREDENTIALS;
	// Sin respuesta (red, timeout) o un proxy delante de un backend caído
	if (!status || [502, 503, 504].includes(status)) {
		return LoginErrorCode.SERVER_UNAVAILABLE;
	}

	return LoginErrorCode.SERVER_ERROR;
};

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

					// Siempre un `AuthError`: NextAuth envuelve cualquier otro error
					// con el original como `cause` y lo escribe completo en el log
					throw new LoginError(toLoginErrorCode(error));
				}
			}
		})
	],
	session: {
		strategy: 'jwt',
		maxAge: 7 * 24 * 60 * 60
	},
	pages: {
		signIn: ROUTES.LOGIN
	},
	events: {
		/**
		 * El refresh token vive solo en el JWT cifrado de la cookie `httpOnly`, así
		 * que invalidarlo en el backend tiene que pasar aquí, en el servidor. Antes
		 * se copiaba a la sesión para que el cliente lo mandara al cerrar sesión, y
		 * eso lo dejaba al alcance de cualquier script de la página.
		 *
		 * Si el backend falla, la sesión local se cierra igual: antes un refresh
		 * token vencido hacía fallar `/logout` y no había forma de salir.
		 */
		async signOut(message) {
			const refreshToken =
				'token' in message ? message.token?.refreshToken : undefined;
			if (typeof refreshToken !== 'string') return;

			try {
				await authServices.logout(refreshToken);
			} catch (error) {
				// Sin el error completo: serializa la cabecera con el refresh token
				console.error(
					`[auth] logout failed: ${
						error instanceof Error ? error.message : 'unknown error'
					}`
				);
			}
		}
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
				// El refresh token no se copia: ver `events.signOut`
				session.accessToken = token.accessToken as any;
				session.user = token.user as any;
			}

			return session;
		}
	}
});
