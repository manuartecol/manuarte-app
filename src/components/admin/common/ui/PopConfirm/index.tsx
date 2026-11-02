import { Popconfirm, PopconfirmProps } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

// El resto de props de antd pasa tal cual, para los avisos que necesitan
// reaccionar al abrirse o bloquear la confirmación
const PopConfirm = ({
	title,
	onConfirm,
	description,
	children,
	okButtonProps,
	...rest
}: PopconfirmProps) => {
	return (
		<Popconfirm
			title={title}
			description={description}
			onConfirm={onConfirm}
			okText='Sí'
			okButtonProps={{ style: { width: 50 }, ...okButtonProps }}
			cancelText='No'
			cancelButtonProps={{
				style: { width: 50 },
				variant: 'outlined',
				color: 'danger'
			}}
			placement='left'
			icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
			{...rest}
		>
			{children}
		</Popconfirm>
	);
};

export default PopConfirm;
