/* eslint-disable no-unused-vars */

interface Product {
	id: string;
	name: string;
}

interface ProductVariant {
	id: string;
	name: string;
	productId: string;
	vId: string;
	createdBy: string;
	updatedBy: string;
	createdDate: string;
	updatedDate: string;
	deletedDate?: string;
	productName: string;
	productDescription: string;
	categoryProductName: string;
	qrCode: string;
}

type ProductCreationAttr = Pick<
	ProductAttributes,
	'name' | 'description' | 'categoryProductId'
>;

interface ProductCategory {
	id: string;
	name: string;
	cId: string;
	createdBy: string;
	updatedBy: string;
	createdDate: string;
	updatedDate: string;
	deletedDate?: string;
}

interface User {
	id: string;
	email: string;
	permitPartId: string;
	isActive: boolean;
	personId: string;
	createdDate: string;
	updatedDate: string;
	person: {
		id: string;
		fullName: string;
		dni: string;
		gender: string;
		birthDate: string;
		createdDate: string;
		updatedDate: string;
	};
	permitPart: {
		id: string;
		name: string;
		permits: {
			id: string;
			name: string;
			description: null;
			createdDate: string;
			updatedDate: string;
		}[];
	};
}

type DataTable = ProductVariant | ProductCategory | User;

interface UIModalState {
	isOpen: boolean;
	title: string | null;
	content: string | null;
}
interface RootState {
	ui: {
		modal: UIModalState;
	};
	product: {
		products: Product[];
		productVariants: ProductVariant[];
		productCategories: ProductCategory[];
	};
}
