'use server';
import { CredentialsSignin } from 'next-auth';
import { signIn, signOut } from '@/auth';
import { ROUTES } from '@/utils/routes';
import { LoginErrorCode } from '@/types/enums';

type LoginResult = { ok: true } | { ok: false; code: string };

export async function doCredentialLogin(
	values: SubmitLoginDto
): Promise<LoginResult> {
	try {
		await signIn('credentials', {
			email: values.email,
			password: values.password,
			redirect: false
		});

		return { ok: true };
	} catch (err) {
		// El motivo ya quedó en el log de `authorize`
		if (err instanceof CredentialsSignin) return { ok: false, code: err.code };

		console.error(
			`[auth] sign in failed: ${err instanceof Error ? err.message : 'unknown error'}`
		);
		return { ok: false, code: LoginErrorCode.SERVER_ERROR };
	}
}

export async function doLogout() {
	await signOut({ redirectTo: ROUTES.LOGIN });
}
