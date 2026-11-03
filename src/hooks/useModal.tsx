import ProductForm from '@/components/admin/products/ProductForm';
import ProductVariantForm from '@/components/admin/products/ProductVariantForm';
import ProductVariantEditForm from '@/components/admin/products/ProductVariantEditForm';
import ProductCategoryForm from '@/components/admin/products/ProductCategoryForm';
import StaffForm from '@/components/admin/users/StaffForm';
import PermissionsForm from '@/components/admin/users/PermissionsForm';
import CustomersForm from '@/components/admin/users/CustomersForm';
import BillingModalForm from '@/components/admin/common/input-data/BillingModalForm';
import StockItemForm from '@/components/admin/stock/StockItemForm';
import CashMovementForm from '@/components/admin/financial-flow/CashMovementForm.tsx';
import ConfirmOperation, {
	ConfirmOperationProps
} from '@/components/admin/common/ui/ConfirmOperation';
import { useModalStore } from '@/stores/modalStore';
import { ReactNode } from 'react';
import { ModalContent } from '@/types/enums';
import CashSessionForm from '@/components/admin/financial-flow/CashSessionForm';
import PiggyBankWithdrawForm from '@/components/admin/financial-flow/PiggyBankWithdrawForm';
import BalanceForm from '@/components/admin/users/BalanceForm';

const useModal = () => {
	const { componentProps } = useModalStore();

	const MODAL_CONTENT: Record<ModalContent, ReactNode> = {
		[ModalContent.products]: <ProductForm />,
		[ModalContent.productVariants]: <ProductVariantForm />,
		[ModalContent.productVariantEdit]: <ProductVariantEditForm />,
		[ModalContent.productCategories]: <ProductCategoryForm />,
		[ModalContent.staff]: <StaffForm />,
		[ModalContent.permissions]: <PermissionsForm />,
		[ModalContent.customers]: <CustomersForm />,
		[ModalContent.billings]: <BillingModalForm />,
		[ModalContent.preOrder]: <BillingModalForm />,
		[ModalContent.stockItems]: <StockItemForm />,
		[ModalContent.openCashSession]: (
			<CashSessionForm {...(componentProps as { shopId: string })} />
		),
		[ModalContent.closeCashSession]: (
			<CashSessionForm {...(componentProps as { shopId: string })} />
		),
		[ModalContent.cashIncome]: (
			<CashMovementForm {...(componentProps as { shopId: string })} />
		),
		[ModalContent.cashExpense]: (
			<CashMovementForm {...(componentProps as { shopId: string })} />
		),
		[ModalContent.piggyBankWithdraw]: (
			<PiggyBankWithdrawForm {...(componentProps as { shopId: string })} />
		),
		[ModalContent.confirm]: componentProps ? (
			<ConfirmOperation {...(componentProps as ConfirmOperationProps)} />
		) : null,
		[ModalContent.balance]: <BalanceForm />
	};

	return { MODAL_CONTENT };
};

export default useModal;
