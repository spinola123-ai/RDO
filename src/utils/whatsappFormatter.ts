import { RDOReport, FieldPhoto } from '../types/rdo';

export interface FormatOptions {
  customNote?: string;
  formatType?: 'complete' | 'brief';
  includePhotos?: boolean;
  selectedPhotoIds?: string[];
}

export function generateWhatsAppSummary(report: RDOReport, options?: FormatOptions): string {
  const { customNote, formatType = 'complete', includePhotos = false, selectedPhotoIds } = options || {};

  // Date formatting
  const [year, month, day] = report.date ? report.date.split('-') : ['', '', ''];
  const formattedDate = day && month && year ? `${day}/${month}/${year}` : report.date;

  // Day of week
  let dayOfWeek = '';
  try {
    const d = new Date(report.date + 'T12:00:00');
    dayOfWeek = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    dayOfWeek = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
  } catch {
    // ignore
  }

  // Direct & Indirect Labor counts
  const directWorkers = report.directLabor.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const indirectWorkers = report.indirectLabor.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const totalWorkers = directWorkers + indirectWorkers;
  const totalHH = (
    report.directLabor.reduce((acc, curr) => acc + (Number(curr.quantity) * (Number(curr.hoursWorked) || 0)), 0) +
    report.indirectLabor.reduce((acc, curr) => acc + (Number(curr.quantity) * (Number(curr.hoursWorked) || 0)), 0)
  );

  // Equipment count
  const machineCount = report.equipment.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);

  // Stoppage hours
  const totalStoppageHours = report.stoppages.reduce((acc, curr) => acc + (Number(curr.totalHours) || 0), 0);

  // Engineer & Fiscal names
  const engineerName = report.signatures.engineer.signerName || report.projectInfo.engineerName || 'A definir';
  const inspectorName = report.signatures.inspector.signerName || report.projectInfo.clientInspector || 'A definir';

  // Weather formatting helper
  const translateWeather = (cond: string) => {
    switch (cond) {
      case 'ensolarado': return 'Ensolarado ☀️';
      case 'nublado': return 'Nublado ☁️';
      case 'parcialmente_nublado': return 'Parcialmente Nublado ⛅';
      case 'chuva_fraca': return 'Chuva Fraca 🌦️';
      case 'chuva_forte': return 'Chuva Forte 🌧️';
      case 'tempestade': return 'Tempestade ⛈️';
      default: return cond;
    }
  };

  const translateGround = (ground: string) => {
    switch (ground) {
      case 'seco': return 'Seco';
      case 'praticavel': return 'Praticável';
      case 'impraticavel': return 'Impraticável ⚠️';
      default: return ground;
    }
  };

  // Filter photos if selectedPhotoIds provided
  const relevantPhotos = report.photos.filter((p) => {
    if (!selectedPhotoIds) return true;
    return selectedPhotoIds.includes(p.id);
  });

  const lines: string[] = [];

  // ==========================================
  // 1. FORMA SINTÉTICA (RESUMIDA / DIRETA)
  // ==========================================
  if (formatType === 'brief') {
    lines.push(`🏗️ *RDO #${report.reportNumber}* • ${formattedDate}${dayOfWeek ? ` (${dayOfWeek})` : ''}`);
    lines.push(`🏢 *Obra:* ${report.projectInfo.projectName || 'Obra'}`);
    lines.push(`👷 *Resp:* ${engineerName} | *Fiscal:* ${inspectorName}`);

    // Prazo se cadastrado
    if (report.projectInfo.totalDays > 0) {
      const percent = Math.min(100, Math.round(((report.projectInfo.elapsedDays || 0) / report.projectInfo.totalDays) * 100));
      lines.push(`⏳ *Prazo:* Dia ${report.projectInfo.elapsedDays || 0}/${report.projectInfo.totalDays} (${percent}%)`);
    }

    lines.push('');
    // Clima em 1 linha
    lines.push(`☀️ *Clima:* Manhã: ${translateWeather(report.weather.morning.condition)} | Tarde: ${translateWeather(report.weather.afternoon.condition)}`);

    // Efetivo e HH
    lines.push(`👥 *Efetivo Total:* ${totalWorkers} trabalhadores (${totalHH.toFixed(0)} Homem-Hora)`);

    // Máquinas
    if (report.equipment.length > 0) {
      const activeEquip = report.equipment
        .filter(eq => Number(eq.quantity) > 0)
        .map(eq => `${eq.name} (${eq.quantity}x)`)
        .join(', ');
      lines.push(`🚜 *Equipamentos:* ${activeEquip || `${machineCount} no canteiro`}`);
    }

    // Paralisações
    if (totalStoppageHours > 0) {
      lines.push(`⚠️ *Paralisações:* ${totalStoppageHours.toFixed(1)}h paradas no dia`);
    } else {
      lines.push(`⏱️ *Paralisações:* Nenhuma (0h) ✅`);
    }

    // Atividades principais resumidas
    lines.push('');
    lines.push(`🔨 *Atividades Realizadas:*`);
    if (report.activities.length > 0) {
      report.activities.forEach((act, idx) => {
        lines.push(`• [${act.sector}] ${act.description} (${act.progressPercent}%)`);
      });
    } else {
      lines.push(`• Sem atividades cadastradas.`);
    }

    // Fotos no resumo sintético (se habilitado)
    if (includePhotos) {
      lines.push('');
      if (relevantPhotos.length > 0) {
        const sectors = Array.from(new Set(relevantPhotos.map(p => p.sectorTag).filter(Boolean))).join(', ');
        lines.push(`📸 *Fotos:* ${relevantPhotos.length} foto(s) anexada(s)${sectors ? ` (${sectors})` : ''}`);
        relevantPhotos.forEach((p, idx) => {
          const cap = p.caption ? ` - ${p.caption}` : '';
          const sec = p.sectorTag ? ` [${p.sectorTag}]` : '';
          lines.push(`  ↳ Foto ${idx + 1}${sec}${cap}`);
        });
      } else {
        lines.push(`📸 *Fotos:* Nenhuma foto anexada.`);
      }
    }

    // Assinaturas
    lines.push('');
    lines.push(`✍️ *Status Assinaturas:* Eng: ${report.signatures.engineer.signed ? 'OK ✅' : 'Pendente ⏳'} | Fiscal: ${report.signatures.inspector.signed ? 'OK ✅' : 'Pendente ⏳'}`);

    // Recado
    if (customNote && customNote.trim()) {
      lines.push('');
      lines.push(`📢 *Aviso:* ${customNote.trim()}`);
    }

    lines.push('');
    lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`_Resumo executivo do Diário de Obra_`);
    return lines.join('\n');
  }

  // ==========================================
  // 2. FORMA COMPLETA (DETALHADA)
  // ==========================================
  lines.push(`🏗️ *RELATÓRIO DIÁRIO DE OBRA (RDO) #${report.reportNumber}*`);
  lines.push(`📅 *Data:* ${formattedDate}${dayOfWeek ? ` (${dayOfWeek})` : ''}`);
  lines.push(`🏢 *Obra:* ${report.projectInfo.projectName || 'Empreendimento'}`);
  if (report.projectInfo.location) {
    lines.push(`📍 *Local:* ${report.projectInfo.location}`);
  }
  lines.push(`👷 *Resp. Técnico:* ${engineerName}${report.projectInfo.engineerCREA ? ` (${report.projectInfo.engineerCREA})` : ''}`);
  lines.push(`🔍 *Fiscalização:* ${inspectorName}`);

  // Timeline
  if (report.projectInfo.totalDays > 0) {
    const percent = Math.min(100, Math.round(((report.projectInfo.elapsedDays || 0) / report.projectInfo.totalDays) * 100));
    lines.push(`⏳ *Prazo Contratual:* Dia ${report.projectInfo.elapsedDays || 0} de ${report.projectInfo.totalDays} (${percent}% decorrido)`);
  }

  lines.push(''); // Blank line

  // Clima
  lines.push(`☀️ *CONDIÇÕES DO TEMPO & SOLO*`);
  lines.push(`• Manhã: ${translateWeather(report.weather.morning.condition)} | Solo: ${translateGround(report.weather.morning.groundCondition)}`);
  lines.push(`• Tarde: ${translateWeather(report.weather.afternoon.condition)} | Solo: ${translateGround(report.weather.afternoon.groundCondition)}`);
  lines.push(`• Noite: ${translateWeather(report.weather.night.condition)}`);

  lines.push(''); // Blank line

  // Efetivo
  lines.push(`👥 *EFETIVO TOTAL:* ${totalWorkers} pessoas (${totalHH.toFixed(0)} Homem-Hora)`);
  lines.push(`• Mão de Obra Direta: ${directWorkers} trabalhadores`);
  if (report.directLabor.length > 0) {
    const laborDetails = report.directLabor
      .filter((dl) => Number(dl.quantity) > 0)
      .map((dl) => `${dl.role}: ${dl.quantity}`)
      .join(' | ');
    if (laborDetails) {
      lines.push(`  ↳ ${laborDetails}`);
    }
  }

  lines.push(`• Mão de Obra Indireta: ${indirectWorkers} pessoas`);
  if (report.indirectLabor.length > 0) {
    const indirectDetails = report.indirectLabor
      .filter((il) => Number(il.quantity) > 0)
      .map((il) => `${il.role}: ${il.quantity}`)
      .join(' | ');
    if (indirectDetails) {
      lines.push(`  ↳ ${indirectDetails}`);
    }
  }

  lines.push(''); // Blank line

  // Equipamentos
  if (report.equipment.length > 0) {
    lines.push(`🚜 *MÁQUINAS & EQUIPAMENTOS (${machineCount})*`);
    const operatingEquip = report.equipment
      .filter((eq) => Number(eq.quantity) > 0)
      .map((eq) => `• ${eq.name} (${eq.quantity}x): ${eq.hoursOperated || 0}h operando${eq.status === 'espera' ? ' [Em Espera]' : eq.status === 'manutencao' ? ' [Manutenção]' : ''}`);
    lines.push(...operatingEquip);
    lines.push('');
  }

  // Paralisações / Horas Paradas
  lines.push(`⏱️ *HORAS PARADAS & INTERRUPÇÕES*`);
  if (report.stoppages.length > 0) {
    lines.push(`⚠️ *Total:* ${totalStoppageHours.toFixed(1)} horas paradas`);
    report.stoppages.forEach((stp) => {
      lines.push(`• ${stp.affectedTeamOrEquipment}: ${stp.totalHours}h (${stp.startTime} às ${stp.endTime})`);
      if (stp.description) {
        lines.push(`  Motivo: ${stp.description}`);
      }
    });
  } else {
    lines.push(`✅ Nenhuma paralisação registrada no dia.`);
  }

  lines.push(''); // Blank line

  // Atividades
  lines.push(`🔨 *PRINCIPAIS ATIVIDADES DO DIA*`);
  if (report.activities.length > 0) {
    report.activities.forEach((act, idx) => {
      lines.push(`${idx + 1}. *${act.sector}* [${act.progressPercent}%]`);
      lines.push(`   ${act.description}`);
      if (act.crew) {
        lines.push(`   _Equipe:_ ${act.crew}`);
      }
    });
  } else {
    lines.push(`• Sem atividades registradas.`);
  }

  // Segurança e Meio Ambiente
  lines.push('');
  lines.push(`🦺 *SEGURANÇA DO TRABALHO & DDS*`);
  lines.push(`• DDS Realizado: ${report.safety.ddsRealized ? 'Sim ✅' : 'Não ❌'}`);
  if (report.safety.ddsRealized && report.safety.ddsTheme) {
    lines.push(`• Tema DDS: ${report.safety.ddsTheme}`);
  }
  lines.push(`• Incidentes/Acidentes: ${report.safety.incidentsReported ? `⚠️ Sim: ${report.safety.incidentDetails || 'Verificar RDO'}` : 'Nenhum incidente ✅'}`);

  // Fotos no resumo completo (se habilitado)
  if (includePhotos) {
    lines.push('');
    lines.push(`📸 *REGISTRO FOTOGRÁFICO:* ${relevantPhotos.length} foto(s) anexada(s)`);
    if (relevantPhotos.length > 0) {
      relevantPhotos.forEach((photo, idx) => {
        const sector = photo.sectorTag ? ` [${photo.sectorTag}]` : '';
        const caption = photo.caption ? `: ${photo.caption}` : '';
        lines.push(`  • Foto ${idx + 1}${sector}${caption}`);
      });
    } else {
      lines.push(`  • Nenhuma foto cadastrada neste diário.`);
    }
  }

  // Assinaturas
  lines.push('');
  lines.push(`✍️ *ASSINATURAS:*`);
  lines.push(`• Engenharia: ${report.signatures.engineer.signed ? 'Assinado digitalmente ✅' : 'Pendente de assinatura ⏳'}`);
  lines.push(`• Fiscalização: ${report.signatures.inspector.signed ? 'Assinado digitalmente ✅' : 'Pendente de assinatura ⏳'}`);

  // Custom Note if provided
  if (customNote && customNote.trim()) {
    lines.push('');
    lines.push(`📢 *OBSERVAÇÕES DO DIA / RECADOS:*`);
    lines.push(customNote.trim());
  }

  lines.push('');
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`_Relatório emitido via RDO Obras Profissional_`);

  return lines.join('\n');
}

export function openWhatsAppWithMessage(messageText: string): void {
  const encoded = encodeURIComponent(messageText);
  const url = `https://api.whatsapp.com/send?text=${encoded}`;
  
  // Try opening window
  const newWindow = window.open(url, '_blank');
  if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
    // Popup blocked, fallback to location href
    window.location.href = url;
  }
}

/**
 * Converts a data URL string to a standard File object
 */
export async function dataUrlToFile(dataUrl: string, fileName: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const mimeType = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  return new File([blob], fileName, { type: mimeType });
}

/**
 * Downloads a single photo
 */
export function downloadPhoto(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

/**
 * Copies an image dataUrl to clipboard as PNG for Ctrl+V in WhatsApp Web
 */
export async function copyImageToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.drawImage(img, 0, 0);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );

    if (!pngBlob) return false;

    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob }),
      ]);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to copy image to clipboard:', err);
    return false;
  }
}
