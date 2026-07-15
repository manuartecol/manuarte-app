import { Skeleton, Tooltip } from 'antd';
import { formatCurrency, formatDate } from '@/utils/formats';
import { useSelector } from 'react-redux';
import { BiMoneyWithdraw } from 'react-icons/bi';
import generatePicker from 'antd/es/date-picker/generatePicker';
import { IoInformationCircleOutline } from 'react-icons/io5';
import CustomTable from '../../common/display-data/Table';
import AddButton from '../../common/ui/AddButton';
import { CurrentCashSessionStatus, ModalContent } from '@/types/enums';
import CashMovementCols from './cols';
import esES from 'antd/es/date-picker/locale/es_ES';
import momentGenerateConfig from 'rc-picker/lib/generate/moment';
import moment, { Moment } from 'moment';
import 'moment/locale/es';

const DatePicker = generatePicker<Moment>(momentGenerateConfig);
moment.locale('es');

interface Props {
	shopId: string;
	isLoading: boolean;
	onChangeDate: (date: Moment) => void;
	selectedDate: Moment | null;
}

const CashFlow = ({ shopId, isLoading, onChangeDate, selectedDate }: Props) => {
	const { currentCashSession } = useSelector(
		(state: RootState) => state.financialFlow
	);
	const { status, reason, balance, accumulatedDifference, data } =
		currentCashSession ?? {};
	const { cashMovementsColumns } = CashMovementCols();

	return (
		<div className='space-y-4'>
			<div className='flex justify-between'>
				<DatePicker
					value={selectedDate || moment(data?.openedAt)}
					format={value => value.format('DD-MMM-YYYY').toUpperCase()}
					locale={esES}
					disabledDate={current => {
						return current && current > moment().endOf('day');
					}}
					onChange={onChangeDate}
					allowClear={false}
				/>

				<div className='flex items-end gap-2'>
					{data && !data?.closedAt && status === 'blocked' && (
						<h2 className='text-[16px] text-[#E53535] border border-[#E53535] font-semibold px-3'>
							{reason}
						</h2>
					)}

					{data !== null && data?.openedAt && (
						<h2 className='text-[16px] font-semibold'>
							{`Sesión del ${formatDate(data?.openedAt)}`}
						</h2>
					)}

					<div
						className={`h-6 w-6 rounded-full ${!data || data?.closedAt ? 'border-4 border-gray-300' : 'bg-[#10b981]'}`}
					/>
				</div>
			</div>

			<div className='grid grid-cols-3 gap-6'>
				<div className='col-span-2 space-y-2'>
					<CustomTable
						columns={cashMovementsColumns}
						dataSource={isLoading ? [] : data?.movements}
						isLoading={isLoading}
					/>
				</div>

				{data ? (
					<div className='space-y-5 p-4'>
						{data?.closedAt === null && (
							<div className='space-y-2'>
								<h2 className='font-bold'>
									Balance:{' '}
									{isLoading ? (
										<Skeleton.Button
											active
											style={{
												width: 100,
												height: 20,
												outline: '1px solid transparent'
											}}
										/>
									) : (
										balance && (
											<span
												className={`${balance > 0 ? 'text-[#10b981]' : 'text-[#E53535]'}`}
											>
												{formatCurrency(balance ?? 0)}
											</span>
										)
									)}
								</h2>

								<h2 className='font-bold'>
									Diferencia acumulada:{' '}
									{isLoading ? (
										<Skeleton.Button
											active
											style={{
												width: 100,
												height: 20,
												outline: '1px solid transparent'
											}}
										/>
									) : (
										accumulatedDifference && (
											<span
												className={`${accumulatedDifference >= 0 ? 'text-[#10b981]' : 'text-[#E53535]'}`}
											>
												{formatCurrency(accumulatedDifference ?? 0)}
											</span>
										)
									)}
								</h2>
							</div>
						)}

						<div className='space-y-2'>
							{data?.openedAt && (
								<>
									<h2 className='font-bold text-[16px] text-[#0D6EFD]'>
										Apertura
									</h2>
									<h2>
										<span className='font-bold'>Fecha y hora:</span>{' '}
										{formatDate(data?.openedAt, true)}
									</h2>
								</>
							)}

							<div className='flex gap-4'>
								{data?.openingAmount && (
									<div>
										<span className='font-bold'>Sistema:</span>{' '}
										{formatCurrency(data?.openingAmount)}
									</div>
								)}

								{data?.declaredOpeningAmount && (
									<div>
										<span className='font-bold'>Declarado:</span>{' '}
										{formatCurrency(data?.declaredOpeningAmount)}
									</div>
								)}

								{data?.openingDifference && (
									<div>
										<span className='font-bold'>Diferencia:</span>{' '}
										<span
											className={`${data?.openingDifference >= 0 ? 'text-[#10b981]' : 'text-[#E53535]'}`}
										>
											{formatCurrency(data?.openingDifference)}
										</span>
									</div>
								)}
							</div>

							{data?.openingComments && (
								<div>
									<span className='font-bold'>Observaciones:</span>
									<p>{data?.openingComments}</p>
								</div>
							)}
						</div>

						{data?.closedAt && (
							<div className='space-y-2'>
								<>
									<h2 className='font-bold text-[16px] text-[#0D6EFD]'>
										Cierre
									</h2>
									<h2>
										<span className='font-bold'>Fecha y hora:</span>{' '}
										{formatDate(data?.closedAt, true)}
									</h2>
								</>

								<div className='flex gap-4'>
									{data?.closingAmount && (
										<div>
											<span className='font-bold'>Sistema:</span>{' '}
											{formatCurrency(data?.closingAmount)}
										</div>
									)}

									{data?.declaredClosingAmount && (
										<div>
											<span className='font-bold'>Declarado:</span>{' '}
											{formatCurrency(data?.declaredClosingAmount)}
										</div>
									)}

									{data?.closingDifference && (
										<div>
											<span className='font-bold'>Diferencia:</span>{' '}
											<span
												className={`${data?.closingDifference >= 0 ? 'text-[#10b981]' : 'text-[#E53535]'}`}
											>
												{formatCurrency(data?.closingDifference)}
											</span>
										</div>
									)}
								</div>

								{data?.closingComments && (
									<div>
										<span className='font-bold'>Observaciones:</span>
										<p>{data?.closingComments}</p>
									</div>
								)}
							</div>
						)}

						<div className='space-y-2'>
							<h2 className='font-bold text-[16px] text-[#eab308]'>Alcancía</h2>

							<div className='flex items-center gap-6'>
								<div>
									<span className='font-bold'>Acumulado:</span>{' '}
									{formatCurrency(data?.piggyBankAmount as number) ?? 0}
								</div>

								{status === CurrentCashSessionStatus.OPEN &&
									!data?.closedAt &&
									data?.piggyBankAmount &&
									data?.piggyBankAmount > 0 && (
										<AddButton
											title='Retiro de la Alcancía'
											modalContent={ModalContent.piggyBankWithdraw}
											componentProps={{ shopId }}
											buttonLabel='Retirar'
											addIcon={false}
											appendIcon={<BiMoneyWithdraw />}
										/>
									)}
							</div>

							<div className='py-2'>
								{data?.piggyBankMovements?.length > 0 &&
									data?.piggyBankMovements?.map(pbm => (
										<div key={pbm?.id} className='flex items-center gap-2'>
											<div className='w-3 h-3 bg-[#eab308] rounded-full' />
											<span>
												{pbm?.type === 'DEPOSIT' ? 'Depósito' : 'Retiro'} por
												valor de{' '}
												<span
													className={`${pbm?.type === 'DEPOSIT' ? 'text-[#10b981]' : 'text-[#E53535]'}`}
												>
													{formatCurrency(pbm.amount)}
												</span>{' '}
												el {formatDate(pbm?.createdDate)}{' '}
											</span>
											{pbm?.comments && (
												<Tooltip title={pbm?.comments}>
													<span>
														<IoInformationCircleOutline size={18} />
													</span>
												</Tooltip>
											)}
										</div>
									))}
							</div>
						</div>
					</div>
				) : (
					<div className='h-full flex items-center justify-center'>
						<h2 className='text-gray-400 font-bold text-[24px] text-center'>
							¡Realiza la apertura de la caja para ver más información!
						</h2>
					</div>
				)}
			</div>
		</div>
	);
};

export default CashFlow;
