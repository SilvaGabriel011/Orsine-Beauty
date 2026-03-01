/**
 * Layout da area publica do site (grupo de rotas (site))
 *
 * Estrutura de layout com:
 * - Header com navegacao
 * - Conteudo principal (children)
 * - Footer com contato e links
 * - Botao flutuante do WhatsApp
 *
 * Providers:
 * - CartProvider para gerenciar carrinho de compras
 *
 * Aplicado a todas as paginas em /servicos, /portfolio, /agendar, etc.
 */
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import WhatsAppButton from "@/components/shared/WhatsAppButton";
import { CartProvider } from "@/lib/cart-context";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      {/* Container flexivel para layout vertical */}
      <div className="flex min-h-screen flex-col">
        <Header />
        {/* Area de conteudo que cresce para preencher espaco disponivel */}
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppButton />
      </div>
    </CartProvider>
  );
}
