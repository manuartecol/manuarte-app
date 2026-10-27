import { notification } from 'antd';
import { AxiosError } from 'axios';
import { DiscountType } from '@/types/enums';
import { whatsAppLibs } from '@/libs/api/whatsapp';

const usePdf = () => {
	const calculateTotals = (data: Quote | Billing) => {
		const items = data?.items;
		const discountType = data?.discountType;
		const discount = data?.discount;
		const shipping = data?.shipping;
		const subtotal = items?.reduce(
			(acc, item) => acc + Number(item.totalPrice),
			0
		);

		const isFixedDiscount = discountType === DiscountType.FIXED;

		const discountLabel =
			!data?.discountType || isFixedDiscount
				? 'DESCUENTO'
				: `DESCUENTO (${discount}%)`;

		const discountValue =
			(!discountType || isFixedDiscount
				? Number(discount)
				: subtotal * (Number(discount) / 100)) || 0;

		const total = subtotal - discountValue + Number(shipping);

		return { subtotal, discountValue, discountLabel, total };
	};

	const sendPdf = async ({
		isQuote,
		serialNumber
	}: {
		isQuote: boolean;
		serialNumber: string;
	}) => {
		try {
			const res = isQuote
				? await whatsAppLibs.sendQuote(serialNumber)
				: await whatsAppLibs.sendBilling(serialNumber);

			if (res?.status === 200) {
				notification.success({
					message: 'Documento enviado con éxito'
				});
			}
		} catch (error) {
			console.error(error);
			// El mensaje del backend distingue un PDF que no se pudo generar (que no
			// se arregla reintentando) de un fallo al enviarlo. El genérico queda
			// para cuando no hay respuesta, como un 502 con el servidor caído
			const message =
				(error instanceof AxiosError && error.response?.data?.message) ||
				'Error al enviar documento';
			notification.error({ message });
		}
	};

	return { calculateTotals, sendPdf };
};

export default usePdf;
