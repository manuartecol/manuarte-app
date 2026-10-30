import { useDrawerStore } from '@/stores/drawerStore';
import { formatCurrency } from '@/utils/formats';
import { Button, Col, Row } from 'antd';
import DrawerLayout from '../../common/layout/DrawerLayout';

const RecentActivityDetails = () => {
	const { dataToHandle, closeDrawer } = useDrawerStore.getState();
	const { items } = dataToHandle ?? {};

	const itemsCount = items?.reduce((acc: any, item: any) => {
		return acc + Number(item?.quantity);
	}, 0);

	const total = items?.reduce((acc: any, item: any) => {
		return acc + Number(item?.totalPrice);
	}, 0);

	return (
		<DrawerLayout
			footer={
				<div className='flex justify-end'>
					<Button
						color='danger'
						variant='outlined'
						className='w-[90%] max-w-[200px]'
						style={{ fontWeight: 600 }}
						htmlType='button'
						onClick={closeDrawer}
					>
						CERRAR
					</Button>
				</div>
			}
		>
			<Row gutter={32} className='items-center'>
				<Col span={12}>
					<div className='flex flex-col flex-1 gap-2 mb-6'>
						<span>Cliente</span>
						<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
							{dataToHandle?.fullName}
						</span>
					</div>
				</Col>
				<Col span={12}>
					<div className='flex flex-col flex-1 gap-2 mb-6'>
						<span>Número de Documento</span>
						<span className='px-3 py-1 bg-[#e5e5e5] rounded-md'>
							{dataToHandle?.dni}
						</span>
					</div>
				</Col>
				{items?.length > 0 ? (
					<>
						<Col span={24}>
							<p className='mb-6'># Total de Items: {itemsCount}</p>
						</Col>

						{items.map((item: BillingItem | QuoteItem, index: number) => (
							<Col key={item?.id} span={24}>
								<div className='flex justify-between'>
									<div className='flex flex-col flex-1 gap-1 '>
										{index === 0 ? <span>Nombre</span> : null}
										<span className='flex items-center h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
											{item?.name}
										</span>
									</div>
									<div className='flex flex-col gap-1 w-[110px]'>
										{index === 0 ? (
											<span className='text-center'>Cantidad</span>
										) : null}
										<span className='flex items-center justify-center h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
											{item?.quantity}
										</span>
									</div>
									<div className='flex flex-col gap-1 w-[110px]'>
										{index === 0 ? (
											<span className='text-end'>Precio Total</span>
										) : null}
										<span className='flex items-center justify-end h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
											{formatCurrency(item?.totalPrice)}
										</span>
									</div>
								</div>
							</Col>
						))}
						<Col span={24}>
							<div className='flex justify-between'>
								<div className='flex flex-col flex-1 gap-1 '>
									<span className='flex items-center justify-end h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
										Subtotal:
									</span>
								</div>
								<div className='flex flex-col gap-1 w-[110px]'>
									<span className='flex items-center justify-end h-[50px] px-3 py-1 font-bold border border-[#e5e5e5] rounded'>
										{formatCurrency(total)}
									</span>
								</div>
							</div>
						</Col>
						<Col span={24}>
							<div className='flex justify-between'>
								<div className='flex flex-col flex-1 gap-1 '>
									<span className='flex items-center justify-end h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
										Flete:
									</span>
								</div>
								<div className='flex flex-col gap-1 w-[110px]'>
									<span className='flex items-center justify-end h-[50px] px-3 py-1 font-bold border border-[#e5e5e5] rounded'>
										{formatCurrency(dataToHandle?.shipping)}
									</span>
								</div>
							</div>
						</Col>
						<Col span={24}>
							<div className='flex justify-between'>
								<div className='flex flex-col flex-1 gap-1 '>
									<span className='flex items-center justify-end h-[50px] px-3 py-1 border border-[#e5e5e5] rounded'>
										Total:
									</span>
								</div>
								<div className='flex flex-col gap-1 w-[110px]'>
									<span className='flex items-center justify-end h-[50px] px-3 py-1 font-bold border border-[#e5e5e5] rounded'>
										{formatCurrency(total + dataToHandle?.shipping)}
									</span>
								</div>
							</div>
						</Col>
					</>
				) : null}
			</Row>
		</DrawerLayout>
	);
};

export default RecentActivityDetails;
