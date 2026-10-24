import { PERMISSION_MAP } from './mappings';

/**
 * Vive aparte de `formats.ts` a propósito. `utils/auth.ts` solo necesita esta
 * función, y `auth.ts` lo importa el middleware, que corre en cada petición a
 * `/admin/*`. Desde `formats.ts` arrastraba `moment` y su locale (5,2 MB) al
 * paquete del middleware, que no formatea ni una fecha.
 */
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
