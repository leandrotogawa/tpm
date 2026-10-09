"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import styles from "./page.module.css";
import { DonutIcon, CakeIcon, CupIcon } from "@/components/ProductIcons";
import { isOpenNow } from "@/lib/open-now";
import { brl } from "@/lib/constants";
import type { ConfigPagamento, Estabelecimento, Horario, Produto } from "@/lib/types";
import { normalizeWhatsappNumber } from "@/lib/whatsapp";

type CartItem = { key: string; tipo: "produto"; produtoId: string; nome: string; precoUnit: number; qty: number };

const TIPOS_CONSUMO = ["Retirada", "Delivery", "Consumir no local"] as const;
const FORMAS_PAGAMENTO = [
  { key: "pix", label: "Pix" },
  { key: "dinheiro", label: "Dinheiro" },
  { key: "credito", label: "Cartão de crédito" },
  { key: "debito", label: "Cartão de débito" },
] as const;

const SECTIONS = [
  { id: "promocoes", label: "Promoções" },
  { id: "donuts", label: "Donuts" },
  { id: "fatias", label: "Fatias de Bolo" },
  { id: "cappuccino", label: "Cappuccino Gelado" },
  { id: "combos", label: "Combos" },
];

export default function CardapioPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [estabelecimento, setEstabelecimento] = useState<Estabelecimento | null>(null);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [configPagamento, setConfigPagamento] = useState<ConfigPagamento | null>(null);
  const [loading, setLoading] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [tipoConsumo, setTipoConsumo] = useState<(typeof TIPOS_CONSUMO)[number]>("Retirada");
  const [formaPagamento, setFormaPagamento] = useState<string>("Pix");
  const [clienteNome, setClienteNome] = useState("");
  const [activeSection, setActiveSection] = useState("donuts");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    async function load() {
      const [produtosRes, estRes, horariosRes, pagamentoRes] = await Promise.all([
        fetch("/api/produtos?ativo=true"),
        fetch("/api/estabelecimento"),
        fetch("/api/horarios"),
        fetch("/api/config-pagamento"),
      ]);
      setProdutos(await produtosRes.json());
      setEstabelecimento(await estRes.json());
      setHorarios(await horariosRes.json());
      const pagamento = (await pagamentoRes.json()) as ConfigPagamento;
      setConfigPagamento(pagamento);
      setLoading(false);
    }
    load();
  }, []);

  const formasPagamentoDisponiveis = useMemo(
    () =>
      FORMAS_PAGAMENTO.filter((forma) => {
        if (!configPagamento) return forma.key !== "debito";
        return Boolean(configPagamento[forma.key]);
      }),
    [configPagamento]
  );

  useEffect(() => {
    if (formasPagamentoDisponiveis.length === 0) return;
    if (!formasPagamentoDisponiveis.some((forma) => forma.label === formaPagamento)) {
      setFormaPagamento(formasPagamentoDisponiveis[0].label);
    }
  }, [formaPagamento, formasPagamentoDisponiveis]);

  const donuts = useMemo(
    () => produtos.filter((p) => p.categoria === "Donuts").sort((a, b) => a.ordem - b.ordem),
    [produtos]
  );
  const promocoes = useMemo(
    () => produtos.filter((p) => p.categoria === "Promoções").sort((a, b) => a.ordem - b.ordem),
    [produtos]
  );
  const fatias = useMemo(
    () => produtos.filter((p) => p.categoria === "Fatias").sort((a, b) => a.ordem - b.ordem),
    [produtos]
  );
  const bebidas = useMemo(
    () => produtos.filter((p) => p.categoria === "Bebidas").sort((a, b) => a.ordem - b.ordem),
    [produtos]
  );
  const combos = useMemo(
    () => produtos.filter((p) => p.categoria === "Combos").sort((a, b) => a.ordem - b.ordem),
    [produtos]
  );
  const sections = useMemo(
    () =>
      SECTIONS.filter((section) => {
        if (section.id === "promocoes") return promocoes.length > 0;
        if (section.id === "combos") return combos.length > 0;
        return true;
      }),
    [combos.length, promocoes.length]
  );

  const aberto = horarios.length > 0 ? isOpenNow(horarios) : null;

  function addProduto(produto: Produto) {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.tipo === "produto" && i.produtoId === produto.id
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [
        ...prev,
        {
          key: `produto-${produto.id}`,
          tipo: "produto",
          produtoId: produto.id,
          nome: produto.nome,
          precoUnit: produto.preco,
          qty: 1,
        },
      ];
    });
    setCartOpen(true);
  }

  function changeQty(key: string, delta: number) {
    setCart((prev) =>
      prev
        .map((i) => (i.key === key ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );
  }

  const total = cart.reduce((sum, i) => sum + i.precoUnit * i.qty, 0);
  const totalItens = cart.reduce((sum, i) => sum + i.qty, 0);

  async function finalizarPedido() {
    if (cart.length === 0) return;
    setEnviando(true);
    setErro(null);
    try {
      const itens: (
        | { tipo: "produto"; produtoId: string; quantidade: number }
      )[] = cart.map((item) => ({ tipo: "produto", produtoId: item.produtoId, quantidade: item.qty }));

      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cliente: clienteNome, tipoConsumo, formaPagamento, itens }),
      });
      const pedido = await res.json();
      if (!res.ok) {
        setErro(pedido.error ?? "Não foi possível enviar o pedido.");
        return;
      }

      const linhas = cart
        .map((i) => `• ${i.qty}x ${i.nome} — ${brl(i.precoUnit * i.qty)}`)
        .join("\n");
      const msg = `Olá, ${estabelecimento?.nome ?? "Vanilla Coffee"}! Quero fazer o pedido #${pedido.numero}:\n\n${linhas}\n\nTipo: ${tipoConsumo}\nPagamento: ${formaPagamento}\nTotal: ${brl(total)}`;
      const numero = normalizeWhatsappNumber(estabelecimento?.whatsapp);
      if (!numero) {
        setErro("Configure um número de WhatsApp válido no painel para receber os pedidos.");
        return;
      }
      window.open(`https://wa.me/${numero}?text=${encodeURIComponent(msg)}`, "_blank");

      setCart([]);
      setClienteNome("");
      setFormaPagamento(formasPagamentoDisponiveis[0]?.label ?? "Pix");
      setTipoConsumo("Retirada");
      setCartOpen(false);

      const produtosRes = await fetch("/api/produtos?ativo=true");
      setProdutos(await produtosRes.json());
    } finally {
      setEnviando(false);
    }
  }

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-40% 0px -50% 0px" }
    );
    Object.values(sectionRefs.current).forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, [loading]);

  if (loading) {
    return <div className={styles.page} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.siteHeader}>
          <div
            className={styles.heroCover}
            style={
              (estabelecimento?.capaUrl ?? estabelecimento?.logoUrl)
                ? ({ ["--header-bg-image" as string]: `url(${estabelecimento?.capaUrl ?? estabelecimento?.logoUrl})` } as React.CSSProperties)
                : undefined
            }
          >
            {estabelecimento?.logoUrl ? (
              <div className={styles.logoFrame}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.logo} src={estabelecimento.logoUrl} alt={estabelecimento.nome} />
              </div>
            ) : (
              <p className={styles.logoFallback}>{estabelecimento?.nome ?? "Vanilla Coffee"}</p>
            )}
          </div>

          <div className={styles.heroContent}>
            <p className={styles.tagline}>doces, café e momentos que combinam</p>
            {aberto !== null && (
              <span className={`${styles.statusBadge} ${aberto ? styles.statusOpen : styles.statusClosed}`}>
                <span className={styles.statusDot} />
                {aberto ? "Aberto agora" : "Fechado no momento"}
              </span>
            )}
            <div className={styles.heroRule}>
              <span className={styles.dots} />
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 21s-7.2-4.6-9.8-9.1C.6 8.6 2 5 5.6 4.4c2-.3 3.6.7 4.4 2.2.8-1.5 2.4-2.5 4.4-2.2C18 5 19.4 8.6 21.8 11.9 19.2 16.4 12 21 12 21z"
                  fill="currentColor"
                />
              </svg>
              <span className={styles.dots} />
            </div>
          </div>
        </header>

        <nav className={styles.catNav}>
          {sections.map((s) => (
            <a
              key={s.id}
              className={activeSection === s.id ? styles.active : undefined}
              onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth" })}
            >
              {s.label}
            </a>
          ))}
        </nav>

        <main>
          {promocoes.length > 0 && (
            <section
              id="promocoes"
              ref={(el) => {
                sectionRefs.current.promocoes = el;
              }}
              className={styles.menuSection}
            >
              <div className={styles.sectionHead}>
                <div className={styles.sectionBadge}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 3l2.2 4.5L19 8.2l-3.5 3.4.8 4.8-4.3-2.3-4.3 2.3.8-4.8L5 8.2l4.8-.7L12 3z" stroke="#FBF3EA" strokeWidth="1.8" strokeLinejoin="round" />
                  </svg>
                </div>
                <h2>Promoções</h2>
              </div>
              <p className={styles.sectionSub}>Aproveite as ofertas em destaque e adicione rapidinho à sua sacola.</p>
              <div className={styles.dividerDots} />

              <div className={styles.promoGrid}>
                {promocoes.map((produto) => (
                  <ProductCard key={produto.id} produto={produto} icon={getProductIcon(produto)} onAdd={() => addProduto(produto)} highlightPromotion />
                ))}
              </div>
            </section>
          )}

          <section
            id="donuts"
            ref={(el) => {
              sectionRefs.current.donuts = el;
            }}
            className={styles.menuSection}
          >
            <div className={styles.sectionHead}>
              <div className={styles.sectionBadge}>
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#FBF3EA" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" stroke="#FBF3EA" strokeWidth="2" />
                </svg>
              </div>
              <h2>Donuts</h2>
            </div>
            <p className={styles.sectionSub}>
              Nossos donuts artesanais são feitos com muito carinho e ingredientes de qualidade!
            </p>
            <div className={styles.dividerDots} />

            <div className={styles.cardGrid}>
              {donuts.map((d) => (
                <ProductCard key={d.id} produto={d} icon={<DonutIcon nome={d.nome} cor={d.corIcone} />} onAdd={() => addProduto(d)} />
              ))}
            </div>

            <div className={styles.promoStrip}>
              🎁 <strong>Escolha seus favoritos</strong> e monte seu pedido com os sabores que mais combinam com você.
            </div>
          </section>

          <section
            id="fatias"
            ref={(el) => {
              sectionRefs.current.fatias = el;
            }}
            className={styles.menuSection}
          >
            <div className={styles.sectionHead}>
              <div className={styles.sectionBadge}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 20h16M5 20l1-9h12l1 9M6 11l6-6 6 6"
                    stroke="#FBF3EA"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h2>Fatias de Bolo</h2>
            </div>
            <p className={styles.sectionSub}>Fatias generosas e recheadas para deixar seu dia mais doce!</p>
            <div className={styles.dividerDots} />

            <div className={`${styles.cardGrid} ${styles.cardGridTwoCol}`}>
              {fatias.map((f) => (
                <ProductCard key={f.id} produto={f} icon={<CakeIcon nome={f.nome} cor={f.corIcone} />} onAdd={() => addProduto(f)} />
              ))}
            </div>
          </section>

          <section
            id="cappuccino"
            ref={(el) => {
              sectionRefs.current.cappuccino = el;
            }}
            className={styles.menuSection}
          >
            <div className={styles.sectionHead}>
              <div className={styles.sectionBadge}>
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 9h13a3 3 0 0 1 0 6h-1" stroke="#FBF3EA" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M4 9v6a4 4 0 0 0 4 4h3a4 4 0 0 0 4-4V9"
                    stroke="#FBF3EA"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M7 5c0 1 1 1 1 2M11 5c0 1 1 1 1 2" stroke="#FBF3EA" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </div>
              <h2>Cappuccino Gelado</h2>
            </div>
            <p className={styles.sectionSub}>
              Cremoso, gelado e perfeito para qualquer momento! Finalizado com chantilly e opção de cobertura de chocolate.
            </p>
            <div className={styles.dividerDots} />

            <div className={styles.sizeCards}>
              {bebidas.map((c) => {
                const esgotado = c.controlaEstoque && (c.estoque?.quantidade ?? 0) <= 0;
                return (
                  <div key={c.id} className={styles.sizeCard}>
                    {c.imagemUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.productImage} src={c.imagemUrl} alt={c.nome} />
                    ) : (
                      <div className={styles.iconWrap}>
                        <CupIcon />
                      </div>
                    )}
                    <span className={styles.sizeLabel}>{c.nome.replace("Cappuccino Gelado ", "")}</span>
                    <span className={styles.price}>{brl(c.preco)}</span>
                    {esgotado ? (
                      <div className={styles.soldOut}>Esgotado</div>
                    ) : (
                      <button className={styles.btnAdd} onClick={() => addProduto(c)}>
                        + Adicionar
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {combos.length > 0 && (
            <section
              id="combos"
              ref={(el) => {
                sectionRefs.current.combos = el;
              }}
              className={styles.menuSection}
            >
              <div className={styles.sectionHead}>
                <div className={styles.sectionBadge}>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 3l1.8 4.8L19 9l-4 3.3L16 18l-4-2.6L8 18l1-5.7L5 9l5.2-1.2L12 3z"
                      stroke="#FBF3EA"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2>Combos</h2>
              </div>
              <p className={styles.sectionSub}>Quanto mais doce, melhor — aproveite e leve mais por menos.</p>
              <div className={styles.dividerDots} />

              <div className={styles.cardGrid}>
                {combos.map((combo) => (
                  <ProductCard key={combo.id} produto={combo} icon={<DonutIcon nome={combo.nome} cor={combo.corIcone} />} onAdd={() => addProduto(combo)} />
                ))}
              </div>
            </section>
          )}
        </main>

        <footer className={styles.siteFooter}>
          <p className={styles.quote}>{estabelecimento?.nome ?? "Vanilla Coffee"} — doces, café e momentos que combinam.</p>
          <p>Obrigada pela preferência! 🤍 Feito com amor para você.</p>
          <p className={styles.handle}>{estabelecimento?.instagram}</p>
        </footer>
      </div>

      <button className={styles.cartFab} aria-label="Abrir sacola" onClick={() => setCartOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M6 8h12l-1.2 11.2a2 2 0 0 1-2 1.8H9.2a2 2 0 0 1-2-1.8L6 8z"
            stroke="#FBF3EA"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M9 8V6a3 3 0 0 1 6 0v2" stroke="#FBF3EA" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <span className={styles.cartBadge}>{totalItens}</span>
      </button>

      <aside className={`${styles.cartPanel} ${cartOpen ? styles.cartPanelOpen : ""}`}>
        <div className={styles.cartPanelHead}>
          <h3>Sua sacola</h3>
          <button onClick={() => setCartOpen(false)} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className={styles.cartItems}>
          {cart.length === 0 ? (
            <p className={styles.cartEmpty}>Sua sacola está vazia — escolha algo gostoso 😋</p>
          ) : (
            cart.map((item) => (
              <div key={item.key} className={styles.cartItem}>
                <div>
                  <div className={styles.name}>{item.nome}</div>
                  <div style={{ opacity: 0.7 }}>{brl(item.precoUnit)} un.</div>
                </div>
                <div className={styles.qtyCtrl}>
                  <button onClick={() => changeQty(item.key, -1)}>−</button>
                  <span>{item.qty}</span>
                  <button onClick={() => changeQty(item.key, 1)}>+</button>
                </div>
              </div>
            ))
          )}
        </div>
        <div className={styles.cartPanelFoot}>
          {cart.length > 0 && (
            <>
              <div className={styles.tipoConsumoRow}>
                {TIPOS_CONSUMO.map((t) => (
                  <button
                    key={t}
                    className={t === tipoConsumo ? styles.active : undefined}
                    onClick={() => setTipoConsumo(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className={styles.cartOptionsBlock}>
                <span className={styles.cartOptionsTitle}>Forma de pagamento</span>
                <div className={styles.paymentOptions}>
                  {formasPagamentoDisponiveis.map((forma) => (
                    <label key={forma.key} className={styles.paymentOption}>
                      <input
                        type="radio"
                        name="forma-pagamento"
                        checked={formaPagamento === forma.label}
                        onChange={() => setFormaPagamento(forma.label)}
                      />
                      <span>{forma.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <input
                type="text"
                placeholder="Seu nome (opcional)"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                style={{
                  width: "100%",
                  marginBottom: 12,
                  padding: "9px 12px",
                  borderRadius: 10,
                  border: "1px solid var(--line)",
                  fontSize: "0.85rem",
                }}
              />
            </>
          )}
          {erro && (
            <p style={{ color: "#b23a3a", fontSize: "0.78rem", marginBottom: 8 }}>{erro}</p>
          )}
          <div className={styles.cartTotalRow}>
            <span>Total</span>
            <span>{brl(total)}</span>
          </div>
          <button
            className={`${styles.btnWhatsapp} ${cart.length === 0 ? styles.btnWhatsappDisabled : ""}`}
            onClick={finalizarPedido}
            disabled={cart.length === 0 || enviando || formasPagamentoDisponiveis.length === 0}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#08360C">
              <path d="M12 2C6.5 2 2 6.5 2 12c0 1.9.5 3.7 1.5 5.3L2 22l4.9-1.4C8.4 21.5 10.1 22 12 22c5.5 0 10-4.5 10-10S17.5 2 12 2z" />
            </svg>
            {enviando ? "Enviando..." : "Realizar pedido"}
          </button>
        </div>
      </aside>
    </div>
  );
}

function getProductIcon(produto: Produto) {
  if (produto.categoria === "Fatias") {
    return <CakeIcon nome={produto.nome} cor={produto.corIcone} />;
  }
  if (produto.categoria === "Bebidas") {
    return <CupIcon />;
  }
  return <DonutIcon nome={produto.nome} cor={produto.corIcone} />;
}

function ProductCard({
  produto,
  icon,
  onAdd,
  highlightPromotion,
}: {
  produto: Produto;
  icon: ReactNode;
  onAdd: () => void;
  highlightPromotion?: boolean;
}) {
  const esgotado = produto.controlaEstoque && (produto.estoque?.quantidade ?? 0) <= 0;
  return (
    <div className={`${styles.productCard} ${highlightPromotion ? styles.productCardPromo : ""}`}>
      {produto.imagemUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.productImage} src={produto.imagemUrl} alt={produto.nome} />
      ) : (
        <div className={styles.iconWrap}>{icon}</div>
      )}
      {highlightPromotion && <span className={styles.promoBadge}>Promoção</span>}
      <h3>{produto.nome}</h3>
      <p className={styles.desc}>{produto.descricao}</p>
      <div className={styles.cardFooter}>
        <span className={styles.price}>
          {brl(produto.preco)} <small>/un</small>
        </span>
        {esgotado ? (
          <span className={styles.soldOut}>Esgotado</span>
        ) : (
          <button className={styles.btnAdd} onClick={onAdd}>
            + Adicionar
          </button>
        )}
      </div>
    </div>
  );
}
