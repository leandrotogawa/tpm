"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../painel.module.css";
import Modal from "./Modal";
import Switch from "./Switch";
import { CATEGORIAS_PRODUTO, brl } from "@/lib/constants";
import type { Produto } from "@/lib/types";

type FormState = {
  id?: string;
  nome: string;
  categoria: string;
  preco: string;
  descricao: string;
  imagemUrl: string | null;
  controlaEstoque: boolean;
  quantidadeInicial: string;
};

const EMPTY_FORM: FormState = {
  nome: "",
  categoria: "Donuts",
  preco: "",
  descricao: "",
  imagemUrl: null,
  controlaEstoque: true,
  quantidadeInicial: "0",
};

export default function ProdutosSection({ onToast }: { onToast: (msg: string) => void }) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [filtro, setFiltro] = useState("Todos");
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    const res = await fetch("/api/produtos");
    setProdutos(await res.json());
  }

  useEffect(() => {
    (async () => {
      await carregar();
    })();
  }, []);

  const filtrados = produtos.filter((p) => {
    if (filtro !== "Todos" && p.categoria !== filtro) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  function abrirNovo() {
    setForm(EMPTY_FORM);
    setModalAberto(true);
  }

  function abrirEdicao(p: Produto) {
    setForm({
      id: p.id,
      nome: p.nome,
      categoria: p.categoria,
      preco: String(p.preco),
      descricao: p.descricao ?? "",
      imagemUrl: p.imagemUrl,
      controlaEstoque: p.controlaEstoque,
      quantidadeInicial: String(p.estoque?.quantidade ?? 0),
    });
    setModalAberto(true);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      onToast(data.error ?? "Erro ao enviar imagem");
      return;
    }
    setForm((prev) => ({ ...prev, imagemUrl: data.url }));
    e.target.value = "";
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome,
        categoria: form.categoria,
        preco: parseFloat(form.preco.replace(",", ".")) || 0,
        descricao: form.descricao || null,
        imagemUrl: form.imagemUrl,
        controlaEstoque: form.controlaEstoque,
        quantidadeInicial: parseInt(form.quantidadeInicial, 10) || 0,
      };

      const res = form.id
        ? await fetch(`/api/produtos/${form.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/produtos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const raw = await res.text();
        let message = "Erro ao salvar produto";
        if (raw) {
          try {
            const data = JSON.parse(raw) as { error?: string };
            message = data.error ?? message;
          } catch {
            message = raw;
          }
        }
        onToast(message);
        return;
      }
      setModalAberto(false);
      await carregar();
      onToast(form.id ? "Produto atualizado ✓" : "Produto criado ✓");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarAtivo(p: Produto) {
    await fetch(`/api/produtos/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo: !p.ativo }),
    });
    await carregar();
  }

  async function excluir(p: Produto) {
    if (!confirm(`Remover "${p.nome}" do cardápio?`)) return;
    await fetch(`/api/produtos/${p.id}`, { method: "DELETE" });
    await carregar();
    onToast("Produto removido");
  }

  return (
    <section>
      <div className={styles.pageIntro}>
        <p>Itens que aparecem no seu cardápio digital.</p>
      </div>

      <div className={styles.toolbar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Buscar produto"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <div className={styles.filterPills}>
          {["Todos", ...CATEGORIAS_PRODUTO].map((cat) => (
            <button
              key={cat}
              className={`${styles.filterPill} ${filtro === cat ? styles.filterPillActive : ""}`}
              onClick={() => setFiltro(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button className={styles.btnPrimary} style={{ marginLeft: "auto" }} onClick={abrirNovo}>
          + Novo produto
        </button>
      </div>

      <div className={styles.card} style={{ padding: "6px 8px" }}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Categoria</th>
                <th>Preço</th>
                <th>Ativo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className={styles.cellProduct}>
                      <span className={styles.cellIcon} style={p.imagemUrl ? undefined : { background: `${p.corIcone ?? "#6B0E0E"}20` }}>
                        {p.imagemUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img className={styles.cellThumb} src={p.imagemUrl} alt={p.nome} />
                        ) : (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: p.corIcone ?? "#6B0E0E",
                              display: "block",
                            }}
                          />
                        )}
                      </span>
                      {p.nome}
                    </div>
                  </td>
                  <td>{p.categoria}</td>
                  <td>{brl(p.preco)}</td>
                  <td>
                    <Switch checked={p.ativo} onChange={() => alternarAtivo(p)} label={`Ativar ${p.nome}`} />
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    <button className={styles.btnGhostIcon} aria-label="Editar" onClick={() => abrirEdicao(p)}>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path
                          d="M4 20l1-4L16 5l3 3L8 19l-4 1z"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button className={styles.btnGhostIcon} aria-label="Excluir" onClick={() => excluir(p)}>
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
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalAberto && (
        <Modal title={form.id ? "Editar produto" : "Novo produto"} onClose={() => setModalAberto(false)}>
          <form onSubmit={salvar}>
            <div className={styles.field}>
              <label htmlFor="p-nome">Nome *</label>
              <input
                id="p-nome"
                required
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="p-categoria">Categoria *</label>
                <select
                  id="p-categoria"
                  value={form.categoria}
                  onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                >
                  {CATEGORIAS_PRODUTO.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label htmlFor="p-preco">Preço (R$) *</label>
                <input
                  id="p-preco"
                  required
                  inputMode="decimal"
                  value={form.preco}
                  onChange={(e) => setForm({ ...form, preco: e.target.value })}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="p-descricao">Descrição</label>
              <textarea
                id="p-descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              />
            </div>
            <div className={styles.field}>
              <label>Foto do produto</label>
              <div className={styles.uploadRow}>
                <div className={`${styles.uploadBox} ${styles.productUploadBox}`} onClick={() => imageInputRef.current?.click()}>
                  {form.imagemUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.imagemUrl} alt={form.nome || "Produto"} />
                  ) : (
                    <div className={styles.uploadPlaceholder}>Sem foto</div>
                  )}
                </div>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: "none" }}
                  onChange={handleUpload}
                />
                <div className={styles.uploadText}>
                  <b>Selecione a foto</b>essa imagem aparecerá no cardápio do produto
                </div>
              </div>
            </div>
            <div className={styles.checkRow}>
              <input
                type="checkbox"
                id="p-estoque"
                checked={form.controlaEstoque}
                onChange={(e) => setForm({ ...form, controlaEstoque: e.target.checked })}
              />
              <label htmlFor="p-estoque">Controla estoque</label>
            </div>
            {form.controlaEstoque && !form.id && (
              <div className={styles.field}>
                <label htmlFor="p-qtd">Quantidade inicial em estoque</label>
                <input
                  id="p-qtd"
                  inputMode="numeric"
                  value={form.quantidadeInicial}
                  onChange={(e) => setForm({ ...form, quantidadeInicial: e.target.value })}
                />
              </div>
            )}
            <button className={styles.btnPrimary} style={{ width: "100%", marginTop: 8 }} disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar produto"}
            </button>
          </form>
        </Modal>
      )}
    </section>
  );
}
