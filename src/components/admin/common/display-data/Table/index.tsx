import {
	useCallback,
	useEffect,
	useLayoutEffect,
	useRef,
	useState
} from 'react';
import { Empty, Table, TableColumnsType, TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { useMediaQuery } from 'react-responsive';

/** Selector del contenedor que scrollea, el `Content` del layout del admin. */
const SCROLL_CONTAINER = '.ant-layout-content';

/** Por debajo de esto la tabla no es usable; mejor dejar scrollear la página. */
const MIN_BODY_HEIGHT = 180;

/**
 * Alto del envoltorio en el primer pintado, antes de poder medir nada.
 *
 * Tiene que ser CSS y no píxeles: en una recarga dura el HTML del servidor se
 * pinta antes de hidratar, así que todavía no hay medición. Navegando entre
 * páginas no se llega a ver, porque ahí no hay HTML del servidor para este
 * trozo y la medición entra antes del pintado.
 *
 * El descuento sale de la estructura del layout, que ahora es determinista:
 * 64 px del encabezado, 48 del padding del `Content` y unos 128 de la cabecera
 * de cada página (título más filtros). Antes eran 420 porque además descontaba
 * lo que ocupa la tabla aparte del cuerpo, y eso ya no hace falta: el alto se
 * aplica al envoltorio, no al cuerpo.
 */
const SSR_WRAPPER_HEIGHT = `max(${MIN_BODY_HEIGHT}px, calc(100vh - 240px))`;

/**
 * Alto del cuerpo mientras no hay medición. Antes cada página pasaba el suyo
 * (`scrollMinus`, 12 valores puestos a ojo entre 290 y 400); desde que el alto
 * se mide del espacio real solo cubre el primer pintado, así que basta uno. Es
 * el valor por defecto que ya tenía la prop.
 */
const FALLBACK_SCROLL_Y = 'calc(100vh - 380px)';

/**
 * La medición se aplica antes del pintado, para que al entrar desde otra página
 * no se vea ni un fotograma con el alto de respaldo. En el servidor no existe
 * `useLayoutEffect`, de ahí la variante.
 */
const useMeasureEffect =
	typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface CustomTableProps {
	columns: TableColumnsType<any>;
	dataSource: DataTable[];
	isLoading?: boolean;
	pagination?: TablePaginationConfig;
	filterData?: (
		_pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => void;
	onChange?: (
		pagination: TablePaginationConfig,
		filters: Record<string, FilterValue | null>
	) => void;
}

const CustomTable = ({
	columns,
	dataSource,
	isLoading = false,
	pagination,
	onChange = () => null
}: CustomTableProps) => {
	const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [bodyHeight, setBodyHeight] = useState<number | null>(null);
	/**
	 * Hueco disponible completo, medible siempre. Hace falta aparte de
	 * `bodyHeight` porque ese necesita que exista `.ant-table-body`, y antd no
	 * renderiza ese elemento hasta que hay datos: en la primera carga, con el
	 * spinner, no habría nada que dar de alto y la tabla se veía encogida.
	 */
	const [availableHeight, setAvailableHeight] = useState<number | null>(null);

	/**
	 * El alto del cuerpo se mide, no se calcula sobre `100vh`.
	 *
	 * Antes era `calc(100vh - N)` con una N distinta por página (12 valores
	 * entre 290 y 400, puestos a ojo). El contenedor no mide `100vh` sino
	 * `89vh` menos su padding, así que sobraban unos `11vh` que además crecen
	 * con la pantalla: ningún número fijo podía acertar en todas las
	 * resoluciones, y en monitores grandes la tabla desbordaba y el `Content`
	 * sacaba una barra de scroll que movía la página entera.
	 *
	 * Lo que se mide es el hueco entre donde arranca la tabla y el fondo útil
	 * del contenedor, menos lo que ocupan cabecera y paginación. Esos dos no
	 * dependen del alto del cuerpo, así que la cuenta no se realimenta.
	 */
	const measure = useCallback(() => {
		const wrapper = wrapperRef.current;
		const container = wrapper?.closest(SCROLL_CONTAINER);
		if (!wrapper || !container) return;

		// Una tabla en una pestaña inactiva sigue montada pero con
		// `display: none` (productos y clientes usan `Tabs` sin destruir las
		// pestañas ocultas). Ahí todas sus medidas dan 0 y se le asignaría una
		// altura sin sentido, que se vería un instante al cambiar de pestaña. Se
		// mide cuando vuelva a ser visible: el observador del envoltorio salta en
		// ese momento.
		if (wrapper.offsetParent === null) return;

		// Solo si cambia de verdad: al aplicar un alto cambia el del envoltorio, y
		// el observador volvería a dispararse en bucle
		const commit =
			(set: typeof setBodyHeight) =>
			(value: number): void =>
				set(current =>
					current === null || Math.abs(current - value) > 1 ? value : current
				);

		// Hueco entre donde arranca la tabla y el fondo útil del contenedor
		const containerRect = container.getBoundingClientRect();
		const paddingBottom =
			parseFloat(getComputedStyle(container).paddingBottom) || 0;
		const available = Math.floor(
			containerRect.bottom -
				paddingBottom -
				wrapper.getBoundingClientRect().top
		);

		if (available >= MIN_BODY_HEIGHT) commit(setAvailableHeight)(available);

		// `.ant-table-body` solo existe cuando hay datos y `scroll.y` está puesto
		const body = wrapper.querySelector('.ant-table-body');
		if (!body) return;

		// Lo que ocupa la tabla aparte del cuerpo. Ninguna de las dos partes puede
		// depender del alto actual del cuerpo ni del borde inferior del envoltorio,
		// porque el envoltorio tiene alto fijo y el cuerpo va cambiando:
		//
		// - Por encima: del borde superior del envoltorio al del cuerpo, o sea
		//   padding más cabecera. Ninguno de los dos se mueve con el alto.
		//
		// - Por debajo: la paginación con sus márgenes, medida sobre ella misma,
		//   más el padding inferior del envoltorio. Antes se medía como
		//   `envoltorio.bottom - cuerpo.bottom`, y eso solo cuadra si el contenido
		//   cabe exacto. Al pasar a una pantalla más baja el envoltorio se encoge
		//   antes que el cuerpo, el cuerpo sobresale, la resta da negativa y la
		//   paginación desaparece de la cuenta: el cuerpo sale demasiado alto y la
		//   paginación queda fuera de la tarjeta. Con un error más pequeño no llega
		//   a desbordar, pero se come el espacio de debajo de la paginación.
		//
		// Los márgenes cuentan aparte porque `offsetHeight` no los incluye, y la
		// paginación de antd lleva `margin: 16px 0`.
		const wrapperStyle = getComputedStyle(wrapper);
		const above =
			body.getBoundingClientRect().top - wrapper.getBoundingClientRect().top;

		const tablePagination = wrapper.querySelector<HTMLElement>(
			'.ant-table-pagination'
		);
		const paginationStyle = tablePagination
			? getComputedStyle(tablePagination)
			: null;
		const paginationHeight = tablePagination
			? tablePagination.offsetHeight +
				(parseFloat(paginationStyle?.marginTop ?? '') || 0) +
				(parseFloat(paginationStyle?.marginBottom ?? '') || 0)
			: 0;

		const below =
			paginationHeight + (parseFloat(wrapperStyle.paddingBottom) || 0);

		const chrome = Math.max(above, 0) + below;

		const next = Math.floor(available - chrome);

		if (next >= MIN_BODY_HEIGHT) commit(setBodyHeight)(next);
	}, []);

	useMeasureEffect(() => {
		measure();

		const wrapper = wrapperRef.current;
		const container = wrapper?.closest(SCROLL_CONTAINER);
		if (!wrapper || !container || typeof ResizeObserver === 'undefined') return;

		const observer = new ResizeObserver(measure);
		observer.observe(container);
		// También el envoltorio, para seguir los filtros o cabeceras de página que
		// crecen por encima de la tabla y le quitan espacio
		observer.observe(wrapper);

		return () => observer.disconnect();
	}, [measure, dataSource, isLoading]);

	const scrollY = bodyHeight ?? FALLBACK_SCROLL_Y;

	/**
	 * Alto del envoltorio, y única fuente de altura de todo el componente.
	 *
	 * Antes cada estado tenía el suyo: una constante CSS en el primer pintado,
	 * `hueco - 135` para el spinner y el medido para la tabla, así que al cargar
	 * se veían tres tamaños distintos. Ahora el envoltorio mide el hueco
	 * disponible en los tres y lo de dentro lo rellena, así que el único salto
	 * que queda es el del primer pintado, donde todavía no hay nada que medir.
	 */
	const wrapperHeight = availableHeight ?? SSR_WRAPPER_HEIGHT;

	const defaultPagination: TablePaginationConfig = {
		locale: { items_per_page: '/ página' },
		size: isMobile ? 'small' : 'default',
		defaultPageSize: 30,
		pageSizeOptions: ['30', '50', '100']
	};

	return (
		<div
			ref={wrapperRef}
			className='table-fill-height py-2 px-4 shadow-[6px_6px_24px_rgba(0,0,0,0.25)] rounded-lg'
			style={{ height: wrapperHeight }}
		>
			<Table<DataTable>
				rowKey='id'
				columns={columns}
				dataSource={dataSource}
				scroll={{
					// El alto medido, y si no se pudo medir, el cálculo de antes
					y: dataSource?.length > 0 ? scrollY : undefined,
					x: !isLoading && dataSource?.length > 0 ? 'max-content' : undefined
				}}
				pagination={{
					...defaultPagination,
					...(pagination ?? {})
				}}
				/*
					Rellenan el envoltorio en vez de imponer su propio alto. Antes cada
					uno salía de `100vh` con una constante distinta, y eran los que
					anulaban la medición: por muy bien dimensionado que quedara el
					cuerpo, un `minHeight` de `100vh - 160px` obligaba a la tabla entera
					a desbordar el contenedor.
				*/
				style={{ height: '100%' }}
				// El alto del spinner lo resuelve la clase `table-fill-height` en
				// globals.css, que completa la cadena de porcentajes que antd rompe
				loading={{ spinning: isLoading }}
				locale={{
					emptyText: !isLoading ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_DEFAULT}
							description={<p>{`No hay datos para mostrar`}</p>}
							style={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								height: '100%'
							}}
						/>
					) : null,
					filterConfirm: 'Filtrar',
					filterReset: 'Limpiar',
					triggerAsc: 'Orden ascendente',
					triggerDesc: 'Orden descendente'
				}}
				onChange={onChange}
			/>
		</div>
	);
};

export default CustomTable;
