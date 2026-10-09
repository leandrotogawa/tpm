"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import styles from "./painel.module.css";
import { useToast } from "./_components/useToast";
import PerfilSection from "./_components/PerfilSection";
import PedidosSection from "./_components/PedidosSection";
import ProdutosSection from "./_components/ProdutosSection";
import ComplementosSection from "./_components/ComplementosSection";
import OpcoesSection from "./_components/OpcoesSection";
import EstoqueSection from "./_components/EstoqueSection";
import ConfigSection from "./_components/ConfigSection";

type PageKey =
  | "perfil"
  | "pedidos"
  | "produtos"
  | "complementos"
  | "opcoes"
  | "estoque"
  | "config";

const TITLES: Record<PageKey, string> = {
  perfil: "Perfil",
  pedidos: "Últimos pedidos",
  produtos: "Produtos",
  complementos: "Complementos",
  opcoes: "Opções",
  estoque: "Estoque",
  config: "Configurações",
};

export default function PainelPage() {
  const router = useRouter();
  const [activePage, setActivePage] = useState<PageKey>("perfil");
  const { message, showToast } = useToast();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/painel/login");
    router.refresh();
  }

  return (
    <div className={styles.app}>
      <div className={styles.appLayout}>
        <aside className={styles.sidebar}>
          <div className={styles.brand}>
            <span>Vanilla Coffee</span>
          </div>
          <nav className={styles.sidebarNav}>
            <div className={styles.navGroupLabel}>Empresa</div>
            <NavButton icon={<PerfilIcon />} active={activePage === "perfil"} onClick={() => setActivePage("perfil")}>
              Perfil
            </NavButton>

            <div className={styles.navGroupLabel}>Vendas</div>
            <NavButton icon={<PedidosIcon />} active={activePage === "pedidos"} onClick={() => setActivePage("pedidos")}>
              Gestão de pedidos
            </NavButton>

            <div className={styles.navGroupLabel}>Catálogo</div>
            <NavButton sub active={activePage === "produtos"} onClick={() => setActivePage("produtos")}>
              Produtos
            </NavButton>
            <NavButton sub active={activePage === "complementos"} onClick={() => setActivePage("complementos")}>
              Complementos
            </NavButton>
            <NavButton sub active={activePage === "opcoes"} onClick={() => setActivePage("opcoes")}>
              Opções
            </NavButton>

            <div className={styles.navGroupLabel}>Operação</div>
            <NavButton icon={<EstoqueIcon />} active={activePage === "estoque"} onClick={() => setActivePage("estoque")}>
              Estoque
            </NavButton>
            <NavButton icon={<ConfigIcon />} active={activePage === "config"} onClick={() => setActivePage("config")}>
              Configurações
            </NavButton>
          </nav>
        </aside>

        <div className={styles.main}>
          <header className={styles.topbar}>
            <h1>{TITLES[activePage]}</h1>
            <div className={styles.topbarIcons}>
              <button className={styles.avatar} onClick={handleLogout} title="Sair">
                VC
              </button>
            </div>
          </header>

          <main className={styles.content}>
            {activePage === "perfil" && <PerfilSection onToast={showToast} />}
            {activePage === "pedidos" && <PedidosSection onToast={showToast} />}
            {activePage === "produtos" && <ProdutosSection onToast={showToast} />}
            {activePage === "complementos" && <ComplementosSection onToast={showToast} />}
            {activePage === "opcoes" && <OpcoesSection onToast={showToast} />}
            {activePage === "estoque" && <EstoqueSection />}
            {activePage === "config" && <ConfigSection onToast={showToast} />}
          </main>
        </div>
      </div>

      <div className={`${styles.toast} ${message ? styles.toastShow : ""}`}>{message}</div>
    </div>
  );
}

function NavButton({
  children,
  icon,
  sub,
  active,
  onClick,
}: {
  children: ReactNode;
  icon?: ReactNode;
  sub?: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`${styles.navLink} ${sub ? styles.navLinkSub : ""} ${active ? styles.navLinkActive : ""}`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function PerfilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
      <path d="M4 20c1.6-4 5-6 8-6s6.4 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function PedidosIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16l-1.5 12H5.5L4 7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 7V5a4 4 0 0 1 8 0v2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function EstoqueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-5 9 5-9 5-9-5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M3 9v6l9 5 9-5V9M12 14v6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
function ConfigIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path
        d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2 1.2L10 21h4l.6-2.6c.7-.3 1.4-.7 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
