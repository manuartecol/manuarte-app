'use client';

import { downloadExcel, generateTopSalesData } from '@/utils/documents';
import { Button, notification, Tooltip } from 'antd';
import { IoMdDownload } from 'react-icons/io';
import { dashboardServices } from '@/services/dashboardServices';
import FlagCol from '../Flags/FlagCol';
import FlagEcu from '../Flags/FlagEcu';
import { Dayjs } from 'dayjs';
import { useState } from 'react';

interface GenerateTopSalesReportButtonProps {
	currency: string;
	year: string;
	selectedMonth: Dayjs;
	disabled?: boolean;
}

const GenerateTopSalesReportButton = ({
	currency,
	year,
	selectedMonth,
	disabled
}: GenerateTopSalesReportButtonProps) => {
	const [loading, setLoading] = useState(false);

	const handleDownloadExcel = async () => {
		try {
			setLoading(true);
			const data = await dashboardServices.getSalesReport(
				currency,
				year,
				selectedMonth.format('M')
			);

			if (!data?.products || data?.products.length <= 0) {
				notification.error({
					message: 'No se encontraron datos para generar el reporte',
					key: 'top-sales-report-error'
				});
				return;
			}

			const excelData = generateTopSalesData(data.products);

			if (excelData) {
				const country = currency === 'COP' ? 'Colombia' : 'Ecuador';
				const title = `Top Ventas - ${country}`;
				const fileName = `top-ventas-${country.toLowerCase()}-${selectedMonth.format('MMMM-YYYY')}.xlsx`;

				downloadExcel({
					data: excelData,
					fileName,
					title,
					date: selectedMonth.toISOString(),
					dateFormat: 'month',
					currency: currency as 'COP' | 'USD'
				});
			}
		} catch (error) {
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	const FLAGS = {
		COP: <FlagCol size={20} />,
		USD: <FlagEcu size={20} />
	};

	return (
		<Tooltip title='Descargar reporte de top ventas'>
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
				disabled={disabled || loading}
				loading={loading}
			>
				Generar Reporte {FLAGS[currency as keyof typeof FLAGS]}
			</Button>
		</Tooltip>
	);
};

export default GenerateTopSalesReportButton;
