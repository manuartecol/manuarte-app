'use client';
import { useEffect, useState } from 'react';
import { notification, Tabs, TabsProps } from 'antd';
import { GiPayMoney, GiReceiveMoney } from 'react-icons/gi';
import AddButton from '../../common/ui/AddButton';
import { financialFlowServices } from '@/services/financialFlowServices';
import { CurrentCashSessionStatus, ModalContent } from '@/types/enums';
import { useDispatch, useSelector } from 'react-redux';
import {
	setBankTransferMovements,
	setCurrentCashSession
} from '@/reducers/financialFlow/financialFlowSlice';
import { RiSafe2Fill, RiSafe2Line } from 'react-icons/ri';
import CashFlow from '../CashFlow';
import BankTransfers from '../BankTransfers';
import { Dayjs } from 'dayjs';

const TabsFinancialFlow = ({ shopId }: { shopId: string | undefined }) => {
	const { currentCashSession } = useSelector(
		(state: RootState) => state.financialFlow
	);
	const [isLoading, setIsLoading] = useState(true);
	const [isCash, setIsCash] = useState(true);
	const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
	const dispatch = useDispatch();
	const { status, canOpen, data } = currentCashSession;

	const fetchCashSession = async () => {
		try {
			if (shopId) {
				const cashSessionData =
					await financialFlowServices.getCurrentCashSession(shopId);
				const bankTransferData =
					await financialFlowServices.getBankTransferMovements(shopId);

				if (cashSessionData) {
					dispatch(setCurrentCashSession(cashSessionData));
				}

				if (bankTransferData) {
					dispatch(setBankTransferMovements(bankTransferData));
				}
			}
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		fetchCashSession();
	}, [shopId]);

	const onChangeDate = async (date: Dayjs) => {
		const formattedDate = date?.toDate().toISOString();
		setSelectedDate(date);

		if (shopId && formattedDate) {
			setIsLoading(true);

			try {
				const data = await financialFlowServices.getCashSessionByDate(
					shopId,
					formattedDate
				);
				const data2 = await financialFlowServices.getBankTransferMovements(
					shopId,
					formattedDate
				);

				if (data) {
					dispatch(setCurrentCashSession({ ...currentCashSession, data }));
				} else {
					dispatch(
						setCurrentCashSession({ ...currentCashSession, data: null })
					);
					notification.error({
						message: 'No hay caja para la fecha seleccionada'
					});
				}

				if (data2) {
					dispatch(setBankTransferMovements(data2));
				} else {
					dispatch(setBankTransferMovements([]));
					notification.error({
						message: 'No hay depósitos para la fecha seleccionada'
					});
				}
			} finally {
				setIsLoading(false);
			}
		}
	};

	const items: TabsProps['items'] = [
		{
			key: '1',
			label: 'Flujo de Caja',
			children: (
				<CashFlow
					shopId={shopId as string}
					isLoading={isLoading}
					onChangeDate={onChangeDate}
					selectedDate={selectedDate}
				/>
			)
		},
		{
			key: '2',
			label: 'Transferencias Bancarias',
			children: (
				<BankTransfers
					isLoading={isLoading}
					onChangeDate={onChangeDate}
					selectedDate={selectedDate}
				/>
			)
		}
	];

	const onChange = (key: string) => {
		setIsCash(key === '1');
	};

	const operations = isCash ? (
		<div className='flex items-center gap-10 max-[460px]:flex-col'>
			{canOpen ? (
				<AddButton
					title='Apertura de Caja'
					modalContent={ModalContent.openCashSession}
					componentProps={{ shopId: shopId as string }}
					buttonLabel='Abrir Caja'
					addIcon={false}
					appendIcon={<RiSafe2Line size={18} />}
				/>
			) : (
				data &&
				!data?.closedAt && (
					<AddButton
						title='Cierre de Caja'
						modalContent={ModalContent.closeCashSession}
						componentProps={{ shopId: shopId as string }}
						buttonLabel='Cerrar Caja'
						addIcon={false}
						appendIcon={<RiSafe2Fill size={18} />}
					/>
				)
			)}

			<div className='flex gap-2'>
				{status === CurrentCashSessionStatus.OPEN &&
					data?.closedAt === null && (
						<>
							<AddButton
								title='Registrar Ingreso'
								modalContent={ModalContent.cashIncome}
								componentProps={{ shopId: shopId as string }}
								buttonLabel='Ingreso'
								appendIcon={<GiReceiveMoney size={18} />}
							/>
							<AddButton
								title='Registrar Gasto'
								modalContent={ModalContent.cashExpense}
								componentProps={{ shopId: shopId as string }}
								buttonLabel='Gasto'
								appendIcon={<GiPayMoney size={18} />}
							/>
						</>
					)}
			</div>
		</div>
	) : null;

	return (
		<Tabs
			defaultActiveKey='1'
			items={items}
			tabBarExtraContent={isLoading ? undefined : operations}
			onChange={onChange}
		/>
	);
};

export default TabsFinancialFlow;
