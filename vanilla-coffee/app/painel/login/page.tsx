"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "../painel.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErro(data.error ?? "Não foi possível entrar.");
        return;
      }
      router.push("/painel");
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={styles.app}>
      <div className={styles.loginWrap}>
        <form className={styles.loginCard} onSubmit={handleSubmit}>
          <h1>Vanilla Coffee</h1>
          <p>Entre para acessar o painel do lojista</p>
          {erro && <p className={styles.loginError}>{erro}</p>}
          <div className={styles.field} style={{ textAlign: "left" }}>
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className={styles.field} style={{ textAlign: "left" }}>
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <button className={styles.btnPrimary} style={{ width: "100%" }} disabled={enviando}>
            {enviando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
