import { ReactNode } from 'react';

interface DrawerLayoutProps {
	children: ReactNode;
	/** Botones de acción. Quedan fijos abajo, fuera del scroll. */
	footer: ReactNode;
}

/**
 * Cuerpo de un panel con los botones de acción siempre a la vista.
 *
 * Antes cada formulario dejaba sus botones al final del contenido, así que con
 * una lista larga (un movimiento de 171 productos, una factura grande) había
 * que bajar hasta el final para guardar, y guardar una factura es la acción
 * más repetida del sistema. Aquí solo desplaza el contenido; el pie va aparte.
 *
 * `h-full` funciona porque el cuerpo del Drawer de antd ya ocupa el alto que
 * queda bajo la cabecera. Con `justify-between` en su lugar, el espacio bajo el
 * botón cambiaba según el contenido. Las clases de overflow no son decorativas:
 *
 * - `overflow-hidden` fuera: el cuerpo del Drawer también es un contenedor con
 *   `overflow: auto`, y sin esto habría dos scrollbars verticales compitiendo.
 * - `overflow-x-hidden` dentro: un `Row` con `gutter` aplica márgenes negativos
 *   a cada lado, que antes caían en el padding del Drawer y aquí desbordarían.
 *   Solo se recorta margen vacío, porque el contenido arranca en el padding de
 *   cada `Col`.
 * - `min-h-0`: sin él el hijo flex no encoge por debajo de su contenido, no
 *   desplaza nunca y empuja el pie fuera del panel.
 *
 * El pie no lleva padding inferior propio: el espacio de debajo lo pone el del
 * cuerpo del Drawer (`DRAWER_STYLES`), que se respeta siempre porque el pie ya
 * no se va con el scroll.
 */
const DrawerLayout = ({ children, footer }: DrawerLayoutProps) => (
	<div className='h-full flex flex-col overflow-hidden'>
		<div className='flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar'>
			{children}
		</div>
		<div className='shrink-0 pt-4 bg-white'>{footer}</div>
	</div>
);

export default DrawerLayout;
