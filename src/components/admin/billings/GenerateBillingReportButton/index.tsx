'use client';
import { billingLibs, BillingParams } from '@/libs/api/billing';
import { BillingStatus } from '@/types/enums';
import { downloadExcel, generateBillingsData } from '@/utils/documents';
import { Button, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import { IoMdDownload } from 'react-icons/io';

interface Props {
	shopSlug: string;
	searchParams?: BillingParams;
}

const GenerateBillingReportButton = ({ shopSlug, searchParams }: Props) => {
	const [isLoading, setIsLoading] = useState(false);
	const hasDateFilters = searchParams?.dateStart && searchParams?.dateEnd;

	const filters = {
		shopId: searchParams?.shopId as string,
		serialNumber: searchParams?.serialNumber,
		status: searchParams?.status,
		paymentMethods: searchParams?.paymentMethods,
		customerName: searchParams?.customerName,
		dateStart: searchParams?.dateStart,
		dateEnd: searchParams?.dateEnd
	};

	const handleDownloadExcel = async () => {
		try {
			setIsLoading(true);

			const res = await billingLibs.getAll({
				...filters,
				page: 1,
				pageSize: 9999,
				status: BillingStatus.PAID
			});

			if (res?.billings?.length === 0) return;

			const excelData = generateBillingsData(res?.billings);
			const date = searchParams?.dateStart;

			if (excelData) {
				const shopName = shopSlug.toUpperCase().replace('-', ' ');
				const title = `Reporte de Ventas - ${shopName}`;

				downloadExcel({
					data: excelData,
					fileName: `${shopSlug}-reporte-ventas-${dayjs(date).format('YYYYMMDD')}`,
					title,
					date
				});
			}
		} catch (error) {
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Tooltip title='Descargar reporte de ventas'>
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
				disabled={!hasDateFilters || isLoading}
			>
				Generar Reporte
			</Button>
		</Tooltip>
	);
};

export default GenerateBillingReportButton;
