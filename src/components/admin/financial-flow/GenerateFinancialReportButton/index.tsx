'use client';
import {
	downloadFinancialExcel,
	generateFinancialData
} from '@/utils/documents';
import { Button } from 'antd';
import { IoMdDownload } from 'react-icons/io';
import { useSelector } from 'react-redux';
import { formatDate } from '@/utils/formats';

const GenerateFinancialReportButton = ({ shopSlug }: { shopSlug: string }) => {
	const {
		currentCashSession: { data, balance },
		bankTransferMovements
	} = useSelector((state: RootState) => state.financialFlow);
	const cashMovements = data?.movements;
	const finalCash =
		data?.closedAt === null ? balance : data?.declaredClosingAmount;
	const piggyBankAmount = data?.piggyBankAmount;
	const piggyBankMovements = data?.piggyBankMovements ?? [];
	const initialCash = data?.openingAmount ?? 0;

	const canGenerateReport = Boolean(
		cashMovements?.length > 0 || bankTransferMovements?.length > 0
	);

	const handleDownloadExcel = async () => {
		try {
			const {
				cashIncomes,
				cashExpenses,
				bankData,
				piggyBankWithdrawalsTotal,
				totalSaleOfDay
			} = generateFinancialData(
				cashMovements,
				bankTransferMovements,
				piggyBankMovements
			);

			const sufix = 'reporte-flujo-financiero';
			const shopName = shopSlug.toUpperCase().replace('-', ' ');

			if (
				cashIncomes &&
				cashExpenses &&
				bankData &&
				finalCash &&
				piggyBankAmount
			) {
				const title = `Reporte - Flujo Financiero ${shopName}`;

				const dateString = formatDate(data?.openedAt);

				downloadFinancialExcel({
					cashIncomes,
					cashExpenses,
					bankData,
					finalCash,
					piggyBankAmount,
					initialCash,
					piggyBankWithdrawalsTotal,
					totalSaleOfDay,
					fileName: `${shopSlug}-${sufix}-${dateString}`,
					title,
					date: data?.openedAt
				});
			}
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<Button
			variant='solid'
			color='primary'
			icon={
				<IoMdDownload
					size={18}
					style={{ display: 'flex', alignItems: 'center' }}
				/>
			}
			onClick={handleDownloadExcel}
			disabled={!canGenerateReport}
		>
			Generar Reporte
		</Button>
	);
};

export default GenerateFinancialReportButton;
