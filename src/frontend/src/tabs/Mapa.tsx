import React, { ReactElement, useEffect, useRef, useState } from 'react';
import L, { Map, ImageOverlay } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import styles from '../Styles/Mapa.module.css';
import MapaInterface from '../interfaces/mapaInterface';
import QueimadaInterface from '../interfaces/queimadaInterface'
import { ESTADOS_BRASIL } from '../constants/mapFilters';
import { ESTADO_CENTERS } from '../constants/mapCenters';
import 'leaflet.heat'
import { useParams } from 'react-router-dom';
import api from '../services/api';

const BIOMAS_BRASIL = [
  'Amazônia',
  'Cerrado',
  'Caatinga',
  'Pampa',
  'Pantanal',
  'Mata Atlântica'
];

const BIOMA_FILES = [
  { name: 'Amazônia', file: '/amazonia.geojson', color: '#388e3c' },
  { name: 'Cerrado', file: '/cerrado.geojson', color: '#fbc02d' },
  { name: 'Caatinga', file: '/caatinga.geojson', color: '#e65100' },
  { name: 'Pampa', file: '/pampa.geojson', color: '#0288d1' },
  { name: 'Pantanal', file: '/pantanal.geojson', color: '#8d6e63' },
  { name: 'Mata Atlântica', file: '/mata_atlantica.geojson', color: '#43a047' }
];

// Para legenda e cor dos marcadores por bioma
const BIOMA_COLORS: Record<string, string> = {
  'Amazônia': '#388e3c',
  'Cerrado': '#fbc02d',
  'Caatinga': '#e65100',
  'Pampa': '#0288d1',
  'Pantanal': '#8d6e63',
  'Mata Atlântica': '#43a047'
};

const Mapa: React.FC<MapaInterface> = (
  { item }: MapaInterface
): ReactElement => {
  const mapRef = useRef<Map | null>(null);

  const brasilLayerRef = useRef<L.GeoJSON | null>(null);
  const estadoLayerRef = useRef<L.GeoJSON | null>(null);
  const biomasLayerRefs = useRef<{ [key: string]: L.GeoJSON | null }>({});
  const leafletMarkersRef = useRef<L.Marker[]>([]);
  const heatLayerRef = useRef<L.Layer | null>(null)

  const [geojsonEstados, setGeojsonEstados] = useState<any>(null);
  const [biomasGeojsons, setBiomasGeojsons] = useState<{ [bioma: string]: any }>({});


  const [mapType, setMapType] = useState<'estado' | 'bioma'>('estado');
  let propItem = 'focos'
  if (item !== undefined) {
    propItem = String(item)
  }
  const [dataType, setDataType] = useState<string>(propItem);
  const [estado, setEstado] = useState<string>('');
  const [estadoFiltrado, setEstadoFiltrado] = useState<string>('');
  const [bioma, setBioma] = useState<string>('');
  const [biomaFiltrado, setBiomaFiltrado] = useState<string>('');
  const [detailType, setDetailType] = useState<string>('marcadores')
  const [markers, setMarkers] = useState<{ geocode: [number, number]; popUp: string }[]>([]);
  const [mostrarImagemRisco, setMostrarImagemRisco] = useState(false);
  const [mediaRiscoFogo, setMediaRiscoFogo] = useState<string | null>(null);
  const hoje = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(hoje)
  const [endDate, setEndDate] = useState<string>(hoje)
  const [imagemOverlay, setImagemOverlay] = useState<L.ImageOverlay | null>(null)

  useEffect(() => {
    fetch('/brazil-states.geojson')
      .then(res => res.json())
      .then(data => setGeojsonEstados(data));

    BIOMA_FILES.forEach(({ name, file }) => {
      fetch(file)
        .then(res => res.json())
        .then(data => {
          setBiomasGeojsons(prev => ({ ...prev, [name]: data }));
        });
    });
  }, []);

  // Estados layer
  useEffect(() => {
    if (!mapRef.current || !geojsonEstados) return;

    if (brasilLayerRef.current) {
      brasilLayerRef.current.remove();
      brasilLayerRef.current = null;
    }
    if (estadoLayerRef.current) {
      estadoLayerRef.current.remove();
      estadoLayerRef.current = null;
    }

    if (mapType !== 'estado') return;

    const brasilLayer = L.geoJSON(geojsonEstados, {
      style: {
        color: '#000',
        weight: 1.8,
        fillColor: 'transparent',
        fillOpacity: 0,
        opacity: 1,
      },
      interactive: false
    });
    brasilLayer.addTo(mapRef.current);
    brasilLayerRef.current = brasilLayer;

    if (estadoFiltrado) {
      const estadoLayer = L.geoJSON(geojsonEstados, {
        filter: feature => {
          const props = feature?.properties as any;
          return (
            props &&
            (
              props.name === estadoFiltrado ||
              props.sigla === estadoFiltrado ||
              props.NOME === estadoFiltrado ||
              props.UF === estadoFiltrado
            )
          );
        },
        style: {
          color: '#1976d2',
          weight: 3,
          fillColor: '#bbdefb',
          fillOpacity: 0.18,
          opacity: 0.9,
        },
        onEachFeature: (feature, layer) => {
          const props = feature?.properties as any;
          if (props && props.name) {
            layer.bindPopup(props.name);
          }
        }
      });
      estadoLayer.addTo(mapRef.current);
      estadoLayerRef.current = estadoLayer;
    }
  }, [geojsonEstados, mapType, estadoFiltrado]);

  // Biomas layer (um ou todos)
  useEffect(() => {
    if (!mapRef.current) return;

    Object.values(biomasLayerRefs.current).forEach(layer => {
      if (layer) {
        layer.remove();
      }
    });
    biomasLayerRefs.current = {};

    if (mapType !== 'bioma') return;

    BIOMA_FILES.forEach(({ name, color }) => {
      const geojson = biomasGeojsons[name];
      if (!geojson) return;

      if (biomaFiltrado && biomaFiltrado !== name) return;

      const layer = L.geoJSON(geojson, {
        style: {
          color,
          weight: 2.5,
          fillOpacity: 0.15,
          opacity: 0.9,
        },
        onEachFeature: (feature, lyr) => {
          lyr.bindPopup(name);
        },
      });
      layer.addTo(mapRef.current!);
      biomasLayerRefs.current[name] = layer;
    });

    if (
      mapType === 'bioma' &&
      biomaFiltrado &&
      biomasLayerRefs.current[biomaFiltrado]
    ) {
      const layer = biomasLayerRefs.current[biomaFiltrado];
      const bounds = layer!.getBounds();
      if (bounds.isValid()) {
        mapRef.current!.fitBounds(bounds, { maxZoom: 6 });
      }
    }
  }, [biomasGeojsons, mapType, biomaFiltrado]);

  // Inicializa o mapa
  useEffect(() => {

    const mapDiv = document.getElementById('mapid');
    if (!mapDiv) return;

    if (mapRef.current === null) {
      const brazilBounds: L.LatLngBoundsExpression = [
        [-33.75, -73.99],
        [5.27, -34.79],
      ];
      const map = L.map('mapid', {
        center: [-14.235, -51.9253],
        zoom: 4,
        maxBounds: brazilBounds,
        maxBoundsViscosity: 1.0,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap contributors',
      }).addTo(map);
      mapRef.current = map;
    }
  }, [dataType]);

  useEffect(() => {
    if (dataType !== 'imagem-risco' && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 100);
    }
  }, [dataType])

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove overlay antigo se existir
    if (imagemOverlay) {
      mapRef.current.removeLayer(imagemOverlay);
      setImagemOverlay(null);
    }

    if (dataType === 'imagem-risco') {
      const bounds: L.LatLngBoundsExpression = [
        [-33.75, -73.99],
        [5.27, -34.79]
      ]

      const overlay = L.imageOverlay(
        '/mapa-risco-overlay-v4.png',
        bounds,
        { opacity: 0.5, interactive: false }
      )
      overlay.addTo(mapRef.current)
      setImagemOverlay(overlay)
    }
  }, [dataType, mapRef.current])

  // --- Marcadores ---
  const defaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // esconde o mapa quando escolhe imagem risco de fogo
  useEffect(() => {
    if (!mapRef.current) return;

    leafletMarkersRef.current.forEach(marker => marker.remove());
    leafletMarkersRef.current = [];

    markers.forEach(({ geocode, popUp }) => {
      const marker = L.marker(geocode, { icon: defaultIcon }).addTo(mapRef.current!)
      if (popUp) marker.bindPopup(popUp)
      leafletMarkersRef.current.push(marker)
    })
  }, [markers]);

  // --- heatmap ---
  function atualizarHeatmap(markersParaMapa: { geocode: [number, number] }[]) {
    if (!mapRef.current) return;

    // debup
    console.log('Markers para heatmap:', markersParaMapa)

    // Remove heatmap antigo
    if (heatLayerRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    // Adiciona novo heatmap
    const heatPoints = markersParaMapa.map(m => [
      Number(m.geocode[0]),
      Number(m.geocode[1]),
      10
    ]);
    // debug
    console.log('heatPoints para heatLayer:', heatPoints)
    if (heatPoints.length > 0) {
      const HeatLayer = (L as any).heatLayer
      console.log('mapRef.current:', mapRef.current)
      heatLayerRef.current = HeatLayer(heatPoints, {
        radius: 15,
        blur: 5,
        maxZoom: 15,
        minOpacity: 0.5,
        gradient: {
          0.4: 'blue',
          0.6: 'cyan',
          0.7: 'lime',
          0.8: 'yellow',
          1.0: 'red'
        }
      }).addTo(mapRef.current);
    }
  }

  // limpar o heatmap
  function limparHeatmap() {
    if (heatLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
  }

  // limpar marcadores
  function limparMarcadores() {
    if (leafletMarkersRef.current) {
      leafletMarkersRef.current.forEach(marker => marker.remove())
      leafletMarkersRef.current = []
    }
  }

  // --- Backend fetch dos pontos ---
  const fetchPontosPeriodo = async (startDate: string, endDate: string) => {
    let url = '';
    if (dataType === 'focos') url = '/focos-pontos';
    else if (dataType === 'riscos') url = '/riscos-pontos';
    else if (dataType === 'queimadas') url = '/queimadas-pontos';

    if (!url) return [];

    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (mapType === 'estado' && estado) params.estado = estado;
    if (mapType === 'bioma' && bioma) params.bioma = bioma;

    try {
      const response = await api.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar pontos:', error);
      return [];
    }
  }

  // --- Filtro dos pontos ---
  function filtrarPontos(
    pontos: any[],
    filtros: { estado?: string; bioma?: string; mapType: 'estado' | 'bioma' }
  ) {
    const { estado, bioma, mapType } = filtros;
    return pontos.filter((p: any) => {
      let ok = true;
      if (mapType === 'estado' && estado) ok = ok && String(p.estado).toUpperCase() === String(estado).toUpperCase();
      if (mapType === 'bioma' && bioma) ok = ok && p.bioma === bioma;
      return ok;
    });
  }

  // --- Handler do filtro ---
  const handleFilterApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setMostrarImagemRisco(false)

    setEstadoFiltrado(mapType === 'estado' ? estado : '');
    setBiomaFiltrado(mapType === 'bioma' ? bioma : '');

    // Exemplo de data fixa, ajuste para seu caso!
    const todosPontos = await fetchPontosPeriodo(startDate, endDate)

    console.log('Fetch terminou! Dados recebidos:', todosPontos)

    const pontosFiltrados = filtrarPontos(todosPontos, {
      estado,
      bioma,
      mapType
    });

    console.log('Coordenadas dos pontos filtrados:', pontosFiltrados.map(p => ({
      lat: p.lat ?? p.latitude,
      lon: p.lon ?? p.longitude
    })))

    const riscosValidos = pontosFiltrados
      .map(p => Number(p.risco_fogo))
      .filter(rf => !isNaN(rf) && rf >= 0)

    const media = dataType === 'riscos' && riscosValidos.length > 0
      ? (riscosValidos.reduce((acc, rf) => acc + rf, 0) / riscosValidos.length).toFixed(2)
      : null
    setMediaRiscoFogo(media)

    const markersParaMapa = pontosFiltrados.map((item: any) => ({
      geocode: [
        Number(item.lat ?? item.latitude),
        Number(item.lon ?? item.longitude)
      ] as [number, number],
      popUp: `${item.municipio || ''} - ${item.estado || ''} (${item.data_hora_gmt})` +
        (item.risco_fogo !== undefined
          ? (Number(item.risco_fogo) < 0
            ? `<br/>Risco de Fogo: <b>Indisponível</b>`
            : `<br/>Risco de Fogo: <b>${Number(item.risco_fogo).toFixed(2)}</b>`)
          : '')
    }))

    console.log('Markers para o mapa:', markersParaMapa)

    if (detailType === 'marcadores') {
      limparHeatmap()
      limparMarcadores()
      setMarkers(markersParaMapa)
    }

    if (detailType === 'calor') {
      limparHeatmap()
      limparMarcadores()
      atualizarHeatmap(markersParaMapa)
    }

    if (mapRef.current && mapType === 'estado' && estado && ESTADO_CENTERS[estado]) {
      mapRef.current.setView(ESTADO_CENTERS[estado], 7);
    }
  };

  return (
    <div>
      <section className={styles.container}>
        <form className={styles.filterPanel} onSubmit={handleFilterApply}>
          <h2>Filtros</h2>
          <div className={styles.radioGroup}>
            <p>Tipo de mapa:</p>
            <label>
              <input
                type="radio"
                name="mapType"
                value="estado"
                checked={mapType === 'estado'}
                onChange={() => setMapType('estado')}
              />
              Estados
            </label>
            <label>
              <input
                type="radio"
                name="mapType"
                value="bioma"
                checked={mapType === 'bioma'}
                onChange={() => setMapType('bioma')}
              />
              Biomas
            </label>
          </div>

          <div className={styles.radioGroup}>
            <p>Tipo de dados:</p>
            <label>
              <input
                type="radio"
                name="dataType"
                value="focos"
                checked={dataType === 'focos'}
                onChange={() => setDataType('focos')}
              />
              Focos de Calor
            </label>
            <label>
              <input
                type="radio"
                name="dataType"
                value="riscos"
                checked={dataType === 'riscos'}
                onChange={() => setDataType('riscos')}
              />
              Riscos de Fogo (Mapa)
            </label>
            <label>
              <input
                type="radio"
                name="dataType"
                value="imagem-risco"
                checked={dataType === 'imagem-risco'}
                onChange={() => setDataType('imagem-risco')}
              />
              Riscos de Fogo (Imagem)
            </label>
            <label>
              <input
                type="radio"
                name="dataType"
                value="queimadas"
                checked={dataType === 'queimadas'}
                onChange={() => setDataType('queimadas')}
              />
              Áreas Queimadas
            </label>
          </div>

          <div className={styles.radioGroup}>
            <p>Tipo de detalhes:</p>
            <label>
              <input
                type="radio"
                name="detailType"
                value="marcadores"
                checked={detailType === 'marcadores'}
                onChange={() => setDetailType('marcadores')}
              />
              Marcadores
            </label>
            <label>
              <input
                type="radio"
                name="detailType"
                value="calor"
                checked={detailType === 'calor'}
                onChange={() => setDetailType('calor')}
              />
              Mapa de Calor
            </label>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="startDate">Data inicial: </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              max={endDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label htmlFor="endDate">Data final: </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>

          {mapType === 'estado' && (
            <div className={styles.selectGroup}>
              <select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Estado</option>
                {ESTADOS_BRASIL.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mapType === 'bioma' && (
            <div className={styles.selectGroup}>
              <select value={bioma} onChange={e => setBioma(e.target.value)}>
                <option value="">Todos</option>
                {BIOMAS_BRASIL.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button className={styles.applyButton} type="submit">
            Ativar Filtros
          </button>

          {mapType === 'bioma' && (
            <div style={{ marginTop: "1rem", display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {BIOMA_FILES.map(({ name, color }) => (
                <div key={name} style={{ display: "flex", alignItems: "center", minWidth: 140 }}>
                  <span style={{
                    display: "inline-block",
                    width: 20,
                    height: 20,
                    borderRadius: 4,
                    marginRight: 8,
                    background: color,
                    border: "1.5px solid #333"
                  }} />
                  <span style={{ fontSize: 14 }}>{name}</span>
                </div>
              ))}
            </div>
          )}
        </form>

        <div style={{ flex: 1, height: '80vh', position: 'relative' }}>
          <div id="mapid" className={styles.map}></div>
          {dataType !== 'imagem-risco' && (
            <div className={styles.mapLegend}>
              <strong>Legenda</strong>
              <ul style={{ margin: '0.5rem 0 0 0', padding: 0, listStyle: 'none' }}>
                {dataType === 'focos' && (
                  <>
                    <li>
                      <span style={{
                        display: 'inline-block', width: 16, height: 16, background: '#1976d2', borderRadius: 3, marginRight: 8, border: '1px solid #333'
                      }} /> Foco de calor detectado
                    </li>
                    <li>Quantidade: <b>{markers.length}</b></li>
                  </>
                )}
                {dataType === 'riscos' && (
                  <>
                    {detailType === 'marcadores' && (
                      <li>
                        <span style={{
                          display: 'inline-block', width: 16, height: 16, background: '#e65100', borderRadius: 3, marginRight: 8, border: '1px solid #333'
                        }} /> Marcador: ponto com risco de fogo
                      </li>
                    )}
                    {detailType === 'calor' && (
                      <li>
                        <span style={{
                          display: 'inline-block', width: 16, height: 16, background: 'linear-gradient(90deg, blue, cyan, lime, yellow, red)', borderRadius: 3, marginRight: 8, border: '1px solid #333'
                        }} /> Heatmap: intensidade do risco de fogo
                      </li>
                    )}
                    <li>Quantidade: <b>{markers.length}</b></li>
                    <li>
                      Intensidade média: <b style={{ color: '#ffb300' }}>
                        {mediaRiscoFogo !== null ? mediaRiscoFogo : 'Não disponível'}
                      </b>
                    </li>
                  </>
                )}
                {dataType === 'queimadas' && (
                  <>
                    <li>
                      <span style={{
                        display: 'inline-block', width: 16, height: 16, background: '#8d6e63', borderRadius: 3, marginRight: 8, border: '1px solid #333'
                      }} /> Área queimada detectada
                    </li>
                    <li>Quantidade: <b>{markers.length}</b></li>
                  </>
                )}
                {(biomaFiltrado || estadoFiltrado) && (
                  <li style={{ marginTop: 8, fontSize: 13 }}>
                    <b>Filtros:</b>
                    {biomaFiltrado && <> Bioma: {biomaFiltrado};</>}
                    {estadoFiltrado && <> Estado: {estadoFiltrado};</>}
                  </li>
                )}
                <li style={{ marginTop: 8, fontSize: 12 }}>
                  Fonte: INPE / Projeto MYOPES
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Mapa