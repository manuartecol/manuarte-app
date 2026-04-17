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

			<div className='shadow-[6px_6px_24px_rgba(0,0,0,0.25)] rounded-lg'>
				{data ? (
					<div className='m-4 max-h-[480px] overflow-y-auto custom-scrollbar'>
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
