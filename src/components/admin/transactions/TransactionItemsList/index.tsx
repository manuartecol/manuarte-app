import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Col, Empty, Skeleton } from 'antd';

/** Alto de la fila real, para que al llegar los datos el panel no salte. */
const ROW_HEIGHT = 50;

/** El `mb-2` entre filas. */
const ROW_GAP = 8;

/**
 * Alto reservado al final: el pie con el botón CERRAR (`pt-4` más el botón),
 * que tiene que quedar visible, y las etiquetas "Nombre" y "Cantidad", que
 * aparecen sobre la primera fila solo cuando llegan los datos.
 */
const BOTTOM_RESERVED = 104;

/** Mientras no se ha medido el alto disponible, y en pantallas muy bajas. */
const MIN_ROWS = 5;

/**
 * Techo de seguridad. Si la medición sale mal (el Drawer animando, un alto
 * raro), el esqueleto queda corto pero nunca se convierte en una lista larga
 * con scroll propio, que es peor que una fila de menos.
 */
const MAX_ROWS = 9;

const TransactionsItemList = ({
	items,
	isBilling = false,
	isLoading = false,
	hasFailed = false,
	onRetry
}: {
	items: TransactionItem[] | BillingItem[];
	isBilling: boolean;
	isLoading?: boolean;
	hasFailed?: boolean;
	onRetry?: () => void;
}) => {
	const skeletonRef = useRef<HTMLDivElement>(null);
	const [rowCount, setRowCount] = useState(MIN_ROWS);

	// El alto disponible depende de cuánto ocupe la cabecera del movimiento, que
	// varía según el tipo (una factura no muestra origen ni destino), así que se
	// mide en vez de calcularse con un número fijo.
	useEffect(() => {
		if (!isLoading) return;

		// En el frame siguiente, porque el Drawer todavía está animando su
		// entrada: medido durante la animación, `top` viene cerca de 0 y el
		// espacio disponible sale casi igual a la ventana entera
		const frame = requestAnimationFrame(() => {
			if (!skeletonRef.current) return;

			const { top } = skeletonRef.current.getBoundingClientRect();
			if (top <= 0) return;

			const available = window.innerHeight - top - BOTTOM_RESERVED;
			const fit = Math.floor(available / (ROW_HEIGHT + ROW_GAP));

			setRowCount(Math.min(MAX_ROWS, Math.max(MIN_ROWS, fit)));
		});

		return () => cancelAnimationFrame(frame);
	}, [isLoading]);

	if (isLoading) {
		return (
			<Col span={24}>
				<div ref={skeletonRef}>
					{Array.from({ length: rowCount }).map((_, index) => (
						<div key={index} className='flex justify-between gap-2 mb-2'>
							{/*
								Misma estructura que la fila con datos: `flex-1` para el
								nombre y ancho fijo para la cantidad. Con `block` a secas el
								primero mide 100% y, sumado a los 110 px del segundo más el
								hueco, desbordaba y sacaba un scrollbar horizontal al abrir
								el panel. `minWidth: 0` neutraliza el mínimo de 160 px que
								trae `Skeleton.Input` de antd, que impediría encogerlo.
							*/}
							<div className='flex-1 min-w-0'>
								<Skeleton.Input
									active
									block
									style={{ height: ROW_HEIGHT, minWidth: 0 }}
								/>
							</div>
							<div className='w-[110px] shrink-0'>
								<Skeleton.Input
									active
									block
									style={{ height: ROW_HEIGHT, minWidth: 0 }}
								/>
							</div>
						</div>
					))}
				</div>
			</Col>
		);
	}

	if (hasFailed) {
		return (
			<Col span={24}>
				{/*
					Con un botón y no con un "cierra y vuelve a abrirlo": el Drawer no
					declara `destroyOnClose`, así que al reabrir el mismo registro el
					efecto no se vuelve a disparar y ese consejo no habría servido.
				*/}
				<Alert
					type='error'
					showIcon
					message='No se pudieron cargar los productos'
					description='Puede ser un problema de conexión.'
					action={
						onRetry ? (
							<Button size='small' danger onClick={onRetry}>
								Reintentar
							</Button>
						) : null
					}
				/>
			</Col>
		);
	}

	// Antes devolvía null, así que un movimiento sin productos y uno que todavía
	// estaba cargando se veían igual: el panel vacío sin explicación
	if (!items?.length) {
		return (
			<Col span={24}>
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description='Este movimiento no tiene productos'
				/>
			</Col>
		);
	}

	return items.map((item, index) => (
		<Col key={item.id} span={24}>
			<div className='flex justify-between'>
				<div className='flex flex-col flex-1 gap-1 '>
					{index === 0 ? <span>Nombre</span> : null}
					<span className='flex items-center h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
						{isBilling
							? (item as BillingItem).name
							: `${(item as TransactionItem).productName} ${(item as TransactionItem).productVariantName}`}
					</span>
				</div>
				<div className='flex flex-col gap-1 w-[110px]'>
					{index === 0 ? <span>Cantidad</span> : null}
					<span className='flex items-center justify-center h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
						{item.quantity}
					</span>
				</div>
			</div>
		</Col>
	));
};

export default TransactionsItemList;
