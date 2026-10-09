"use client";

import { useEffect, useRef, useState } from "react";
import styles from "../painel.module.css";
import type { Estabelecimento, Horario } from "@/lib/types";
import { isOpenNow } from "@/lib/open-now";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

const SWATCHES = ["#6B0E0E", "#8C2A2A", "#C8792E", "#2E1710"];

export default function PerfilSection({ onToast }: { onToast: (msg: string) => void }) {
  const [dados, setDados] = useState<Estabelecimento | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [salvando, setSalvando] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const capaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/estabelecimento")
      .then((r) => r.json())
      .then(setDados);
    fetch("/api/horarios")
      .then((r) => r.json())
      .then(setHorarios);
  }, []);

  function update<K extends keyof Estabelecimento>(field: K, value: Estabelecimento[K]) {
    setDados((prev) => (prev ? { ...prev, [field]: value } : prev));
  }

  async function handleUpload(field: "logoUrl" | "capaUrl", e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !dados) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    if (!res.ok) {
      onToast(data.error ?? "Erro ao enviar imagem");
      return;
    }
    update(field, data.url);
    e.target.value = "";
  }

  async function handleSalvar() {
    if (!dados) return;
    setSalvando(true);
    try {
      const res = await fetch("/api/estabelecimento", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: dados.nome,
          descricao: dados.descricao,
          cnpj: dados.cnpj,
          corMenu: dados.corMenu,
          logoUrl: dados.logoUrl,
          capaUrl: dados.capaUrl,
          instagram: dados.instagram,
          whatsapp: dados.whatsapp,
          telefone: dados.telefone,
        }),
      });
      if (res.ok) {
        onToast("Alterações salvas ✓");
      } else {
        onToast("Não foi possível salvar.");
      }
    } finally {
      setSalvando(false);
    }
  }

  if (!dados) return null;

  const aberto = horarios.length > 0 ? isOpenNow(horarios) : null;

  return (
    <section>
      <div className={styles.pageIntro}>
        <p>Dados públicos do seu estabelecimento e aparência do cardápio digital.</p>
      </div>

      <div className={styles.perfilGrid}>
        <div>
          <div className={styles.card}>
            <h2>Mídias da sua loja</h2>
            <p className={styles.cardSub}>Configure a logo redonda e a imagem de fundo do topo do cardápio.</p>
            <div className={styles.mediaGrid}>
              <div className={styles.mediaField}>
                <span className={styles.mediaLabel}>Logo circular</span>
                <div className={styles.uploadRow}>
                  <div className={styles.uploadBox} onClick={() => logoInputRef.current?.click()}>
                    {dados.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dados.logoUrl} alt={dados.nome} />
                    )}
                  </div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload("logoUrl", e)}
                  />
                  <div className={styles.uploadText}>
                    <b>Selecione a logo</b>essa imagem aparece no círculo do topo
                  </div>
                </div>
              </div>

              <div className={styles.mediaField}>
                <span className={styles.mediaLabel}>Imagem do painel</span>
                <div className={styles.uploadRow}>
                  <div className={`${styles.uploadBox} ${styles.uploadBoxWide}`} onClick={() => capaInputRef.current?.click()}>
                    {dados.capaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dados.capaUrl} alt={`${dados.nome} capa`} />
                    ) : (
                      <div className={styles.uploadPlaceholder}>Sem capa</div>
                    )}
                  </div>
                  <input
                    ref={capaInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    style={{ display: "none" }}
                    onChange={(e) => handleUpload("capaUrl", e)}
                  />
                  <div className={styles.uploadText}>
                    <b>Selecione a capa</b>essa imagem aparece como fundo do topo do cardápio
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.colorRow}>
              <span className={styles.label}>Cor do menu:</span>
              {SWATCHES.map((cor) => (
                <div
                  key={cor}
                  className={`${styles.swatch} ${dados.corMenu === cor ? styles.swatchSelected : ""}`}
                  style={{ background: cor }}
                  onClick={() => update("corMenu", cor)}
                />
              ))}
            </div>
          </div>

          <div className={styles.card}>
            <h2>Dados do estabelecimento</h2>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="nome">Nome do estabelecimento *</label>
                <input id="nome" type="text" value={dados.nome} onChange={(e) => update("nome", e.target.value)} />
              </div>
              <div className={styles.field}>
                <label htmlFor="cnpj">CNPJ</label>
                <input
                  id="cnpj"
                  type="text"
                  placeholder="00.000.000/0001-00"
                  value={dados.cnpj ?? ""}
                  onChange={(e) => update("cnpj", e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                value={dados.descricao ?? ""}
                onChange={(e) => update("descricao", e.target.value)}
              />
            </div>
          </div>

          <div className={styles.card}>
            <h2>Contato do estabelecimento</h2>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label htmlFor="telefone">Telefone de contato</label>
                <input
                  id="telefone"
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={dados.telefone ?? ""}
                  onChange={(e) => update("telefone", e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="instagram">Meu @ no Instagram</label>
                <input
                  id="instagram"
                  type="text"
                  value={dados.instagram ?? ""}
                  onChange={(e) => update("instagram", e.target.value)}
                />
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="whatsapp">WhatsApp</label>
              <input
                id="whatsapp"
                type="tel"
                placeholder="5511999999999"
                value={dados.whatsapp ?? ""}
                onChange={(e) => update("whatsapp", normalizeWhatsappNumber(e.target.value))}
              />
              <p className={styles.fieldHint}>
                Esse número recebe os pedidos feitos no cardápio digital (DDI+DDD+número, só dígitos).
              </p>
            </div>
          </div>

          <button className={styles.btnPrimary} onClick={handleSalvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        <div className={styles.previewWrap}>
          <p
            style={{
              fontSize: ".8rem",
              fontWeight: 700,
              color: "var(--brown)",
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: ".04em",
              margin: "0 0 10px",
            }}
          >
            Preview do cardápio
          </p>
          <div className={styles.previewFrame}>
            <div
              className={styles.previewHeader}
              style={{
                backgroundColor: dados.corMenu,
                ...(dados.capaUrl ? { ["--preview-bg-image" as string]: `url(${dados.capaUrl})` } : {}),
              }}
            >
              {dados.logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className={styles.previewLogo} src={dados.logoUrl} alt="" />
              )}
            </div>
            <div className={styles.previewBody}>
              <p className={styles.pname}>{dados.nome}</p>
              <p className={styles.pmeta}>{dados.instagram}</p>
              <p
                className={styles.pstatus}
                style={aberto === false ? { color: "var(--red)" } : undefined}
              >
                ● {aberto === false ? "Fechado" : "Aberto agora"}
              </p>
              <div className={styles.previewChips}>
                <span>Donuts</span>
                <span>Fatias de Bolo</span>
                <span>Cappuccino Gelado</span>
              </div>
            </div>
            <div className={styles.previewCart} style={{ background: dados.corMenu }}>
              🛍 Ver sacola
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
