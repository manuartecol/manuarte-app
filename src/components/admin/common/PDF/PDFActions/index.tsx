import { Button, MenuProps, notification, Space } from 'antd';
import { IoDownloadOutline } from 'react-icons/io5';
import { BsSendArrowDown } from 'react-icons/bs';
import { PiInvoice } from 'react-icons/pi';
import { MdOutlinePendingActions } from 'react-icons/md';
import DropdownMenu from '../../ui/DropdownMenu';
import PDFDoc from '../PDFDoc';
import { useModalStore } from '@/stores/modalStore';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { BillingStatus, ModalContent } from '@/types/enums';
import usePdf from '@/hooks/usePdf';
import AddButton from '../../ui/AddButton';
import { BiDollar } from 'react-icons/bi';

type Props = {
	isQuote: boolean;
	data: Quote | Billing;
};

const PDFActions = ({ isQuote, data }: Props) => {
	const { openModal, closeModal } = useModalStore.getState();
	const { sendPdf, calculateTotals } = usePdf();
	const { total } = calculateTotals(data);

	const city = data?.cityName?.toUpperCase() ?? 'NA';
	const customerName = data?.fullName?.toUpperCase() ?? 'CONSUMIDOR FINAL';
	const isNotPaid = data?.status !== BillingStatus.PAID;

	const sendDocument = async () => {
		if (!data?.phoneNumber) {
			notification.info({
				message: 'El cliente no tiene un número de teléfono asociado'
			});
			return;
		}

		openModal({
			content: ModalContent.confirm,
			componentProps: {
				confirmTitle:
					'¿Estás seguro de que quieres enviar este documento al cliente?',
				confirmText: `Se enviará al número de WhatsApp (+${data?.callingCode}) ${data?.phoneNumber}`,
				onConfirm: async () => {
					try {
						await sendPdf({ isQuote, serialNumber: data.serialNumber });
					} finally {
						closeModal();
					}
				}
			}
		});
	};

	const dropDownItems: MenuProps['items'] = [
		{
			key: '1',
			label: (
				<Space className='px-2'>
					<Button
						variant='text'
						color='primary'
						icon={
							<PiInvoice
								size={18}
								style={{ display: 'flex', alignItems: 'center' }}
							/>
						}
						onClick={() =>
							openModal({
								title: 'Generar Factura',
								content: ModalContent.billings,
								dataToHandle: data
							})
						}
					>
						Generar Factura
					</Button>
				</Space>
			)
		},
		{
			key: '2',
			label: (
				<Space className='px-2'>
					<Button
						variant='text'
						color='primary'
						icon={
							<MdOutlinePendingActions
								size={18}
								style={{ display: 'flex', alignItems: 'center' }}
							/>
						}
						onClick={() =>
							openModal({
								title: 'Pedido | Abono',
								content: ModalContent.preOrder,
								dataToHandle: data
							})
						}
					>
						Pedido | Abono
					</Button>
				</Space>
			)
		}
	];

	return (
		<div className='flex items-center justify-between ps-4'>
			<div className='flex gap-2'>
				<PDFDownloadLink
					document={<PDFDoc isQuote={isQuote} data={data} />}
					fileName={`${city} - ${customerName}`}
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						padding: '0 15px',
						border: '1px solid #1677ff',
						borderRadius: 6
					}}
				>
					<IoDownloadOutline
						size={18}
						style={{ display: 'flex', alignItems: 'center' }}
					/>
					Descargar
				</PDFDownloadLink>
				<Button
					variant='outlined'
					color='primary'
					icon={
						<BsSendArrowDown
							size={18}
							style={{ display: 'flex', alignItems: 'center' }}
						/>
					}
					onClick={sendDocument}
					disabled={!isQuote && isNotPaid}
				>
					Enviar
				</Button>
			</div>

			{isQuote ? (
				<div className='flex gap-4 items-center'>
					{data?.customerId && (
						<AddButton
							title='Gestionar Abono'
							modalContent={ModalContent.balance}
							buttonLabel='Abono'
							addIcon={false}
							appendIcon={<BiDollar size={18} />}
							dataToHandle={{
								id: data?.customerId,
								currency: data?.currency,
								quoteId: data?.id,
								shopId: data?.shopId,
								total
							}}
						/>
					)}
					<DropdownMenu items={dropDownItems} label='Factura' />
				</div>
			) : null}
		</div>
	);
};

export default PDFActions;
