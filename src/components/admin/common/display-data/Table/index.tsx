import { useCallback, useEffect, useRef, useState } from 'react';
import { Empty, Table, TableColumnsType, TablePaginationConfig } from 'antd';
import { FilterValue } from 'antd/es/table/interface';
import { useMediaQuery } from 'react-responsive';

/** Selector del contenedor que scrollea, el `Content` del layout del admin. */
const SCROLL_CONTAINER = '.ant-layout-content';

/** Por debajo de esto la tabla no es usable; mejor dejar scrollear la página. */
const MIN_BODY_HEIGHT = 180;

interface CustomTableProps {
	columns: TableColumnsType<any>;
	dataSource: DataTable[];
	isLoading?: boolean;
	/**
	 * Respaldo en píxeles sobre `100vh`, que es como se dimensionaba antes.
	 * Solo se usa si no se puede medir el contenedor. Las páginas no deberían
	 * necesitar pasarlo: el alto se calcula del espacio real disponible.
	 */
	scrollMinus?: number;
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
	scrollMinus = 380,
	pagination,
	onChange = () => null
}: CustomTableProps) => {
	const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
	const wrapperRef = useRef<HTMLDivElement>(null);
	const [bodyHeight, setBodyHeight] = useState<number | null>(null);

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
		const body = wrapper?.querySelector('.ant-table-body');
		if (!wrapper || !container || !body) return;

		// Hueco entre donde arranca la tabla y el fondo útil del contenedor
		const containerRect = container.getBoundingClientRect();
		const paddingBottom =
			parseFloat(getComputedStyle(container).paddingBottom) || 0;
		const available =
			containerRect.bottom -
			paddingBottom -
			wrapper.getBoundingClientRect().top;

		// Todo lo que ocupa la tabla que no es el cuerpo, por diferencia y no
		// sumando partes: así entran los márgenes, que `offsetHeight` no cuenta.
		// La paginación de antd lleva `margin: 16px 0`, o sea 32 px que antes se
		// perdían y hacían desbordar la tabla.
		const chrome = wrapper.offsetHeight - body.clientHeight;

		const next = Math.floor(available - chrome);
		if (next < MIN_BODY_HEIGHT) return;

		// Solo si cambia de verdad: al aplicar el alto cambia el del envoltorio,
		// y el observador volvería a dispararse en bucle
		setBodyHeight(current =>
			current === null || Math.abs(current - next) > 1 ? next : current
		);
	}, []);

	useEffect(() => {
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

	const scrollY = bodyHeight ?? `calc(100vh - ${scrollMinus}px)`;

	const defaultPagination: TablePaginationConfig = {
		locale: { items_per_page: '/ página' },
		size: isMobile ? 'small' : 'default',
		defaultPageSize: 30,
		pageSizeOptions: ['30', '50', '100']
	};

	return (
		<div
			ref={wrapperRef}
			className='py-2 px-4 shadow-[6px_6px_24px_rgba(0,0,0,0.25)] rounded-lg'
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
					Estas tres alturas también salían de `100vh` y son las que anulaban
					la medición: por muy bien dimensionado que quedara el cuerpo, un
					`minHeight` de `100vh - 160px` obligaba a la tabla entera a desbordar
					el contenedor. Ahora usan el alto medido, y si no se pudo medir no
					imponen nada en vez de imponer un valor equivocado.
				*/
				style={{
					minHeight: isLoading ? (bodyHeight ?? undefined) : undefined
				}}
				loading={{
					spinning: isLoading,
					style: { minHeight: bodyHeight ?? undefined }
				}}
				locale={{
					emptyText: !isLoading ? (
						<Empty
							image={Empty.PRESENTED_IMAGE_DEFAULT}
							description={<p>{`No hay datos para mostrar`}</p>}
							style={{
								display: 'flex',
								flexDirection: 'column',
								justifyContent: 'center',
								height: bodyHeight ?? undefined
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
