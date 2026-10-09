"use client";

import { useEffect, useState } from "react";
import styles from "../painel.module.css";
import type { Produto } from "@/lib/types";
import { stockStatus, STOCK_STATUS_LABEL, STOCK_STATUS_BADGE_CLASS } from "@/lib/stock-status";

const BADGE_CLASS_MAP: Record<string, string> = {
  "badge-green": "badgeGreen",
  "badge-amber": "badgeAmber",
  "badge-red": "badgeRed",
};

export default function EstoqueSection() {
  const [produtos, setProdutos] = useState<Produto[]>([]);

  async function carregar() {
    const res = await fetch("/api/estoque");
    setProdutos(await res.json());
  }

  useEffect(() => {
    (async () => {
      await carregar();
    })();
  }, []);

  async function ajustar(produtoId: string, delta: number) {
    setProdutos((prev) =>
      prev.map((p) =>
        p.id === produtoId && p.estoque
          ? { ...p, estoque: { ...p.estoque, quantidade: Math.max(0, p.estoque.quantidade + delta) } }
          : p
      )
    );
    await fetch(`/api/estoque/${produtoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ delta }),
    });
  }

  return (
    <section>
      <div className={styles.pageIntro}>
        <p>Controle de unidades disponíveis por sabor.</p>
      </div>
      <div className={styles.callout}>
        📋 O estoque desce automaticamente a cada pedido feito no cardápio digital.
      </div>

      <div className={styles.card} style={{ padding: "6px 8px" }}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Estoque atual</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((p) => {
                const status = stockStatus(p.controlaEstoque, p.estoque?.quantidade);
                const badgeClass = BADGE_CLASS_MAP[STOCK_STATUS_BADGE_CLASS[status]];
                return (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "var(--ink)" }}>{p.nome}</td>
                    <td>{p.categoria}</td>
                    <td>
                      {p.controlaEstoque ? (
                        <div className={styles.stepper}>
                          <button onClick={() => ajustar(p.id, -1)}>−</button>
                          <span>{p.estoque?.quantidade ?? 0}</span>
                          <button onClick={() => ajustar(p.id, 1)}>+</button>
                        </div>
                      ) : (
                        <span style={{ opacity: 0.45 }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.badge} ${styles[badgeClass]}`}>
                        <span className={styles.badgeDot} />
                        {STOCK_STATUS_LABEL[status]}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
