import { Tag } from 'antd';
import { IoStorefrontOutline } from 'react-icons/io5';
import { TbFileDollar } from 'react-icons/tb';
import PDFContainer from '@/components/admin/common/PDF/PDFContainer';
import GoBack from '@/components/admin/common/ui/GoBack';

interface QuoteDetailPageProps {
	params: {
		shopSlug: string;
		serialNumber: string;
	};
}

const QuoteDetailPage = (props: QuoteDetailPageProps) => {
	const {
		params: { shopSlug, serialNumber }
	} = props;
	const shopName = shopSlug.toUpperCase().replace('-', ' ');

	return (
		<div className='flex flex-col gap-6 h-full'>
			<div className='flex flex-wrap items-center'>
				<GoBack />
				<h2 className='text-lg min-[796px]:text-2xl font-semibold ps-4'>
					Cotizaciones:
				</h2>
				<span className='flex gap-1 items-center ps-4 pe-2 max-[555px]:mt-2 text-lg min-[796px]:text-2xl font-semibold'>
					<IoStorefrontOutline /> {shopName}
				</span>
				<div className='flex items-center max-[955px]:mt-2 max-[955px]:ps-4'>
					<Tag
						color='blue-inverse'
						className='w-fit'
						style={{ padding: '0 12px' }}
					>
						<span className='flex gap-2 items-center text-lg'>
							<TbFileDollar size={24} /># {serialNumber}
						</span>
					</Tag>
				</div>
			</div>

			<PDFContainer
				shopSlug={shopSlug}
				serialNumber={serialNumber}
				isQuote={true}
			/>
		</div>
	);
};

export default QuoteDetailPage;
