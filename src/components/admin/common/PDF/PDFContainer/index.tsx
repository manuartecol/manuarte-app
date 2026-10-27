'use client';
import { useEffect, useRef, useState } from 'react';
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
	const contentRef = useRef<HTMLDivElement>(null);

	const fetchData = async () => {
		if (serialNumber) {
			const data = isQuote
				? await quoteLibs.getOne({ serialNumber })
				: await billingLibs.getOne({ serialNumber });

			setData(data);
		}
	};

	useEffect(() => {
		fetchData();
	}, []);

	return (
		<>
			<PDFActions
				isQuote={isQuote}
				data={isQuote ? (data as Quote) : (data as Billing)}
			/>

			{/*
				Ocupa el alto que deja la página, en vez del `max-h-[480px]` fijo que en
				pantallas grandes dejaba media pantalla vacía debajo. El mínimo evita que
				en ventanas bajas quede aplastado: ahí es el contenido del layout el que
				desplaza. La tarjeta se reserva entera desde el primer render, así que
				no salta al llegar los datos
			*/}
			<div className='flex flex-col flex-1 min-h-[320px] shadow-[6px_6px_24px_rgba(0,0,0,0.25)] rounded-lg'>
				{data ? (
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
