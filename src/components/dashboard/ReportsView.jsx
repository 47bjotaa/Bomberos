import { useEffect, useState } from 'react';
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

const TIPOS_USO_MATERIAL = [
  'Consumible Usado',
  'Danado',
  'Perdido',
  'Retenido',
];

const TIPOS_AFECTACION_ITEM = [
  { value: 'Danado', estado: 'Mal Estado', label: 'Danado' },
  { value: 'Perdido', estado: 'Perdido', label: 'Perdido' },
  { value: 'Retenido', estado: 'Retenido', label: 'Retenido' },
];

const getTodayDateValue = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getCurrentTimeValue = () => new Date().toTimeString().slice(0, 8);

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

const getInventoryPayload = (payload) => {
  if (Array.isArray(payload)) return payload;

  const materials = Array.isArray(payload?.materiales) ? payload.materiales : [];
  const items = Array.isArray(payload?.items) ? payload.items : [];
  if (materials.length > 0 || items.length > 0) return [...materials, ...items];

  return getArrayPayload(payload);
};

const mapLocationName = (location) => ({
  id: location.idUbicacion || location.id,
  name: location.nombre || location.name || location.nombreUbicacion || location.descripcion || 'Sin ubicacion',
});

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
  idUbicacion: vehicle.idUbicacion || vehicle.idUbicacionActual || vehicle.idUbicacionVehiculo || '',
  nombre: vehicle.nomenclatura || vehicle.nombre || vehicle.name || `Unidad ${vehicle.patente || ''}`.trim(),
  patente: vehicle.patente || '',
  tipo: vehicle.tipoVehiculo || vehicle.tipo || '',
});

const mapMaterial = (material) => ({
  id: material.idInventario || material.idInventarioMaterial || material.id,
  idInventario: material.idInventario || material.idInventarioMaterial || material.idInventarioItem || '',
  idMaterial: material.idMaterial || material.id,
  nombre: material.nombre || material.nombreMaterial || material.name || 'Material sin nombre',
  stock: material.cantidadDisponible ?? material.stock ?? material.cantidad ?? null,
  idUbicacion: material.idUbicacion || material.idUbicacionActual || material.ubicacionId || '',
  ubicacionNombre: material.nombreUbicacion || material.ubicacion || material.nombreUbicacionActual || material.nombreUbicacionPadre || material.nombrePadre || 'Sin ubicacion',
  serializado: Boolean(material.idItem || material.idInventarioItem || material.codigoUnico || material.codigo || material.esSerializacion || material.esSerializado || material.serializado),
});

const mapItem = (item) => ({
  id: item.idItem || item.idInventarioItem || item.idDetalleEpp || item.id,
  idItem: item.idItem || item.idInventarioItem || item.idDetalleEpp || item.id,
  nombre: item.nombreMaterial || item.equipo || item.nombre || 'Item sin nombre',
  codigo: item.codigoUnico || item.codigo || '',
  idUbicacion: item.idUbicacion || item.idUbicacionActual || item.ubicacionId || '',
  ubicacionNombre: item.nombreUbicacion || item.ubicacion || item.nombreUbicacionActual || item.nombreUbicacionPadre || item.nombrePadre || 'Sin ubicacion',
});

const mapInventoryItem = (item) => ({
  id: item.idInventarioItem || item.idItem || item.idInventario || item.idMaterial || item.id,
  idItem: item.idItem || item.idInventarioItem || item.idDetalleEpp,
  idInventario: item.idInventario || item.idInventarioMaterial || item.idInventarioItem,
  idMaterial: item.idMaterial || item.id,
  nombre: item.nombreMaterial || item.nombre || item.equipo || 'Material sin nombre',
  codigo: item.codigoUnico || item.codigo || '',
  stock: item.cantidadDisponible ?? item.stock ?? item.cantidad ?? 1,
  idUbicacion: item.idUbicacion || item.idUbicacionActual || item.ubicacionId || '',
  ubicacionNombre: item.nombreUbicacion || item.ubicacion || item.nombreUbicacionActual || item.nombreUbicacionPadre || item.nombrePadre || 'Sin ubicacion',
  serializado: Boolean(item.idItem || item.idInventarioItem || item.idDetalleEpp || item.codigoUnico || item.codigo || item.esSerializacion || item.esSerializado || item.serializado),
});

const getEmergencyId = (payload) => (
  payload?.idEmergencia
  || payload?.id
  || payload?.data?.idEmergencia
  || payload?.data?.id
  || payload?.result?.idEmergencia
  || payload?.result?.id
);

const createEmptyEmergencyMaterial = () => ({
  idMaterial: '',
  idInventario: '',
  cantidad: 1,
  tipoUso: 'Consumible Usado',
  descontarStock: true,
  observacion: '',
});

const createEmptyEmergencyItem = () => ({
  idItem: '',
  tipoAfectacion: 'Danado',
  estadoAplicado: 'Mal Estado',
  observacion: '',
});

function ReportsView({ palette, canViewFullReports = true, canViewBasicReports = true }) {
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
  const [emergencyForm, setEmergencyForm] = useState({
    fecha: getTodayDateValue(),
    hora: getCurrentTimeValue(),
    tipoEmergencia: '',
    direccionSector: '',
    idUbicacion: '',
    idVehiculo: '',
    observaciones: '',
  });
  const [emergencyMaterials, setEmergencyMaterials] = useState([]);
  const [emergencyItems, setEmergencyItems] = useState([]);
  const [emergencyVehicles, setEmergencyVehicles] = useState([]);
  const [materialsCatalog, setMaterialsCatalog] = useState([]);
  const [serialItems, setSerialItems] = useState([]);
  const [emergencyLocationNames, setEmergencyLocationNames] = useState({});
  const [emergencyModalStep, setEmergencyModalStep] = useState(null);
  const [loadingEmergencyCatalogs, setLoadingEmergencyCatalogs] = useState(false);
  const [loadingEmergencyInventory, setLoadingEmergencyInventory] = useState(false);
  const [emergencySaving, setEmergencySaving] = useState(false);
  const [emergencyError, setEmergencyError] = useState('');
  const [emergencyNotice, setEmergencyNotice] = useState('');

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
    if (!canViewAdvancedReports) return undefined;

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
  }, [canViewAdvancedReports]);

  useEffect(() => {
    if (!canViewAdvancedReports) return undefined;

    let ignore = false;
    const fetchEmergencyCatalogs = async () => {
      setLoadingEmergencyCatalogs(true);
      setEmergencyError('');

      try {
        const vehiclesPayload = await apiFetch('/api/vehiculos');

        if (ignore) return;

        const vehicleOptions = getArrayPayload(vehiclesPayload)
          .map(mapVehicle)
          .filter(vehicle => vehicle.idUbicacion);

        setEmergencyVehicles(vehicleOptions);
      } catch (catalogError) {
        if (!ignore) {
          setEmergencyError(catalogError.message || 'No se pudieron cargar los vehiculos para post emergencia.');
        }
      } finally {
        if (!ignore) setLoadingEmergencyCatalogs(false);
      }
    };

    fetchEmergencyCatalogs();

    return () => {
      ignore = true;
    };
  }, [canViewAdvancedReports]);

  useEffect(() => {
    if (!canViewAdvancedReports || !emergencyForm.idUbicacion) {
      return undefined;
    }

    let ignore = false;
    const fetchEmergencyInventory = async () => {
      setLoadingEmergencyInventory(true);
      setEmergencyError('');
      setMaterialsCatalog([]);
      setSerialItems([]);
      setEmergencyLocationNames({});

      try {
        const [inventoryPayload, childLocationsPayload] = await Promise.all([
          apiFetch(`/api/materiales?idUbicacion=${encodeURIComponent(emergencyForm.idUbicacion)}`),
          apiFetch(`/api/ubicaciones/${encodeURIComponent(emergencyForm.idUbicacion)}/hijas`).catch(() => []),
        ]);
        if (ignore) return;

        const locationNameMap = getArrayPayload(childLocationsPayload)
          .map(mapLocationName)
          .filter(location => location.id)
          .reduce((acc, location) => ({
            ...acc,
            [String(location.id)]: location.name,
          }), {});
        const inventoryItems = getInventoryPayload(inventoryPayload).map(mapInventoryItem).filter(item => item.id);
        setMaterialsCatalog(inventoryItems.filter(item => !item.serializado && item.idInventario).map(mapMaterial));
        setSerialItems(inventoryItems.filter(item => item.serializado && (item.idItem || item.id)).map(mapItem));
        setEmergencyLocationNames(locationNameMap);
      } catch (inventoryError) {
        if (!ignore) {
          setEmergencyError(inventoryError.message || 'No se pudo cargar el inventario de la ubicacion seleccionada.');
        }
      } finally {
        if (!ignore) setLoadingEmergencyInventory(false);
      }
    };

    fetchEmergencyInventory();

    return () => {
      ignore = true;
    };
  }, [canViewAdvancedReports, emergencyForm.idUbicacion]);

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

  const handleEmergencyFormChange = (event) => {
    const { name, value } = event.target;
    if (name === 'idUbicacion') {
      const selectedVehicle = emergencyVehicles.find(vehicle => String(vehicle.idUbicacion) === String(value));
      setEmergencyForm(current => ({
        ...current,
        idUbicacion: value,
        idVehiculo: selectedVehicle?.idVehiculo ? String(selectedVehicle.idVehiculo) : '',
      }));
      setEmergencyMaterials([]);
      setEmergencyItems([]);
    } else {
      setEmergencyForm(current => ({ ...current, [name]: value }));
    }
    setEmergencyError('');
    setEmergencyNotice('');
  };

  const updateEmergencyMaterial = (index, field, value) => {
    setEmergencyMaterials(current => current.map((material, materialIndex) => {
      if (materialIndex !== index) return material;

      const nextMaterial = { ...material, [field]: value };
      if (field === 'tipoUso' && value !== 'Consumible Usado') {
        nextMaterial.descontarStock = false;
      }
      if (field === 'tipoUso' && value === 'Consumible Usado') {
        nextMaterial.descontarStock = true;
      }
      return nextMaterial;
    }));
    setEmergencyError('');
    setEmergencyNotice('');
  };

  const updateEmergencyItem = (index, field, value) => {
    setEmergencyItems(current => current.map((item, itemIndex) => {
      if (itemIndex !== index) return item;

      if (field === 'tipoAfectacion') {
        const selectedType = TIPOS_AFECTACION_ITEM.find(option => option.value === value);
        return {
          ...item,
          tipoAfectacion: value,
          estadoAplicado: selectedType?.estado || item.estadoAplicado,
        };
      }

      return { ...item, [field]: value };
    }));
    setEmergencyError('');
    setEmergencyNotice('');
  };

  const selectedEmergencyVehicle = emergencyVehicles.find(vehicle => (
    String(vehicle.idUbicacion) === String(emergencyForm.idUbicacion)
  ));
  const emergencyInventoryRows = [
    ...materialsCatalog.map(material => ({
      ...material,
      selectionKey: `material-${material.idInventario}`,
      kind: 'material',
      typeLabel: 'Material',
      code: '',
    })),
    ...serialItems.map(item => ({
      ...item,
      selectionKey: `item-${item.idItem}`,
      kind: 'item',
      typeLabel: 'Serializado',
      code: item.codigo,
    })),
  ];
  const emergencyInventoryGroups = emergencyInventoryRows.reduce((groups, row) => {
    const key = row.idUbicacion ? String(row.idUbicacion) : row.ubicacionNombre;
    const resolvedName = row.idUbicacion
      ? (emergencyLocationNames[String(row.idUbicacion)] || row.ubicacionNombre || 'Sin ubicacion')
      : (row.ubicacionNombre || 'Sin ubicacion');
    const existingGroup = groups.find(group => group.key === key);
    if (existingGroup) {
      existingGroup.rows.push(row);
      return groups;
    }

    return [
      ...groups,
      {
        key,
        name: resolvedName,
        rows: [row],
      },
    ];
  }, []);
  const selectedEmergencyCount = emergencyMaterials.length + emergencyItems.length;

  const resetEmergencyFlow = () => {
    setEmergencyModalStep(null);
    setEmergencyMaterials([]);
    setEmergencyItems([]);
    setEmergencyError('');
    setEmergencyNotice('');
  };

  const openEmergencyFlow = () => {
    if (!emergencyForm.idUbicacion) {
      setEmergencyError('Selecciona un vehiculo para iniciar el reporte.');
      return;
    }

    setEmergencyError('');
    setEmergencyNotice('');
    setEmergencyModalStep('base');
  };

  const continueEmergencyBase = () => {
    if (!emergencyForm.tipoEmergencia.trim() || !emergencyForm.direccionSector.trim() || !emergencyForm.hora) {
      setEmergencyError('Completa tipo de emergencia, direccion/sector y hora.');
      return;
    }

    setEmergencyForm(current => ({
      ...current,
      fecha: getTodayDateValue(),
    }));
    setEmergencyError('');
    setEmergencyModalStep('materials');
  };

  const isEmergencyInventorySelected = (row) => (
    row.kind === 'material'
      ? emergencyMaterials.some(material => String(material.idInventario) === String(row.idInventario))
      : emergencyItems.some(item => String(item.idItem) === String(row.idItem))
  );

  const toggleEmergencyInventoryRow = (row) => {
    if (row.kind === 'material') {
      setEmergencyMaterials(current => (
        current.some(material => String(material.idInventario) === String(row.idInventario))
          ? current.filter(material => String(material.idInventario) !== String(row.idInventario))
          : [...current, { ...createEmptyEmergencyMaterial(), idInventario: row.idInventario ? String(row.idInventario) : '', cantidad: 1 }]
      ));
    } else {
      setEmergencyItems(current => (
        current.some(item => String(item.idItem) === String(row.idItem))
          ? current.filter(item => String(item.idItem) !== String(row.idItem))
          : [...current, { ...createEmptyEmergencyItem(), idItem: String(row.idItem) }]
      ));
    }
    setEmergencyError('');
  };

  const continueEmergencyMaterials = () => {
    if (selectedEmergencyCount === 0) {
      setEmergencyError('Selecciona al menos un material o item del vehiculo.');
      return;
    }

    setEmergencyError('');
    setEmergencyModalStep('observations');
  };

  const createEmergencyReport = async () => {
    if (!emergencyForm.tipoEmergencia.trim() || !emergencyForm.direccionSector.trim() || !emergencyForm.idUbicacion) {
      setEmergencyError('Completa tipo de emergencia, direccion/sector y vehiculo.');
      return;
    }

    const materiales = emergencyMaterials
      .filter(material => material.idInventario)
      .map(material => ({
        idInventario: Number(material.idInventario),
        cantidad: Number(material.cantidad) || 1,
        tipoUso: material.tipoUso,
        descontarStock: Boolean(material.descontarStock),
        observacion: material.observacion.trim(),
      }));

    const items = emergencyItems
      .filter(item => item.idItem)
      .map(item => ({
        idItem: Number(item.idItem),
        tipoAfectacion: item.tipoAfectacion,
        estadoAplicado: item.estadoAplicado,
        observacion: item.observacion.trim(),
      }));

    if (materiales.length === 0 && items.length === 0) {
      setEmergencyError('Agrega al menos un material o item afectado.');
      return;
    }

    const hasMissingObservation = [...materiales, ...items].some(entry => !entry.observacion);
    if (hasMissingObservation) {
      setEmergencyError('Agrega una observacion para cada material o item seleccionado.');
      return;
    }

    const payload = {
      fecha: getTodayDateValue(),
      hora: emergencyForm.hora,
      tipoEmergencia: emergencyForm.tipoEmergencia.trim(),
      direccionSector: emergencyForm.direccionSector.trim(),
      idUbicacion: Number(emergencyForm.idUbicacion),
      observaciones: emergencyForm.observaciones.trim(),
      materiales,
      items,
    };

    if (emergencyForm.idVehiculo) {
      payload.idVehiculo = Number(emergencyForm.idVehiculo);
    }

    setEmergencySaving(true);
    setEmergencyError('');
    setEmergencyNotice('');

    try {
      const createdEmergency = await apiFetch('/api/emergencias', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const idEmergencia = getEmergencyId(createdEmergency);

      if (!idEmergencia) {
        setEmergencyNotice('Emergencia registrada, pero la API no devolvio id para descargar el PDF.');
        return;
      }

      const pdf = await apiFetch(`/api/emergencias/${idEmergencia}/reporte/pdf`, {
        responseType: 'blob',
      });
      triggerPdfDownload(pdf, `reporte-post-emergencia-${idEmergencia}.pdf`);
      setEmergencyNotice(`Emergencia ${idEmergencia} registrada y PDF descargado.`);
      setEmergencyMaterials([]);
      setEmergencyItems([]);
      setEmergencyModalStep(null);
      setEmergencyForm(current => ({
        ...current,
        fecha: getTodayDateValue(),
        hora: getCurrentTimeValue(),
        tipoEmergencia: '',
        direccionSector: '',
        idUbicacion: '',
        idVehiculo: '',
        observaciones: '',
      }));
    } catch (createError) {
      setEmergencyError(createError.message || 'No se pudo registrar la emergencia.');
    } finally {
      setEmergencySaving(false);
    }
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
      setError(downloadError.message || 'No se pudo generar el reporte. Verifica tus permisos e intenta nuevamente.');
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
      setStockError(downloadError.message || 'No se pudo generar el reporte. Verifica tus permisos e intenta nuevamente.');
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
      setDonationError(downloadError.message || 'No se pudo generar el reporte de donaciones. Verifica tus permisos e intenta nuevamente.');
    } finally {
      setDonationDownloading(false);
    }
  };

  return (
    <div className="h-full overflow-auto p-4 sm:p-6 lg:p-8" style={{ background: palette.bg, color: palette.text }}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-lg">
          <div className="flex items-start gap-4 border-b border-dark-border/70 bg-dark-bg2/55 p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
              <Icons.Report className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand-cyan">Centro de reportes</p>
              <h3 className="rajdhani mt-1 text-2xl font-bold text-text-main">Documentos operativos listos para generar</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">
                Usa el asistente para post emergencia o descarga reportes PDF con filtros por periodo, campaña, motivo y ubicación.
              </p>
            </div>
          </div>
        </div>
        <div className="grid auto-rows-min items-start gap-5 lg:grid-cols-2">
        {canViewAdvancedReports && (
        <section className="h-fit rounded-xl border p-5 shadow-lg" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-ember/30 bg-brand-ember/10 text-brand-ember">
                <Icons.Report className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Post emergencia</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>Registro + PDF</span>
                <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: palette.muted }}>Asistente guiado para documentar salida, materiales usados y observaciones.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-dark-border bg-dark-bg/60 p-4">
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase" style={{ color: palette.muted }}>Vehiculo</span>
              <select name="idUbicacion" value={emergencyForm.idUbicacion} onChange={handleEmergencyFormChange} disabled={loadingEmergencyCatalogs || emergencySaving} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan disabled:opacity-60">
                <option value="">{loadingEmergencyCatalogs ? 'Cargando vehiculos...' : 'Selecciona vehiculo'}</option>
                {emergencyVehicles.map(vehicle => (
                  <option key={vehicle.idUbicacion} value={vehicle.idUbicacion}>
                    {vehicle.nombre}{vehicle.patente ? ` - ${vehicle.patente}` : ''}{vehicle.tipo ? ` - ${vehicle.tipo}` : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {emergencyError && (
            <p className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{emergencyError}</p>
          )}
          {emergencyNotice && (
            <p className="mt-5 rounded-lg border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-sm text-brand-green">{emergencyNotice}</p>
          )}

          <div className="mt-5 flex justify-end">
            <button type="button" onClick={openEmergencyFlow} disabled={loadingEmergencyCatalogs || emergencySaving || !emergencyForm.idUbicacion} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:opacity-60">
              <Icons.Report className="h-4 w-4" />
              Continuar
            </button>
          </div>
        </section>
        )}
        {canViewAdvancedReports && (
        <section className="h-fit rounded-xl border p-5 shadow-lg" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-red/30 bg-brand-red/10 text-brand-red">
                <Icons.Report className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Bajas de inventario</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
                <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: palette.muted }}>Filtra bajas o perdidas por motivo y periodo antes de descargar.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-lg border border-dark-border bg-dark-bg/60 p-4 sm:grid-cols-2">
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
        {canViewAdvancedReports && (
        <section className="h-fit rounded-xl border p-5 shadow-lg" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-green/30 bg-brand-green/10 text-brand-green">
                <Icons.Finance className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Donaciones por campaña</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
                <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: palette.muted }}>Resume pagos por campaña, estado de pago y periodo seleccionado.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 rounded-lg border border-dark-border bg-dark-bg/60 p-4 sm:grid-cols-2">
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
        <section className="h-fit rounded-xl border p-5 shadow-lg" style={{ borderColor: palette.borderStrong, background: palette.card }}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan">
                <Icons.Report className="h-6 w-6" />
              </div>
              <div>
                <h4 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Stock por cantidad valorizado</h4>
                <span className="mt-2 inline-flex rounded border px-2 py-1 text-xs font-semibold" style={{ borderColor: palette.borderStrong, color: palette.muted }}>PDF</span>
                <p className="mt-3 max-w-md text-sm leading-relaxed" style={{ color: palette.muted }}>Genera inventario valorizado de toda la compania o una ubicacion raiz.</p>
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-dark-border bg-dark-bg/60 p-4">
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
        {!canViewFullReports && !canViewBasicReports && (
          <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-12 text-center text-text-muted lg:col-span-2">
            No tienes permisos para generar reportes.
          </div>
        )}
        </div>

        {emergencyModalStep === 'base' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h4 className="rajdhani text-xl font-bold text-text-main">Datos de la emergencia</h4>
                  <p className="mt-1 text-xs text-text-muted">Paso 1 de 3</p>
                </div>
                <button type="button" onClick={resetEmergencyFlow} className="px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red">
                  x
                </button>
              </div>

              <div className="grid max-h-[calc(90vh-140px)] gap-4 overflow-y-auto p-6 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-text-muted">Tipo</span>
                  <input name="tipoEmergencia" value={emergencyForm.tipoEmergencia} onChange={handleEmergencyFormChange} placeholder="Rescate vehicular" className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors placeholder-text-muted focus:border-brand-cyan" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-text-muted">Vehiculo</span>
                  <div className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm font-semibold text-text-main">
                    {selectedEmergencyVehicle ? `${selectedEmergencyVehicle.nombre}${selectedEmergencyVehicle.patente ? ` - ${selectedEmergencyVehicle.patente}` : ''}` : 'Sin seleccionar'}
                  </div>
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-text-muted">Direccion/sector</span>
                  <input name="direccionSector" value={emergencyForm.direccionSector} onChange={handleEmergencyFormChange} placeholder="Ruta 5 km 42" className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors placeholder-text-muted focus:border-brand-cyan" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-text-muted">Hora</span>
                  <input name="hora" type="time" step="1" value={emergencyForm.hora} onChange={handleEmergencyFormChange} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors focus:border-brand-cyan" />
                </label>
                {emergencyError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red md:col-span-2">{emergencyError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <button type="button" onClick={resetEmergencyFlow} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white">
                  Cancelar
                </button>
                <button type="button" onClick={continueEmergencyBase} disabled={loadingEmergencyCatalogs} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:opacity-50">
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}

        {emergencyModalStep === 'materials' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h4 className="rajdhani text-xl font-bold text-text-main">Materiales del vehiculo</h4>
                  <p className="mt-1 text-xs text-text-muted">Paso 2 de 3 - {selectedEmergencyVehicle?.nombre || 'Vehiculo'}</p>
                </div>
                <button type="button" onClick={resetEmergencyFlow} className="px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red">
                  x
                </button>
              </div>

              <div className="max-h-[calc(90vh-150px)] overflow-y-auto p-6">
                {loadingEmergencyInventory ? (
                  <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-12 text-center text-sm text-text-muted">
                    Cargando inventario del vehiculo...
                  </div>
                ) : emergencyInventoryRows.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-12 text-center text-sm text-text-muted">
                    Este vehiculo no tiene materiales disponibles.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {emergencyInventoryGroups.map(group => (
                      <div key={group.key} className="overflow-hidden rounded-lg border border-dark-border bg-dark-bg">
                        <div className="border-b border-dark-border bg-dark-bg2 px-4 py-3">
                          <h5 className="text-sm font-bold text-text-main">{group.name}</h5>
                        </div>
                        <table className="w-full text-left text-sm">
                          <thead className="border-b border-dark-border bg-dark-bg2 text-xs uppercase text-text-muted">
                            <tr>
                              <th className="w-12 px-4 py-3"></th>
                              <th className="px-4 py-3">Material</th>
                              <th className="px-4 py-3">Tipo</th>
                              <th className="px-4 py-3">Codigo/stock</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.rows.map(row => {
                              const selected = isEmergencyInventorySelected(row);
                              return (
                                <tr key={row.selectionKey} onClick={() => toggleEmergencyInventoryRow(row)} className={`cursor-pointer border-b border-dark-border/70 transition-colors last:border-0 ${selected ? 'bg-brand-cyan/10' : 'hover:bg-dark-bg2'}`}>
                                  <td className="px-4 py-3">
                                    <input type="checkbox" checked={selected} onChange={() => toggleEmergencyInventoryRow(row)} onClick={(event) => event.stopPropagation()} className="h-4 w-4 rounded border-dark-border text-brand-cyan" />
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-text-main">{row.nombre}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`rounded border px-2 py-1 text-xs font-semibold ${row.kind === 'item' ? 'border-brand-ember/30 bg-brand-ember/10 text-brand-ember' : 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan'}`}>
                                      {row.typeLabel}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-text-muted">
                                    {row.kind === 'item' ? (row.code || 'Sin codigo') : `Stock ${row.stock ?? '-'}`}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                )}
                {emergencyError && (
                  <p className="mt-4 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{emergencyError}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <span className="text-sm font-semibold text-text-muted">{selectedEmergencyCount} seleccionados</span>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEmergencyModalStep('base')} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white">
                    Volver
                  </button>
                  <button type="button" onClick={continueEmergencyMaterials} disabled={loadingEmergencyInventory} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:opacity-50">
                    Continuar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {emergencyModalStep === 'observations' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="w-full max-w-4xl overflow-hidden rounded-lg border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h4 className="rajdhani text-xl font-bold text-text-main">Observaciones del reporte</h4>
                  <p className="mt-1 text-xs text-text-muted">Paso 3 de 3</p>
                </div>
                <button type="button" onClick={resetEmergencyFlow} disabled={emergencySaving} className="px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red disabled:opacity-50">
                  x
                </button>
              </div>

              <div className="max-h-[calc(90vh-150px)] space-y-4 overflow-y-auto p-6">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase text-text-muted">Observacion general</span>
                  <textarea name="observaciones" value={emergencyForm.observaciones} onChange={handleEmergencyFormChange} rows="3" placeholder="Procedimiento con apoyo de SAMU." className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg px-3 py-2.5 text-sm text-text-main outline-none transition-colors placeholder-text-muted focus:border-brand-cyan" />
                </label>

                {emergencyMaterials.map((material, index) => {
                  const detail = materialsCatalog.find(item => String(item.idInventario) === String(material.idInventario));
                  const locationName = detail?.idUbicacion
                    ? (emergencyLocationNames[String(detail.idUbicacion)] || detail.ubicacionNombre)
                    : detail?.ubicacionNombre;
                  return (
                    <div key={`selected-material-${material.idInventario}`} className="rounded-lg border border-dark-border bg-dark-bg p-4">
                      <p className="text-sm font-bold text-text-main">{detail?.nombre || 'Material'}</p>
                      <p className="mt-1 text-xs text-text-muted">{locationName || 'Sin ubicacion'}</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold uppercase text-text-muted">Cantidad</span>
                          <input type="number" min="1" value={material.cantidad} onChange={(event) => updateEmergencyMaterial(index, 'cantidad', event.target.value)} className="w-full rounded-lg border border-dark-border bg-dark-bg2 px-3 py-2 text-sm text-text-main outline-none focus:border-brand-cyan" />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold uppercase text-text-muted">Tipo uso</span>
                          <select value={material.tipoUso} onChange={(event) => updateEmergencyMaterial(index, 'tipoUso', event.target.value)} className="w-full rounded-lg border border-dark-border bg-dark-bg2 px-3 py-2 text-sm text-text-main outline-none focus:border-brand-cyan">
                            {TIPOS_USO_MATERIAL.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                          </select>
                        </label>
                        <label className="flex items-end gap-2 pb-2 text-sm text-text-main">
                          <input type="checkbox" checked={material.descontarStock} onChange={(event) => updateEmergencyMaterial(index, 'descontarStock', event.target.checked)} className="h-4 w-4 rounded border-dark-border bg-dark-bg text-brand-cyan" />
                          Descontar stock
                        </label>
                      </div>
                      <textarea rows="2" value={material.observacion} onChange={(event) => updateEmergencyMaterial(index, 'observacion', event.target.value)} placeholder="Observacion del material" className="mt-3 w-full resize-none rounded-lg border border-dark-border bg-dark-bg2 px-3 py-2 text-sm text-text-main outline-none placeholder-text-muted focus:border-brand-cyan" />
                    </div>
                  );
                })}

                {emergencyItems.map((item, index) => {
                  const detail = serialItems.find(serialItem => String(serialItem.idItem) === String(item.idItem));
                  return (
                    <div key={`selected-item-${item.idItem}`} className="rounded-lg border border-dark-border bg-dark-bg p-4">
                      <p className="text-sm font-bold text-text-main">{detail?.nombre || 'Item serializado'}</p>
                      {detail?.codigo && <p className="mt-1 text-xs text-text-muted">{detail.codigo}</p>}
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold uppercase text-text-muted">Afectacion</span>
                          <select value={item.tipoAfectacion} onChange={(event) => updateEmergencyItem(index, 'tipoAfectacion', event.target.value)} className="w-full rounded-lg border border-dark-border bg-dark-bg2 px-3 py-2 text-sm text-text-main outline-none focus:border-brand-cyan">
                            {TIPOS_AFECTACION_ITEM.map(tipo => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-xs font-semibold uppercase text-text-muted">Estado aplicado</span>
                          <input value={item.estadoAplicado} onChange={(event) => updateEmergencyItem(index, 'estadoAplicado', event.target.value)} className="w-full rounded-lg border border-dark-border bg-dark-bg2 px-3 py-2 text-sm text-text-main outline-none focus:border-brand-cyan" />
                        </label>
                      </div>
                      <textarea rows="2" value={item.observacion} onChange={(event) => updateEmergencyItem(index, 'observacion', event.target.value)} placeholder="Observacion del item" className="mt-3 w-full resize-none rounded-lg border border-dark-border bg-dark-bg2 px-3 py-2 text-sm text-text-main outline-none placeholder-text-muted focus:border-brand-cyan" />
                    </div>
                  );
                })}

                {emergencyError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">{emergencyError}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <button type="button" onClick={() => setEmergencyModalStep('materials')} disabled={emergencySaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white disabled:opacity-50">
                  Volver
                </button>
                <button type="button" onClick={createEmergencyReport} disabled={emergencySaving} className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60">
                  <Icons.Report className="h-4 w-4" />
                  {emergencySaving ? 'Registrando...' : 'Registrar y descargar PDF'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ReportsView;
