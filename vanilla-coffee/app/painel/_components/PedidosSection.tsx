"use client";

import { useEffect, useState } from "react";
import styles from "../painel.module.css";
import { brl } from "@/lib/constants";
import type { Pedido } from "@/lib/types";

const STATUS_STYLE: Record<string, { badge: string; bg: string; color: string }> = {
  Concluído: { badge: "badgeGreen", bg: "var(--green-bg)", color: "var(--green)" },
  "Em preparo": { badge: "badgeAmber", bg: "var(--amber-bg)", color: "var(--amber)" },
  Cancelado: { badge: "badgeRed", bg: "var(--red-bg)", color: "var(--red)" },
};

function tempoAtras(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "agora mesmo";
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rem = min % 60;
  return rem > 0 ? `${h} h ${rem} min` : `${h} h`;
}

export default function PedidosSection({ onToast }: { onToast: (msg: string) => void }) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [busca, setBusca] = useState("");
  const [ativoId, setAtivoId] = useState<string | null>(null);

  async function carregar(q?: string) {
    const url = q ? `/api/pedidos?q=${encodeURIComponent(q)}` : "/api/pedidos";
    const res = await fetch(url);
    const data: Pedido[] = await res.json();
    setPedidos(data);
    if (data.length > 0 && !data.find((p) => p.id === ativoId)) {
      setAtivoId(data[0].id);
    }
    if (data.length === 0) setAtivoId(null);
  }

  useEffect(() => {
    (async () => {
      await carregar();
    })();
    const interval = setInterval(() => carregar(busca), 15000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => carregar(busca), 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  const pedido = pedidos.find((p) => p.id === ativoId) ?? null;

  async function mudarStatus(status: string) {
    if (!pedido) return;
    const res = await fetch(`/api/pedidos/${pedido.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await carregar(busca);
      onToast(
        status === "Concluído"
          ? "Pedido marcado como concluído"
          : status === "Cancelado"
            ? "Pedido cancelado"
            : "Pedido reaberto"
      );
    }
  }

  return (
    <section>
      <div className={styles.pageIntro}>
        <p>Acompanhe os pedidos recebidos pelo cardápio digital.</p>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Pesquise por cliente ou número do pedido"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      <div className={styles.ordersLayout}>
        <div className={styles.card} style={{ padding: 10 }}>
          <div className={styles.orderList}>
            {pedidos.length === 0 && (
              <p style={{ textAlign: "center", opacity: 0.6, padding: "20px 0", fontSize: "0.85rem" }}>
                Nenhum pedido encontrado.
              </p>
            )}
            {pedidos.map((p) => {
              const st = STATUS_STYLE[p.status];
              return (
                <div
                  key={p.id}
                  className={`${styles.orderItem} ${p.id === ativoId ? styles.orderItemActive : ""}`}
                  onClick={() => setAtivoId(p.id)}
                >
                  <div className={styles.oiLeft}>
                    <b>
                      {p.cliente} #{p.numero}
                    </b>
                    <small>
                      {tempoAtras(p.criadoEm)} • {p.tipoConsumo}
                    </small>
                  </div>
                  <div className={styles.oiRight}>
                    <span className={styles.val}>{brl(p.total)}</span>
                    <span className={`${styles.badge} ${styles[st.badge]}`}>
                      <span className={styles.badgeDot} />
                      {p.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.card} id="orderDetail">
          {pedido ? (
            <>
              <div className={styles.orderDetailHead}>
                <div>
                  <h3>Pedido #{pedido.numero}</h3>
                  <small>
                    {pedido.cliente} • {tempoAtras(pedido.criadoEm)} atrás
                  </small>
                </div>
              </div>
              <div
                className={styles.statusBanner}
                style={{ background: STATUS_STYLE[pedido.status].bg, color: STATUS_STYLE[pedido.status].color }}
              >
                {pedido.status} • {tempoAtras(pedido.criadoEm)} atrás
              </div>
              <div className={styles.tagsRow}>
                <div className={styles.tagBlock}>
                  <b>Tipo</b>
                  {pedido.tipoConsumo}
                </div>
                <div className={styles.tagBlock}>
                  <b>Pagamento</b>
                  {pedido.formaPagamento}
                </div>
                <div className={styles.tagBlock}>
                  <b>Canal</b>
                  {pedido.canal}
                </div>
              </div>
              <div className={styles.tagBlock} style={{ marginBottom: 14 }}>
                <b>Cliente</b>
                {pedido.cliente}
              </div>
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                {pedido.itens.map((it) => (
                  <div key={it.id} className={styles.itemRow}>
                    <span>
                      <span className={styles.qty}>{it.quantidade}x</span>
                      {it.nomeSnapshot}
                    </span>
                    <span>{brl(it.precoSnapshot * it.quantidade)}</span>
                  </div>
                ))}
                <div className={styles.totalsRow}>
                  <span>Total</span>
                  <span>{brl(pedido.total)}</span>
                </div>
              </div>
              <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
                {pedido.status === "Concluído" && (
                  <button className={styles.btnSecondary} onClick={() => mudarStatus("Em preparo")}>
                    Reabrir pedido
                  </button>
                )}
                {pedido.status === "Em preparo" && (
                  <>
                    <button className={styles.btnPrimary} onClick={() => mudarStatus("Concluído")}>
                      Marcar como concluído
                    </button>
                    <button className={styles.btnSecondary} onClick={() => mudarStatus("Cancelado")}>
                      Cancelar
                    </button>
                  </>
                )}
                {pedido.status === "Cancelado" && (
                  <button className={styles.btnSecondary} onClick={() => mudarStatus("Em preparo")}>
                    Reabrir pedido
                  </button>
                )}
              </div>
            </>
          ) : (
            <p style={{ textAlign: "center", opacity: 0.6, padding: "40px 0" }}>
              Selecione um pedido para ver os detalhes.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
