import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Checkbox, CheckboxProps, Drawer } from 'antd';
import SearchCustomer from '@/components/admin/common/input-data/SearchCustomer';
import useDrawer from '@/hooks/useDrawer';
import { DrawerContent } from '@/types/enums';
import { ROUTES } from '@/utils/routes';
import { useMediaQuery } from 'react-responsive';
import { useDrawerStore } from '@/stores/drawerStore';

/**
 * Sin `marginTop`. El root es absoluto y ocupa el 100% de la caja de padding
 * del `Content`, que es su bloque contenedor, así que cualquier margen superior
 * lo hacía desbordar por esa misma cantidad. Con 1 px ya aparecía una barra de
 * scroll mínima en el `Content`, y al arrastrarla se movía también el contenido
 * de detrás del panel.
 */
const ROOT_STYLE = { position: 'absolute' } as const;

/**
 * El padding inferior del cuerpo es el espacio que queda debajo de los botones
 * de acción de cada panel. Con los 24 px por defecto quedaba demasiado aire.
 */
const DRAWER_STYLES = { body: { paddingBottom: 12 } } as const;

const CustomDrawer = () => {
	const { isOpen, title, content, noCustomer, updateDrawer, closeDrawer } =
		useDrawerStore();
	const { DRAWER_CONTENT } = useDrawer();
	const pathname = usePathname();
	const [checked, setChecked] = useState(false);
	const isMedium = useMediaQuery({ query: '(max-width: 1024px)' });

	useEffect(() => {
		closeDrawer();
	}, [pathname]);

	const drawerContent = DRAWER_CONTENT[content as DrawerContent] ?? null;

	const onChange: CheckboxProps['onChange'] = e => {
		setChecked(e.target.checked);
		updateDrawer({ noCustomer: e.target.checked });
	};

	useEffect(() => {
		setChecked(noCustomer as boolean);
	}, [noCustomer]);

	const smallDrawer =
		pathname === ROUTES.TRANSACTIONS ||
		pathname.includes('historial') ||
		pathname.includes('clientes');

	const showExtra =
		content === DrawerContent.quotes ||
		content === DrawerContent.billings ||
		content === DrawerContent.preOrder;

	return (
		<Drawer
			title={title}
			onClose={closeDrawer}
			keyboard={false}
			maskClosable={false}
			open={isOpen}
			getContainer={false}
			rootStyle={ROOT_STYLE}
			styles={DRAWER_STYLES}
			width={smallDrawer && !isMedium ? '50%' : '100%'}
			height='100%'
			placement={smallDrawer ? 'right' : 'top'}
			extra={
				!showExtra ? null : (
					<div className='flex gap-2 items-center'>
						{!noCustomer ? <SearchCustomer /> : null}
						<Checkbox checked={checked} onChange={onChange}>
							Consumidor final
						</Checkbox>
					</div>
				)
			}
		>
			{drawerContent}
		</Drawer>
	);
};

export default CustomDrawer;
