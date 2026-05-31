import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import { Icons } from '../ui/Icons';

const MOTIVOS = [
  { value: 'TODOS', label: 'Todos los motivos' },
  { value: 'BAJA', label: 'Dado de baja' },
  { value: 'PERDIDA', label: 'Pérdida' },
];

const PERIODOS = [
  { value: 'TODO', label: 'Todo el historial' },
  { value: 'MES', label: 'Por mes' },
  { value: 'ANIO', label: 'Por año' },
];

const DONATION_PERIODOS = [
  { value: 'TODO', label: 'Todo el historial' },
  { value: 'MES', label: 'Por mes' },
  { value: 'ANIO', label: 'Por año' },
];

const ESTADOS_PAGO_DONACION = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'Pagada', label: 'Pagada' },
  { value: 'Rechazada', label: 'Rechazada' },
  { value: 'Anulada', label: 'Anulada' },
  { value: 'Error', label: 'Error' },
];

const POST_EMERGENCY_STEPS = [
  { id: 1, label: 'Vehiculo' },
  { id: 2, label: 'Materiales' },
  { id: 3, label: 'Observaciones' },
];

const getArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  return payload?.ubicaciones
    || payload?.subUbicaciones
    || payload?.hijas
    || payload?.campanas
    || payload?.vehiculos
    || payload?.materiales
    || payload?.items
    || payload?.data
    || payload?.result
    || payload?.value
    || [];
};

const triggerPdfDownload = (pdf, filename) => {
  const url = window.URL.createObjectURL(pdf);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const getSessionCompanyId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.idCompania || '';
  } catch {
    return '';
  }
};

const mapDonationCampaign = (campaign) => ({
  id: campaign.idCampanaDonacion || campaign.id,
  idCampaniaDonacion: campaign.idCampaniaDonacion || campaign.idCampanaDonacion || campaign.id,
  idCampanaDonacion: campaign.idCampanaDonacion || campaign.idCampaniaDonacion || campaign.id,
  idCompania: campaign.idCompania || getSessionCompanyId(),
  nombre: campaign.nombre || 'Campaña sin nombre',
  estado: campaign.estado || '',
});

const mapVehicle = (vehicle) => ({
  id: vehicle.idVehiculo || vehicle.id,
  idVehiculo: vehicle.idVehiculo || vehicle.id,
  nombre: vehicle.nombre || vehicle.nomenclatura || vehicle.name || `Unidad ${vehicle.patente || ''}`,
  patente: vehicle.patente || 'S/N',
  tipo: vehicle.tipoVehiculo || vehicle.tipo || 'Material Mayor',
  idUbicacion: vehicle.idUbicacion || vehicle.idUbicacionVehiculo || vehicle.ubicacionId || vehicle.idUbicacionRaiz || '',
});

const mapLocation = (location) => ({
  id: location.idUbicacion || location.id,
  nombre: location.nombre || location.name || location.nombreUbicacion || 'Sub ubicacion',
  materiales: getArrayPayload(location).map(material => mapPostEmergencyMaterial(material, location)),
});

const mapPostEmergencyMaterial = (material, location = {}) => ({
  id: material.idItemMaterial || material.idMaterialItem || material.idMaterial || material.id,
  idMaterial: material.idMaterial || material.id,
  nombre: material.nombre || material.nombreMaterial || material.descripcion || 'Material sin nombre',
  codigo: material.codigo || material.codigoMaterial || material.numeroSerie || material.serie || '',
  cantidad: material.cantidad ?? material.stock ?? material.cantidadDisponible ?? 1,
  ubicacionId: material.idUbicacion || location.idUbicacion || location.id || '',
  ubicacionNombre: material.nombreUbicacion || location.nombre || location.name || 'Sin ubicacion',
});

const getVehicleLocationId = (vehicleDetail, selectedVehicle) => (
  vehicleDetail?.idUbicacion
  || vehicleDetail?.idUbicacionVehiculo
  || vehicleDetail?.ubicacionId
  || vehicleDetail?.idUbicacionRaiz
  || selectedVehicle?.idUbicacion
  || ''
);

const normalizeVehicleInventory = (vehicleDetail, selectedVehicle) => {
  const directLocations = [
    ...getArrayPayload(vehicleDetail?.subUbicaciones || []),
    ...getArrayPayload(vehicleDetail?.ubicaciones || []),
    ...getArrayPayload(vehicleDetail?.hijas || []),
  ].map(mapLocation).filter(location => location.id);

  if (directLocations.length > 0) return directLocations;

  const directMaterials = [
    ...getArrayPayload(vehicleDetail?.materiales || []),
    ...getArrayPayload(vehicleDetail?.items || []),
  ].map(material => mapPostEmergencyMaterial(material, {
    id: getVehicleLocationId(vehicleDetail, selectedVehicle),
    nombre: selectedVehicle?.nombre || 'Vehiculo',
  })).filter(material => material.id);

  return directMaterials.length > 0
    ? [{
      id: getVehicleLocationId(vehicleDetail, selectedVehicle) || selectedVehicle?.id || 'vehiculo',
      nombre: selectedVehicle?.nombre || 'Vehiculo',
      materiales: directMaterials,
    }]
    : [];
};

const buildPostEmergencyDraft = ({ vehicle, materials, observations }) => {
  const lines = [
    'Reporte post emergencia',
    `Vehiculo: ${vehicle?.nombre || '-'} (${vehicle?.patente || 'S/N'})`,
    `Fecha: ${new Date().toLocaleString('es-CL')}`,
    '',
    'Materiales observados:',
    ...materials.map((material, index) => (
      `${index + 1}. ${material.nombre} - ${material.ubicacionNombre}: ${observations[material.id] || 'Sin observacion'}`
    )),
  ];
  return new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
};

function ReportsView({
  palette,
  canViewFullReports = true,
  canViewBasicReports = true,
  canViewDonationReports = false,
}) {
  const canViewAdvancedReports = canViewFullReports;
  const today = new Date();
  const [filters, setFilters] = useState({
    motivo: 'TODOS',
    periodo: 'TODO',
    anio: String(today.getFullYear()),
    mes: String(today.getMonth() + 1),
  });
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [rootLocationId, setRootLocationId] = useState('');
  const [rootLocations, setRootLocations] = useState([]);
  const [loadingRootLocations, setLoadingRootLocations] = useState(false);
  const [stockDownloading, setStockDownloading] = useState(false);
  const [stockError, setStockError] = useState('');
  const [donationFilters, setDonationFilters] = useState({
    idCampaniaDonacion: '',
    estadoPago: 'TODOS',
    periodo: 'TODO',
    anio: String(today.getFullYear()),
    mes: String(today.getMonth() + 1),
  });
  const [donationCampaigns, setDonationCampaigns] = useState([]);
  const [loadingDonationCampaigns, setLoadingDonationCampaigns] = useState(false);
  const [donationDownloading, setDonationDownloading] = useState(false);
  const [donationError, setDonationError] = useState('');
  const [postEmergencyStep, setPostEmergencyStep] = useState(1);
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedVehicleDetail, setSelectedVehicleDetail] = useState(null);
  const [vehicleInventory, setVehicleInventory] = useState([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [materialObservations, setMaterialObservations] = useState({});
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [loadingVehicleInventory, setLoadingVehicleInventory] = useState(false);
  const [postEmergencyError, setPostEmergencyError] = useState('');

  useEffect(() => {
    const fetchRootLocations = async () => {
      setLoadingRootLocations(true);
      setStockError('');

      try {
        const data = await apiFetch('/api/ubicaciones');
        const locations = getArrayPayload(data)
          .map(location => ({
            id: location.idUbicacion || location.id,
            name: location.nombre || location.name || location.nombreUbicacion || 'Ubicación',
          }))
          .filter(location => location.id);
        setRootLocations(locations);
      } catch (locationsError) {
        setStockError(locationsError.message || 'No se pudieron cargar las ubicaciones raiz.');
      } finally {
        setLoadingRootLocations(false);
      }
    };

    fetchRootLocations();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      setPostEmergencyError('');

      try {
        const data = await apiFetch('/api/vehiculos');
        const mappedVehicles = getArrayPayload(data).map(mapVehicle).filter(vehicle => vehicle.id);
        setVehicles(mappedVehicles);
      } catch (vehiclesError) {
        setPostEmergencyError(vehiclesError.message || 'No se pudieron cargar los vehiculos.');
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    if (!selectedVehicleId) {
      setSelectedVehicleDetail(null);
      setVehicleInventory([]);
      setSelectedMaterialIds([]);
      setMaterialObservations({});
      return undefined;
    }

    let alive = true;
    const selectedVehicle = vehicles.find(vehicle => String(vehicle.id) === String(selectedVehicleId));

    const fetchVehicleInventory = async () => {
      setLoadingVehicleInventory(true);
      setPostEmergencyError('');
      setSelectedMaterialIds([]);
      setMaterialObservations({});

      try {
        const detail = await apiFetch(`/api/vehiculos/${selectedVehicleId}`).catch(() => selectedVehicle || {});
        if (!alive) return;

        const detailWithFallback = { ...(selectedVehicle || {}), ...(detail || {}) };
        setSelectedVehicleDetail(detailWithFallback);

        const normalizedInventory = normalizeVehicleInventory(detailWithFallback, selectedVehicle);
        if (normalizedInventory.length > 0) {
          setVehicleInventory(normalizedInventory);
          return;
        }

        const locationId = getVehicleLocationId(detailWithFallback, selectedVehicle);
        if (!locationId) {
          setVehicleInventory([]);
          return;
        }

        const [childrenPayload, vehicleMaterialsPayload] = await Promise.all([
          apiFetch(`/api/ubicaciones/${locationId}/hijas`).catch(() => []),
          apiFetch(`/api/materiales?idUbicacion=${encodeURIComponent(locationId)}`).catch(() => []),
        ]);
        if (!alive) return;

        const childLocations = getArrayPayload(childrenPayload).map(mapLocation).filter(location => location.id);
        const childLocationsWithMaterials = await Promise.all(childLocations.map(async (location) => {
          const materialsPayload = await apiFetch(`/api/materiales?idUbicacion=${encodeURIComponent(location.id)}`).catch(() => []);
          return {
            ...location,
            materiales: getArrayPayload(materialsPayload)
              .map(material => mapPostEmergencyMaterial(material, location))
              .filter(material => material.id),
          };
        }));
        if (!alive) return;

        const rootMaterials = getArrayPayload(vehicleMaterialsPayload)
          .map(material => mapPostEmergencyMaterial(material, {
            id: locationId,
            nombre: selectedVehicle?.nombre || 'Vehiculo',
          }))
          .filter(material => material.id);

        setVehicleInventory([
          ...(rootMaterials.length > 0 ? [{
            id: locationId,
            nombre: selectedVehicle?.nombre || 'Vehiculo',
            materiales: rootMaterials,
          }] : []),
          ...childLocationsWithMaterials,
        ]);
      } catch (inventoryError) {
        if (alive) setPostEmergencyError(inventoryError.message || 'No se pudo cargar el checklist del vehiculo.');
      } finally {
        if (alive) setLoadingVehicleInventory(false);
      }
    };

    fetchVehicleInventory();
    return () => {
      alive = false;
    };
  }, [selectedVehicleId, vehicles]);

  useEffect(() => {
    if (!canViewAdvancedReports || !canViewDonationReports) return undefined;

    const fetchDonationCampaigns = async () => {
      setLoadingDonationCampaigns(true);
      setDonationError('');

      try {
        const responses = await Promise.all([
          apiFetch('/api/campanasdonaciones?estado=Activa'),
          apiFetch('/api/campanasdonaciones?estado=Finalizada'),
          apiFetch('/api/campanasdonaciones?estado=Cancelada'),
        ]);
        const campaignsById = new Map();
        responses
          .flatMap(response => getArrayPayload(response))
          .map(mapDonationCampaign)
          .filter(campaign => campaign.idCampaniaDonacion)
          .forEach(campaign => campaignsById.set(String(campaign.idCampaniaDonacion), campaign));

        const campaigns = Array.from(campaignsById.values());
        setDonationCampaigns(campaigns);
        setDonationFilters(current => (
          current.idCampaniaDonacion || campaigns.length === 0
            ? current
            : { ...current, idCampaniaDonacion: String(campaigns[0].idCampaniaDonacion) }
        ));
      } catch (campaignsError) {
        setDonationError(campaignsError.message || 'No se pudieron cargar las campañas de donaciones.');
      } finally {
        setLoadingDonationCampaigns(false);
      }
    };

    fetchDonationCampaigns();
    return undefined;
  }, [canViewAdvancedReports, canViewDonationReports]);

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(current => ({ ...current, [name]: value }));
    setError('');
  };

  const handleDonationFilterChange = (event) => {
    const { name, value } = event.target;
    setDonationFilters(current => ({ ...current, [name]: value }));
    setDonationError('');
  };

  const handleDonationMonthChange = (event) => {
    const [anio, mes] = event.target.value.split('-');
    setDonationFilters(current => ({
      ...current,
      anio: anio || current.anio,
      mes: mes ? String(Number(mes)) : current.mes,
    }));
    setDonationError('');
  };

  const downloadBajasReport = async () => {
    if (filters.periodo !== 'TODO' && !filters.anio) {
      setError('Selecciona un año para generar el reporte.');
      return;
    }

    const params = new URLSearchParams();
    if (filters.motivo !== 'TODOS' || filters.periodo !== 'TODO') {
      params.set('motivo', filters.motivo);
      params.set('periodo', filters.periodo);
      if (filters.periodo !== 'TODO') params.set('anio', filters.anio);
      if (filters.periodo === 'MES') params.set('mes', filters.mes);
    }

    setDownloading(true);
    setError('');

    try {
      const query = params.toString();
      const pdf = await apiFetch(`/api/materiales/reportes/bajas/pdf${query ? `?${query}` : ''}`, {
        responseType: 'blob',
      });
      const suffix = filters.periodo === 'TODO'
        ? 'historial'
        : `${filters.periodo.toLowerCase()}-${filters.anio}${filters.periodo === 'MES' ? `-${filters.mes.padStart(2, '0')}` : ''}`;
      triggerPdfDownload(pdf, `reporte-bajas-${filters.motivo.toLowerCase()}-${suffix}.pdf`);
    } catch (downloadError) {
      setError(downloadError.message || 'No se pudo generar el reporte. Verifica el permiso VER_REPORTES.');
    } finally {
      setDownloading(false);
    }
  };

  const downloadStockReport = async () => {
    const query = rootLocationId ? `?idUbicacionRaiz=${encodeURIComponent(rootLocationId)}` : '';
    setStockDownloading(true);
    setStockError('');

    try {
      const pdf = await apiFetch(`/api/materiales/reportes/stock-cantidad/pdf${query}`, {
        responseType: 'blob',
      });
      triggerPdfDownload(pdf, `reporte-stock-cantidad-${rootLocationId ? `ubicacion-${rootLocationId}` : 'compania'}.pdf`);
    } catch (downloadError) {
      setStockError(downloadError.message || 'No se pudo generar el reporte. Verifica el permiso VER_REPORTES.');
    } finally {
      setStockDownloading(false);
    }
  };

  const downloadDonationReport = async () => {
    if (!donationFilters.idCampaniaDonacion) {
      setDonationError('Selecciona una campaña para generar el reporte.');
      return;
    }

    if (donationFilters.periodo !== 'TODO' && !donationFilters.anio) {
      setDonationError('Selecciona un año para generar el reporte.');
      return;
    }

    const campaign = donationCampaigns.find(item => (
      String(item.idCampaniaDonacion) === String(donationFilters.idCampaniaDonacion)
    ));
    const companyId = campaign?.idCompania || getSessionCompanyId();

    if (!companyId) {
      setDonationError('No se pudo identificar la compañía de la sesión.');
      return;
    }

    const params = new URLSearchParams({
      idCampaniaDonacion: donationFilters.idCampaniaDonacion,
    });
    if (donationFilters.estadoPago !== 'TODOS') params.set('estadoPago', donationFilters.estadoPago);
    if (donationFilters.periodo !== 'TODO') {
      params.set('periodo', donationFilters.periodo);
      params.set('anio', donationFilters.anio);
    }
    if (donationFilters.periodo === 'MES') params.set('mes', donationFilters.mes);

    setDonationDownloading(true);
    setDonationError('');

    try {
      const pdf = await apiFetch(`/api/companias/${companyId}/donaciones/reportes/pdf?${params.toString()}`, {
        responseType: 'blob',
      });
      const periodSuffix = donationFilters.periodo === 'MES'
        ? `${donationFilters.anio}-${donationFilters.mes.padStart(2, '0')}`
        : donationFilters.periodo === 'ANIO'
          ? donationFilters.anio
          : 'historial';
      triggerPdfDownload(
        pdf,
        `reporte-donaciones-campania-${donationFilters.idCampaniaDonacion}-${donationFilters.estadoPago.toLowerCase()}-${periodSuffix}.pdf`
      );
    } catch (downloadError) {
      setDonationError(downloadError.message || 'No se pudo generar el reporte de donaciones. Verifica el permiso VER_REPORTES.');
    } finally {
      setDonationDownloading(false);
    }
  };

  const selectedVehicle = vehicles.find(vehicle => String(vehicle.id) === String(selectedVehicleId));
  const postEmergencyVehicle = selectedVehicleDetail || selectedVehicle;
  const postEmergencyMaterials = vehicleInventory.flatMap(location => (
    (location.materiales || []).map(material => ({
      ...material,
      ubicacionNombre: material.ubicacionNombre || location.nombre,
    }))
  ));
  const selectedPostEmergencyMaterials = postEmergencyMaterials.filter(material => (
    selectedMaterialIds.includes(String(material.id))
  ));
  const canContinuePostEmergencySelection = selectedMaterialIds.length > 0;
  const canFinishPostEmergencyReport = selectedPostEmergencyMaterials.length > 0
    && selectedPostEmergencyMaterials.every(material => String(materialObservations[material.id] || '').trim());

  const handlePostEmergencyVehicleChange = (event) => {
    setSelectedVehicleId(event.target.value);
    setPostEmergencyStep(1);
    setPostEmergencyError('');
  };

  const togglePostEmergencyMaterial = (materialId) => {
    const normalizedId = String(materialId);
    setSelectedMaterialIds(current => (
      current.includes(normalizedId)
        ? current.filter(id => id !== normalizedId)
        : [...current, normalizedId]
    ));
    setPostEmergencyError('');
  };

  const updatePostEmergencyObservation = (materialId, value) => {
    setMaterialObservations(current => ({
      ...current,
      [materialId]: value,
    }));
    setPostEmergencyError('');
  };

  const resetPostEmergencyFlow = () => {
    setPostEmergencyStep(1);
    setSelectedVehicleId('');
    setSelectedVehicleDetail(null);
    setVehicleInventory([]);
    setSelectedMaterialIds([]);
    setMaterialObservations({});
    setPostEmergencyError('');
  };

  const finishPostEmergencyReport = () => {
    if (!canFinishPostEmergencyReport) {
      setPostEmergencyError('Completa una observacion para cada material seleccionado.');
      return;
    }

    const draft = buildPostEmergencyDraft({
      vehicle: postEmergencyVehicle,
      materials: selectedPostEmergencyMaterials,
      observations: materialObservations,
    });
    triggerPdfDownload(draft, `reporte-post-emergencia-${selectedVehicleId || 'vehiculo'}.txt`);
    resetPostEmergencyFlow();
  };

  return (
    <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-7">
          <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Reportes</h3>
        </div>

        <div className="grid auto-rows-min items-start gap-5 lg:grid-cols-2">
        {canViewAdvancedReports && (
        <section className="h-fit rounded-lg border p-5" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-red/30 bg-brand-red/10 text-brand-red">
                <Icons.Report className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Bajas de inventario</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
              </div>
            </div>
            <span className="rounded border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
              VER_REPORTES
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Motivo</span>
              <select name="motivo" value={filters.motivo} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                {MOTIVOS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Periodo</span>
              <select name="periodo" value={filters.periodo} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                {PERIODOS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {filters.periodo !== 'TODO' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Año</span>
                <input name="anio" type="number" min="2000" max="2100" value={filters.anio} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan" />
              </label>
            )}
            {filters.periodo === 'MES' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Mes</span>
                <select name="mes" value={filters.mes} onChange={handleFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                  {Array.from({ length: 12 }, (_, index) => index + 1).map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {error && (
            <p className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{error}</p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={downloadBajasReport} disabled={downloading} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:opacity-60">
              <Icons.Report className="h-4 w-4" />
              {downloading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>
        </section>
        )}
        {canViewAdvancedReports && canViewDonationReports && (
        <section className="h-fit rounded-lg border p-5" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-green/30 bg-brand-green/10 text-brand-green">
                <Icons.Finance className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Donaciones por campaña</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
              </div>
            </div>
            <span className="rounded border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
              VER_REPORTES
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Campaña</span>
              <select
                name="idCampaniaDonacion"
                value={donationFilters.idCampaniaDonacion}
                onChange={handleDonationFilterChange}
                disabled={loadingDonationCampaigns}
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan disabled:opacity-60"
              >
                <option value="">{loadingDonationCampaigns ? 'Cargando campañas...' : 'Selecciona una campaña'}</option>
                {donationCampaigns.map(campaign => (
                  <option key={campaign.idCampaniaDonacion} value={campaign.idCampaniaDonacion}>
                    {campaign.nombre}{campaign.estado ? ` - ${campaign.estado}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Estado de pago</span>
              <select name="estadoPago" value={donationFilters.estadoPago} onChange={handleDonationFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                {ESTADOS_PAGO_DONACION.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Periodo</span>
              <select name="periodo" value={donationFilters.periodo} onChange={handleDonationFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan">
                {DONATION_PERIODOS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
            {donationFilters.periodo === 'ANIO' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Año</span>
                <input name="anio" type="number" min="2000" max="2100" value={donationFilters.anio} onChange={handleDonationFilterChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan" />
              </label>
            )}
            {donationFilters.periodo === 'MES' && (
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Mes</span>
                <input
                  type="month"
                  value={`${donationFilters.anio}-${donationFilters.mes.padStart(2, '0')}`}
                  onChange={handleDonationMonthChange}
                  className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan"
                />
              </label>
            )}
          </div>

          {donationError && (
            <p className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{donationError}</p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={downloadDonationReport} disabled={donationDownloading || loadingDonationCampaigns} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:opacity-60">
              <Icons.Report className="h-4 w-4" />
              {donationDownloading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>
        </section>
        )}
        {canViewBasicReports && (
        <section className="h-fit rounded-lg border p-5" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
                <Icons.Report className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Stock por cantidad valorizado</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
              </div>
            </div>
            <span className="rounded border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
              VER_REPORTES
            </span>
          </div>

          <div className="mt-5">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Ubicación raíz</span>
              <select
                value={rootLocationId}
                onChange={(event) => {
                  setRootLocationId(event.target.value);
                  setStockError('');
                }}
                disabled={loadingRootLocations}
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan disabled:opacity-60"
              >
                <option value="">Toda la compañía</option>
                {rootLocations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </label>
          </div>

          {stockError && (
            <p className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{stockError}</p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={downloadStockReport} disabled={stockDownloading || loadingRootLocations} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:opacity-60">
              <Icons.Report className="h-4 w-4" />
              {stockDownloading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          </div>
        </section>
        )}
        {canViewBasicReports && (
        <section className="h-fit rounded-lg border p-5 lg:col-span-2" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-ember/30 bg-brand-ember/10 text-brand-ember">
                <Icons.Inventory className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Reporte post emergencia</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>Checklist</span>
              </div>
            </div>
            <span className="rounded border border-brand-cyan/25 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
              VER_REPORTES
            </span>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            {POST_EMERGENCY_STEPS.map(step => (
              <div
                key={step.id}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${postEmergencyStep === step.id ? 'border-brand-cyan/50 bg-brand-cyan/10 text-brand-cyan' : 'border-dark-border bg-dark-bg text-text-muted'}`}
              >
                {step.id}. {step.label}
              </div>
            ))}
          </div>

          {postEmergencyStep === 1 && (
            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Vehiculo que fue a emergencia</span>
                <select
                  value={selectedVehicleId}
                  onChange={handlePostEmergencyVehicleChange}
                  disabled={loadingVehicles}
                  className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan disabled:opacity-60"
                >
                  <option value="">{loadingVehicles ? 'Cargando vehiculos...' : 'Selecciona un vehiculo'}</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.nombre} - {vehicle.patente}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => setPostEmergencyStep(2)}
                disabled={!selectedVehicleId || loadingVehicleInventory}
                className="inline-flex items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-5 py-2.5 text-sm font-semibold text-brand-cyan transition-colors hover:bg-brand-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingVehicleInventory ? 'Cargando checklist...' : 'Continuar'}
              </button>
            </div>
          )}

          {postEmergencyStep === 2 && (
            <div className="mt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: palette.text }}>{postEmergencyVehicle?.nombre || 'Vehiculo seleccionado'}</p>
                  <p className="text-xs" style={{ color: palette.muted }}>{selectedMaterialIds.length} materiales seleccionados</p>
                </div>
                <button type="button" onClick={() => setPostEmergencyStep(1)} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white">
                  Cambiar vehiculo
                </button>
              </div>

              {loadingVehicleInventory ? (
                <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-8 text-center text-sm text-text-muted">Cargando sub ubicaciones y materiales...</div>
              ) : vehicleInventory.length === 0 ? (
                <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-8 text-center text-sm text-text-muted">
                  No hay materiales cargados para este vehiculo.
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-2">
                  {vehicleInventory.map(location => (
                    <div key={location.id} className="rounded-lg border border-dark-border bg-dark-bg p-4">
                      <h5 className="mb-3 text-sm font-bold uppercase" style={{ color: palette.muted }}>{location.nombre}</h5>
                      <div className="space-y-2">
                        {(location.materiales || []).length === 0 ? (
                          <p className="text-sm text-text-muted">Sin materiales registrados.</p>
                        ) : location.materiales.map(material => {
                          const materialId = String(material.id);
                          const selected = selectedMaterialIds.includes(materialId);
                          return (
                            <label key={materialId} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors ${selected ? 'border-brand-cyan/60 bg-brand-cyan/10' : 'border-dark-border bg-dark-bg2 hover:border-brand-cyan/40'}`}>
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => togglePostEmergencyMaterial(materialId)}
                                className="h-4 w-4 rounded border-dark-border text-brand-cyan"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-semibold text-text-main">{material.nombre}</span>
                                <span className="block text-xs text-text-muted">{material.codigo || 'Sin codigo'} - Cantidad: {material.cantidad}</span>
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setPostEmergencyStep(3)}
                  disabled={!canContinuePostEmergencySelection}
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Agregar observaciones
                </button>
              </div>
            </div>
          )}

          {postEmergencyStep === 3 && (
            <div className="mt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: palette.text }}>Observaciones por material</p>
                  <p className="text-xs" style={{ color: palette.muted }}>{selectedPostEmergencyMaterials.length} materiales seleccionados</p>
                </div>
                <button type="button" onClick={() => setPostEmergencyStep(2)} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white">
                  Volver al checklist
                </button>
              </div>

              <div className="space-y-3">
                {selectedPostEmergencyMaterials.map(material => (
                  <div key={material.id} className="grid gap-3 rounded-lg border border-dark-border bg-dark-bg p-4 lg:grid-cols-[minmax(220px,320px)_1fr]">
                    <div>
                      <p className="text-sm font-semibold text-text-main">{material.nombre}</p>
                      <p className="mt-1 text-xs text-text-muted">{material.ubicacionNombre} - {material.codigo || 'Sin codigo'}</p>
                    </div>
                    <textarea
                      value={materialObservations[material.id] || ''}
                      onChange={(event) => updatePostEmergencyObservation(material.id, event.target.value)}
                      rows={3}
                      placeholder="Observacion encontrada al volver de emergencia"
                      className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg2 px-3 py-2.5 text-sm text-text-main outline-none transition-colors placeholder:text-text-muted focus:border-brand-cyan"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <button type="button" onClick={resetPostEmergencyFlow} className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:text-white">
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={finishPostEmergencyReport}
                  disabled={!canFinishPostEmergencyReport}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Icons.Report className="h-4 w-4" />
                  Finalizar y descargar borrador
                </button>
              </div>
            </div>
          )}

          {postEmergencyError && (
            <p className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{postEmergencyError}</p>
          )}
        </section>
        )}
        {!canViewFullReports && !canViewBasicReports && (
          <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-12 text-center text-text-muted lg:col-span-2">
            No tienes permisos para generar reportes.
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

export default ReportsView;
