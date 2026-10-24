import { useEffect, useState } from 'react';
import { Button, Col, Divider, Row, Skeleton } from 'antd';
import TransactionsItemList from '../TransactionItemsList';
import { transactionLibs } from '@/libs/api/transaction';
import { billingLibs } from '@/libs/api/billing';
import { useDrawerStore } from '@/stores/drawerStore';
import {
	TRANSACTION_STATES_MAP,
	TRANSACTION_TYPES_MAP
} from '@/utils/mappings';
import { formatDate } from '@/utils/formats';
import { DrawerContent, TransactionType } from '@/types/enums';

const TransactionDetails = () => {
	const { dataToHandle, closeDrawer, content } = useDrawerStore.getState();
	const [items, setItems] = useState<TransactionItem[]>([]);
	const [customer, setCustomer] = useState(null);
	const [isLoading, setIsLoading] = useState(true);
	/**
	 * Los wrappers de `libs/api` capturan el error y devuelven `undefined`, que
	 * no es lo mismo que un movimiento sin productos. Sin distinguirlos, una
	 * petición fallida se veía igual que una lista vacía: el panel en blanco.
	 */
	const [hasFailed, setHasFailed] = useState(false);
	/**
	 * Registro al que pertenecen los `items` que hay en estado. El Drawer no
	 * declara `destroyOnClose`, así que este componente queda montado al cerrar y
	 * conserva su estado: al abrir otro movimiento se pintaba un fotograma con
	 * los productos del anterior bajo la cabecera del nuevo. Comparando esto con
	 * el registro pedido, esos datos se descartan en el mismo render.
	 */
	const [loadedId, setLoadedId] = useState<string | null>(null);
	/** Fuerza un reintento sobre el mismo registro, que si no nunca recargaría. */
	const [retryCount, setRetryCount] = useState(0);
	const isBilling = dataToHandle?.type === 'BILLING';

	const stockId =
		dataToHandle?.type === TransactionType.ENTER
			? dataToHandle?.toId
			: dataToHandle?.fromId;

	const requestedId = isBilling
		? dataToHandle?.identifier
		: content === DrawerContent.transactionDetails
			? dataToHandle?.id
			: dataToHandle?.transactionId;

	const fetchTransactionItems = async () => {
		const data = await transactionLibs.getItems(requestedId, stockId);

		if (data) {
			setItems(data);
		} else {
			setHasFailed(true);
		}
	};

	const fetchBillingItems = async () => {
		const data = await billingLibs.getOne({ serialNumber: requestedId });

		if (data) {
			setCustomer(data?.fullName);
			setItems(data?.items ?? []);
		} else {
			setHasFailed(true);
		}
	};

	useEffect(() => {
		let isCurrent = true;

		const loadItems = async () => {
			setIsLoading(true);
			setHasFailed(false);

			try {
				await (isBilling ? fetchBillingItems() : fetchTransactionItems());
			} finally {
				// Si mientras la petición estaba en vuelo se abrió otro registro,
				// esta respuesta ya no corresponde y no debe marcar nada como cargado
				if (isCurrent) {
					setLoadedId(requestedId ?? null);
					setIsLoading(false);
				}
			}
		};

		loadItems();

		return () => {
			isCurrent = false;
		};
	}, [requestedId, retryCount]);

	// Los items en estado son de otro registro hasta que termine la carga
	const isStale = loadedId !== requestedId;

	const itemsCount = items?.reduce((acc, item) => {
		const quantity = Number(item.quantity);
		return acc + (Number.isFinite(quantity) ? quantity : 0);
	}, 0);

	return (
		/*
			Un solo scroller, el área de contenido, y el pie fuera de él para que
			quede siempre a la misma altura. Con `justify-between` sobre un `h-full`,
			el espacio debajo del botón cambiaba según el contenido: con la lista
			corta se veía el padding del Drawer, y con la lista larga el pie se iba
			fuera de la caja junto al contenido y ese padding dejaba de verse.

			Las tres clases de overflow no son decorativas:

			- `overflow-hidden` en el contenedor exterior: el cuerpo del Drawer
			  también es un contenedor con `overflow: auto`, así que sin esto habría
			  dos scrollbars verticales compitiendo.
			- `overflow-x-hidden` en el interior: `Row gutter={32}` aplica márgenes
			  de -16 px a cada lado, que antes caían dentro del padding del Drawer y
			  aquí desbordaban. Solo se recorta margen vacío, porque el contenido
			  arranca en 0 por el padding de cada `Col`.
			- `min-h-0`: sin él el hijo flex no encoge por debajo de su contenido y
			  no scrollea nunca.
		*/
		<div className='h-full flex flex-col overflow-hidden'>
			<div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar'>
				<Row gutter={32} className='items-center'>
				{isBilling ? null : (
					<>
						<Col span={12}>
							<div className='flex flex-col flex-1 gap-2 mb-4'>
								<span>Origen</span>
								<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
									{dataToHandle?.fromName ?? 'NA'}
								</span>
							</div>
						</Col>
						<Col span={12}>
							<div className='flex flex-col flex-1 gap-2 mb-4'>
								<span>Destino</span>
								<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
									{dataToHandle?.toName ?? 'NA'}
								</span>
							</div>
						</Col>
					</>
				)}

				{dataToHandle?.description || dataToHandle?.identifier ? (
					<Col span={24}>
						<div className='flex flex-col flex-1 gap-2 mb-4'>
							<span>{isBilling ? 'Cliente' : 'Descripción'}</span>
							<span className='px-3 py-2 bg-[#e5e5e5] rounded-md'>
								{isBilling
									? (customer ?? 'Consumidor Final')
									: dataToHandle?.description || dataToHandle?.identifier}
							</span>
						</div>
					</Col>
				) : null}

				<Col span={8}>
					<div className='flex flex-col flex-1 gap-2 mb-4'>
						<span>{isBilling ? 'Número de serial' : 'Tipo'}</span>
						<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
							{isBilling
								? dataToHandle?.identifier
								: TRANSACTION_TYPES_MAP[dataToHandle?.type]}
						</span>
					</div>
				</Col>

				<Col span={8}>
					<div className='flex flex-col flex-1 gap-2 mb-4'>
						<span>Estado</span>
						<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
							{isBilling
								? 'Pagada'
								: TRANSACTION_STATES_MAP[dataToHandle?.state]}
						</span>
					</div>
				</Col>

				<Col span={8}>
					<div className='flex flex-col flex-1 gap-2 mb-4'>
						<span>Fecha</span>
						<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
							{formatDate(dataToHandle?.createdDate) ?? '--'}
						</span>
					</div>
				</Col>

				<Divider orientation='left'>Productos</Divider>
				{isLoading || isStale ? (
					<Col>
						{/* Mismo `pb-6` que la línea real, para que no se mueva al llegar */}
						<div className='pb-6'>
							<Skeleton.Input active size='small' style={{ width: 170 }} />
						</div>
					</Col>
				) : items?.length > 0 ? (
					<Col>
						<p className='pb-6'># Total de Items: {itemsCount}</p>
					</Col>
				) : null}
				<TransactionsItemList
					items={items}
					isBilling={isBilling}
					isLoading={isLoading || isStale}
					hasFailed={hasFailed}
					onRetry={() => setRetryCount(count => count + 1)}
				/>
				</Row>
			</div>

			{/*
				`shrink-0` para que el pie no se comprima cuando el contenido es largo,
				y sin padding inferior propio: el espacio de debajo lo pone el padding
				del cuerpo del Drawer, que ahora sí se respeta siempre porque el pie ya
				no se va con el scroll. Mismo criterio que `DrawerFormFooter`.
			*/}
			<div className='shrink-0 flex justify-end gap-4 pt-4 bg-white'>
				<Button
					color='danger'
					variant='outlined'
					className='w-[90%] max-w-[200px]'
					style={{ fontWeight: 600 }}
					htmlType='button'
					onClick={closeDrawer}
				>
					CERRAR
				</Button>
			</div>
		</div>
	);
};

export default TransactionDetails;
