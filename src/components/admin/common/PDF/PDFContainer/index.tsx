'use client';
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Skeleton, Spin } from 'antd';
import PDFActions from '../PDFActions';
import PDFPreview from '../PDFPreview';
import { quoteLibs } from '@/libs/api/quote';
import { billingLibs } from '@/libs/api/billing';

interface Props {
	shopSlug: string;
	serialNumber: string;
	isQuote: boolean;
}

const PDFContainer = ({ shopSlug, serialNumber, isQuote }: Props) => {
	const [data, setData] = useState<Quote | Billing>();
	const [isLoading, setIsLoading] = useState(true);
	/**
	 * Los wrappers de `libs/api` capturan el error y devuelven `undefined`. Sin
	 * distinguirlo, una petición fallida dejaba el spinner girando para siempre.
	 */
	const [hasFailed, setHasFailed] = useState(false);
	const contentRef = useRef<HTMLDivElement>(null);

	const fetchData = async () => {
		if (!serialNumber) return;

		setIsLoading(true);
		setHasFailed(false);
		try {
			const data = isQuote
				? await quoteLibs.getOne({ serialNumber })
				: await billingLibs.getOne({ serialNumber });

			if (data) setData(data);
			else setHasFailed(true);
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<>
			{/*
				Solo con datos: antes se mostraban durante la carga, y "Descargar"
				generaba en el navegador un PDF de un documento que aún no había llegado.
				Mientras carga, un esqueleto con la misma forma reserva el alto de la
				fila: sin él la tarjeta del documento empezaba arriba y bajaba de golpe
				al aparecer los botones
			*/}
			{data ? (
				<PDFActions
					isQuote={isQuote}
					data={isQuote ? (data as Quote) : (data as Billing)}
				/>
			) : isLoading ? (
				<div className='flex items-center justify-between ps-4'>
					<div className='flex gap-2'>
						<Skeleton.Button active style={{ width: 120 }} />
						<Skeleton.Button active style={{ width: 95 }} />
					</div>
					{isQuote ? (
						<div className='flex gap-4'>
							<Skeleton.Button active style={{ width: 95 }} />
							<Skeleton.Button active style={{ width: 105 }} />
						</div>
					) : null}
				</div>
			) : null}

			{/*
				Ocupa el alto que deja la página, en vez del `max-h-[480px]` fijo que en
				pantallas grandes dejaba media pantalla vacía debajo. El mínimo evita que
				en ventanas bajas quede aplastado: ahí es el contenido del layout el que
				desplaza. La tarjeta se reserva entera desde el primer render, así que
				no salta al llegar los datos
			*/}
			<div className='flex flex-col flex-1 min-h-[320px] shadow-[6px_6px_24px_rgba(0,0,0,0.25)] rounded-lg'>
				{isLoading ? (
					<div className='flex flex-1 items-center justify-center'>
						<Spin size='large' />
					</div>
				) : hasFailed ? (
					<div className='m-4'>
						<Alert
							type='error'
							showIcon
							message={`No se pudo cargar ${isQuote ? 'la cotización' : 'la factura'}`}
							description='Puede ser un problema de conexión.'
							action={
								<Button size='small' danger onClick={fetchData}>
									Reintentar
								</Button>
							}
						/>
					</div>
				) : data ? (
					<div className='m-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar'>
						<PDFPreview
							isQuote={isQuote}
							data={data}
							pdfRef={contentRef}
							shopSlug={shopSlug}
						/>
					</div>
				) : null}
			</div>
		</>
	);
};

export default PDFContainer;
