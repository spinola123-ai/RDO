/**
 * Utilitários para cálculo de prazos de obras e diários de obra (RDO)
 */

/**
 * Calcula a quantidade de dias decorridos entre a data de início da obra
 * e a data do relatório (RDO). No dia de início o resultado é 0 (0 dias
 * decorridos). No dia seguinte o resultado é 1, e assim por diante.
 */
export function calculateElapsedDays(startDateStr?: string, reportDateStr?: string): number {
  if (!startDateStr || !reportDateStr) return 0;

  const sParts = startDateStr.split('-').map(Number);
  const rParts = reportDateStr.split('-').map(Number);
  if (sParts.length < 3 || rParts.length < 3) return 0;

  const [sy, sm, sd] = sParts;
  const [ry, rm, rd] = rParts;
  if (!sy || !sm || !sd || !ry || !rm || !rd) return 0;

  const startUTC = Date.UTC(sy, sm - 1, sd);
  const reportUTC = Date.UTC(ry, rm - 1, rd);

  const diffMs = reportUTC - startUTC;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Calcula a data prevista de término contratual com base na data de início e prazo total em dias.
 */
export function calculateEndDate(startDateStr?: string, totalDays?: number): string {
  if (!startDateStr || !totalDays || totalDays <= 0) return '';

  const sParts = startDateStr.split('-').map(Number);
  if (sParts.length < 3) return '';

  const [sy, sm, sd] = sParts;
  if (!sy || !sm || !sd) return '';

  const date = new Date(sy, sm - 1, sd);
  date.setDate(date.getDate() + totalDays - 1);

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formata data YYYY-MM-DD para o padrão brasileiro DD/MM/AAAA.
 */
export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}
