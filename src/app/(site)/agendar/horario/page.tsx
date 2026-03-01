import { redirect } from "next/navigation";

export default async function HorarioPage() {
  // Rota legada — redirecionar para o novo fluxo de checkout
  redirect("/agendar/checkout");
}
