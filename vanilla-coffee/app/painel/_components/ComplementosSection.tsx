"use client";

import { useEffect, useState } from "react";
import styles from "../painel.module.css";
import Modal from "./Modal";
import Switch from "./Switch";
import { brl } from "@/lib/constants";
import type { Complemento } from "@/lib/types";

type FormState = { id?: string; nome: string; aplicaA: string; preco: string };
const EMPTY_FORM: FormState = { nome: "", aplicaA: "", preco: "" };

export default function ComplementosSection({ onToast }: { onToast: (msg: string) => void }) {
  const [complementos, setComplementos] = useState<Complemento[]>([]);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const res = await fetch("/api/complementos");
    setComplementos(await res.json());
  }

  useEffect(() => {
    (async () => {
      await carregar();
    })();
  }, []);

  const filtrados = complementos.filter((c) =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  );

  function abrirNovo() {
    setForm(EMPTY_FORM);
    setModalAberto(true);
  }

  function abrirEdicao(c: Complemento) {
    setForm({ id: c.id, nome: c.nome, aplicaA: c.aplicaA, preco: String(c.preco) });
    setModalAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        aplicaA: form.aplicaA,
        preco: parseFloat(form.preco.replace(",", ".")) || 0,
      };
      const res = form.id
        ? await fetch(`/api/complementos/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/complementos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json();
        onToast(data.error ?? "Erro ao salvar complemento");
        return;
      }
      setModalAberto(false);
      await carregar();
      onToast(form.id ? "Complemento atualizado ✓" : "Complemento criado ✓");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(c: Complemento) {
    await fetch(`/api/complementos/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !c.ativo }),
    });
    await carregar();
  }

  async function excluir(c: Complemento) {
    if (!confirm(`Remover "${c.nome}"?`)) return;
    await fetch(`/api/complementos/${c.id}`, { method: "DELETE" });
    await carregar();
    onToast("Complemento removido");
  }

  return (
    <section>
      <div className={styles.pageIntro}>
        <p>Adicionais que o cliente pode incluir no pedido.</p>
      </div>
      <div className={styles.callout}>
        💡 Ajuste livremente os complementos e valores que a loja realmente oferece.
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar complemento"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button className={styles.btnPrimary} style={{ marginLeft: "auto" }} onClick={abrirNovo}>
          + Novo complemento
        </button>
      </div>

      <div className={styles.card} style={{ padding: "6px 8px" }}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Complemento</th>
                <th>Aplica-se a</th>
                <th>Preço</th>
                <th>Ativo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: "var(--ink)" }}>{c.nome}</td>
                  <td style={{ opacity: 0.7 }}>{c.aplicaA}</td>
                  <td>{brl(c.preco)}</td>
                  <td>
                    <Switch checked={c.ativo} onChange={() => alternarAtivo(c)} label={`Ativar ${c.nome}`} />
                  </td>
                  <td>
                    <button className={styles.btnGhostIcon} aria-label="Editar" onClick={() => abrirEdicao(c)}>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 20l1-4L16 5l3 3L8 19l-4 1z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button className={styles.btnGhostIcon} aria-label="Excluir" onClick={() => excluir(c)}>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", opacity: 0.6, padding: 24 }}>
                    Nenhum complemento encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <Modal title={form.id ? "Editar complemento" : "Novo complemento"} onClose={() => setModalAberto(false)}>
          <form onSubmit={salvar}>
            <div className={styles.field}>
              <label htmlFor="c-nome">Nome *</label>
              <input
                id="c-nome"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="c-aplica">Aplica-se a</label>
              <input
                id="c-aplica"
                placeholder="Ex.: Donuts, Fatias"
                value={form.aplicaA}
                onChange={(e) => setForm({ ...form, aplicaA: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="c-preco">Preço (R$) *</label>
              <input
                id="c-preco"
                required
                inputMode="decimal"
                value={form.preco}
                onChange={(e) => setForm({ ...form, preco: e.target.value })}
              />
            </div>
            <button className={styles.btnPrimary} style={{ width: "100%", marginTop: 8 }} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar complemento"}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
