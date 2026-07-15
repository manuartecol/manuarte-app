'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Empty, Skeleton } from 'antd';
import FlagCol from '../Flags/FlagCol';
import FlagEcu from '../Flags/FlagEcu';

type TopSalesProduct = {
	productVariantId: string;
	productName: string;
	totalQuantity: number;
};

type TopSales = {
	topCOP: TopSalesProduct[];
	topUSD: TopSalesProduct[];
	month: string;
};

interface TopSalesChartProps {
	data: TopSales;
	loading?: boolean;
}

type Rgb = { r: number; g: number; b: number };

const hexToRgb = (hex: string): Rgb => {
	const value = parseInt(hex.replace('#', ''), 16);
	return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
};

const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => ({
	r: a.r + (b.r - a.r) * t,
	g: a.g + (b.g - a.g) * t,
	b: a.b + (b.b - a.b) * t
});

const rgbToHex = ({ r, g, b }: Rgb) =>
	`#${[r, g, b]
		.map(channel => Math.round(channel).toString(16).padStart(2, '0'))
		.join('')}`;

// Rampa secuencial de un solo tono: la porción más vendida queda más oscura,
// la menos vendida más clara — evita necesitar un color categórico distinto
// por cada producto.
const getSequentialShades = (baseHex: string, count: number) => {
	const base = hexToRgb(baseHex);
	const darkest = mixRgb(base, { r: 0, g: 0, b: 0 }, 0.35);
	const lightest = mixRgb(base, { r: 255, g: 255, b: 255 }, 0.8);

	return Array.from({ length: count }, (_, i) => {
		const t = count <= 1 ? 0 : i / (count - 1);
		return rgbToHex(mixRgb(darkest, lightest, t));
	});
};

const TopSellerHeading = ({ product }: { product: TopSalesProduct }) => (
	<div className='w-full px-2 text-center' title={product.productName}>
		<p className='text-xs font-semibold truncate'>{product.productName}</p>
		<p className='text-[11px] text-gray-500'>
			<span className='text-lg'>🔝</span> {product.totalQuantity} unds vendidas
		</p>
	</div>
);

const TopSalesCharts = ({ data, loading = false }: TopSalesChartProps) => {
	if (loading) {
		return (
			<div className='flex max-lg:flex-wrap gap-8 p-24'>
				<div className='w-full flex justify-center items-center gap-64'>
					<Skeleton.Node
						active
						style={{ width: 200, height: 200, borderRadius: '50%' }}
					>
						<div />
					</Skeleton.Node>
					<Skeleton.Node
						active
						style={{ width: 200, height: 200, borderRadius: '50%' }}
					>
						<div />
					</Skeleton.Node>
				</div>
			</div>
		);
	}

	const copShades = getSequentialShades('#0e7490', data?.topCOP?.length || 0);
	const usdShades = getSequentialShades('#eab308', data?.topUSD?.length || 0);

	return (
		<div className='flex max-lg:flex-wrap gap-8 p-8'>
			{data?.topCOP?.length > 0 || data?.topUSD?.length > 0 ? (
				<>
					{/* Colombia */}
					{data.topCOP.length > 0 && (
						<ResponsiveContainer
							width='100%'
							height={370}
							className='flex flex-col gap-2 items-center p-4'
						>
							<>
								<FlagCol />
								<TopSellerHeading product={data.topCOP[0]} />
								<PieChart width={400} height={250}>
									<Tooltip formatter={(value: number) => `${value} unds`} />
									<Pie
										data={data.topCOP}
										dataKey='totalQuantity'
										nameKey='productName'
										cx='50%'
										cy='50%'
										innerRadius={10}
										paddingAngle={1.5}
										stroke='#fff'
										strokeWidth={2}
									>
										{data.topCOP.map((entry, index) => (
											<Cell
												key={entry.productVariantId}
												fill={copShades[index]}
											/>
										))}
									</Pie>
								</PieChart>
							</>
						</ResponsiveContainer>
					)}

					{/* Ecuador */}
					{data.topUSD.length > 0 && (
						<ResponsiveContainer
							width='100%'
							height={370}
							className='flex flex-col gap-2 items-center p-4'
						>
							<>
								<FlagEcu />
								<TopSellerHeading product={data.topUSD[0]} />
								<PieChart width={400} height={250}>
									<Tooltip formatter={(value: number) => `${value} unds`} />
									<Pie
										data={data.topUSD}
										dataKey='totalQuantity'
										nameKey='productName'
										cx='50%'
										cy='50%'
										innerRadius={10}
										paddingAngle={1.5}
										stroke='#fff'
										strokeWidth={2}
									>
										{data.topUSD.map((entry, index) => (
											<Cell
												key={entry.productVariantId}
												fill={usdShades[index]}
											/>
										))}
									</Pie>
								</PieChart>
							</>
						</ResponsiveContainer>
					)}
				</>
			) : (
				<Empty
					image={Empty.PRESENTED_IMAGE_DEFAULT}
					description={<p>{`No hay datos para mostrar`}</p>}
					className='m-auto grow'
				/>
			)}
		</div>
	);
};

export default TopSalesCharts;
