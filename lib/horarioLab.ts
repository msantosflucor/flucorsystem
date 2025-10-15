// lib/horarioLab.ts

export function isLaboratorioFechado(nowDate?: Date): boolean {
  const now = nowDate ?? new Date();
  const dow = now.getDay(); // 0 = domingo

  if (dow === 0) return true; // domingo fechado o dia todo

  const h = now.getHours();
  // fechado entre 22:00–23:59 e 00:00–05:59
  return (h >= 22) || (h < 6);
}

export function janelaFechamentoAtual(nowDate?: Date): [Date|null, Date|null] {
  const now = nowDate ?? new Date();
  const dow = now.getDay();

  // Domingo (00:00–23:59)
  if (dow === 0) {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return [start, end];
  }

  const hour = now.getHours();

  // 00:00–06:00 → janela começou ontem às 22:00 e vai até hoje 06:00
  if (hour < 6) {
    const start = new Date(now);
    start.setDate(start.getDate() - 1);
    start.setHours(22, 0, 0, 0);
    const end = new Date(now);
    end.setHours(6, 0, 0, 0);
    return [start, end];
  }

  // 22:00–23:59 → janela atual hoje 22:00 → amanhã 06:00
  if (hour >= 22) {
    const start = new Date(now);
    start.setHours(22, 0, 0, 0);
    const end = new Date(now);
    end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0);
    return [start, end];
  }

  // Lab aberto
  return [null, null];
}

// Funções auxiliares para compatibilidade
export function janelaFechamentoAtualLegacy(ref = new Date()): readonly [Date, Date] {
  const [start, end] = janelaFechamentoAtual(ref);
  if (start && end) {
    return [start, end] as const;
  }
  // Retorna datas inválidas quando aberto
  return [new Date(0), new Date(0)] as const;
}

export function isLaboratorioFechadoLegacy(d = new Date()): boolean {
  return isLaboratorioFechado(d);
}