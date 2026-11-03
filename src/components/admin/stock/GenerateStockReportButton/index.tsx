'use client';
import { Button, notification } from 'antd';
import { IoMdDownload } from 'react-icons/io';
import {
	downloadExcel,
	generateCostStockData,
	generateRestockData,
	generateStockHistoryData
} from '@/utils/documents';
import { ButtonVariantType } from 'antd/es/button';
import { stockItemLibs } from '@/libs/api/stock-item';

interface Props {
	shopSlug: string;
	stockId?: string;
	history?: StockItemHistory[];
	product?: { productName: string; productVariantName: string };
	variant?: ButtonVariantType;
	label?: string;
	isMoldesReport?: boolean;
}

const GenerateStockReportButton = ({
	shopSlug,
	stockId,
	history,
	product,
	variant = 'solid',
	label = 'Generar Reporte',
	isMoldesReport = false
}: Props) => {
	const isRestockData = label.toLowerCase().includes('pedido');

	/**
	 * Con `history` el informe sale de lo que ya está en pantalla y no hace falta
	 * pedir nada. Antes se pedía el stock siempre, con un `stockId &&` que en el
	 * historial se quedaba en `undefined`: desestructurarlo rompía el informe de
	 * esa vista, que es la única que no recibe `stockId`
	 */
	const getExcelData = async () => {
		if (history) {
			return generateStockHistoryData(history);
		}

		if (!stockId) {
			notification.error({
				message: 'No se pudo identificar la bodega del reporte'
			});

			return;
		}

		const data = await stockItemLibs.getAllByStock({
			stockId,
			report: true
		});

		if (!Array.isArray(data?.stockItems)) {
			notification.error({
				message: 'No se pudieron obtener los items de stock. Inténtalo de nuevo'
			});

			return;
		}

		if (data.stockItems.length === 0) {
			notification.info({ message: 'Esta bodega no tiene items de stock' });

			return;
		}

		return isRestockData
			? generateRestockData(data.stockItems, isMoldesReport)
			: generateCostStockData(data.stockItems);
	};

	const handleDownloadExcel = async () => {
		try {
			const excelData = await getExcelData();

			if (!excelData?.length) return;

			const restockSufix = isMoldesReport
				? 'reporte-pedido-moldes-stock'
				: 'reporte-pedido-stock';

			const sufix = history
				? 'reporte-historial-stock'
				: `${isRestockData ? restockSufix : 'reporte-stock'}`;

			const shopName = shopSlug.toUpperCase().replace('-', ' ');

			const title = product
				? `${shopName}: ${product?.productName} - ${product?.productVariantName}`
				: `${isRestockData ? 'Pedido de ' : ''}Stock ${isMoldesReport ? 'de Moldes ' : ''}- ${shopName}`;

			downloadExcel({
				data: excelData,
				fileName: `${shopSlug}-${sufix}`,
				title
			});
		} catch (error) {
			console.error(error);
			notification.error({
				message: 'Ocurrió un error generando el reporte'
			});
		}
	};

	return (
		<Button
			variant={variant}
			color='primary'
			icon={
				<IoMdDownload
					size={18}
					style={{ display: 'flex', alignItems: 'center' }}
				/>
			}
			onClick={handleDownloadExcel}
		>
			{label}
		</Button>
	);
};

export default GenerateStockReportButton;
