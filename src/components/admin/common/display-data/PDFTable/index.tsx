import { DiscountType } from '@/types/enums';
import { formatCurrency } from '@/utils/formats';

interface PDFTableProps {
	items: QuoteItem[] | BillingItem[];
	discountType?: string;
	discount?: number;
	shipping: number;
}

const PDFTable = ({
	items,
	discountType,
	discount,
	shipping = 0
}: PDFTableProps) => {
	const subtotal = items.reduce((acc, item) => {
		return acc + Number(item.totalPrice);
	}, 0);

	const isFixedDiscount = discountType === DiscountType.FIXED;

	const discountLabel =
		!discountType || isFixedDiscount ? 'DESCUENTO' : `DESCUENTO (${discount}%)`;

	const discountValue =
		(!discountType || isFixedDiscount
			? Number(discount)
			: subtotal * (Number(discount) / 100)) || 0;

	const total = subtotal - discountValue + Number(shipping);

	return (
		<div className='mb-16'>
			<table className='w-full border-collapse text-left'>
				<thead>
					<tr className='border-b-2'>
						<th className='px-4 py-2'>#</th>
						<th className='px-4 py-2'>PRODUCTO</th>
						<th className='px-4 py-2'>CANTIDAD</th>
						<th className='px-4 py-2'>PRECIO</th>
						<th className='px-4 py-2'>TOTAL PRODUCTO</th>
					</tr>
				</thead>
				<tbody>
					{items.map((item, index) => (
						<tr key={item.id} className='border-b-2'>
							<td className='px-4 py-2'>{index + 1}</td>
							<td className='px-4 py-2'>{item.name}</td>
							<td className='px-4 py-2'>{item.quantity}</td>
							<td className='px-4 py-2'>{formatCurrency(item.price)}</td>
							<td className='px-4 py-2'>{formatCurrency(item.totalPrice)}</td>
						</tr>
					))}
				</tbody>
				<tbody>
					<tr>
						<td rowSpan={4} colSpan={3}></td>
						<td className='px-4 py-2 font-bold border-b-2'>SUBTOTAL</td>
						<td className='px-4 py-2 border-b-2'>{formatCurrency(subtotal)}</td>
					</tr>
					<tr>
						<td className='px-4 py-2 font-bold border-b-2'>{discountLabel}</td>
						<td className='px-4 py-2 border-b-2'>
							{formatCurrency(discountValue) ?? 0}
						</td>
					</tr>
					<tr>
						<td className='px-4 py-2 font-bold border-b-2'>FLETE</td>
						<td className='px-4 py-2 border-b-2'>
							{formatCurrency(shipping) ?? 0}
						</td>
					</tr>
					<tr>
						<td className='px-4 py-2 font-bold border-b-2'>TOTAL</td>
						<td className='px-4 py-2 border-b-2'>{formatCurrency(total)}</td>
					</tr>
				</tbody>
			</table>
		</div>
	);
};

export default PDFTable;
