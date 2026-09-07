import { DayWeather, GroundCondition, WeatherCondition, WeatherPeriod } from '../types/rdo';

export interface WeatherFetchResult {
  success: boolean;
  temperature: number;
  humidity: number;
  condition: WeatherCondition;
  groundCondition: GroundCondition;
  description: string;
  rainMm: number;
  cityName?: string;
  error?: string;
}

// Pre-defined coordinates for major Brazilian construction regions
export const BRAZILIAN_CITIES: Record<string, { lat: number; lng: number; name: string; state: string }> = {
  'sp': { lat: -23.5505, lng: -46.6333, name: 'São Paulo', state: 'SP' },
  'rj': { lat: -22.9068, lng: -43.1729, name: 'Rio de Janeiro', state: 'RJ' },
  'bh': { lat: -19.9167, lng: -43.9345, name: 'Belo Horizonte', state: 'MG' },
  'bsb': { lat: -15.7975, lng: -47.8919, name: 'Brasília', state: 'DF' },
  'cwb': { lat: -25.4284, lng: -49.2733, name: 'Curitiba', state: 'PR' },
  'poa': { lat: -30.0346, lng: -51.2177, name: 'Porto Alegre', state: 'RS' },
  'ssa': { lat: -12.9777, lng: -38.5016, name: 'Salvador', state: 'BA' },
  'rec': { lat: -8.0476, lng: -34.8770, name: 'Recife', state: 'PE' },
  'for': { lat: -3.7319, lng: -38.5267, name: 'Fortaleza', state: 'CE' },
  'gyn': { lat: -16.6869, lng: -49.2648, name: 'Goiânia', state: 'GO' },
  'vix': { lat: -20.3155, lng: -40.3128, name: 'Vitória', state: 'ES' },
  'bel': { lat: -1.4558, lng: -48.4902, name: 'Belém', state: 'PA' },
  'cba': { lat: -15.6014, lng: -56.0979, name: 'Cuiabá', state: 'MT' },
  'cgr': { lat: -20.4697, lng: -54.6201, name: 'Campo Grande', state: 'MS' },
  'fln': { lat: -27.5954, lng: -48.5480, name: 'Florianópolis', state: 'SC' },
};

export function mapWMOCodeToCondition(code: number, rainMm = 0): { condition: WeatherCondition; ground: GroundCondition; desc: string } {
  if (code === 0) {
    return { condition: 'ensolarado', ground: 'seco', desc: 'Céu limpo / Ensolarado' };
  }
  if (code >= 1 && code <= 3) {
    return { condition: code === 1 ? 'parcialmente_nublado' : 'nublado', ground: 'seco', desc: code === 1 ? 'Parcialmente Nublado' : 'Nublado' };
  }
  if (code === 45 || code === 48) {
    return { condition: 'nublado', ground: 'praticavel', desc: 'Nevoeiro / Neblina matinal' };
  }
  if (code >= 51 && code <= 67) {
    return { condition: 'chuva_fraca', ground: rainMm > 4 ? 'impraticavel' : 'praticavel', desc: 'Garoa / Chuva Fraca' };
  }
  if (code >= 71 && code <= 77) {
    return { condition: 'chuva_fraca', ground: 'praticavel', desc: 'Precipitação leve' };
  }
  if (code >= 80 && code <= 82) {
    return { condition: 'chuva_forte', ground: 'impraticavel', desc: 'Pancadas de Chuva Forte' };
  }
  if (code >= 95) {
    return { condition: 'tempestade', ground: 'impraticavel', desc: 'Tempestade com trovoadas' };
  }
  return { condition: 'parcialmente_nublado', ground: 'praticavel', desc: 'Tempo Variável' };
}

export async function fetchWeatherByCoordinates(lat: number, lng: number, locationLabel?: string): Promise<WeatherFetchResult> {
  if (!navigator.onLine) {
    return {
      success: false,
      temperature: 25,
      humidity: 60,
      condition: 'parcialmente_nublado',
      groundCondition: 'praticavel',
      description: 'Sem conexão com a internet (Offline). Usando apontamento manual.',
      rainMm: 0,
      error: 'offline',
    };
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,weather_code,precipitation&timezone=auto`;
    const response = await fetch(url, { signal: AbortSignal.timeout(6000) });
    
    if (!response.ok) {
      throw new Error(`Erro API Clima: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;
    const temp = Math.round(current.temperature_2m);
    const humidity = Math.round(current.relative_humidity_2m);
    const rain = Number(current.precipitation) || 0;
    const weatherCode = Number(current.weather_code) || 0;

    const { condition, ground, desc } = mapWMOCodeToCondition(weatherCode, rain);

    return {
      success: true,
      temperature: temp,
      humidity,
      condition,
      groundCondition: ground,
      description: desc,
      rainMm: rain,
      cityName: locationLabel || `${lat.toFixed(3)}, ${lng.toFixed(3)}`,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Falha na requisição';
    return {
      success: false,
      temperature: 26,
      humidity: 65,
      condition: 'parcialmente_nublado',
      groundCondition: 'praticavel',
      description: 'Não foi possível consultar o clima online. Ajuste manualmente.',
      rainMm: 0,
      error: errorMessage,
    };
  }
}

export function getCurrentGPSCoordinates(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocalização não suportada no dispositivo'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      (err) => {
        reject(err);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  });
}

export const BRAZILIAN_STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

export async function fetchWeatherByCityAndState(state: string, cityName: string): Promise<WeatherFetchResult> {
  if (!navigator.onLine) {
    return {
      success: false,
      temperature: 25,
      humidity: 60,
      condition: 'parcialmente_nublado',
      groundCondition: 'praticavel',
      description: 'Sem conexão com a internet (Offline). Usando apontamento manual.',
      rainMm: 0,
      error: 'offline',
    };
  }

  try {
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=10&language=pt&format=json`;
    const geoRes = await fetch(geoUrl, { signal: AbortSignal.timeout(6000) });
    if (!geoRes.ok) throw new Error('Falha ao buscar coordenadas da cidade');
    const geoData = await geoRes.json();

    let bestResult = null;
    if (geoData && geoData.results && geoData.results.length > 0) {
      bestResult = geoData.results.find((r: any) => 
        r.country_code === 'BR'
      ) || geoData.results[0];
    }

    if (!bestResult) {
      throw new Error(`Cidade "${cityName}" não encontrada.`);
    }

    const lat = bestResult.latitude;
    const lng = bestResult.longitude;
    const resolvedName = `${bestResult.name} - ${state.toUpperCase()}`;

    return await fetchWeatherByCoordinates(lat, lng, resolvedName);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Falha na requisição';
    return {
      success: false,
      temperature: 26,
      humidity: 65,
      condition: 'parcialmente_nublado',
      groundCondition: 'praticavel',
      description: `Cidade não localizada (${errorMessage}). Preencha manualmente se necessário.`,
      rainMm: 0,
      error: errorMessage,
    };
  }
}

export function createDefaultPeriodWeather(cond: WeatherCondition = 'ensolarado', ground: GroundCondition = 'seco', temp = 26): WeatherPeriod {
  return {
    condition: cond,
    groundCondition: ground,
    temperature: temp,
    rainMm: 0,
    notes: '',
  };
}

export function populateDayWeatherFromFetch(result: WeatherFetchResult): DayWeather {
  return {
    morning: {
      condition: result.condition,
      groundCondition: result.groundCondition,
      temperature: Math.max(18, result.temperature - 2),
      rainMm: result.rainMm,
      notes: result.description,
    },
    afternoon: {
      condition: result.condition,
      groundCondition: result.groundCondition,
      temperature: result.temperature + 2,
      rainMm: result.rainMm,
      notes: result.description,
    },
    night: {
      condition: result.condition === 'ensolarado' ? 'claro' as WeatherCondition : result.condition,
      groundCondition: result.groundCondition,
      temperature: Math.max(16, result.temperature - 4),
      rainMm: 0,
      notes: '',
    },
    autoFetched: true,
    fetchedCity: result.cityName,
    fetchedTemp: result.temperature,
    fetchedHumidity: result.humidity,
    fetchedDescription: result.description,
  };
}
