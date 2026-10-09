export type HorarioDTO = {
  diaSemana: number;
  aberto: boolean;
  horaAbre: string;
  horaFecha: string;
};

/** Pure function so it can run both in the browser (live badge) and on the server. */
export function isOpenNow(horarios: HorarioDTO[], now = new Date()): boolean {
  const hoje = horarios.find((h) => h.diaSemana === now.getDay());
  if (!hoje || !hoje.aberto) return false;

  const minutosAgora = now.getHours() * 60 + now.getMinutes();
  const [abreH, abreM] = hoje.horaAbre.split(":").map(Number);
  const [fechaH, fechaM] = hoje.horaFecha.split(":").map(Number);
  const minutosAbre = abreH * 60 + abreM;
  const minutosFecha = fechaH * 60 + fechaM;

  return minutosAgora >= minutosAbre && minutosAgora < minutosFecha;
}
