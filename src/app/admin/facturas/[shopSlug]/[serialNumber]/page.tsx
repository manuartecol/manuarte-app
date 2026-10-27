import { Tag } from 'antd';
import { IoStorefrontOutline } from 'react-icons/io5';
import { PiInvoice } from 'react-icons/pi';
import PDFContainer from '@/components/admin/common/PDF/PDFContainer';
import GoBack from '@/components/admin/common/ui/GoBack';

interface BillingDetailPageProps {
	params: {
		shopSlug: string;
		serialNumber: string;
	};
}

const BillingDetailPage = (props: BillingDetailPageProps) => {
	const {
		params: { shopSlug, serialNumber }
	} = props;
	const shopName = shopSlug.toUpperCase().replace('-', ' ');

	return (
		<div className='flex flex-col gap-6 h-full'>
			<div className='flex flex-wrap items-center'>
				<GoBack />
				<h2 className='text-lg min-[796px]:text-2xl font-semibold ps-4'>
					Facturas:
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
							<PiInvoice size={24} /># {serialNumber}
						</span>
					</Tag>
				</div>
			</div>

			<PDFContainer
				shopSlug={shopSlug}
				serialNumber={serialNumber}
				isQuote={false}
			/>
		</div>
	);
};

export default BillingDetailPage;
