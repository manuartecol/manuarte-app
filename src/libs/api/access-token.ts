import { jwtDecode } from 'jwt-decode';
import { getSession } from 'next-auth/react';

/** Margen para pedir uno nuevo antes de que caduque, no justo al caducar. */
const EXPIRY_MARGIN_MS = 30_000;

/**
 * Token del cliente, en memoria del módulo.
 *
 * Antes cada petición al backend llamaba a `getSession()`, y `getSession()` no
 * usa la caché del `SessionProvider`: hace un fetch a `/api/auth/session` cada
 * vez. O sea dos viajes por llamada, y en una pantalla como el dashboard una
 * docena de peticiones de sesión seguidas.
 *
 * Esto NO cambia dónde vive el token. El callback `session` de `auth.ts` ya
 * expone `session.accessToken` a JavaScript del cliente, así que el token ya
 * estaba en esta misma memoria; lo único que cambia es que se conserva
 * mientras sea válido en lugar de volver a pedirlo por red. A propósito no se
 * guarda en `localStorage` ni `sessionStorage`: eso sí sería un cambio de
 * riesgo, porque sobreviviría al cierre de la pestaña y quedaría legible para
 * cualquier script después. Esta variable muere con la página.
 *
 * Vive aparte porque hay dos instancias de axios (`libs/api/axios.ts` y el
 * duplicado `services/axios.ts`) y las dos necesitan la misma caché. Duplicar
 * esta lógica sería duplicar justo la parte delicada.
 */
let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * Petición de sesión en vuelo, para que varias peticiones simultáneas
 * compartan una sola.
 *
 * Sin esto la caché no sirve de nada en el arranque de una pantalla: el
 * dashboard lanza una docena de llamadas a la vez, todas pasan por aquí antes
 * de que ninguna sesión haya respondido, todas ven la caché vacía y todas
 * piden. Guardar el valor solo ayuda a partir de la segunda tanda; guardar la
 * promesa colapsa también la primera.
 */
let inFlightSession: Promise<string | null> | null = null;

export const clearCachedAccessToken = () => {
	cachedToken = null;
};

const fetchAccessToken = async () => {
	// Llamar a `getSession()` al caducar no es solo para releer el token: es lo
	// que dispara el callback `jwt`, que detecta el vencimiento y lo renueva con
	// el refresh token.
	const session = await getSession();
	const accessToken = session?.accessToken;

	if (!accessToken) {
		clearCachedAccessToken();
		return null;
	}

	let expiresAt = 0;
	try {
		const { exp } = jwtDecode(accessToken);
		expiresAt = exp ? exp * 1000 : 0;
	} catch {
		// Token ilegible: se usa esta vez y no se cachea
	}

	cachedToken = expiresAt ? { value: accessToken, expiresAt } : null;

	return accessToken;
};

export const getClientAccessToken = async () => {
	if (cachedToken && Date.now() < cachedToken.expiresAt - EXPIRY_MARGIN_MS) {
		return cachedToken.value;
	}

	if (!inFlightSession) {
		inFlightSession = fetchAccessToken().finally(() => {
			inFlightSession = null;
		});
	}

	return inFlightSession;
};
