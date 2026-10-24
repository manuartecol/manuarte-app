'use client';
import { useState } from 'react';
import { Button, Layout, Skeleton, theme } from 'antd';
import {
	TbLayoutSidebarLeftCollapseFilled,
	TbLayoutSidebarRightCollapseFilled
} from 'react-icons/tb';
import { PiUserCircle } from 'react-icons/pi';
import { Provider } from 'react-redux';
import { useSession } from 'next-auth/react';
import SidebarMenu from '../../components/admin/common/layout/SidebarMenu';
import CustomModal from '@/components/admin/common/layout/Modal';
import CustomDrawer from '@/components/admin/common/layout/Drawer';
import store from '@/reducers/store';
import { formatToTitleCase } from '@/utils/formats';
import Image from 'next/image';

const { Header, Sider, Content } = Layout;

const AdminLayout = ({
	children
}: Readonly<{
	children: React.ReactNode;
}>) => {
	const [collapsed, setCollapsed] = useState(false);
	const [hide, setHide] = useState(false);
	const { data: session, status } = useSession();

	const {
		token: { colorBgContainer, borderRadiusLG }
	} = theme.useToken();

	return (
		<Provider store={store}>
			{/*
				`height` y no `minHeight`, más `overflow: hidden`: con `minHeight` el
				conjunto podía crecer por encima de la ventana y aparecía una barra de
				scroll en el documento, además de la del contenedor de páginas. Ahora
				el alto total es exactamente la ventana y el único que desplaza es el
				`Content`.
			*/}
			<Layout style={{ height: '100vh', overflow: 'hidden' }}>
				<Sider
					className='p-1'
					trigger={null}
					collapsible
					collapsed={collapsed}
					breakpoint='md'
					onBreakpoint={broken => {
						setCollapsed(broken);
						setHide(broken);
					}}
				>
					<h1 className='text-center p-4 text-2xl text-white font-bold'>
						{collapsed ? (
							'M'
						) : (
							<Image
								src='/logo-manuarte.png'
								className='w-[150px] object-contain mb-6'
								alt='login-image'
								width={466}
								height={230}
								priority
							/>
						)}
					</h1>
					<SidebarMenu session={session} />
				</Sider>
				<Layout>
					<Header
						style={{ padding: 0, background: colorBgContainer, zIndex: 1 }}
						className='flex justify-end md:justify-between drop-shadow-md'
					>
						{!hide ? (
							<Button
								type='text'
								icon={
									collapsed ? (
										<TbLayoutSidebarRightCollapseFilled size={20} />
									) : (
										<TbLayoutSidebarLeftCollapseFilled size={20} />
									)
								}
								onClick={() => setCollapsed(!collapsed)}
								style={{
									fontSize: '16px',
									width: 64,
									height: 64
								}}
							/>
						) : null}
						<Button
							type='text'
							icon={<PiUserCircle size={20} />}
							iconPosition='end'
							style={{
								fontSize: '16px',
								height: 64,
								padding: '0 24px'
							}}
						>
							{/*
								Se mira `status`, no si `session` tiene valor. Con la sesión en
								null (petición fallida, o sin iniciar sesión) el esqueleto se
								quedaba puesto para siempre, porque "cargando" y "sin sesión"
								se veían igual, y solo recargando se arreglaba. Sin sesión no
								se dibuja nada: de redirigir al login se encarga el middleware.
							*/}
							{status === 'loading' ? (
								<Skeleton.Button
									active
									style={{
										width: 200,
										display: 'flex',
										justifyItems: 'center'
									}}
								/>
							) : session ? (
								<div>
									<span className='font-bold me-2'>
										{formatToTitleCase(session?.user?.roleName as string)}:
									</span>{' '}
									{session?.user?.email}
								</div>
							) : null}
						</Button>
					</Header>
					{/*
						`overflowX: 'hidden'` y no `overflow: 'auto'`: el Drawer se monta
						aquí dentro (`getContainer={false}`) y con `position: absolute`,
						así que mientras entra desde la derecha está en `translateX(100%)`,
						fuera de esta caja. Con el eje horizontal en `auto` eso saca un
						scrollbar durante la animación, y al ocupar alto empuja el
						contenido del panel y el botón de cerrar da un salto cuando
						desaparece. Nada ancho depende de este scroll: las tablas usan
						`scroll={{ x: 'max-content' }}` y resuelven el suyo por dentro.
					*/}
					<Content
						style={{
							position: 'relative',
							// Ocupa lo que quede bajo el encabezado, sea cual sea el alto de
							// la ventana. Antes era `89vh`, que sumado a los 64 px del
							// encabezado solo cabía en pantallas de más de 582 px de alto.
							// `minHeight: 0` es lo que permite al hijo flex encoger y
							// desplazar; sin él vuelve a desbordar hacia el documento
							flex: 1,
							minHeight: 0,
							padding: 24,
							background: colorBgContainer,
							borderRadius: borderRadiusLG,
							overflowX: 'hidden',
							overflowY: 'auto'
						}}
					>
						<CustomDrawer />
						{children}
					</Content>
				</Layout>
			</Layout>
			<CustomModal />
		</Provider>
	);
};

export default AdminLayout;
