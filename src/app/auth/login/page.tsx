/**
 * Pagina: Login
 *
 * Pagina de autenticacao para usuarios existentes. Exibe form de login
 * com email e senha, e links para cadastro ou recuperacao de senha.
 *
 * Renderiza LoginForm como client component envolvido em Suspense.
 */
import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
