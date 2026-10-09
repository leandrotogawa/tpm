"use client";

import { useEffect, useState } from "react";
import styles from "../painel.module.css";
import Switch from "./Switch";
import { DIAS_SEMANA } from "@/lib/constants";
import type { ConfigNotificacao, ConfigPagamento, Horario } from "@/lib/types";

export default function ConfigSection({ onToast }: { onToast: (msg: string) => void }) {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [pagamento, setPagamento] = useState<ConfigPagamento | null>(null);
  const [notificacao, setNotificacao] = useState<ConfigNotificacao | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fetch("/api/horarios")
      .then((r) => r.json())
      .then(setHorarios);
    fetch("/api/config-pagamento")
      .then((r) => r.json())
      .then(setPagamento);
    fetch("/api/config-notificacao")
      .then((r) => r.json())
      .then(setNotificacao);
  }, []);

  function updateHorario(diaSemana: number, patch: Partial<Horario>) {
    setHorarios((prev) => prev.map((h) => (h.diaSemana === diaSemana ? { ...h, ...patch } : h)));
  }

  async function salvarTudo() {
    setSalvando(true);
    try {
      await Promise.all([
        fetch("/api/horarios", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(horarios),
        }),
        pagamento &&
          fetch("/api/config-pagamento", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pagamento),
          }),
        notificacao &&
          fetch("/api/config-notificacao", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(notificacao),
          }),
      ]);
      onToast("Configurações salvas ✓");
    } finally {
      setSalvando(false);
    }
  }

  if (!pagamento || !notificacao) return null;

  const horariosOrdenados = [...horarios].sort((a, b) => {
    const order = (d: number) => (d === 0 ? 7 : d);
    return order(a.diaSemana) - order(b.diaSemana);
  });

  return (
    <section>
      <div className={styles.pageIntro}>
        <p>Horários, pagamentos e notificações do estabelecimento.</p>
      </div>

      <div className={styles.card}>
        <h2>Horário de funcionamento</h2>
        <p className={styles.cardSub}>Define quando seu cardápio aparece como &quot;aberto&quot;.</p>
        <div>
          {horariosOrdenados.map((h) => (
            <div key={h.diaSemana} className={styles.hoursRow}>
              <span className={styles.day}>{DIAS_SEMANA[h.diaSemana]}</span>
              <Switch
                checked={h.aberto}
                onChange={(checked) => updateHorario(h.diaSemana, { aberto: checked })}
                label={`Aberto na ${DIAS_SEMANA[h.diaSemana]}`}
              />
              {h.aberto ? (
                <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    type="time"
                    value={h.horaAbre}
                    onChange={(e) => updateHorario(h.diaSemana, { horaAbre: e.target.value })}
                  />
                  <span style={{ opacity: 0.5 }}>às</span>
                  <input
                    type="time"
                    value={h.horaFecha}
                    onChange={(e) => updateHorario(h.diaSemana, { horaFecha: e.target.value })}
                  />
                </span>
              ) : (
                <span className={styles.closedLabel}>Fechado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <h2>Formas de pagamento aceitas</h2>
        <div className={styles.checkRow}>
          <input
            type="checkbox"
            id="pg-pix"
            checked={pagamento.pix}
            onChange={(e) => setPagamento({ ...pagamento, pix: e.target.checked })}
          />
          <label htmlFor="pg-pix">Pix</label>
        </div>
        <div className={styles.checkRow}>
          <input
            type="checkbox"
            id="pg-dinheiro"
            checked={pagamento.dinheiro}
            onChange={(e) => setPagamento({ ...pagamento, dinheiro: e.target.checked })}
          />
          <label htmlFor="pg-dinheiro">Dinheiro</label>
        </div>
        <div className={styles.checkRow}>
          <input
            type="checkbox"
            id="pg-credito"
            checked={pagamento.credito}
            onChange={(e) => setPagamento({ ...pagamento, credito: e.target.checked })}
          />
          <label htmlFor="pg-credito">Cartão de crédito</label>
        </div>
        <div className={styles.checkRow}>
          <input
            type="checkbox"
            id="pg-debito"
            checked={pagamento.debito}
            onChange={(e) => setPagamento({ ...pagamento, debito: e.target.checked })}
          />
          <label htmlFor="pg-debito">Cartão de débito</label>
        </div>
      </div>

      <div className={styles.card}>
        <h2>Notificações</h2>
        <div className={styles.toggleRow}>
          <div className={styles.trowLabel}>
            <b>Novo pedido pelo WhatsApp</b>
            <small>Avisa o número de contato a cada pedido novo</small>
          </div>
          <Switch
            checked={notificacao.novoPedidoWhatsapp}
            onChange={(checked) => setNotificacao({ ...notificacao, novoPedidoWhatsapp: checked })}
          />
        </div>
        <div className={styles.toggleRow}>
          <div className={styles.trowLabel}>
            <b>Som de alerta no painel</b>
            <small>Toca um som quando um pedido chega</small>
          </div>
          <Switch
            checked={notificacao.somAlertaPainel}
            onChange={(checked) => setNotificacao({ ...notificacao, somAlertaPainel: checked })}
          />
        </div>
      </div>

      <button className={styles.btnPrimary} onClick={salvarTudo} disabled={salvando}>
        {salvando ? "Salvando..." : "Salvar configurações"}
      </button>
    </section>
  );
}
