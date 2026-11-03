import TabsTableProducts from '@/components/admin/products/TabsTableProducts';
import { ProductsPageParams } from '@/libs/api/product';
import { productCategoryServices } from '@/services/productCategoryServices';

export const dynamic = 'force-dynamic';

interface Props {
	searchParams: ProductsPageParams;
}

const ProducstPage = async ({ searchParams }: Props) => {
	const productCategoriesData =
		await productCategoryServices.getAllProductCategories();

	return (
		<section className='flex flex-col gap-4'>
			<h2 className='text-2xl font-semibold px-4'>Productos</h2>
			<TabsTableProducts
				searchParams={searchParams}
				productCategoriesData={productCategoriesData}
			/>
		</section>
	);
};

export default ProducstPage;
