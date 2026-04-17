import { notification } from 'antd';
import PDFDoc from '@/components/admin/common/PDF/PDFDoc';
import { DiscountType } from '@/types/enums';
import { pdf } from '@react-pdf/renderer';
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

	const generatePDFBlob = async ({
		isQuote,
		data
	}: {
		isQuote: boolean;
		data: Quote | Billing;
	}) => {
		const blob = await pdf(<PDFDoc isQuote={isQuote} data={data} />).toBlob();

		return blob;
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
			notification.error({ message: 'Error al enviar documento' });
		}
	};

	// const sendPdf = async ({
	// 	isQuote,
	// 	data
	// }: {
	// 	isQuote: boolean;
	// 	data: Quote | Billing;
	// }) => {
	// 	try {
	// 		const doc = await generatePDFBlob({ isQuote, data });
	// 		const mediaId = await messagingServices.uploadMedia(
	// 			doc,
	// 			data.serialNumber
	// 		);

	// 		const customerName = data?.fullName?.toUpperCase() ?? 'CONSUMIDOR FINAL';
	// 		const recipientPhoneNumber = `${data?.callingCode}${data?.phoneNumber}`;
	// 		const { total } = calculateTotals(data);

	// 		const messageData = {
	// 			templateName: isQuote ? 'send_quote' : 'send_billing',
	// 			mediaId,
	// 			params: {
	// 				customerName,
	// 				docSerialNumber: data?.serialNumber,
	// 				total,
	// 				docName: `${isQuote ? 'CTZ' : 'FCT'}-${data?.serialNumber}`
	// 			}
	// 		};

	// 		// Enviar al cliente
	// 		const res = await messagingServices.sendDocMessage({
	// 			recipientPhoneNumber,
	// 			...messageData
	// 		});

	// 		if (res?.status === 200) {
	// 			notification.success({
	// 				message: 'Documento enviado con éxito'
	// 			});
	// 		}

	// 		// Enviar copia al número de WhatsApp de la tienda
	// 		const shopPhoneNumber =
	// 			data?.countryIsoCode === 'CO'
	// 				? process.env.NEXT_PUBLIC_SHOP_CO_PHONE_NUMBER
	// 				: process.env.NEXT_PUBLIC_SHOP_EC_PHONE_NUMBER;

	// 		const res2 = await messagingServices.sendDocMessage({
	// 			recipientPhoneNumber: shopPhoneNumber as string,
	// 			...messageData
	// 		});

	// 		if (res2?.status === 200) {
	// 			notification.success({
	// 				message: 'Copia del documento enviada a la tienda'
	// 			});
	// 		}
	// 	} catch (error) {
	// 		notification.error({ message: 'Error al enviar documento' });
	// 	}
	// };

	// const sendPdfAfterCreateDoc = async ({
	// 	isQuote,
	// 	serialNumber
	// }: {
	// 	isQuote: boolean;
	// 	serialNumber: string;
	// }) => {
	// 	const newQuoteData = isQuote
	// 		? await quoteLibs.getOne({ serialNumber })
	// 		: await billingLibs.getOne({ serialNumber });

	// 	await sendPdf({
	// 		isQuote,
	// 		data: newQuoteData
	// 	});
	// };

	return { calculateTotals, generatePDFBlob, sendPdf };
};

export default usePdf;
