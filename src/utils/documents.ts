import ExcelJS from 'exceljs';
import {
	CASH_MOVEMENT_CAT_MAP,
	PAYMENT_METHOD_MAP,
	TRANSACTION_TYPES_MAP
} from './mappings';
import { formatDate, formatToTitleCase } from './formats';
import { CashMovementCategory, DiscountType } from '@/types/enums';

export interface ExcelRestockData {
	'#': number;
	Código: string;
	Producto: string;
	'Cantidad mínima': number;
	'Cantidad máxima': number;
	'Cantidad actual': number;
	'Cantidad en tránsito': number;
	'Cantidad en Cascajal'?: number;
	'Cantidad requerida': number;
}

export interface ExcelCostStockData {
	'#': number;
	Código: string;
	Producto: string;
	Cantidad: number;
	'Precio Venta': number;
	'Total Precio Venta': number;
	'Precio Dist': number;
	'Total Precio Dist': number;
	'Precio Costo': number;
	'Costo Total': number;
	'Ganancia Unitaria': number;
	'% de Ganancia': number;
}

export interface ExcelStockHistoryData {
	'#': number;
	Fecha: string;
	Transacción: string;
	'Stock Antes': number;
	Cantidad: number;
	'Stock Después': number;
}

export interface ExcelBillingData {
	'#': number;
	'Número de Serial': string;
	Cliente: string;
	'Métodos de Pago': string;
	Subtotal: number;
	Descuento: number;
	Flete: number;
	Total: number;
}

export interface ExcelCustomerActivityData {
	'#': number;
	Fecha: string;
	'Número de Serial': string;
	'Métodos de Pago': string;
	Flete: number;
	Total: number;
}

export interface ExcelTopCustomersData {
	'#': number;
	'Nro de Documento': string;
	Nombre: string;
	Teléfono: string;
	Ciudad: string;
	Compras: number;
	Facturado: number;
}

export interface ExcelTopSalesData {
	'#': number;
	'Grupo de Categoría': string;
	Categoría: string;
	Producto: string;
	Cantidad: number;
	Precio: number;
	'Total Ventas': number;
}

export const generateRestockData = (
	stockItems: StockItem[],
	isMoldesReport: boolean
) => {
	try {
		let excelData: ExcelRestockData[] = [];

		const filteredStockItems = isMoldesReport
			? stockItems.filter(
					item => item.productCategoryGroupName.toLowerCase() === 'moldes'
				)
			: stockItems.filter(
					item => item.productCategoryGroupName.toLowerCase() !== 'moldes'
				);

		const hasMainStockQuantity = filteredStockItems.some(
			item => !!item.mainStockQuantity
		);

		if (filteredStockItems?.length > 0) {
			excelData = filteredStockItems.reduce((acc, item) => {
				const requiredQty =
					Number(item.maxQty) -
					Number(item.quantity) -
					Number(item.quantityInTransit);

				if (item.maxQty > 0 && item.minQty > 0 && requiredQty > 0) {
					const row: ExcelRestockData = {
						'#': acc.length + 1,
						Código: item.vId,
						Producto: `${item.productName} - ${item.productVariantName}`,
						'Cantidad mínima': item.minQty,
						'Cantidad máxima': item.maxQty,
						'Cantidad actual': item.quantity,
						'Cantidad en tránsito': item.quantityInTransit,
						'Cantidad requerida': requiredQty
					};

					if (hasMainStockQuantity) {
						row['Cantidad en Cascajal'] = item.mainStockQuantity || 0;
					}

					acc.push(row);
				}

				return acc;
			}, [] as ExcelRestockData[]);
		}

		return excelData;
	} catch (error) {
		console.error(error);
	}
};

export const generateCostStockData = (stockItems: StockItem[]) => {
	try {
		let excelData: ExcelCostStockData[] = [];

		if (stockItems?.length > 0) {
			excelData = stockItems.reduce((acc, item) => {
				if (item.quantity > 0 && item.cost > 0) {
					acc.push({
						'#': acc.length + 1,
						Código: item.vId,
						Producto: `${item.productName} - ${item.productVariantName}`,
						Cantidad: item.quantity,
						'Precio Venta': item.price,
						'Total Precio Venta': Number(item.quantity) * Number(item.price),
						'Precio Dist': item.priceDis ?? 0,
						'Total Precio Dist': Number(item.quantity) * Number(item.priceDis),
						'Precio Costo': item.cost,
						'Costo Total': Number(item.quantity) * Number(item.cost),
						'Ganancia Unitaria': Number(item.price) - Number(item.cost),
						'% de Ganancia':
							(Number(item.price) - Number(item.cost)) / Number(item.cost)
					});
				}

				return acc;
			}, [] as ExcelCostStockData[]);
		}

		return excelData;
	} catch (error) {
		console.error(error);
	}
};

export const generateStockHistoryData = (history: StockItemHistory[]) => {
	try {
		let excelData: ExcelStockHistoryData[] = [];
		if (history?.length > 0) {
			excelData = history?.map((item, i) => {
				const stockAfter =
					item.type === 'ENTER'
						? Number(item.stockBefore) + Number(item.quantity)
						: Number(item.stockBefore) - Number(item.quantity);

				return {
					'#': i + 1,
					Fecha: formatDate(item.createdDate) ?? '--',
					Transacción:
						item.type === 'BILLING'
							? 'Factura'
							: TRANSACTION_TYPES_MAP[item.type],
					'Stock Antes': item.stockBefore,
					Cantidad: item.quantity,
					'Stock Después': stockAfter
				};
			});
		}

		return excelData;
	} catch (error) {
		console.error(error);
	}
};

export const generateBillingsData = (billings: Billing[]) => {
	try {
		let excelData: ExcelBillingData[] = [];

		if (billings?.length > 0) {
			excelData = billings?.map((item, i) => {
				const discount =
					(item?.discountType === DiscountType.PERCENTAGE
						? Number(item.subtotal) * (Number(item.discount) / 100)
						: Number(item.discount)) || 0;

				return {
					'#': i + 1,
					'Número de Serial': item.serialNumber,
					Fecha: formatDate(item.createdDate) ?? '--',
					Cliente: formatToTitleCase(item.customerName) ?? 'Consumidor Final',
					'Métodos de Pago': item?.paymentMethods
						?.map(p => PAYMENT_METHOD_MAP[p])
						.join(', '),
					Subtotal: item.subtotal,
					Descuento: discount,
					Total: Number(item.subtotal) - discount,
					Flete: item.shipping ?? 0
				};
			});
		}

		return excelData;
	} catch (error) {
		console.error(error);
	}
};

export const generateCustomerData = (recentActivity: Billing[] | Quote[]) => {
	try {
		let excelData: ExcelCustomerActivityData[] = [];
		if (recentActivity?.length > 0) {
			excelData = recentActivity?.map((item, i) => {
				const paymentMethods = 'paymentMethods' in item && item.paymentMethods;
				const total = 'subtotal' in item ? Number(item.subtotal) : 0;

				return {
					'#': i + 1,
					Transacción: paymentMethods ? 'Factura' : 'Cotización',
					'Número de Serial': item.serialNumber,
					'Métodos de Pago': Array.isArray(paymentMethods)
						? paymentMethods?.map(p => PAYMENT_METHOD_MAP[p]).join(', ')
						: '--',
					Flete: item.shipping ?? 0,
					Total: total,
					Fecha: formatDate(item.createdDate) ?? '--'
				};
			});
		}

		return excelData;
	} catch (error) {
		console.error(error);
	}
};

export const generateTopCustomersData = (data: Customer[]) => {
	try {
		let excelData: ExcelTopCustomersData[] = [];
		if (data?.length > 0) {
			excelData = data?.map((item, i) => {
				return {
					'#': i + 1,
					'Nro de Documento': item.dni,
					Nombre: item.fullName,
					Teléfono: item.phoneNumber,
					Ciudad: (item.cityName || item.city) ?? '--',
					Compras: Number(item.billingCount),
					Facturado: Number(item.totalSpent)
				};
			});
		}

		return excelData;
	} catch (error) {
		console.error(error);
	}
};

export const generateTopSalesData = (topGroups: any[]) => {
	try {
		const excelData: ExcelTopSalesData[] = [];
		let index = 1;

		if (topGroups?.length > 0) {
			for (const group of topGroups) {
				if (group.topProducts?.length > 0) {
					for (const product of group.topProducts) {
						excelData.push({
							'#': index++,
							'Grupo de Categoría': group.groupName,
							Categoría: product.categoryName,
							Producto: `${product.baseProductName} - ${product.productName}`,
							Cantidad: Number(product.totalQuantity),
							Precio: Number(product.avgUnitPrice),
							'Total Ventas': Number(product.totalRevenue)
						});
					}
				}
			}
		}

		return excelData;
	} catch (error) {
		console.error(error);
	}
};

export const generateFinancialData = (
	cashMovements: CashMovement[],
	bankTransferMovements: BankTransferMovement[],
	piggyBankMovements: PiggyBankMovement[] = []
) => {
	try {
		const canceledCashBillingRefs = new Set(
			cashMovements
				.filter(
					m =>
						m.type === 'EXPENSE' &&
						m.category === CashMovementCategory.OTHER &&
						m.reference
				)
				.map(m => m.reference)
				.filter(ref =>
					cashMovements.some(m => m.type === 'INCOME' && m.reference === ref)
				)
		);

		const cashIncomes = cashMovements
			.filter(
				item =>
					item.type === 'INCOME' && !canceledCashBillingRefs.has(item.reference)
			)
			.map(item => ({
				category: CASH_MOVEMENT_CAT_MAP[item.category],
				customer: item.customerName ?? '--',
				reference: item.reference ?? '--',
				amount: Number(item.amount)
			}));

		const cashExpenses = cashMovements
			.filter(
				item =>
					item.type === 'EXPENSE' &&
					!canceledCashBillingRefs.has(item.reference)
			)
			.map(item => ({
				category: CASH_MOVEMENT_CAT_MAP[item.category],
				categoryRaw: item.category,
				customer: item.customerName ?? '--',
				reference:
					[item.reference, item.comments].filter(Boolean).join(' - ') || '--',
				amount: Number(item.amount)
			}));

		const canceledBankBillingRefs = new Set(
			bankTransferMovements
				.filter(m => m.type === 'EXPENSE' && m.reference)
				.map(m => m.reference)
				.filter(ref =>
					bankTransferMovements.some(
						m => m.type === 'INCOME' && m.reference === ref
					)
				)
		);

		const bankData = bankTransferMovements
			.filter(
				item =>
					item.type === 'INCOME' && !canceledBankBillingRefs.has(item.reference)
			)
			.map(item => ({
				paymentMethod: PAYMENT_METHOD_MAP[item.paymentMethod] ?? '--',
				customer: item.customerName ?? '--',
				reference: item.reference ?? '--',
				amount: Number(item.amount)
			}))
			.sort((a, b) => b.paymentMethod.localeCompare(a.paymentMethod));

		const piggyBankWithdrawalsTotal = piggyBankMovements
			.filter(item => item.type === 'WITHDRAW' && !item.deletedDate)
			.reduce((sum, item) => sum + Number(item.amount), 0);

		const cashIncomesTotal = cashIncomes.reduce((sum, i) => sum + i.amount, 0);
		const bankTotal = bankData.reduce((sum, e) => sum + e.amount, 0);

		const deliveryChangesTotal = cashExpenses
			.filter(
				e =>
					e.categoryRaw === CashMovementCategory.DELIVERY ||
					e.categoryRaw === CashMovementCategory.CHANGE
			)
			.reduce((sum, e) => sum + e.amount, 0);

		const totalSaleOfDay = cashIncomesTotal + bankTotal - deliveryChangesTotal;

		return {
			cashIncomes,
			cashExpenses,
			bankData,
			piggyBankWithdrawalsTotal,
			totalSaleOfDay
		};
	} catch (error) {
		console.error(error);
		return {
			cashIncomes: [],
			cashExpenses: [],
			bankData: [],
			piggyBankWithdrawalsTotal: 0,
			totalSaleOfDay: 0
		};
	}
};

export const downloadExcel = async ({
	data,
	fileName,
	title,
	info = undefined,
	date
}: {
	data:
		| ExcelRestockData[]
		| ExcelStockHistoryData[]
		| ExcelBillingData[]
		| ExcelCustomerActivityData[]
		| ExcelTopCustomersData[]
		| ExcelTopSalesData[]
		| ExcelCostStockData[];
	fileName: string;
	title: string;
	info?: any | undefined;
	date?: string;
}) => {
	try {
		if (data?.length > 0) {
			const workbook = new ExcelJS.Workbook();
			const worksheet = workbook.addWorksheet('Hoja 1');
			const isUsd = title.toLowerCase().includes('quito');

			const headers = Object.keys(data[0]);
			const totalColumns = headers.length;

			const lastColLetter = getColLetter(totalColumns - 1);
			const titleEndColLetter = getColLetter(totalColumns - 2);
			const isCustomerReport = fileName.includes('reporte-cliente');

			// Title:
			worksheet.mergeCells(
				!isCustomerReport ? `A1:${titleEndColLetter}2` : 'A1:C2'
			);
			const titleCell = worksheet.getCell('A1');
			titleCell.value = title;
			titleCell.font = { bold: true, size: 11 };
			titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
			titleCell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
			titleCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'D9D9D9' }
			};

			if (isCustomerReport && info) {
				const phoneLabelCell = worksheet.getCell('D1');
				phoneLabelCell.value = 'Teléfono:';
				phoneLabelCell.font = { bold: true, size: 11 };
				phoneLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
				phoneLabelCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				phoneLabelCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};

				const phoneCell = worksheet.getCell('E1');
				phoneCell.value = String(info?.phoneNumber || '--');
				phoneCell.font = { size: 11 };
				phoneCell.alignment = { vertical: 'middle', horizontal: 'center' };
				phoneCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				phoneCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};
				phoneCell.numFmt = '@';

				const cityLabelCell = worksheet.getCell('D2');
				cityLabelCell.value = 'Ciudad:';
				cityLabelCell.font = { bold: true, size: 11 };
				cityLabelCell.alignment = { vertical: 'middle', horizontal: 'center' };
				cityLabelCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				cityLabelCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};

				const cityCell = worksheet.getCell('E2');
				cityCell.value = info?.cityName
					? `${String(info?.cityName)}, ${String(info?.countryIsoCode)}`
					: '--';
				cityCell.font = { size: 11 };
				cityCell.alignment = { vertical: 'middle', horizontal: 'center' };
				cityCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				cityCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};

				const billingsLabelCell = worksheet.getCell('F1');
				billingsLabelCell.value = 'Compras:';
				billingsLabelCell.font = { bold: true, size: 11 };
				billingsLabelCell.alignment = {
					vertical: 'middle',
					horizontal: 'center'
				};
				billingsLabelCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				billingsLabelCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};

				const billingsCell = worksheet.getCell('G1');
				billingsCell.value = Number(info?.billingsCount) ?? 0;
				billingsCell.font = { size: 11 };
				billingsCell.alignment = { vertical: 'middle', horizontal: 'center' };
				billingsCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				billingsCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};
				billingsCell.numFmt = '#,##0';

				const totalSpentLabelCell = worksheet.getCell('F2');
				totalSpentLabelCell.value = 'Total gastado:';
				totalSpentLabelCell.font = { bold: true, size: 11 };
				totalSpentLabelCell.alignment = {
					vertical: 'middle',
					horizontal: 'center'
				};
				totalSpentLabelCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				totalSpentLabelCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};

				const totalSpentCell = worksheet.getCell('G2');
				totalSpentCell.value = Number(info?.totalSpent) ?? 0;
				totalSpentCell.font = { size: 11 };
				totalSpentCell.alignment = { vertical: 'middle', horizontal: 'center' };
				totalSpentCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				totalSpentCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};
				totalSpentCell.numFmt =
					info?.countryIsoCode === 'EC' ? '"$" #,##0.00' : '"$" #,##0';
			}

			// Date:
			if (!isCustomerReport) {
				worksheet.mergeCells(`${lastColLetter}1:${lastColLetter}2`);
				const dateCell = worksheet.getCell(`${lastColLetter}1`);
				dateCell.value = date ? formatDate(date) : formatDate(new Date());
				dateCell.font = { bold: true, size: 11 };
				dateCell.alignment = { vertical: 'middle', horizontal: 'center' };
				dateCell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				dateCell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'D9D9D9' }
				};
			}

			// Headers:
			worksheet.addRow(headers);
			headers.forEach((_header, index) => {
				const cell = worksheet.getCell(3, index + 1);
				cell.font = { bold: true };
				cell.alignment = { vertical: 'middle', horizontal: 'center' };
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
				cell.fill = {
					type: 'pattern',
					pattern: 'solid',
					fgColor: { argb: 'C5D9F1' }
				};
			});

			// Data:
			data.forEach(item => {
				const row = worksheet.addRow(Object.values(item));

				row.eachCell((cell, colNumber) => {
					cell.alignment = { vertical: 'middle', horizontal: 'center' };
					cell.border = {
						top: { style: 'thin' },
						left: { style: 'thin' },
						bottom: { style: 'thin' },
						right: { style: 'thin' }
					};

					if (
						headers[colNumber - 1] === 'Código' ||
						headers[colNumber - 1] === 'Número de Serial'
					) {
						cell.numFmt = '@';
						cell.value = String(cell.value);
					}

					if (headers[colNumber - 1] === 'Cantidad actual') {
						formatRequiredQtyCol(item, cell);
					}

					const transactionIndex = headers.findIndex(h => h === 'Transacción');
					if (colNumber - 1 === transactionIndex) {
						formatTransactionCol(item, cell);
					}

					if (
						headers[colNumber - 1] === 'Nro de Documento' ||
						headers[colNumber - 1] === 'Teléfono'
					) {
						cell.numFmt = '@';
						cell.value = String(cell.value);
					}

					if (headers[colNumber - 1] === 'Compras') {
						cell.numFmt = '#,##0';
					}

					if (
						headers[colNumber - 1] === 'Subtotal' ||
						headers[colNumber - 1] === 'Descuento' ||
						headers[colNumber - 1] === 'Total' ||
						headers[colNumber - 1] === 'Flete' ||
						headers[colNumber - 1] === 'Facturado' ||
						headers[colNumber - 1] === 'Precio Venta' ||
						headers[colNumber - 1] === 'Total Precio Venta' ||
						headers[colNumber - 1] === 'Precio Dist' ||
						headers[colNumber - 1] === 'Total Precio Dist' ||
						headers[colNumber - 1] === 'Precio Costo' ||
						headers[colNumber - 1] === 'Costo Total' ||
						headers[colNumber - 1] === 'Ganancia Unitaria' ||
						headers[colNumber - 1] === 'Precio' ||
						headers[colNumber - 1] === 'Total Ventas'
					) {
						cell.numFmt =
							isUsd || info?.countryIsoCode === 'EC'
								? '"$" #,##0.00'
								: '"$" #,##0';
						cell.value = Number(cell.value);
						cell.alignment = { vertical: 'middle', horizontal: 'right' };
					}

					if (headers[colNumber - 1] === '% de Ganancia') {
						cell.numFmt = '0.00%';
					}

					if (
						headers[colNumber - 1] === 'Producto' ||
						headers[colNumber - 1] === 'Cliente' ||
						headers[colNumber - 1] === 'Métodos de Pago' ||
						headers[colNumber - 1] === 'Categoría' ||
						headers[colNumber - 1] === 'Grupo de Categoría'
					) {
						cell.alignment = { vertical: 'middle', horizontal: 'left' };
					}
				});
			});

			const requiredQtyIndex = headers.findIndex(
				h => h === 'Cantidad requerida'
			);
			if (requiredQtyIndex !== -1) {
				countRequiredQty(requiredQtyIndex, worksheet, headers);
			}

			const customerIndex = headers.findIndex(h => h === 'Cliente');
			const subtotalIndex = headers.findIndex(h => h === 'Subtotal');
			const descuentoIndex = headers.findIndex(h => h === 'Descuento');
			const totalIndex = headers.findIndex(h => h === 'Total');
			const fleteIndex = headers.findIndex(h => h === 'Flete');
			if (
				customerIndex !== -1 &&
				subtotalIndex !== -1 &&
				descuentoIndex !== -1 &&
				totalIndex !== -1 &&
				fleteIndex !== -1
			) {
				const sumRow = worksheet.addRow(Array(headers.length).fill(''));
				const totalRowNumber = worksheet.rowCount;
				sumTotals(subtotalIndex, totalRowNumber, sumRow, isUsd, 'Totales');
				sumTotals(descuentoIndex, totalRowNumber, sumRow, isUsd);
				sumTotals(totalIndex, totalRowNumber, sumRow, isUsd);
				sumTotals(fleteIndex, totalRowNumber, sumRow, isUsd);
			}

			const totalPriceIndex = headers.findIndex(
				h => h === 'Total Precio Venta'
			);
			const totalCostIndex = headers.findIndex(h => h === 'Costo Total');
			if (totalPriceIndex !== -1 && totalCostIndex !== -1) {
				const sumRow = worksheet.addRow(Array(headers.length).fill(''));
				const totalRowNumber = worksheet.rowCount;
				sumTotals(
					totalPriceIndex,
					totalRowNumber,
					sumRow,
					isUsd,
					'Valor total precio'
				);
				sumTotals(
					totalCostIndex,
					totalRowNumber,
					sumRow,
					isUsd,
					'Valor total costo'
				);
			}

			const COL_WIDTHS: Record<string, number> = {
				'#': 5,
				Producto: 70,
				Cliente: 30,
				Categoría: 50
			};

			worksheet.columns = headers.map(header => ({
				width: COL_WIDTHS[header] ?? 20
			}));

			const buffer = await workbook.xlsx.writeBuffer();
			const blob = new Blob([buffer], {
				type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
			});

			const link = document.createElement('a');
			link.href = URL.createObjectURL(blob);

			link.download = `${fileName}.xlsx`;
			link.click();
		}
	} catch (error) {
		console.error(error);
	}
};

export const downloadFinancialExcel = async ({
	cashIncomes,
	cashExpenses,
	bankData,
	piggyBankAmount,
	finalCash,
	initialCash,
	piggyBankWithdrawalsTotal,
	totalSaleOfDay,
	fileName,
	title,
	date
}: {
	cashIncomes: any[];
	cashExpenses: any[];
	bankData: any[];
	piggyBankAmount: number;
	finalCash: number;
	initialCash: number;
	piggyBankWithdrawalsTotal: number;
	totalSaleOfDay: number;
	fileName: string;
	title: string;
	date: string;
}) => {
	try {
		const workbook = new ExcelJS.Workbook();
		const worksheet = workbook.addWorksheet('Reporte Financiero');

		// ==== Fila 1: Título y Fecha ====
		worksheet.mergeCells('A1:H1');
		const titleCell = worksheet.getCell('A1');
		titleCell.value = title;
		titleCell.font = { bold: true, size: 12 };
		titleCell.alignment = { vertical: 'middle', horizontal: 'center' };

		const dateCell = worksheet.getCell('I1');
		dateCell.value = formatDate(date);
		dateCell.font = { bold: true, size: 11 };
		dateCell.alignment = { vertical: 'middle', horizontal: 'center' };

		// ==== Fila 2: Subtítulos ====
		worksheet.mergeCells('A2:D2');
		worksheet.getCell('A2').value = 'Efectivo (Ingresos)';
		worksheet.getCell('A2').fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'C5D9F1' }
		};
		worksheet.getCell('A2').font = { bold: true };
		worksheet.getCell('A2').alignment = { horizontal: 'center' };
		worksheet.getCell('A2').border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};

		worksheet.mergeCells('F2:I2');
		worksheet.getCell('F2').value = 'Depósitos';
		worksheet.getCell('F2').fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'C5D9F1' }
		};
		worksheet.getCell('F2').font = { bold: true };
		worksheet.getCell('F2').alignment = { horizontal: 'center' };
		worksheet.getCell('F2').border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};

		// ==== Tabla de ingresos (fila 3+) ====
		const headers = [
			'Categoría',
			'Cliente',
			'Referencia',
			'Monto',
			'',
			'Método de Pago',
			'Cliente',
			'Referencia',
			'Monto'
		];
		const headerRow = worksheet.addRow(headers);

		// estilos headers efectivo
		[1, 2, 3, 4].forEach(colIdx => {
			const cell = headerRow.getCell(colIdx);
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'C5D9F1' }
			};
			cell.font = { bold: true };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		});
		// headers depósitos
		[6, 7, 8, 9].forEach(colIdx => {
			const cell = headerRow.getCell(colIdx);
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'C5D9F1' }
			};
			cell.font = { bold: true };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		});

		// ==== Filas de ingresos ====
		const maxIncomeRows = Math.max(cashIncomes.length, bankData.length);
		for (let i = 0; i < maxIncomeRows; i++) {
			const cash = cashIncomes[i] ?? {
				category: '',
				customer: '',
				reference: '',
				amount: ''
			};
			const bank = bankData[i] ?? {
				paymentMethod: '',
				customer: '',
				reference: '',
				amount: ''
			};

			const row = worksheet.addRow([
				cash.category,
				cash.customer,
				cash.reference,
				cash.amount,
				'',
				bank.paymentMethod,
				bank.customer,
				bank.reference,
				bank.amount
			]);

			[1, 2, 3, 4, 6, 7, 8, 9].forEach(colIdx => {
				const cell = row.getCell(colIdx);
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
			});
		}

		// Totales ingresos
		const totalRow = worksheet.addRow([
			'',
			'',
			'Total efectivo:',
			cashIncomes.length > 0
				? { formula: `SUM(D4:D${3 + cashIncomes.length})` }
				: 0,
			'',
			'',
			'',
			'Total depósitos:',
			bankData.length > 0 ? { formula: `SUM(I4:I${3 + bankData.length})` } : 0
		]);

		totalRow.font = { bold: true };
		[3, 4, 8, 9].forEach(colIdx => {
			totalRow.getCell(colIdx).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'D9D9D9' }
			};
			totalRow.getCell(colIdx).border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		});

		// ==== Fila en blanco ====
		worksheet.addRow([]);

		// ==== Subtítulo gastos ====
		const expensesStartRow = worksheet.lastRow!.number + 1;
		worksheet.mergeCells(`A${expensesStartRow}:D${expensesStartRow}`);
		worksheet.getCell(`A${expensesStartRow}`).value = 'Efectivo (Gastos)';
		worksheet.getCell(`A${expensesStartRow}`).alignment = {
			horizontal: 'center'
		};
		worksheet.getCell(`A${expensesStartRow}`).fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'C5D9F1' }
		};
		worksheet.getCell(`A${expensesStartRow}`).font = { bold: true };
		worksheet.getCell(`A${expensesStartRow}`).border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};

		// ==== Headers gastos ====
		const expHeaders = ['Categoría', 'Cliente', 'Referencia', 'Monto'];
		const expHeaderRow = worksheet.addRow(expHeaders);
		[1, 2, 3, 4].forEach(colIdx => {
			const cell = expHeaderRow.getCell(colIdx);
			cell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'C5D9F1' }
			};
			cell.font = { bold: true };
			cell.alignment = { horizontal: 'center', vertical: 'middle' };
			cell.border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		});

		// ==== Filas gastos ====
		for (const exp of cashExpenses) {
			const row = worksheet.addRow([
				exp.category,
				exp.customer,
				exp.reference,
				exp.amount
			]);
			[1, 2, 3, 4].forEach(colIdx => {
				row.getCell(colIdx).border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
			});
		}

		// Totales gastos
		const totalExpRow = worksheet.addRow([
			'',
			'',
			'Total gastos:',
			cashExpenses.length > 0
				? {
						formula: `SUM(D${expHeaderRow.number + 1}:D${expHeaderRow.number + cashExpenses.length})`
					}
				: 0
		]);

		totalExpRow.font = { bold: true };
		[3, 4].forEach(colIdx => {
			totalExpRow.getCell(colIdx).fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: 'D9D9D9' }
			};
			totalExpRow.getCell(colIdx).border = {
				top: { style: 'thin' },
				left: { style: 'thin' },
				bottom: { style: 'thin' },
				right: { style: 'thin' }
			};
		});

		// ==== Bloque resumen F-G ====
		const blockCol = 6; // F
		const blockStartRow = expHeaderRow.number;
		const blockRows = [
			{ label: 'Caja inicial', value: initialCash, color: 'BDD7EE' },
			{ label: 'Caja final', value: finalCash, color: 'BDD7EE' },
			{
				label: 'Retiros de Alcancía',
				value: piggyBankWithdrawalsTotal,
				color: 'FFE699'
			},
			{ label: 'Alcancía', value: piggyBankAmount, color: 'FFE699' },
			{ label: 'Total Ventas del Día', value: totalSaleOfDay, color: 'C6E0B4' }
		];
		blockRows.forEach(({ label, value, color }, r) => {
			const labelCell = worksheet.getCell(blockStartRow + r, blockCol);
			const valueCell = worksheet.getCell(blockStartRow + r, blockCol + 1);
			labelCell.value = label;
			labelCell.fill = {
				type: 'pattern',
				pattern: 'solid',
				fgColor: { argb: color }
			};
			labelCell.font = { bold: true };
			valueCell.value = Number(value) ?? 0;
			valueCell.numFmt = '"$" #,##0.00';
			[labelCell, valueCell].forEach(cell => {
				cell.border = {
					top: { style: 'thin' },
					left: { style: 'thin' },
					bottom: { style: 'thin' },
					right: { style: 'thin' }
				};
			});
		});

		// ==== Estilos globales ====
		worksheet.getColumn(4).numFmt = '"$" #,##0.00';
		worksheet.getColumn(7).numFmt = '"$" #,##0.00';
		worksheet.getColumn(9).numFmt = '"$" #,##0.00';
		worksheet.getColumn(1).width = 22;
		worksheet.getColumn(2).width = 22;
		worksheet.getColumn(3).width = 22;
		worksheet.getColumn(4).width = 18;
		worksheet.getColumn(6).width = 22;
		worksheet.getColumn(7).width = 22;
		worksheet.getColumn(8).width = 22;
		worksheet.getColumn(9).width = 18;

		// Descargar
		const buffer = await workbook.xlsx.writeBuffer();
		const blob = new Blob([buffer], {
			type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
		});
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = `${fileName}.xlsx`;
		link.click();
	} catch (error) {
		console.error(error);
	}
};

const formatRequiredQtyCol = (item: any, cell: ExcelJS.Cell) => {
	let fillColor = '10B981';

	const stockPercentage =
		(item['Cantidad actual'] / item['Cantidad máxima']) * 100;

	if (item['Cantidad actual'] <= item['Cantidad mínima']) {
		fillColor = 'E53535';
	} else if (stockPercentage <= 75) {
		fillColor = 'EAB308';
	}

	cell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: fillColor }
	};
};

const formatTransactionCol = (item: any, cell: ExcelJS.Cell) => {
	const TYPE_COLORS: Record<string, string> = {
		Entrada: '0D6EFD',
		Transferencia: 'EAB308',
		Salida: 'E53535',
		Factura: '10b981',
		Cotización: '0D6EFD'
	};

	const fillColor = TYPE_COLORS[item['Transacción']] ?? 'FFFFFF';

	cell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: fillColor }
	};
};

const sumTotals = (
	totalIndex: number,
	totalRowNumber: number,
	sumRow: ExcelJS.Row,
	isUsd: boolean,
	label?: string
) => {
	const colLetter = getColLetter(totalIndex);

	const totalCell = sumRow.getCell(totalIndex + 1);
	totalCell.value = {
		formula: `SUM(${colLetter}4:${colLetter}${totalRowNumber - 1})`
	};

	totalCell.font = { bold: true };
	totalCell.alignment = { horizontal: 'right' };
	totalCell.border = {
		top: { style: 'thin' },
		left: { style: 'thin' },
		bottom: { style: 'thin' },
		right: { style: 'thin' }
	};
	totalCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'C6E0B4' }
	};
	totalCell.numFmt = isUsd ? '"$" #,##0.00' : '"$" #,##0';

	const labelCell = sumRow.getCell(totalIndex);
	if (label) {
		labelCell.value = label;
		labelCell.font = { bold: true };
		labelCell.alignment = { horizontal: 'center' };
		labelCell.border = {
			top: { style: 'thin' },
			left: { style: 'thin' },
			bottom: { style: 'thin' },
			right: { style: 'thin' }
		};
		labelCell.fill = {
			type: 'pattern',
			pattern: 'solid',
			fgColor: { argb: 'C5D9F1' }
		};
	}
};

const countRequiredQty = (
	requiredQtyIndex: number,
	worksheet: ExcelJS.Worksheet,
	headers: string[]
) => {
	const totalRow = worksheet.addRow(Array(headers.length).fill(''));
	const totalRowNumber = totalRow.number;

	const labelStartIndex = requiredQtyIndex - 2;
	const labelEndIndex = requiredQtyIndex - 1;
	const sumIndex = requiredQtyIndex;

	const labelStartLetter = getColLetter(labelStartIndex);
	const labelEndLetter = getColLetter(labelEndIndex);
	const sumLetter = getColLetter(sumIndex);

	worksheet.mergeCells(
		`${labelStartLetter}${totalRowNumber}:${labelEndLetter}${totalRowNumber}`
	);
	const labelCell = worksheet.getCell(`${labelStartLetter}${totalRowNumber}`);
	labelCell.value = 'Cantidad total requerida de items';
	labelCell.font = { bold: true };
	labelCell.alignment = { vertical: 'middle', horizontal: 'center' };
	labelCell.border = {
		top: { style: 'thin' },
		left: { style: 'thin' },
		bottom: { style: 'thin' },
		right: { style: 'thin' }
	};
	labelCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'C5D9F1' }
	};

	const sumCell = worksheet.getCell(`${sumLetter}${totalRowNumber}`);
	sumCell.value = {
		formula: `SUM(${sumLetter}4:${sumLetter}${totalRowNumber - 1})`
	};
	sumCell.numFmt = '#,##0';
	sumCell.font = { bold: true };
	sumCell.alignment = { vertical: 'middle', horizontal: 'center' };
	sumCell.border = {
		top: { style: 'thin' },
		left: { style: 'thin' },
		bottom: { style: 'thin' },
		right: { style: 'thin' }
	};
	sumCell.fill = {
		type: 'pattern',
		pattern: 'solid',
		fgColor: { argb: 'C5D9F1' }
	};
};

const getColLetter = (index: number) => {
	let col = '';
	while (index >= 0) {
		col = String.fromCharCode((index % 26) + 65) + col;
		index = Math.floor(index / 26) - 1;
	}
	return col;
};
