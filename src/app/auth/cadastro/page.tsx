/**
 * Pagina: Registro / Cadastro de Novo Usuario
 *
 * Pagina para criar nova conta. Exibe form de cadastro com email, senha
 * e dados pessoais. Links para login se ja tiver conta.
 *
 * Renderiza CadastroForm como client component.
 */
import type { Metadata } from "next";
import { CadastroForm } from "./cadastro-form";

export const metadata: Metadata = {
  title: "Criar Conta",
};

export default function CadastroPage() {
  return <CadastroForm />;
}
