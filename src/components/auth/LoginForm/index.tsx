'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Form, Input, notification } from 'antd';
import { MdEmail } from 'react-icons/md';
import { RiLockPasswordFill } from 'react-icons/ri';
import { doCredentialLogin } from '@/app/actions';
import { getSession } from 'next-auth/react';
import { AUTH_RULES } from '@/utils/auth';
import { ROUTES } from '@/utils/routes';
import { LoginErrorCode } from '@/types/enums';

// Un `null` de `authorize` llega como el `code` por defecto, 'credentials', y
// cae en el mensaje de credenciales inválidas
const LOGIN_ERROR_MESSAGES: Record<string, string> = {
	[LoginErrorCode.INVALID_CREDENTIALS]:
		'Correo o contraseña incorrectos. Inténtalo de nuevo!',
	[LoginErrorCode.SERVER_UNAVAILABLE]:
		'No se pudo conectar con el servidor. Inténtalo en unos minutos!',
	[LoginErrorCode.SERVER_ERROR]:
		'Ocurrió un error al iniciar sesión. Inténtalo más tarde!'
};

const LoginForm = () => {
	const [isLoading, setIsLoading] = useState(false);
	const [form] = Form.useForm();
	const router = useRouter();

	const handleSubmit = async (values: SubmitLoginDto) => {
		try {
			setIsLoading(true);
			const res = await doCredentialLogin({
				email: values.email,
				password: values.password
			});

			if (res.ok) {
				const session = await getSession();

				const roleName = session?.user?.roleName as string;
				const shop = session?.user?.shop as string;
				const shopId = session?.user?.shopId as string;

				const redirectTo =
					AUTH_RULES(shop, shopId)[roleName].defaultPath ?? ROUTES.LOGIN;

				router.push(redirectTo);
				notification.success({ message: 'Bienvenido!' });
				return;
			}

			notification.error({
				message:
					LOGIN_ERROR_MESSAGES[res.code] ??
					LOGIN_ERROR_MESSAGES[LoginErrorCode.INVALID_CREDENTIALS]
			});
		} catch (error) {
			console.error(error);
			notification.error({
				message: 'Ocurrió un error inesperado. Inténtalo más tarde!'
			});
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className='m-auto max-w-[400px] w-full px-8 py-4 rounded-lg max-md:shadow-2xl'>
			<Form
				form={form}
				name='login'
				className='flex flex-col gap-3'
				onFinish={values => handleSubmit(values)}
			>
				<div className='mb-8 text-center'>
					<h3 className='mb-2 text-gray-800 text-3xl font-bold'>
						Inicio de Sesión
					</h3>
					<p>Ingresa tu email y contraseña:</p>
				</div>

				<Form.Item
					name='email'
					rules={[{ required: true, message: 'Por favor ingresa tu email!' }]}
				>
					<Input
						size='large'
						prefix={<MdEmail size={20} />}
						placeholder='Email'
					/>
				</Form.Item>
				<Form.Item
					name='password'
					rules={[
						{ required: true, message: 'Por favor ingresa tu contraseña!' }
					]}
				>
					<Input.Password
						size='large'
						prefix={<RiLockPasswordFill size={20} />}
						type='password'
						placeholder='Password'
					/>
				</Form.Item>

				<Form.Item>
					<Button
						block
						type='primary'
						size='large'
						htmlType='submit'
						loading={isLoading}
					>
						INICIAR SESIÓN
					</Button>
				</Form.Item>
			</Form>
		</div>
	);
};

export default LoginForm;
