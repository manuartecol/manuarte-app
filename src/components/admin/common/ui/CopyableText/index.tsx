import { Tooltip } from 'antd';
import { useState } from 'react';
import { IoCopyOutline } from 'react-icons/io5';

/**
 * `badge` lo presenta como una etiqueta con ícono, para cuando el texto va
 * metido en una frase y no se adivina que se puede copiar. Sin él se ve como
 * texto normal, que es como lo usan las tablas: ahí la columna ya lo da a
 * entender y una etiqueta en cada fila sería ruido.
 */
const CopyableText = ({
	text,
	badge = false
}: {
	text: string;
	badge?: boolean;
}) => {
	const [tooltip, setTooltip] = useState('Copiar');

	const copyText = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setTooltip('Copiado ✓');
			setTimeout(() => setTooltip('Copiar'), 1500);
		} catch (err) {
			console.error('Error al copiar:', err);
			setTooltip('Error');
			setTimeout(() => setTooltip('Copiar'), 1500);
		}
	};
	return (
		<Tooltip title={tooltip}>
			{badge ? (
				<span
					onClick={copyText}
					className='inline-flex items-center gap-1 px-1.5 rounded border border-gray-300 bg-gray-50 font-mono cursor-pointer transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600'
				>
					{text}
					<IoCopyOutline size={12} />
				</span>
			) : (
				<span
					onClick={copyText}
					style={{
						cursor: 'pointer'
					}}
				>
					{text}
				</span>
			)}
		</Tooltip>
	);
};

export default CopyableText;
