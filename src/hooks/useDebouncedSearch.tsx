import { useCallback, useEffect, useRef } from 'react';

const DEBOUNCE_MS = 500;

/**
 * Debounce con guarda de respuestas obsoletas, para los buscadores que
 * consultan al backend mientras se escribe.
 *
 * Resuelve dos problemas de los `handleSearch` escritos a mano: el temporizador
 * vivía en una variable del cuerpo del componente, que se redeclara en cada
 * render, así que nunca llegaba a cancelarse; y la respuesta de una búsqueda
 * anterior podía llegar después de la última y sobreescribir los resultados
 * correctos con los de un texto que el usuario ya había descartado.
 */
const useDebouncedSearch = () => {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const requestIdRef = useRef(0);

	useEffect(
		() => () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		},
		[]
	);

	// Cancela la búsqueda pendiente e invalida la que ya esté en vuelo
	const cancel = useCallback(() => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
			timeoutRef.current = null;
		}
		requestIdRef.current += 1;
	}, []);

	/**
	 * Agenda `task` tras el debounce. Le pasa `isCurrent`, que devuelve false si
	 * mientras la petición estaba en vuelo llegó otra búsqueda: en ese caso el
	 * resultado se descarta sin tocar el estado.
	 */
	const schedule = useCallback(
		(
			task: (isCurrent: () => boolean) => void | Promise<void>,
			delay: number = DEBOUNCE_MS
		) => {
			cancel();
			const requestId = requestIdRef.current;

			timeoutRef.current = setTimeout(() => {
				const running = task(() => requestId === requestIdRef.current);

				// Un fallo dentro de la búsqueda no puede quedar como promesa sin
				// manejar: el componente ya no la está esperando
				if (running instanceof Promise) running.catch(console.error);
			}, delay);
		},
		[cancel]
	);

	return { schedule, cancel };
};

export default useDebouncedSearch;
