export type WeatherCondition = 'ensolarado' | 'nublado' | 'parcialmente_nublado' | 'chuva_fraca' | 'chuva_forte' | 'tempestade';
export type GroundCondition = 'seco' | 'praticavel' | 'impraticavel';

export interface WeatherPeriod {
  condition: WeatherCondition;
  groundCondition: GroundCondition;
  temperature?: number;
  rainMm?: number;
  notes?: string;
}

export interface DayWeather {
  morning: WeatherPeriod;
  afternoon: WeatherPeriod;
  night: WeatherPeriod;
  autoFetched?: boolean;
  fetchedCity?: string;
  fetchedTemp?: number;
  fetchedHumidity?: number;
  fetchedDescription?: string;
}

export interface DirectLaborItem {
  id: string;
  role: string;
  company: string; // Próprio ou Empreiteira
  quantity: number;
  hoursWorked: number;
}

export interface IndirectLaborItem {
  id: string;
  role: string;
  quantity: number;
  hoursWorked: number;
}

export type EquipmentStatus = 'operando' | 'espera' | 'manutencao';

export interface EquipmentItem {
  id: string;
  name: string;
  codeOrPlate: string;
  quantity: number;
  status: EquipmentStatus;
  hoursOperated: number;
  hoursStandby: number;
  hoursMaintenance: number;
}

export type StoppageReason = 
  | 'clima_chuva' 
  | 'falta_material' 
  | 'quebra_equipamento' 
  | 'seguranca_acidente' 
  | 'falta_energia_agua' 
  | 'liberacao_projeto' 
  | 'greve_fiscalizacao' 
  | 'outros';

export interface WorkStoppageItem {
  id: string;
  reason: StoppageReason;
  customReason?: string;
  affectedTeamOrEquipment: string; // Ex: "Equipe de Concretagem" ou "Escavadeira CAT 320"
  startTime: string; // "09:30"
  endTime: string;   // "11:45"
  totalHours: number; // 2.25
  impactLevel: 'baixo' | 'medio' | 'critico';
  description: string;
}

export type ActivityStatus = 'iniciado' | 'em_andamento' | 'concluido' | 'paralisado';

export interface ActivityItem {
  id: string;
  sector: string; // Ex: "Bloco A - Fundação", "Torre 1 - Pavimento 4"
  description: string;
  progressPercent: number; // 0 - 100
  status: ActivityStatus;
  safetyDDS: boolean;
  crew: string; // Equipe responsável
  notes?: string;
}

export interface FieldPhoto {
  id: string;
  base64Data: string;
  caption: string;
  sectorTag: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  takenOffline: boolean;
}

export interface SafetyAndEnvironment {
  ddsRealized: boolean;
  ddsTheme: string;
  incidentsReported: boolean;
  incidentDetails?: string;
  epiInspectionStatus: 'conforme' | 'atencao' | 'irregular';
  wasteManagementNotes?: string;
}

export interface ProjectInfo {
  projectName: string;
  codeOrContract: string;
  artNumber: string;
  clientName: string;
  location: string;
  engineerName: string;
  engineerCREA: string;
  clientInspector: string;
  totalDays: number;
  elapsedDays: number;
  startDate: string;
}

export interface SignatureBlock {
  signed: boolean;
  signerName: string;
  signerRole: string; // "Responsável Técnico" | "Fiscalização"
  signatureDataUrl?: string; // Canvas base64
  signedAt?: string;
}

export type RDOSyncStatus = 'synced' | 'pending_sync' | 'draft';

export interface RDOReport {
  id: string;
  reportNumber: number; // Sequencial ex: 45
  date: string; // YYYY-MM-DD
  projectInfo: ProjectInfo;
  weather: DayWeather;
  directLabor: DirectLaborItem[];
  indirectLabor: IndirectLaborItem[];
  equipment: EquipmentItem[];
  stoppages: WorkStoppageItem[];
  activities: ActivityItem[];
  safety: SafetyAndEnvironment;
  photos: FieldPhoto[];
  signatures: {
    engineer: SignatureBlock;
    inspector: SignatureBlock;
  };
  generalNotes: string;
  syncStatus: RDOSyncStatus;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}
