import { useState } from 'react';
import { notification, Upload, UploadProps, Spin } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { productLibs } from '@/libs/api/product';
import { AxiosError } from 'axios';

const { Dragger } = Upload;

/**
 * Pasa el valor de una celda a texto.
 *
 * Se usa el valor crudo y no `cell.text` a propósito: `text` devuelve el valor
 * con el formato de la celda, así que una cantidad con separador de miles
 * llegaría como "1,000" y `Number()` daría NaN. Y los códigos de producto
 * empiezan por ceros, que hay que conservar.
 */
const cellToString = (value: unknown): string => {
	if (value === null || value === undefined) return '';

	if (typeof value === 'object') {
		// Texto enriquecido, fórmula o hipervínculo
		const cell = value as {
			text?: string;
			result?: unknown;
			richText?: { text: string }[];
		};

		if (Array.isArray(cell.richText)) {
			return cell.richText.map(part => part.text).join('');
		}
		if (cell.text !== undefined) return String(cell.text);
		if (cell.result !== undefined) return String(cell.result);

		return '';
	}

	return String(value);
};

const ProductsExcelUploader = ({
	onAddBulkProduct,
	fromStockId
}: {
	onAddBulkProduct: (productList: any[]) => void;
	fromStockId: string;
}) => {
	const [loading, setLoading] = useState(false);

	const props: UploadProps = {
		name: 'file',
		multiple: false,
		/**
		 * `accept` incluye `.xls` aunque no se admita, y el rechazo real lo hace
		 * `beforeUpload`.
		 *
		 * Es a propósito: rc-upload descarta en silencio los archivos arrastrados
		 * que no cuadran con `accept`, sin llegar a llamar a `beforeUpload`, así
		 * que con `accept: '.xlsx'` un `.xls` soltado encima no hacía nada y no
		 * explicaba nada. Dejándolo pasar el filtro, el mensaje sale siempre, por
		 * el diálogo y por arrastre.
		 */
		accept: '.xlsx,.xls',
		showUploadList: false,
		beforeUpload(file) {
			const isXlsx =
				file.type ===
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
				file.name.endsWith('.xlsx');

			if (!isXlsx) {
				notification.error({
					message: '¡Formato no válido!',
					description:
						'Solo se permiten archivos .xlsx. Si el tuyo es .xls, ábrelo en Excel y guárdalo como .xlsx'
				});
				return Upload.LIST_IGNORE;
			}

			return true;
		},
		customRequest({ file, onSuccess }) {
			setLoading(true);
			const reader = new FileReader();

			reader.onload = async e => {
				const allRows: string[][] = [];

				// El parseo va en su propio try: si el archivo está corrupto o es un
				// .xls renombrado a .xlsx, `load` lanza, y sin esto la promesa queda
				// rechazada sin dueño, el spinner no se quita nunca y no se explica
				// nada. Es el mismo fallo silencioso que tenía el rechazo por
				// formato.
				try {
					// Carga diferida: ExcelJS son 23 MB que solo hacen falta si alguien
					// sube un archivo, no al abrir el formulario
					const { default: Excel } = await import('exceljs');

					const workbook = new Excel.Workbook();
					await workbook.xlsx.load(e.target?.result as ArrayBuffer);

					const worksheet = workbook.worksheets[0];

					// `row.values` de ExcelJS es 1-based: la posición 0 viene vacía
					// siempre, así que se descarta para que los índices de columna
					// coincidan con lo que devuelve `indexOf` sobre la fila de cabecera
					worksheet?.eachRow({ includeEmpty: true }, row => {
						const values = Array.isArray(row.values)
							? row.values.slice(1)
							: [];
						allRows.push(values.map(cellToString));
					});
				} catch (error) {
					console.error(error);
					notification.error({
						message: 'No se pudo leer el archivo',
						description:
							'Puede estar dañado, o ser un .xls al que le cambiaron la extensión. Ábrelo en Excel y guárdalo como .xlsx'
					});
					setLoading(false);
					return;
				}

				const headerRowIndex = allRows.findIndex(
					row => row.includes('Código') && row.includes('Cantidad requerida')
				);

				if (headerRowIndex === -1) {
					notification.error({
						message: 'No se encontraron las columnas requeridas'
					});
					setLoading(false);
					return;
				}

				const headers = allRows[headerRowIndex];
				const rows = allRows.slice(headerRowIndex + 1);

				const productCodeIndex = headers.indexOf('Código');
				const requiredQtyIndex = headers.indexOf('Cantidad requerida');

				const filteredData = rows
					.filter(row => row[productCodeIndex])
					.map((row: any[]) => ({
						productCode: row[productCodeIndex],
						requiredQty: Number(row[requiredQtyIndex])
					}))
					.filter(item => item.requiredQty > 0);

				const productCodes = filteredData.map(item => item.productCode.trim());

				try {
					const resData = await productLibs.bulkSearchProductVariants(
						productCodes,
						fromStockId
					);

					const processedData = resData.reverse().map((resItem: any) => {
						const match = filteredData.find(
							item => item.productCode.trim() === resItem.productCode.trim()
						);

						return {
							...resItem,
							requiredQty: match?.requiredQty || 0
						};
					});

					onAddBulkProduct(processedData);
					if (onSuccess) onSuccess('ok');
				} catch (error) {
					console.error(error);
					const message =
						error instanceof AxiosError
							? error?.response?.data.message
							: 'Ocurrió un error. Inténtalo más tarde';
					notification.error({ message, duration: null });
				} finally {
					setLoading(false);
				}
			};

			reader.onerror = () => {
				notification.error({
					message: 'Error al leer el archivo'
				});
				setLoading(false);
			};

			reader.readAsArrayBuffer(file as Blob);
		}
	};

	return (
		<Spin spinning={loading}>
			<Dragger {...props} style={{ marginBottom: 12 }}>
				<p className='ant-upload-drag-icon'>
					<InboxOutlined />
				</p>
				<p className='ant-upload-text'>
					Haz clic o arrastra un archivo excel para cargarlo
				</p>
				<p className='ant-upload-hint'>
					Solo archivos .xlsx, con las columnas Código y Cantidad requerida
				</p>
			</Dragger>
		</Spin>
	);
};

export default ProductsExcelUploader;
