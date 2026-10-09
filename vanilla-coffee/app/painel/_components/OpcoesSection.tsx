"use client";

import { useEffect, useState } from "react";
import styles from "../painel.module.css";
import Modal from "./Modal";
import type { GrupoOpcao } from "@/lib/types";

type FormState = { id?: string; nome: string; aplicaA: string; opcoes: string };
const EMPTY_FORM: FormState = { nome: "", aplicaA: "", opcoes: "" };

export default function OpcoesSection({ onToast }: { onToast: (msg: string) => void }) {
  const [grupos, setGrupos] = useState<GrupoOpcao[]>([]);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    const res = await fetch("/api/opcoes");
    setGrupos(await res.json());
  }

  useEffect(() => {
    (async () => {
      await carregar();
    })();
  }, []);

  function abrirNovo() {
    setForm(EMPTY_FORM);
    setModalAberto(true);
  }

  function abrirEdicao(g: GrupoOpcao) {
    setForm({
      id: g.id,
      nome: g.nome,
      aplicaA: g.aplicaA,
      opcoes: g.opcoes.map((o) => o.nome).join(", "),
    });
    setModalAberto(true);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        aplicaA: form.aplicaA,
        opcoes: form.opcoes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      const res = form.id
        ? await fetch(`/api/opcoes/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/opcoes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      if (!res.ok) {
        const data = await res.json();
        onToast(data.error ?? "Erro ao salvar grupo de opção");
        return;
      }
      setModalAberto(false);
      await carregar();
      onToast(form.id ? "Grupo atualizado ✓" : "Grupo criado ✓");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(g: GrupoOpcao) {
    if (!confirm(`Remover o grupo "${g.nome}"?`)) return;
    await fetch(`/api/opcoes/${g.id}`, { method: "DELETE" });
    await carregar();
    onToast("Grupo removido");
  }

  return (
    <section>
      <div className={styles.pageIntro}>
        <p>Grupos de variação que o cliente escolhe (sabor, tamanho...).</p>
      </div>
      <div className={styles.toolbar}>
        <div />
        <button className={styles.btnPrimary} style={{ marginLeft: "auto" }} onClick={abrirNovo}>
          + Novo grupo de opção
        </button>
      </div>
      <div className={styles.optionGrid}>
        {grupos.map((g) => (
          <div key={g.id} className={styles.optionCard}>
            <h3>{g.nome}</h3>
            <p className={styles.applies}>Aplica-se a: {g.aplicaA}</p>
            <div className={styles.optionChipRow}>
              {g.opcoes.map((o) => (
                <span key={o.id} className={styles.optionChip}>
                  {o.nome}
                </span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className={styles.btnSecondary} onClick={() => abrirEdicao(g)}>
                Editar
              </button>
              <button className={styles.btnSecondary} onClick={() => excluir(g)}>
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalAberto && (
        <Modal title={form.id ? "Editar grupo de opção" : "Novo grupo de opção"} onClose={() => setModalAberto(false)}>
          <form onSubmit={salvar}>
            <div className={styles.field}>
              <label htmlFor="g-nome">Nome *</label>
              <input
                id="g-nome"
                required
                placeholder="Ex.: Sabor do Donut"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="g-aplica">Aplica-se a</label>
              <input
                id="g-aplica"
                placeholder="Ex.: Donuts, Caixinha"
                value={form.aplicaA}
                onChange={(e) => setForm({ ...form, aplicaA: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="g-opcoes">Opções (separadas por vírgula)</label>
              <textarea
                id="g-opcoes"
                placeholder="Ex.: Oreo, Paçoca, M&M, Chocolate"
                value={form.opcoes}
                onChange={(e) => setForm({ ...form, opcoes: e.target.value })}
              />
            </div>
            <button className={styles.btnPrimary} style={{ width: "100%", marginTop: 8 }} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar grupo"}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
