import { ReactNode } from 'react';
import { Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface CustomTagProps {
	label: ReactNode;
	isFixed: boolean;
	onClose: (event?: React.MouseEvent<HTMLElement, MouseEvent>) => void;
}

const CustomTag = ({ label, isFixed, onClose }: CustomTagProps) => {
	return (
		<span
			className='ant-select-selection-item'
			style={{ userSelect: 'none', marginRight: 3 }}
		>
			<span className='ant-select-selection-item-content'>{label}</span>
			{isFixed ? (
				<Tooltip title='La bodega principal no se puede quitar'>
					<span
						className='ant-select-selection-item-remove'
						style={{ cursor: 'not-allowed', opacity: 0.45 }}
					>
						<CloseOutlined />
					</span>
				</Tooltip>
			) : (
				<Tooltip title={`Quitar ${label}`}>
					{/*
					 * Un icono y no el carácter '×'. Ant estila
					 * `.ant-select-selection-item-remove` como inline-flex con el
					 * line-height de su icono de 10px; metiéndole un glifo de texto a
					 * 24px, la línea base del '×' caía más abajo que la de la etiqueta y
					 * se veía pegado al borde inferior del tag.
					 *
					 * Fondo al pasar por encima y cursor de mano porque quitar una
					 * bodega desactiva ahí la presentación: una aspa pequeña y gris se
					 * ignora, y el usuario no descubre la acción
					 */}
					<span
						className='ant-select-selection-item-remove rounded-sm px-1 transition-colors hover:bg-red-100 hover:text-red-600'
						style={{ fontSize: 13, lineHeight: 1, cursor: 'pointer' }}
						onMouseDown={e => {
							e.preventDefault();
							e.stopPropagation();
						}}
						onClick={onClose}
					>
						<CloseOutlined />
					</span>
				</Tooltip>
			)}
		</span>
	);
};

export default CustomTag;
