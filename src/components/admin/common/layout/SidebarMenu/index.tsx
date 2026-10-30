import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Skeleton } from 'antd';
import { Session } from 'next-auth';
import getMenuItems, { allMenuItems } from './getMenuItems';
import { ModalContent } from '@/types/enums';
import { useModalStore } from '@/stores/modalStore';
import { doLogout } from '@/app/actions';
import { useDispatch } from 'react-redux';

const SidebarMenu = ({ session }: { session: Session | null }) => {
	const menuItems = getMenuItems(session as Session);
	const [selectedItems, setSelectedItems] = useState<string[]>([]);
	const { openModal, closeModal } = useModalStore.getState();
	const pathname = usePathname();
	const dispatch = useDispatch();

	useEffect(() => {
		const selectedItem =
			allMenuItems().find(item => {
				return pathname.startsWith(item.path);
			})?.key || '';
		setSelectedItems([selectedItem]);
	}, [pathname]);

	const handleMenuSelect = ({ key }: { key: string }) => {
		if (key !== 'logout') setSelectedItems([key]);
	};

	const handleLogout = async () => {
		try {
			// La invalidación del refresh token en el backend la hace `doLogout`
			// del lado del servidor (`events.signOut` en auth.ts)
			closeModal();
			await doLogout();
			dispatch({ type: 'RESET_APP' });
		} catch (error) {
			console.error(error);
		}
	};

	const handleConfirmLogout = ({ key }: { key: string }) => {
		if (key === 'logout') {
			openModal({
				content: ModalContent.confirm,
				componentProps: {
					confirmTitle: '¿Estás seguro de que quieres cerrar sesión?',
					onConfirm: async () => await handleLogout()
				}
			});
		}
	};

	return session ? (
		<Menu
			className='flex flex-col gap-1'
			theme='dark'
			mode='inline'
			defaultSelectedKeys={session ? ['1'] : []}
			selectedKeys={session ? selectedItems : undefined}
			onSelect={handleMenuSelect}
			items={menuItems}
			onClick={handleConfirmLogout}
		/>
	) : (
		<ul className='flex flex-col gap-1'>
			{Array.from({ length: 10 }).map((_, index) => (
				<li key={index} className='m-1'>
					<Skeleton.Button
						active
						block
						style={{ height: 40, outline: '1px solid transparent' }}
					/>
				</li>
			))}
		</ul>
	);
};

export default SidebarMenu;
