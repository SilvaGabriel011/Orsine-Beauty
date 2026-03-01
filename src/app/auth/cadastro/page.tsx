import type { Metadata } from "next";
import { CadastroForm } from "./cadastro-form";

export const metadata: Metadata = {
  title: "Criar Conta",
};

export default function CadastroPage() {
  return <CadastroForm />;
}
