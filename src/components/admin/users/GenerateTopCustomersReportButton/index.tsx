import { useState } from 'react';
import { Button, notification } from 'antd';
import { IoMdDownload } from 'react-icons/io';
import { customerLibs, CustomerParams } from '@/libs/api/customer';
import { downloadExcel, generateTopCustomersData } from '@/utils/documents';

const GenerateTopCustomersReportButton = ({
	reportParams
}: {
	reportParams: CustomerParams;
}) => {
	const [loading, setLoading] = useState(false);

	/**
	 * El botón solo se bloquea mientras genera. Antes se bloqueaba también cuando
	 * una descarga salía vacía, y se quedaba así para siempre: ese estado solo se
	 * escribía al pulsarlo, así que ni limpiar el filtro lo devolvía a la vida.
	 * Una lista vacía no es un botón roto, es un aviso
	 */
	const handleDownloadExcel = async () => {
		try {
			setLoading(true);
			const data = await customerLibs.getTopCustomers(reportParams);

			if (!Array.isArray(data?.topCustomers)) {
				notification.error({
					message: 'No se pudo generar el reporte. Inténtalo de nuevo'
				});

				return;
			}

			if (data.topCustomers.length === 0) {
				notification.info({
					message: 'No hay clientes que cumplan los filtros aplicados'
				});

				return;
			}

			const excelData = generateTopCustomersData(data.topCustomers);

			if (!excelData?.length) {
				notification.error({
					message: 'No se pudo armar el reporte con esos clientes'
				});

				return;
			}

			const fileName = `reporte-general-de-clientes-${reportParams.isoCode}`;
			const country = reportParams.isoCode === 'CO' ? 'Colombia' : 'Ecuador';
			const title = `Reporte de Clientes - ${country}`;

			downloadExcel({
				data: excelData,
				fileName,
				title,
				info: { countryIsoCode: reportParams.isoCode }
			});
		} catch (error) {
			console.error(error);
			notification.error({
				message: 'Ocurrió un error generando el reporte'
			});
		} finally {
			setLoading(false);
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
			disabled={loading}
			loading={loading}
		>
			{loading ? 'Generando...' : 'Generar Reporte'}
		</Button>
	);
};

export default GenerateTopCustomersReportButton;
