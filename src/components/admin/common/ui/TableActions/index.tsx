import { Button, MenuProps, Space, Tooltip } from 'antd';
import React from 'react';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import { IoKeyOutline } from 'react-icons/io5';
import { TbCancel } from 'react-icons/tb';
import PopConfirm from '../PopConfirm';
import { ImEye } from 'react-icons/im';
import { MdOutlinePendingActions, MdTimeline } from 'react-icons/md';
import { HiOutlineDocumentAdd } from 'react-icons/hi';
import DropdownMenu from '../DropdownMenu';
import { ModalContent } from '@/types/enums';
import { PiInvoice } from 'react-icons/pi';

interface TableActionsProps {
	record?: Record<string, any>;
	onEdit?: () => void;
	onGenerate?: ({
		title,
		content
	}: {
		title: string;
		content: ModalContent;
	}) => void;
	onShowDetails?: () => void;
	onEditPermissions?: () => void;
	onTracking?: () => void;
	onDelete?: () => void;
	onCancel?: () => void;
	popTitle?: string;
	popDescription?: string;
	isEditable?: boolean;
	isDeletable?: boolean;
}

const TableActions = ({
	record,
	onEdit,
	onGenerate,
	onShowDetails,
	onEditPermissions,
	onTracking,
	onDelete,
	onCancel,
	popTitle,
	popDescription = '¿Estás seguro de que quieres borrar este elemento?',
	isEditable = true,
	isDeletable = true
}: TableActionsProps) => {
	const isCancel = popDescription.includes('anular');

	const dropDownItems: MenuProps['items'] = onGenerate && [
		{
			key: '1',
			label: (
				<Space className='px-2'>
					<Button
						variant='text'
						color='primary'
						onClick={() =>
							onGenerate({
								title: 'Generar Factura',
								content: ModalContent.billings
							})
						}
					>
						Generar Factura <PiInvoice size={18} />
					</Button>
				</Space>
			)
		},
		{
			key: '2',
			label: (
				<Space className='px-2'>
					<Button
						variant='text'
						color='primary'
						onClick={() =>
							onGenerate({
								title: 'Generar Abono',
								content: ModalContent.preOrder
							})
						}
					>
						Pedido | Abono <MdOutlinePendingActions size={18} />
					</Button>
				</Space>
			)
		}
	];

	return (
		<Space size='small'>
			{onEdit ? (
				<Tooltip title={isEditable ? 'Editar' : ''}>
					<Button
						type='text'
						icon={
							<AiOutlineEdit
								size={20}
								color={isEditable ? '#0D6EFD' : '#A0AEC0'}
							/>
						}
						onClick={onEdit}
						disabled={!isEditable}
					/>
				</Tooltip>
			) : null}

			{onGenerate ? (
				<DropdownMenu items={dropDownItems} label=''>
					<Button
						type='text'
						icon={
							<HiOutlineDocumentAdd
								size={20}
								color={isEditable ? '#0D6EFD' : '#A0AEC0'}
							/>
						}
						style={{ cursor: 'default' }}
					/>
				</DropdownMenu>
			) : null}

			{onShowDetails ? (
				<Tooltip title='Mostrar detalles'>
					<Button
						type='text'
						icon={<ImEye size={20} color='#0D6EFD' />}
						onClick={onShowDetails}
					/>
				</Tooltip>
			) : null}

			{onEditPermissions ? (
				<Tooltip title={isEditable ? 'Editar permisos' : ''}>
					<Button
						type='text'
						icon={
							<IoKeyOutline
								size={20}
								color={isEditable ? '#10b981' : '#d1fae5'}
							/>
						}
						onClick={onEditPermissions}
						disabled={!isEditable}
					/>
				</Tooltip>
			) : null}

			{onTracking ? (
				<Tooltip title='Historial'>
					<Button
						type='text'
						icon={<MdTimeline size={20} color='#eab308' />}
						onClick={onTracking}
					/>
				</Tooltip>
			) : null}

			{onDelete ? (
				<PopConfirm
					title={popTitle}
					description={popDescription}
					onConfirm={onDelete}
				>
					<Tooltip
						title={
							(isDeletable || !isCancel) && (!record || record?.quantity === 0)
								? 'Eliminar'
								: 'No puedes eliminar un item con cantidad en stock'
						}
					>
						<Button
							type='text'
							icon={
								<AiOutlineDelete
									size={20}
									color={
										(isDeletable || !isCancel) &&
										(!record || record?.quantity === 0)
											? '#E53535'
											: '#FCBABA'
									}
								/>
							}
							disabled={record && record?.quantity > 0}
						/>
					</Tooltip>
				</PopConfirm>
			) : null}

			{onCancel ? (
				<PopConfirm
					title={popTitle}
					description={popDescription}
					onConfirm={onCancel}
				>
					<Tooltip title={isDeletable ? 'Anular' : ''}>
						<Button
							type='text'
							icon={
								<TbCancel
									size={20}
									color={isDeletable ? '#E53535' : '#FCBABA'}
								/>
							}
						/>
					</Tooltip>
				</PopConfirm>
			) : null}
		</Space>
	);
};

export default TableActions;
