import ProductForm from '@/components/admin/products/ProductForm';
import ProductVariantForm from '@/components/admin/products/ProductVariantForm';
import ProductCategoryForm from '@/components/admin/products/ProductCategoryForm';
import StaffForm from '@/components/admin/users/StaffForm';
import { ReactNode } from 'react';
import { ModalContent } from '@/types/enums';
import PermissionsForm from '@/components/admin/users/PermissionsForm';
import CustomersForm from '@/components/admin/users/CustomersForm';
import ConfirmLogout from '@/components/admin/common/layout/SidebarMenu/ConfirmLogout';
import BillingModalForm from '@/components/admin/common/input-data/BillingModalForm';
import StockItemForm from '@/components/admin/stock/StockItemForm';

const useModal = () => {
	const MODAL_CONTENT: Record<ModalContent, ReactNode> = {
		[ModalContent.products]: <ProductForm />,
		[ModalContent.productVariants]: <ProductVariantForm />,
		[ModalContent.productCategories]: <ProductCategoryForm />,
		[ModalContent.staff]: <StaffForm />,
		[ModalContent.permissions]: <PermissionsForm />,
		[ModalContent.customers]: <CustomersForm />,
		[ModalContent.billings]: <BillingModalForm />,
		[ModalContent.stockItems]: <StockItemForm />,
		[ModalContent.logout]: <ConfirmLogout />
	};

	return { MODAL_CONTENT };
};

export default useModal;
