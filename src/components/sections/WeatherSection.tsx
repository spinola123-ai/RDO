import React, { useState } from 'react';
import { CloudSun, Sun, Cloud, CloudRain, CloudLightning, MapPin, RefreshCw, Compass, AlertCircle, CheckCircle2 } from 'lucide-react';
import { DayWeather, GroundCondition, WeatherCondition, WeatherPeriod } from '../../types/rdo';
import { BRAZILIAN_STATES, fetchWeatherByCityAndState, getCurrentGPSCoordinates, populateDayWeatherFromFetch } from '../../services/weather';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface WeatherSectionProps {
  weather: DayWeather;
  onUpdateWeather: (weather: DayWeather) => void;
}

export const WeatherSection: React.FC<WeatherSectionProps> = ({ weather, onUpdateWeather }) => {
  const isOnline = useOnlineStatus();
  const [isFetchingWeather, setIsFetchingWeather] = useState(false);
  const [selectedState, setSelectedState] = useState<string>('SP');
  const [cityNameInput, setCityNameInput] = useState<string>('São Paulo');
  const [fetchMessage, setFetchMessage] = useState<string | null>(null);

  const handleFetchAutoWeather = async (useGPS = false) => {
    setIsFetchingWeather(true);
    setFetchMessage(null);

    try {
      if (useGPS) {
        try {
          const gps = await getCurrentGPSCoordinates();
          const res = await import('../../services/weather').then(m => m.fetchWeatherByCoordinates(gps.lat, gps.lng, `GPS (${gps.lat.toFixed(3)}, ${gps.lng.toFixed(3)})`));
          if (res.success) {
            const newDayWeather = populateDayWeatherFromFetch(res);
            onUpdateWeather(newDayWeather);
            setFetchMessage(`Clima atualizado via GPS para ${res.cityName}: ${res.temperature}°C, ${res.humidity}% umidade.`);
            setIsFetchingWeather(false);
            return;
          }
        } catch {
          setFetchMessage('GPS indisponível. Buscando pelo Estado e Cidade digitados...');
        }
      }

      if (!cityNameInput.trim()) {
        setFetchMessage('Por favor, digite o nome da cidade.');
        setIsFetchingWeather(false);
        return;
      }

      const res = await fetchWeatherByCityAndState(selectedState, cityNameInput.trim());
      if (res.success) {
        const newDayWeather = populateDayWeatherFromFetch(res);
        onUpdateWeather(newDayWeather);
        setFetchMessage(`Clima atualizado com sucesso para ${res.cityName}: ${res.temperature}°C, ${res.humidity}% umidade, ${res.description}.`);
      } else {
        setFetchMessage(`Aviso: ${res.description}`);
      }
    } catch {
      setFetchMessage('Não foi possível conectar à API de meteorologia. Preencha manualmente.');
    } finally {
      setIsFetchingWeather(false);
    }
  };

  const updatePeriod = (periodKey: 'morning' | 'afternoon' | 'night', updates: Partial<WeatherPeriod>) => {
    onUpdateWeather({
      ...weather,
      [periodKey]: {
        ...weather[periodKey],
        ...updates,
      },
    });
  };

  const conditionIcons: Record<WeatherCondition, React.ReactNode> = {
    ensolarado: <Sun className="w-5 h-5 text-amber-500" />,
    parcialmente_nublado: <CloudSun className="w-5 h-5 text-amber-500" />,
    nublado: <Cloud className="w-5 h-5 text-slate-400" />,
    chuva_fraca: <CloudRain className="w-5 h-5 text-sky-500" />,
    chuva_forte: <CloudRain className="w-5 h-5 text-blue-700" />,
    tempestade: <CloudLightning className="w-5 h-5 text-purple-600" />,
  };

  const conditionLabels: Record<WeatherCondition, string> = {
    ensolarado: 'Ensolarado / Limpo',
    parcialmente_nublado: 'Parcialmente Nublado',
    nublado: 'Nublado',
    chuva_fraca: 'Chuva Fraca / Garoa',
    chuva_forte: 'Chuva Forte',
    tempestade: 'Tempestade / Raios',
  };

  const groundLabels: Record<GroundCondition, { label: string; color: string; desc: string }> = {
    seco: { label: 'Seco', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', desc: 'Sem restrições para trabalho e tráfego' },
    praticavel: { label: 'Praticável', color: 'bg-amber-100 text-amber-800 border-amber-300', desc: 'Trabalho possível com cautela' },
    impraticavel: { label: 'Impraticável', color: 'bg-rose-100 text-rose-800 border-rose-300', desc: 'Paralisação necessária por lama/alagamento' },
  };

  const renderPeriodCard = (
    title: string,
    periodKey: 'morning' | 'afternoon' | 'night',
    periodData: WeatherPeriod
  ) => {
    return (
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <span className="font-bold text-sm text-slate-800 flex items-center gap-2">
            {conditionIcons[periodData.condition]}
            Turno: {title}
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
            {periodData.temperature ? `${periodData.temperature}°C` : '--'}
          </span>
        </div>

        {/* Condition select */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            Condição do Céu:
          </label>
          <select
            value={periodData.condition}
            onChange={(e) => updatePeriod(periodKey, { condition: e.target.value as WeatherCondition })}
            className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:border-sky-500"
          >
            {Object.entries(conditionLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Ground Condition select */}
        <div>
          <label className="text-[11px] font-semibold text-slate-600 block mb-1">
            Condição do Terreno / Solo:
          </label>
          <div className="grid grid-cols-3 gap-1">
            {(['seco', 'praticavel', 'impraticavel'] as GroundCondition[]).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => updatePeriod(periodKey, { groundCondition: g })}
                className={`py-1 px-1.5 rounded-md text-[11px] font-bold border transition text-center ${
                  periodData.groundCondition === g
                    ? groundLabels[g].color + ' shadow-xs ring-1 ring-offset-1 ring-slate-400'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
                title={groundLabels[g].desc}
              >
                {groundLabels[g].label}
              </button>
            ))}
          </div>
        </div>

        {/* Temperature & Rain input */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Temp. (°C):</label>
            <input
              type="number"
              value={periodData.temperature || ''}
              onChange={(e) => updatePeriod(periodKey, { temperature: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              placeholder="Ex: 26"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 block mb-0.5">Chuva (mm):</label>
            <input
              type="number"
              value={periodData.rainMm || ''}
              onChange={(e) => updatePeriod(periodKey, { rainMm: parseFloat(e.target.value) || 0 })}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs"
              placeholder="Ex: 0"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] font-semibold text-slate-700 block mb-1">Observação do Turno / Clima:</label>
          <textarea
            rows={2}
            value={periodData.notes || ''}
            onChange={(e) => updatePeriod(periodKey, { notes: e.target.value })}
            placeholder="Ex: Ventos fortes com poeira; serviços de guindaste pausados temporariamente."
            className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-800 text-xs focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <CloudSun className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Condições Climáticas & Pluviometria</h2>
            <p className="text-xs text-slate-500">
              Clima por turnos e praticabilidade do canteiro de obras (com integração API automática)
            </p>
          </div>
        </div>

        {/* Auto Weather Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* State Select */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Estado:</span>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden py-0.5 pr-1"
            >
              {BRAZILIAN_STATES.map((s) => (
                <option key={s.uf} value={s.uf}>{s.uf} - {s.name}</option>
              ))}
            </select>
          </div>

          {/* City Input */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg px-2 py-1 border border-slate-200">
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              value={cityNameInput}
              onChange={(e) => setCityNameInput(e.target.value)}
              placeholder="Digite a cidade..."
              className="bg-transparent text-xs font-medium text-slate-800 focus:outline-hidden w-28 sm:w-36"
            />
          </div>

          <button
            type="button"
            onClick={() => handleFetchAutoWeather(false)}
            disabled={isFetchingWeather}
            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
            title="Atualizar clima automaticamente via API integrada Open-Meteo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingWeather ? 'animate-spin' : ''}`} />
            {isFetchingWeather ? 'Consultando...' : 'Obter Clima'}
          </button>

          <button
            type="button"
            onClick={() => handleFetchAutoWeather(true)}
            disabled={isFetchingWeather}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 disabled:opacity-50"
            title="Usar localização GPS do dispositivo"
          >
            <Compass className="w-3.5 h-3.5" />
            GPS
          </button>
        </div>
      </div>

      {/* Online/Offline status alert */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Dispositivo desconectado da internet. A API de clima não pode ser contatada online, mas você pode preencher ou manter as condições salvas no aparelho normalmente.
          </span>
        </div>
      )}

      {/* Message from Fetch */}
      {fetchMessage && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-800 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span>{fetchMessage}</span>
        </div>
      )}

      {/* If auto-fetched previously, display badge */}
      {weather.autoFetched && weather.fetchedCity && (
        <div className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between text-slate-600">
          <span>
            Dados meteorológicos integrados para: <strong>{weather.fetchedCity}</strong>
            {weather.fetchedTemp && ` (${weather.fetchedTemp}°C, ${weather.fetchedHumidity}% umidade)`}
          </span>
          <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
            API Integrada
          </span>
        </div>
      )}

      {/* 3 Periods: Morning, Afternoon, Night */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {renderPeriodCard('Manhã (07h às 12h)', 'morning', weather.morning)}
        {renderPeriodCard('Tarde (13h às 17h)', 'afternoon', weather.afternoon)}
        {renderPeriodCard('Noite / Vigia (18h às 06h)', 'night', weather.night)}
      </div>
    </div>
  );
};
