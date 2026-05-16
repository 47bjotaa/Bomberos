import React, { useState, useEffect } from 'react';
import { Icons } from '../components/ui/Icons';
import BodegaCard from '../components/dashboard/BodegaCard';
import LocationItemsView from '../components/dashboard/LocationItemsView';
import MaterialDetailView from '../components/dashboard/MaterialDetailView';
import VehiculosView from '../components/dashboard/VehiculosView';
import EppView from '../components/dashboard/EppView';
import AssignEppModal from '../components/dashboard/AssignEppModal';
import AddInventoryMaterialModal from '../components/dashboard/AddInventoryMaterialModal';
import MoveMaterialModal from '../components/dashboard/MoveMaterialModal';
import { useTheme } from '../context/ThemeContext';
import { apiFetch, authService } from '../services/api';
import { getThemePalette } from '../utils/themePalette';

const GENERAL_INVENTORY_ID = 'general-inventory';
const TIPOS_PRODUCTO = [
  { id: 1, nombre: 'EPP' },
  { id: 2, nombre: 'Material de agua' },
  { id: 3, nombre: 'Material de rescate' },
  { id: 4, nombre: 'Acceso y ventilacion' },
  { id: 5, nombre: 'Material especifico' },
];

const getMaterialDetailRoute = (pathname) => {
  const itemMatch = pathname.match(/^\/dashboard\/materiales\/items\/([^/]+)$/);
  if (itemMatch) {
    return { type: 'item', id: itemMatch[1], fallback: {} };
  }

  const materialMatch = pathname.match(/^\/dashboard\/materiales\/([^/]+)$/);
  if (materialMatch) {
    return { type: 'material', id: materialMatch[1], fallback: {} };
  }

  return null;
};

function Dashboard({ setView }) {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('bodegas');
  const [inventoryView, setInventoryView] = useState('ubicaciones');
  const [materialDetailRoute, setMaterialDetailRoute] = useState(() => getMaterialDetailRoute(window.location.pathname));
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(true);
  const [ubicacionesError, setUbicacionesError] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [editingCatId, setEditingCatId] = useState(null);
  const [editCatData, setEditCatData] = useState({});
  const [confirmCatAction, setConfirmCatAction] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('Todos los tipos');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [addMaterialError, setAddMaterialError] = useState('');
  const [showInventoryMaterialModal, setShowInventoryMaterialModal] = useState(false);
  const [movingMaterial, setMovingMaterial] = useState(null);
  const [newMaterialData, setNewMaterialData] = useState({
    idTipoProducto: '',
    nombre: '',
    descripcion: '',
    esConsumible: false,
    esSerializacion: false,
    requiereMantencion: false,
    valorUnitario: ''
  });
  const [activeUbicacion, setActiveUbicacion] = useState(null);
  const [locationPath, setLocationPath] = useState([]);
  const [itemsUbicacion, setItemsUbicacion] = useState([]);
  const [subUbicaciones, setSubUbicaciones] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [unassignedItems, setUnassignedItems] = useState([]);
  const [showAddUbicacionModal, setShowAddUbicacionModal] = useState(false);
  const [newUbicacionData, setNewUbicacionData] = useState({ nombre: '', descripcion: '', idTipoUbicacion: '' });
  const [tiposUbicacion, setTiposUbicacion] = useState([]);
  const [loadingTiposUbicacion, setLoadingTiposUbicacion] = useState(false);
  const [addUbicacionError, setAddUbicacionError] = useState('');
  const [savingUbicacion, setSavingUbicacion] = useState(false);
  const [tiposArbolUbicacion, setTiposArbolUbicacion] = useState([]);
  const [loadingTiposArbol, setLoadingTiposArbol] = useState(false);
  const [tiposArbolError, setTiposArbolError] = useState('');
  const [showAddTipoUbicacionModal, setShowAddTipoUbicacionModal] = useState(false);
  const [newTipoUbicacionData, setNewTipoUbicacionData] = useState({ nombre: '', esTipoRaiz: false });
  const [savingTipoUbicacion, setSavingTipoUbicacion] = useState(false);
  const [addTipoUbicacionError, setAddTipoUbicacionError] = useState('');
  const [showTipoRelationsModal, setShowTipoRelationsModal] = useState(false);
  const [createdTipoUbicacion, setCreatedTipoUbicacion] = useState(null);
  const [selectedTipoPadreIds, setSelectedTipoPadreIds] = useState([]);
  const [savingTipoRelations, setSavingTipoRelations] = useState(false);
  const [tipoRelationsError, setTipoRelationsError] = useState('');
  const [stockMinimos, setStockMinimos] = useState([]);
  const [loadingStockMinimos, setLoadingStockMinimos] = useState(false);
  const [stockMinimosError, setStockMinimosError] = useState('');
  const [showAddStockMinimoModal, setShowAddStockMinimoModal] = useState(false);
  const [newStockMinimoData, setNewStockMinimoData] = useState({ nombre: '', idUbicacion: '', materiales: [] });
  const [stockMateriales, setStockMateriales] = useState([]);
  const [stockMaterialSearch, setStockMaterialSearch] = useState('');
  const [loadingStockMateriales, setLoadingStockMateriales] = useState(false);
  const [stockMaterialesError, setStockMaterialesError] = useState('');
  const [savingStockMinimo, setSavingStockMinimo] = useState(false);
  const [addStockMinimoError, setAddStockMinimoError] = useState('');
  const [showAssignEppModal, setShowAssignEppModal] = useState(false);
  const [eppData, setEppData] = useState([
    { id: 1, equipo: 'Casco Estructural Gallet F1', codigo: 'EPP-CAS-001', asignadoA: 'Juan Pérez', inicial: 'J', fecha: '12 Oct 2023', estado: 'Operativo' },
    { id: 2, equipo: 'Cota Estructural Lion', codigo: 'EPP-COT-015', asignadoA: 'María González', inicial: 'M', fecha: '05 Nov 2023', estado: 'En Reparación' },
    { id: 3, equipo: 'Botas de Rescate Haix', codigo: 'EPP-BOT-042', asignadoA: 'Carlos Soto', inicial: 'C', fecha: '10 Ene 2024', estado: 'Operativo' },
    { id: 4, equipo: 'Guantes Estructurales Seiz', codigo: 'EPP-GUA-088', asignadoA: 'Ana Rojas', inicial: 'A', fecha: '22 Feb 2024', estado: 'Operativo' },
    { id: 5, equipo: 'Esclavina (Monja)', codigo: 'EPP-ESC-102', asignadoA: 'Luis Méndez', inicial: 'L', fecha: '01 Mar 2024', estado: 'Operativo' }
  ]);
  const [campanasActivas, setCampanasActivas] = useState([]);
  const [campanasFinalizadas, setCampanasFinalizadas] = useState([]);
  const [loadingCampanas, setLoadingCampanas] = useState(false);
  const [campanasError, setCampanasError] = useState('');
  const [showCreateCampanaModal, setShowCreateCampanaModal] = useState(false);
  const [savingCampana, setSavingCampana] = useState(false);
  const [createCampanaError, setCreateCampanaError] = useState('');
  const [copiedDonationSlug, setCopiedDonationSlug] = useState('');
  const [generatingDonationLinkId, setGeneratingDonationLinkId] = useState(null);
  const [donationLinkError, setDonationLinkError] = useState('');
  const [newCampanaData, setNewCampanaData] = useState({
    nombre: '',
    descripcion: '',
    metaMonto: '',
    fechaInicio: '',
    fechaFin: '',
    imagenUrl: '',
  });

  useEffect(() => {
    if (activeTab === 'bodegas') {
      fetchUbicaciones();
    } else if (activeTab === 'catalogo') {
      fetchCatalogo();
    }
  }, [activeTab]);

  useEffect(() => {
    const handlePopState = () => {
      setMaterialDetailRoute(getMaterialDetailRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (activeTab === 'bodegas' && inventoryView === 'ubicaciones' && !activeUbicacion) {
      selectGeneralInventario();
    }
  }, [activeTab, inventoryView, activeUbicacion]);

  useEffect(() => {
    if (activeTab === 'bodegas' && inventoryView === 'arbol') {
      fetchTiposArbolUbicacion();
    }
  }, [activeTab, inventoryView]);

  useEffect(() => {
    if (activeTab === 'bodegas' && inventoryView === 'stocks') {
      fetchStockMinimos();
    }
  }, [activeTab, inventoryView]);

  useEffect(() => {
    if (activeTab === 'bodegas' && inventoryView === 'catalogo') {
      fetchCatalogo();
    }
  }, [activeTab, inventoryView]);

  useEffect(() => {
    if (activeTab === 'donaciones') {
      fetchCampanasDonaciones();
    }
  }, [activeTab]);

  const getArrayPayload = (payload, keys = []) => {
    if (Array.isArray(payload)) return payload;

    for (const key of keys) {
      if (Array.isArray(payload?.[key])) return payload[key];
    }

    if (Array.isArray(payload?.data)) return payload.data;
    if (Array.isArray(payload?.items)) return payload.items;
    if (Array.isArray(payload?.result)) return payload.result;
    if (Array.isArray(payload?.value)) return payload.value;

    if (payload?.data && typeof payload.data === 'object') {
      return getArrayPayload(payload.data, keys);
    }

    if (payload?.result && typeof payload.result === 'object') {
      return getArrayPayload(payload.result, keys);
    }

    return [];
  };

  const getArrayByKey = (payload, key) => (
    Array.isArray(payload?.[key]) ? payload[key] : []
  );

  const toBoolean = (value) => (
    value === true || value === 1 || value === '1' || String(value).toLowerCase() === 'true'
  );

  const parseCurrencyValue = (value) => {
    if (typeof value === 'number') return value;
    return parseInt(String(value || '').replace(/\D/g, ''), 10) || 0;
  };

  const formatCurrency = (value) => `$${parseCurrencyValue(value).toLocaleString('es-CL')}`;

  const getCurrentBomberoId = async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.idBombero) return user.idBombero;

    const bomberosData = await apiFetch('/api/bomberos');
    const currentBombero = getArrayPayload(bomberosData).find(bombero => (
      Number(bombero.idUsuario) === Number(user.idUsuario)
      || String(bombero.email || '').toLowerCase() === String(user.email || '').toLowerCase()
    ));

    return currentBombero?.idBombero || currentBombero?.id;
  };

  const copyTextToClipboard = async (text) => {
    if (!text) return false;

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('No se pudo copiar el link de donacion:', error);
      window.prompt('Copia el link de donacion:', text);
      return false;
    }
  };

  const generateAndCopyDonationLink = async (campaign) => {
    if (!campaign?.id || generatingDonationLinkId) return;

    setGeneratingDonationLinkId(campaign.id);
    setDonationLinkError('');

    try {
      const idBombero = await getCurrentBomberoId();
      if (!idBombero) {
        throw new Error('No se pudo identificar el bombero de la sesion.');
      }

      const linkData = await apiFetch(`/api/campanasdonaciones/${campaign.id}/bomberos/link`, {
        method: 'POST',
        body: JSON.stringify({
          idBombero: Number(idBombero),
          urlBasePublica: 'https://cuartelamigo.cl',
        }),
      });

      if (!linkData.urlPublica) {
        throw new Error('La API no devolvio una urlPublica.');
      }

      await copyTextToClipboard(linkData.urlPublica);
      setCopiedDonationSlug(campaign.slug || String(campaign.id));
      window.setTimeout(() => setCopiedDonationSlug(currentSlug => (
        currentSlug === (campaign.slug || String(campaign.id)) ? '' : currentSlug
      )), 2200);
    } catch (error) {
      console.error('No se pudo generar el link de donacion:', error);
      setDonationLinkError(error.message || 'No se pudo generar el link de donacion.');
    } finally {
      setGeneratingDonationLinkId(null);
    }
  };

  const formatDateChile = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Santiago',
    }).format(date);
  };

  const getChileIsoFromDateInput = (value, endOfDay = false) => {
    if (!value) return '';
    const time = endOfDay ? '23:59:59.000' : '00:00:00.000';
    return `${value}T${time}-04:00`;
  };

  const mapCampana = (campana) => {
    const meta = Number(campana.metaMonto || 0);
    const recaudado = Number(campana.montoRecaudado || 0);
    const progress = meta > 0 ? Math.min(100, Math.round((recaudado / meta) * 100)) : 0;

    return {
      id: campana.idCampanaDonacion || campana.id,
      nombre: campana.nombre || 'Campana sin nombre',
      descripcion: campana.descripcion || '',
      metaMonto: meta,
      montoRecaudado: recaudado,
      fechaInicio: campana.fechaInicio,
      fechaFin: campana.fechaFin,
      estado: campana.estado || '',
      slug: campana.slug || '',
      imagenUrl: campana.imagenUrl || '',
      totalDonaciones: campana.totalDonaciones || 0,
      progress,
    };
  };

  const mapUbicacion = (u) => {
    const idVehiculo = u.idVehiculo || u.idCarro || null;
    const idUbicacion = u.idUbicacion || u.idUbicacionActual || u.idUbicacionHija || (!idVehiculo ? u.id : null);

    return {
      id: idUbicacion || u.id || idVehiculo,
      idUbicacion,
      idVehiculo,
      name: u.nombre || u.name || u.nombreUbicacion || u.descripcion || 'Ubicacion',
      items: u.totalItems || u.items || u.totalMateriales || u.cantidadMateriales || 0,
      idTipo: u.idTipo || u.idTipoUbicacion,
      nombreTipo: u.nombreTipo || u.tipo || u.tipoUbicacion || ''
    };
  };

  const getMaterialesPayload = (payload) => {
    if (Array.isArray(payload)) return payload;

    const materiales = [
      ...getArrayByKey(payload, 'materiales'),
      ...getArrayByKey(payload, 'items')
    ];

    return materiales.length > 0 ? materiales : getArrayPayload(payload, ['data', 'result', 'value']);
  };

  const mapMateriales = (dataMateriales) => getMaterialesPayload(dataMateriales).map(item => ({
    id: item.idInventarioItem || item.idItem || item.idInventario || item.idMaterial || item.id,
    idItem: item.idItem,
    idInventario: item.idInventario || item.idInventarioItem,
    idMaterial: item.idMaterial || item.id,
    nombre: item.nombreMaterial || item.nombre || 'Material',
    categoria: item.nombreTipoProducto || item.tipoMaterial || 'General',
    cantidad: item.cantidad || 1,
    codigo: item.codigoUnico || null,
    idUbicacion: item.idUbicacion || item.idUbicacionActual,
    idUbicacionRaiz: item.idUbicacionRaiz,
    ubicacionRaiz: item.nombreUbicacionRaiz || item.ubicacionRaiz || '',
    ubicacion: item.nombreUbicacion || item.ubicacion || item.nombreUbicacionActual || item.nombreUbicacionPadre || item.nombrePadre || '',
    serializado: Boolean(item.idItem || item.codigoUnico),
    icon: (item.nombreTipoProducto || '').toLowerCase().includes('comunic') ? 'radio' :
          (item.nombreTipoProducto || '').toLowerCase().includes('medic') ? 'medical' :
          (item.nombreTipoProducto || '').toLowerCase().includes('extin') ? 'fire' : 'package'
  }));

  const selectGeneralInventario = async () => {
    setLocationPath([]);
    setSubUbicaciones([]);
    setActiveUbicacion(GENERAL_INVENTORY_ID);
    setLoadingItems(true);
    setItemsUbicacion([]);

    try {
      const data = await apiFetch('/api/materiales/todos');
      setItemsUbicacion(mapMateriales(data));
    } catch (error) {
      console.error("Error al cargar inventario general:", error);
      setItemsUbicacion([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const fetchItemsUbicacion = async (ubicacion, { updateChildren = true } = {}) => {
    const id = ubicacion.id;

    setActiveUbicacion(id);
    setLoadingItems(true);
    setItemsUbicacion([]);
    try {
      const requests = [apiFetch(`/api/materiales?idUbicacion=${id}`)];

      if (updateChildren) {
        requests.push(apiFetch(`/api/ubicaciones/${id}/hijas`));
      }

      const [dataMateriales, dataHijas = []] = await Promise.all(requests);
      const mappedHijas = getArrayPayload(dataHijas, ['ubicaciones', 'hijas', 'subUbicaciones']).map(mapUbicacion);
      if (updateChildren) {
        setSubUbicaciones(mappedHijas);
      }
      const allItems = mapMateriales(dataMateriales);
      setItemsUbicacion(allItems);
    } catch (error) {
      console.error("Error al cargar detalles de la ubicación:", error);
    } finally {
      setLoadingItems(false);
    }
  };

  const openUbicacion = async (ubicacion) => {
    const normalizedUbicacion = mapUbicacion(ubicacion);

    setLocationPath(prev => {
      const currentIndex = prev.findIndex(item => item.id === normalizedUbicacion.id);
      if (currentIndex >= 0) {
        return prev.slice(0, currentIndex + 1);
      }

      return [...prev, normalizedUbicacion];
    });

    await fetchItemsUbicacion(normalizedUbicacion);
  };

  const selectGeneralUbicacion = async () => {
    const currentUbicacion = locationPath[locationPath.length - 1];
    if (!currentUbicacion) return;

    await fetchItemsUbicacion(currentUbicacion, { updateChildren: false });
  };

  const resetUbicacionesExplorer = () => {
    setLocationPath([]);
    setActiveUbicacion(null);
    setItemsUbicacion([]);
    setSubUbicaciones([]);
  };

  const goToPathIndex = async (index) => {
    if (index < 0) {
      resetUbicacionesExplorer();
      return;
    }

    const nextPath = locationPath.slice(0, index + 1);
    const nextUbicacion = nextPath[nextPath.length - 1];

    setLocationPath(nextPath);
    await fetchItemsUbicacion(nextUbicacion);
  };

  const openMaterialDetail = (material) => {
    const isSerializado = Boolean(material.serializado || material.idItem || material.codigo);
    const detailId = isSerializado ? material.idItem : material.idMaterial;

    if (!detailId) return;

    const nextRoute = {
      type: isSerializado ? 'item' : 'material',
      id: detailId,
      fallback: material,
    };
    const nextPath = isSerializado
      ? `/dashboard/materiales/items/${detailId}`
      : `/dashboard/materiales/${detailId}`;

    window.history.pushState({}, '', nextPath);
    setMaterialDetailRoute(nextRoute);
  };

  const closeMaterialDetail = () => {
    if (window.location.pathname.startsWith('/dashboard/materiales/')) {
      window.history.pushState({}, '', '/dashboard');
    }

    setMaterialDetailRoute(null);
  };

  const selectDashboardTab = (tab) => {
    setActiveTab(tab);
    setMaterialDetailRoute(null);

    if (window.location.pathname.startsWith('/dashboard/materiales/')) {
      window.history.pushState({}, '', '/dashboard');
    }
  };


  const fetchCatalogo = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/materiales/creados');
      const mappedData = getArrayPayload(data, ['materiales', 'items']).map(m => ({
        id: m.idMaterial || m.id,
        idMaterial: m.idMaterial || m.id,
        idTipoProducto: m.idTipoProducto,
        nombre: m.nombre || m.name || 'Sin nombre',
        descripcion: m.descripcion || '',
        tipo: m.nombreTipoProducto || m.tipoMaterial || m.tipo || TIPOS_PRODUCTO.find(tipo => tipo.id === Number(m.idTipoProducto))?.nombre || 'General',
        valor: formatCurrency(m.valorUnitario ?? m.valor ?? m.precio ?? 0),
        valorUnitario: parseCurrencyValue(m.valorUnitario ?? m.valor ?? m.precio ?? 0),
        desechable: toBoolean(m.esConsumible) || toBoolean(m.desechable),
        serializado: toBoolean(m.serializado) || toBoolean(m.esSerializado) || toBoolean(m.esSerializacion),
        mantencion: toBoolean(m.requiereMantencion) || toBoolean(m.mantencion)
      })).filter(material => material.id);
      setCatalogo(mappedData);
    } catch (error) {
      console.error("Error al cargar catalogo:", error);
      setCatalogo([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampanasDonaciones = async () => {
    setLoadingCampanas(true);
    setCampanasError('');

    try {
      const [activasData, finalizadasData] = await Promise.all([
        apiFetch('/api/campanasdonaciones?estado=Activa'),
        apiFetch('/api/campanasdonaciones?estado=Finalizada'),
      ]);

      setCampanasActivas(getArrayPayload(activasData).map(mapCampana));
      setCampanasFinalizadas(getArrayPayload(finalizadasData).map(mapCampana));
    } catch (error) {
      console.error('Error al cargar campanas de donaciones:', error);
      setCampanasError(error.message || 'No se pudieron cargar las campanas de donaciones.');
      setCampanasActivas([]);
      setCampanasFinalizadas([]);
    } finally {
      setLoadingCampanas(false);
    }
  };

  const resetNewCampanaData = () => {
    setNewCampanaData({
      nombre: '',
      descripcion: '',
      metaMonto: '',
      fechaInicio: '',
      fechaFin: '',
      imagenUrl: '',
    });
    setCreateCampanaError('');
  };

  const openCreateCampanaModal = () => {
    resetNewCampanaData();
    setShowCreateCampanaModal(true);
  };

  const closeCreateCampanaModal = () => {
    if (savingCampana) return;
    setShowCreateCampanaModal(false);
    resetNewCampanaData();
  };

  const handleCreateCampana = async (event) => {
    event.preventDefault();
    setCreateCampanaError('');

    const payload = {
      nombre: newCampanaData.nombre.trim(),
      descripcion: newCampanaData.descripcion.trim(),
      metaMonto: parseCurrencyValue(newCampanaData.metaMonto),
      fechaInicio: getChileIsoFromDateInput(newCampanaData.fechaInicio),
      fechaFin: getChileIsoFromDateInput(newCampanaData.fechaFin, true),
      imagenUrl: newCampanaData.imagenUrl.trim(),
      estado: 'Activa',
    };

    if (!payload.nombre || !payload.descripcion || !payload.metaMonto || !payload.fechaInicio || !payload.fechaFin) {
      setCreateCampanaError('Completa nombre, descripcion, meta y fechas para crear la campana.');
      return;
    }

    setSavingCampana(true);

    try {
      await apiFetch('/api/campanasdonaciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setShowCreateCampanaModal(false);
      resetNewCampanaData();
      await fetchCampanasDonaciones();
    } catch (error) {
      setCreateCampanaError(error.message || 'No se pudo crear la campana.');
    } finally {
      setSavingCampana(false);
    }
  };

  const resetNewMaterialData = () => {
    setNewMaterialData({
      idTipoProducto: '',
      nombre: '',
      descripcion: '',
      esConsumible: false,
      esSerializacion: false,
      requiereMantencion: false,
      valorUnitario: ''
    });
    setAddMaterialError('');
  };

  const closeAddMaterialModal = () => {
    if (savingMaterial) return;
    setShowAddMaterialModal(false);
    resetNewMaterialData();
  };

  const handleCreateMaterial = async (event) => {
    event.preventDefault();
    setAddMaterialError('');

    const payload = {
      idTipoProducto: Number(newMaterialData.idTipoProducto),
      nombre: newMaterialData.nombre.trim(),
      descripcion: newMaterialData.descripcion.trim(),
      esConsumible: Boolean(newMaterialData.esConsumible),
      esSerializacion: Boolean(newMaterialData.esSerializacion),
      requiereMantencion: Boolean(newMaterialData.requiereMantencion),
      valorUnitario: parseCurrencyValue(newMaterialData.valorUnitario)
    };

    if (!payload.idTipoProducto || !payload.nombre || !payload.descripcion) {
      setAddMaterialError('Completa tipo, nombre y descripcion para crear el material.');
      return;
    }

    setSavingMaterial(true);
    try {
      await apiFetch('/api/materiales', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await fetchCatalogo();
      setShowAddMaterialModal(false);
      resetNewMaterialData();
    } catch (error) {
      setAddMaterialError(error.message || 'No se pudo crear el material.');
    } finally {
      setSavingMaterial(false);
    }
  };

  const fetchUbicaciones = async () => {
    setLoadingUbicaciones(true);
    setUbicacionesError('');
    try {
      const data = await apiFetch('/api/ubicaciones');
      const mappedData = getArrayPayload(data, ['ubicaciones']).map(mapUbicacion);
      setUbicaciones(mappedData);
    } catch (error) {
      console.error("Error al cargar ubicaciones:", error);
      setUbicacionesError(error.message || 'No se pudieron cargar las ubicaciones.');
      setUbicaciones([]);
    } finally {
      setLoadingUbicaciones(false);
    }
  };

  const currentUbicacion = locationPath[locationPath.length - 1] || null;
  const visibleUbicaciones = currentUbicacion ? subUbicaciones : ubicaciones;
  const selectedUbicacion = [...locationPath, ...subUbicaciones, ...ubicaciones].find(u => u.id === activeUbicacion);
  const isGeneralInventario = activeUbicacion === GENERAL_INVENTORY_ID;
  const selectedUbicacionName = isGeneralInventario ? 'General' : selectedUbicacion?.name || currentUbicacion?.name || 'Ubicacion';
  const selectedUbicacionTipo = selectedUbicacion?.nombreTipo || currentUbicacion?.nombreTipo || '';
  const isGeneralVehiculo = currentUbicacion?.id === activeUbicacion && selectedUbicacionTipo.toLowerCase() === 'vehiculo';
  const addMaterialDisabledReason = isGeneralInventario
    ? 'Selecciona una ubicacion especifica para añadir materiales.'
    : isGeneralVehiculo ? 'No se pueden añadir materiales en General de una ubicacion tipo Vehiculo. Selecciona una gaveta o sububicacion.' : '';
  const selectedOrigen = selectedUbicacion ? { ...selectedUbicacion, name: selectedUbicacionName } : { id: activeUbicacion, name: selectedUbicacionName };
  const palette = getThemePalette(theme);
  const inventoryViews = [
    { id: 'ubicaciones', label: 'Ubicaciones Principales' },
    { id: 'arbol', label: 'Arbol de Ubicaciones' },
    { id: 'stocks', label: 'Stocks Minimos' },
    { id: 'catalogo', label: 'Catalogo' },
  ];
  const refreshActiveUbicacion = async () => {
    if (!activeUbicacion) return;

    if (isGeneralInventario) {
      await selectGeneralInventario();
      return;
    }

    await fetchItemsUbicacion({ id: activeUbicacion, name: selectedUbicacionName }, { updateChildren: false });
  };

  const mapTipoUbicacion = (tipo) => ({
    id: tipo.idTipo || tipo.idTipoUbicacion || tipo.id,
    nombre: tipo.nombre || tipo.name || tipo.nombreTipo || 'Tipo de ubicacion',
    idCompania: tipo.idCompania,
    esTipoRaiz: toBoolean(tipo.esTipoRaiz),
  });

  const fetchTiposArbolUbicacion = async () => {
    setLoadingTiposArbol(true);
    setTiposArbolError('');

    try {
      const data = await apiFetch('/api/tipoubicaciones');
      const tipos = getArrayPayload(data, ['tipos', 'tipoUbicaciones', 'tiposUbicacion'])
        .map(mapTipoUbicacion)
        .filter(tipo => tipo.id);
      setTiposArbolUbicacion(tipos);
      return tipos;
    } catch (error) {
      setTiposArbolError(error.message || 'No se pudieron cargar los tipos de ubicacion.');
      setTiposArbolUbicacion([]);
      return [];
    } finally {
      setLoadingTiposArbol(false);
    }
  };

  const openAddTipoUbicacionModal = () => {
    setNewTipoUbicacionData({ nombre: '', esTipoRaiz: false });
    setAddTipoUbicacionError('');
    setTipoRelationsError('');
    setCreatedTipoUbicacion(null);
    setSelectedTipoPadreIds([]);
    setShowAddTipoUbicacionModal(true);
  };

  const closeAddTipoUbicacionModal = () => {
    if (savingTipoUbicacion) return;

    setShowAddTipoUbicacionModal(false);
    setAddTipoUbicacionError('');
  };

  const canCreateTipoUbicacion = newTipoUbicacionData.nombre.trim();

  const getTipoFromCreateResponse = (payload) => {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;

    const candidates = [
      payload,
      payload.data,
      payload.result,
      payload.value,
      payload.tipoUbicacion,
      payload.tipo,
    ];

    const tipo = candidates.find(candidate => (
      candidate
      && typeof candidate === 'object'
      && (candidate.idTipoUbicacion || candidate.idTipo || candidate.id)
    ));

    return tipo ? mapTipoUbicacion(tipo) : null;
  };

  const handleCreateTipoUbicacion = async (event) => {
    event.preventDefault();
    if (!canCreateTipoUbicacion || savingTipoUbicacion) return;

    setSavingTipoUbicacion(true);
    setAddTipoUbicacionError('');

    try {
      const previousTipoIds = new Set(tiposArbolUbicacion.map(tipo => String(tipo.id)));
      const response = await apiFetch('/api/tipoubicaciones', {
        method: 'POST',
        body: JSON.stringify({
          nombre: newTipoUbicacionData.nombre.trim(),
          esTipoRaiz: Boolean(newTipoUbicacionData.esTipoRaiz),
        }),
      });

      const updatedTipos = await fetchTiposArbolUbicacion();
      const createdFromResponse = getTipoFromCreateResponse(response);
      const createdFromList = updatedTipos.find(tipo => (
        !previousTipoIds.has(String(tipo.id))
        && tipo.nombre.toLowerCase() === newTipoUbicacionData.nombre.trim().toLowerCase()
      )) || updatedTipos.find(tipo => (
        tipo.nombre.toLowerCase() === newTipoUbicacionData.nombre.trim().toLowerCase()
        && tipo.esTipoRaiz === Boolean(newTipoUbicacionData.esTipoRaiz)
      ));
      const nextCreatedTipo = createdFromResponse?.id ? createdFromResponse : createdFromList;

      if (!nextCreatedTipo?.id) {
        throw new Error('El tipo fue creado, pero no se pudo identificar su ID para crear relaciones.');
      }

      setCreatedTipoUbicacion(nextCreatedTipo);
      setSelectedTipoPadreIds([]);
      setTipoRelationsError('');
      setShowAddTipoUbicacionModal(false);
      setShowTipoRelationsModal(true);
    } catch (error) {
      setAddTipoUbicacionError(error.message || 'No se pudo crear el tipo de ubicacion.');
    } finally {
      setSavingTipoUbicacion(false);
    }
  };

  const toggleTipoPadreSelection = (tipoId) => {
    setSelectedTipoPadreIds(prev => (
      prev.includes(tipoId)
        ? prev.filter(id => id !== tipoId)
        : [...prev, tipoId]
    ));
  };

  const closeTipoRelationsModal = () => {
    if (savingTipoRelations) return;

    setShowTipoRelationsModal(false);
    setTipoRelationsError('');
    setCreatedTipoUbicacion(null);
    setSelectedTipoPadreIds([]);
  };

  const handleCreateTipoRelations = async (event) => {
    event.preventDefault();
    if (!createdTipoUbicacion?.id || savingTipoRelations || selectedTipoPadreIds.length === 0) return;

    setSavingTipoRelations(true);
    setTipoRelationsError('');

    try {
      const selectedTipos = tiposArbolUbicacion.filter(tipo => selectedTipoPadreIds.includes(tipo.id));
      await Promise.all(selectedTipos.map(tipoPadre => apiFetch('/api/relaciontipoubicaciones', {
        method: 'POST',
        body: JSON.stringify({
          idCompania: Number(tipoPadre.idCompania || createdTipoUbicacion.idCompania || 0),
          idTipoUbicacionPadre: Number(tipoPadre.id),
          idTipoUbicacionHijo: Number(createdTipoUbicacion.id),
        }),
      })));

      setShowTipoRelationsModal(false);
      setTipoRelationsError('');
      setCreatedTipoUbicacion(null);
      setSelectedTipoPadreIds([]);
    } catch (error) {
      setTipoRelationsError(error.message || 'No se pudieron crear las relaciones del tipo de ubicacion.');
    } finally {
      setSavingTipoRelations(false);
    }
  };

  const mapStockMinimo = (stock) => ({
    id: stock.idStockMinimo || stock.id,
    idUbicacion: stock.idUbicacion,
    nombreUbicacion: stock.nombreUbicacion || stock.ubicacion || 'Ubicacion',
    nombre: stock.nombre || stock.name || 'Stock minimo',
  });

  const fetchStockMinimos = async () => {
    setLoadingStockMinimos(true);
    setStockMinimosError('');

    try {
      const data = await apiFetch('/api/stockminimos');
      const stocks = getArrayPayload(data, ['stockMinimos', 'stocks', 'stock'])
        .map(mapStockMinimo)
        .filter(stock => stock.id);
      setStockMinimos(stocks);
    } catch (error) {
      setStockMinimosError(error.message || 'No se pudieron cargar los stocks minimos.');
      setStockMinimos([]);
    } finally {
      setLoadingStockMinimos(false);
    }
  };

  const mapStockMaterial = (material) => ({
    id: material.idMaterial || material.id,
    nombre: material.nombre || material.nombreMaterial || 'Material',
    tipo: material.nombreTipoProducto || material.tipoMaterial || 'General',
    descripcion: material.descripcion || material.descripcionMaterial || '',
  });

  const fetchStockMateriales = async () => {
    setLoadingStockMateriales(true);
    setStockMaterialesError('');

    try {
      const data = await apiFetch('/api/materiales/creados');
      const materiales = getArrayPayload(data, ['materiales', 'items'])
        .map(mapStockMaterial)
        .filter(material => material.id);
      setStockMateriales(materiales);
      return materiales;
    } catch (error) {
      setStockMaterialesError(error.message || 'No se pudieron cargar los materiales.');
      setStockMateriales([]);
      return [];
    } finally {
      setLoadingStockMateriales(false);
    }
  };

  const openAddStockMinimoModal = async () => {
    setNewStockMinimoData({ nombre: '', idUbicacion: '', materiales: [] });
    setStockMaterialSearch('');
    setAddStockMinimoError('');
    setStockMaterialesError('');
    setShowAddStockMinimoModal(true);
    await fetchStockMateriales();
  };

  const closeAddStockMinimoModal = () => {
    if (savingStockMinimo) return;

    setShowAddStockMinimoModal(false);
    setAddStockMinimoError('');
  };

  const toggleStockMaterial = (materialId) => {
    setNewStockMinimoData(currentData => {
      const exists = currentData.materiales.some(material => String(material.idMaterial) === String(materialId));
      return {
        ...currentData,
        materiales: exists
          ? currentData.materiales.filter(material => String(material.idMaterial) !== String(materialId))
          : [...currentData.materiales, { idMaterial: Number(materialId), cantidad: 1 }],
      };
    });
  };

  const updateStockMaterialCantidad = (materialId, cantidad) => {
    const nextCantidad = Math.max(1, Number(cantidad) || 1);
    setNewStockMinimoData(currentData => ({
      ...currentData,
      materiales: currentData.materiales.map(material => (
        String(material.idMaterial) === String(materialId)
          ? { ...material, cantidad: nextCantidad }
          : material
      )),
    }));
  };

  const getSelectedStockMaterial = (materialId) => (
    newStockMinimoData.materiales.find(material => String(material.idMaterial) === String(materialId))
  );

  const visibleStockMateriales = stockMateriales.filter(material => (
    material.nombre.toLowerCase().includes(stockMaterialSearch.trim().toLowerCase())
  ));

  const canCreateStockMinimo = newStockMinimoData.nombre.trim()
    && newStockMinimoData.idUbicacion
    && newStockMinimoData.materiales.length > 0
    && newStockMinimoData.materiales.every(material => material.idMaterial && material.cantidad > 0);

  const handleCreateStockMinimo = async (event) => {
    event.preventDefault();
    if (!canCreateStockMinimo || savingStockMinimo) return;

    setSavingStockMinimo(true);
    setAddStockMinimoError('');

    try {
      await apiFetch('/api/stockminimos', {
        method: 'POST',
        body: JSON.stringify({
          idUbicacion: Number(newStockMinimoData.idUbicacion),
          nombre: newStockMinimoData.nombre.trim(),
          materiales: newStockMinimoData.materiales.map(material => ({
            idMaterial: Number(material.idMaterial),
            cantidad: Number(material.cantidad),
          })),
        }),
      });

      setShowAddStockMinimoModal(false);
      await fetchStockMinimos();
    } catch (error) {
      setAddStockMinimoError(error.message || 'No se pudo crear el stock minimo.');
    } finally {
      setSavingStockMinimo(false);
    }
  };

  const loadTiposUbicacion = async () => {
    setLoadingTiposUbicacion(true);
    setAddUbicacionError('');
    setTiposUbicacion([]);

    try {
      let endpoint = '/api/tipoubicaciones';

      if (currentUbicacion) {
        let idTipoPadre = currentUbicacion.idTipo;

        if (!idTipoPadre && currentUbicacion.nombreTipo) {
          const rootTypesPayload = await apiFetch('/api/tipoubicaciones');
          const rootTypes = getArrayPayload(rootTypesPayload, ['tipos', 'tipoUbicaciones', 'tiposUbicacion']).map(mapTipoUbicacion);
          const parentType = rootTypes.find(tipo => (
            tipo.nombre.toLowerCase() === currentUbicacion.nombreTipo.toLowerCase()
          ));
          idTipoPadre = parentType?.id;
        }

        if (!idTipoPadre) {
          throw new Error('No se pudo identificar el tipo de la ubicacion padre.');
        }

        endpoint = `/api/tipoubicaciones/${idTipoPadre}/hijos`;
      }

      const data = await apiFetch(endpoint);
      const tipos = getArrayPayload(data, ['tipos', 'tipoUbicaciones', 'tiposUbicacion'])
        .map(mapTipoUbicacion)
        .filter(tipo => (
          tipo.id
          && tipo.nombre.toLowerCase() !== 'vehiculo'
          && (currentUbicacion || tipo.esTipoRaiz)
        ));

      setTiposUbicacion(tipos);
      setNewUbicacionData(currentData => ({
        ...currentData,
        idTipoUbicacion: tipos[0]?.id ? String(tipos[0].id) : '',
      }));
    } catch (error) {
      setAddUbicacionError(error.message || 'No se pudieron cargar los tipos de ubicacion.');
    } finally {
      setLoadingTiposUbicacion(false);
    }
  };

  const openAddUbicacionModal = async () => {
    setNewUbicacionData({ nombre: '', descripcion: '', idTipoUbicacion: '' });
    setTiposUbicacion([]);
    setAddUbicacionError('');
    setShowAddUbicacionModal(true);
    await loadTiposUbicacion();
  };

  const closeAddUbicacionModal = () => {
    if (savingUbicacion) return;

    setShowAddUbicacionModal(false);
    setAddUbicacionError('');
  };

  const canCreateUbicacion = newUbicacionData.nombre.trim()
    && newUbicacionData.descripcion.trim()
    && newUbicacionData.idTipoUbicacion
    && (!currentUbicacion || currentUbicacion.idUbicacion);

  const handleCreateUbicacion = async (event) => {
    event.preventDefault();
    if (!canCreateUbicacion || savingUbicacion) return;

    const parentUbicacionId = currentUbicacion?.idUbicacion || null;
    const payload = {
      nombre: newUbicacionData.nombre.trim(),
      descripcion: newUbicacionData.descripcion.trim(),
      idTipo: Number(newUbicacionData.idTipoUbicacion),
      idPadre: parentUbicacionId ? Number(parentUbicacionId) : null,
    };

    setSavingUbicacion(true);
    setAddUbicacionError('');

    try {
      await apiFetch('/api/ubicaciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setShowAddUbicacionModal(false);
      if (currentUbicacion) {
        await fetchItemsUbicacion(currentUbicacion);
      } else {
        await fetchUbicaciones();
      }
    } catch (error) {
      setAddUbicacionError(error.message || 'No se pudo crear la ubicacion.');
    } finally {
      setSavingUbicacion(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-text-main overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-dark-border bg-dark-surface z-20 relative flex-shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mr-4 md:mr-8" onClick={() => setView('landing')}>
          <div className="w-8 h-8 flex items-center justify-center">
            <img src="/images/logo.png" className="brand-logo" alt="SYNETIX" style={{ height: '32px' }} />
          </div>
          <span className="font-bold tracking-tight rajdhani text-xl hidden md:block" style={{ color: palette.text }}>SGLB</span>
        </div>

        {/* Center: Navigation Icons */}
        <nav className="flex-1 flex items-center justify-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => selectDashboardTab('inicio')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'inicio' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Dashboard /> <span className="hidden lg:inline">Inicio</span>
          </button>
          <button onClick={() => selectDashboardTab('bodegas')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'bodegas' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Inventory /> <span className="hidden lg:inline">Inventario</span>
          </button>
          <button onClick={() => selectDashboardTab('vehiculos')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'vehiculos' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Truck /> <span className="hidden lg:inline">Vehículos</span>
          </button>
          <button onClick={() => selectDashboardTab('epp')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'epp' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Shield /> <span className="hidden lg:inline">EPP</span>
          </button>
          <button onClick={() => selectDashboardTab('libro-guardia')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'libro-guardia' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Traceability /> <span className="hidden lg:inline">Libro Guardia</span>
          </button>
          <button onClick={() => selectDashboardTab('donaciones')} className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'donaciones' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Finance /> <span className="hidden lg:inline">Donaciones</span>
          </button>
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-4 ml-4 md:ml-8 relative">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle" 
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>
          
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-dark-bg3 p-1.5 rounded-lg transition-colors"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold" style={{ color: palette.text }}>Nicolás C.</div>
              <div className="text-xs text-brand-cyan">Capitán</div>
            </div>
            <div className="w-9 h-9 rounded-full bg-dark-bg2 border border-brand-cyan flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(56,189,248,0.2)]">NC</div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-dark-surface border border-dark-border rounded-lg shadow-xl overflow-hidden z-50">
              <button
                onClick={() => {
                  authService.logout();
                  setView('auth');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-brand-red hover:bg-dark-bg3 transition-colors text-left"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-dark-bg relative" onClick={() => showProfileMenu && setShowProfileMenu(false)}>
        {/* Sub Header (Actions specific to active tab) */}
        {activeTab !== 'vehiculos' && !materialDetailRoute && (
          <div className="flex justify-between items-center px-8 py-4 border-b border-dark-border bg-dark-bg2 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center text-brand-cyan border border-dark-border shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                {activeTab === 'bodegas' && inventoryView === 'catalogo' ? <Icons.Traceability /> : activeTab === 'epp' ? <Icons.Shield /> : activeTab === 'donaciones' ? <Icons.Finance /> : <Icons.Inventory />}
              </div>
              <div className="flex flex-col">
                {activeTab === 'bodegas' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {inventoryViews.map(view => (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => setInventoryView(view.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold rajdhani tracking-wide transition-colors ${inventoryView === view.id ? 'bg-brand-red/10 text-brand-red border border-brand-red/30' : 'text-text-muted border border-transparent hover:bg-dark-bg3 hover:text-white'}`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <h2 className="text-lg font-bold rajdhani tracking-wide leading-tight" style={{ color: palette.text }}>
                    {activeTab === 'donaciones' ? 'Donaciones y Campañas' : activeTab === 'catalogo' ? 'Catalogo de Materiales' : activeTab === 'epp' ? 'Equipos de Proteccion Personal (EPP)' : 'Dashboard'}
                  </h2>
                )}
                {activeTab === 'epp' && <span className="text-xs text-text-muted mt-0.5">Controla la asignacion y estado del equipamiento de los voluntarios</span>}
                {activeTab === 'donaciones' && <span className="text-xs text-text-muted mt-0.5">Gestiona campanas de recaudacion y enlaces de pago</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'bodegas' && inventoryView === 'ubicaciones' && (
                <button onClick={openAddUbicacionModal} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors shadow-[0_4px_15px_rgba(232,55,42,0.3)]">Agregar ubicacion</button>
              )}
              {activeTab === 'bodegas' && inventoryView === 'catalogo' && (
                <>
                  <button className="px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Importar catalogo
                  </button>
                  <button onClick={() => {
                    resetNewMaterialData();
                    setShowAddMaterialModal(true);
                  }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
                    <span>+</span> Agregar material
                  </button>
                </>
              )}
              {activeTab === 'epp' && (
                <button onClick={() => setShowAssignEppModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                  Asignar EPP
                </button>
              )}
              {activeTab === 'donaciones' && (
                <button onClick={openCreateCampanaModal} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)]">
                  <span className="text-base leading-none">+</span>
                  Crear campaña
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {materialDetailRoute && (
            <MaterialDetailView route={materialDetailRoute} onBack={closeMaterialDetail} onRemoved={refreshActiveUbicacion} />
          )}

          {!materialDetailRoute && activeTab === 'bodegas' && inventoryView === 'ubicaciones' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                height: '100%',
                minHeight: 0,
                overflow: 'hidden',
                width: '100%'
              }}
            >
              <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
                <LocationItemsView
                  locationName={selectedUbicacionName}
                  items={itemsUbicacion}
                  loading={loadingItems}
                  hasSelection={Boolean(activeUbicacion)}
                  addMaterialDisabledReason={addMaterialDisabledReason}
                  onSelectMaterial={openMaterialDetail}
                  onMoveMaterial={(material) => setMovingMaterial(material)}
                  onAddMaterial={() => {
                    if (!addMaterialDisabledReason) {
                      setShowInventoryMaterialModal(true);
                    }
                  }}
                />
              </div>

              <div
                style={{
                  width: '100%',
                  minWidth: 0,
                  height: '100%',
                  overflowY: 'auto',
                  background: palette.bg,
                  color: palette.text,
                  padding: '32px',
                  borderLeft: `1px solid ${palette.border}`,
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px', color: palette.muted, fontSize: '12px' }}>
                      <button onClick={() => goToPathIndex(-1)} style={{ color: palette.cyan, background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>Ubicaciones</button>
                      {locationPath.map((item, index) => (
                        <span key={item.id} style={{ display: 'flex', gap: '8px' }}>
                          <span>/</span>
                          <button onClick={() => goToPathIndex(index)} style={{ color: palette.cyan, background: 'transparent', border: 0, cursor: 'pointer', padding: 0 }}>{item.name}</button>
                        </span>
                      ))}
                    </div>
                    <h3 style={{ color: palette.text, fontSize: '24px', fontWeight: 700, margin: 0 }}>
                      {currentUbicacion ? currentUbicacion.name : 'Ubicaciones Principales'}
                    </h3>
                    <p style={{ color: palette.muted, fontSize: '14px', margin: '8px 0 0' }}>
                      {currentUbicacion ? 'Selecciona General para ver la ubicacion actual o abre una sububicacion.' : 'Selecciona una ubicacion principal para cargar sus materiales y sububicaciones.'}
                    </p>
                  </div>
                  {currentUbicacion && (
                    <button onClick={() => goToPathIndex(locationPath.length - 2)} style={{ height: '40px', padding: '0 16px', borderRadius: '8px', border: `1px solid ${palette.borderStrong}`, background: palette.card, color: palette.text, cursor: 'pointer' }}>
                      Volver
                    </button>
                  )}
                </div>

                {loadingUbicaciones ? (
                  <div style={{ padding: '56px 0', textAlign: 'center', color: palette.muted }}>Cargando ubicaciones desde el servidor...</div>
                ) : ubicacionesError ? (
                  <div style={{ border: '1px solid rgba(232,55,42,.35)', background: 'rgba(232,55,42,.1)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
                    <p style={{ color: palette.text, fontWeight: 700, margin: 0 }}>No se pudieron cargar las ubicaciones</p>
                    <p style={{ color: palette.muted, margin: '10px 0 18px' }}>{ubicacionesError}</p>
                    <button onClick={fetchUbicaciones} style={{ border: '1px solid rgba(232,55,42,.4)', background: 'rgba(232,55,42,.2)', color: palette.text, borderRadius: '8px', padding: '10px 16px', cursor: 'pointer' }}>
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                    {!currentUbicacion && (
                      <button
                        onClick={selectGeneralInventario}
                        style={{
                          minHeight: '150px',
                          borderRadius: '14px',
                          border: isGeneralInventario ? `1px solid ${palette.cyan}` : `1px solid ${palette.borderStrong}`,
                          background: isGeneralInventario ? palette.cyanSoft : palette.card,
                          color: palette.text,
                          cursor: 'pointer',
                          padding: '20px',
                          textAlign: 'center',
                          fontWeight: 700
                        }}
                      >
                        <div style={{ marginBottom: '10px', color: palette.cyan }}>General</div>
                        Todos los materiales
                      </button>
                    )}
                    {currentUbicacion && subUbicaciones.length > 0 && (
                      <button
                        onClick={selectGeneralUbicacion}
                        style={{
                          minHeight: '150px',
                          borderRadius: '14px',
                          border: activeUbicacion === currentUbicacion.id ? `1px solid ${palette.cyan}` : `1px solid ${palette.borderStrong}`,
                          background: activeUbicacion === currentUbicacion.id ? palette.cyanSoft : palette.card,
                          color: palette.text,
                          cursor: 'pointer',
                          fontWeight: 700
                        }}
                      >
                        General
                      </button>
                    )}

                    {visibleUbicaciones.length > 0 ? visibleUbicaciones.map(ubi => (
                      <button
                        key={ubi.id}
                        onClick={() => openUbicacion(ubi)}
                        style={{
                          minHeight: '150px',
                          borderRadius: '14px',
                          border: activeUbicacion === ubi.id ? `1px solid ${palette.cyan}` : `1px solid ${palette.borderStrong}`,
                          background: activeUbicacion === ubi.id ? palette.cyanSoft : palette.card,
                          color: palette.text,
                          cursor: 'pointer',
                          padding: '20px',
                          textAlign: 'center',
                          fontWeight: 700
                        }}
                      >
                        <div style={{ marginBottom: '10px', color: palette.cyan }}>▣</div>
                        {ubi.name}
                      </button>
                    )) : (
                      <div style={{ gridColumn: '1 / -1', border: `1px dashed ${palette.borderStrong}`, borderRadius: '14px', padding: '56px 24px', textAlign: 'center', color: palette.muted }}>
                        {currentUbicacion ? 'Esta ubicacion no tiene sububicaciones.' : 'No se encontraron ubicaciones registradas.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {!materialDetailRoute && activeTab === 'bodegas' && inventoryView === 'arbol' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Arbol de Ubicaciones</h3>
                  <p className="mt-2 text-sm" style={{ color: palette.muted }}>Tipos disponibles para construir ubicaciones principales y sububicaciones.</p>
                </div>
                <button
                  type="button"
                  onClick={openAddTipoUbicacionModal}
                  className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-colors hover:opacity-90"
                >
                  Agregar tipo de ubicacion
                </button>
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: palette.border, background: palette.card }}>
                {loadingTiposArbol ? (
                  <p className="text-sm" style={{ color: palette.muted }}>Cargando tipos de ubicacion...</p>
                ) : tiposArbolError ? (
                  <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-5 text-center">
                    <p className="font-semibold text-brand-red">{tiposArbolError}</p>
                    <button
                      type="button"
                      onClick={fetchTiposArbolUbicacion}
                      className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : tiposArbolUbicacion.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {tiposArbolUbicacion.map(tipo => (
                      <div
                        key={tipo.id}
                        className="rounded-xl border p-5"
                        style={{ borderColor: palette.borderStrong, background: palette.bg, color: palette.text }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="rajdhani text-lg font-bold" style={{ color: palette.text }}>{tipo.nombre}</p>
                            <p className="mt-1 text-xs" style={{ color: palette.muted }}>ID tipo {tipo.id}</p>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tipo.esTipoRaiz ? 'border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan' : 'border-dark-border bg-dark-bg3 text-text-muted'}`}
                          >
                            {tipo.esTipoRaiz ? 'Raiz' : 'Sububicacion'}
                          </span>
                        </div>
                        {tipo.idCompania && (
                          <p className="mt-4 text-xs" style={{ color: palette.muted }}>Compania {tipo.idCompania}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-14 text-center" style={{ borderColor: palette.borderStrong }}>
                    <p className="font-semibold" style={{ color: palette.text }}>No hay tipos de ubicacion registrados.</p>
                    <p className="mt-2 text-sm" style={{ color: palette.muted }}>Crea el primer tipo para usarlo al agregar ubicaciones.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!materialDetailRoute && activeTab === 'bodegas' && inventoryView === 'stocks' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Stocks Minimos</h3>
                  <p className="mt-2 text-sm" style={{ color: palette.muted }}>Control de materiales que requieren reposicion segun su stock minimo.</p>
                </div>
                <button
                  type="button"
                  onClick={openAddStockMinimoModal}
                  className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-colors hover:opacity-90"
                >
                  Agregar stock minimo
                </button>
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: palette.border, background: palette.card }}>
                {loadingStockMinimos ? (
                  <p className="text-sm" style={{ color: palette.muted }}>Cargando stocks minimos...</p>
                ) : stockMinimosError ? (
                  <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-5 text-center">
                    <p className="font-semibold text-brand-red">{stockMinimosError}</p>
                    <button
                      type="button"
                      onClick={fetchStockMinimos}
                      className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : stockMinimos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {stockMinimos.map(stock => (
                      <div
                        key={stock.id}
                        className="rounded-xl border p-5"
                        style={{ borderColor: palette.borderStrong, background: palette.bg, color: palette.text }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="rajdhani text-lg font-bold" style={{ color: palette.text }}>{stock.nombre}</p>
                            <p className="mt-1 text-sm" style={{ color: palette.muted }}>{stock.nombreUbicacion}</p>
                          </div>
                          <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
                            Stock
                          </span>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2 text-xs">
                          <span className="rounded border px-2 py-1" style={{ borderColor: palette.border, background: palette.bg3, color: palette.muted }}>
                            ID stock {stock.id}
                          </span>
                          {stock.idUbicacion && (
                            <span className="rounded border px-2 py-1" style={{ borderColor: palette.border, background: palette.bg3, color: palette.muted }}>
                              ID ubicacion {stock.idUbicacion}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-16 text-center" style={{ borderColor: palette.borderStrong }}>
                    <p className="font-semibold" style={{ color: palette.text }}>No hay stocks minimos registrados</p>
                    <p className="mt-2 text-sm" style={{ color: palette.muted }}>Cuando se creen configuraciones de stock minimo, apareceran aqui.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!materialDetailRoute && activeTab === 'bodegas' && inventoryView === 'catalogo' && (
            <div className="p-8">
              <div className="mb-6">
                <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Catalogo de Materiales</h3>
                <p className="mt-2 text-sm" style={{ color: palette.muted }}>Administra los materiales base disponibles para el inventario.</p>
              </div>
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    className="w-full pl-10 pr-4 py-2 bg-dark-bg3 border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted" 
                    value={filtroNombre}
                    onChange={(e) => setFiltroNombre(e.target.value)}
                  />
                </div>
                <div className="w-64 relative">
                  <select 
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full px-4 py-2 bg-dark-bg3 border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none text-sm"
                  >
                    <option value="Todos los tipos">Todos los tipos</option>
                    {Array.from(new Set(catalogo.map(item => item.tipo))).map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 absolute right-3 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div className="border border-dark-border rounded-xl overflow-hidden bg-dark-surface shadow-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-dark-bg2 border-b border-dark-border text-text-muted font-medium rajdhani text-base">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Nombre</th>
                      <th className="px-6 py-4 font-semibold">Tipo Material</th>
                      <th className="px-6 py-4 font-semibold">Valor Unitario</th>
                      <th className="px-6 py-4 font-semibold text-center">Desechable</th>
                      <th className="px-6 py-4 font-semibold text-center">Serializado</th>
                      <th className="px-6 py-4 font-semibold text-center">Mantención</th>
                      <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-border">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-10 h-10 border-4 border-brand-cyan/20 border-t-brand-cyan rounded-full animate-spin mb-4"></div>
                            <p className="text-text-muted rajdhani text-lg">Cargando catálogo de materiales...</p>
                          </div>
                        </td>
                      </tr>
                    ) : catalogo.length > 0 ? (
                      (filtroTipo === 'Todos los tipos' ? catalogo : catalogo.filter(item => item.tipo === filtroTipo))
                        .filter(item => (item.nombre || '').toLowerCase().includes(filtroNombre.toLowerCase()))
                        .map(item => {
                        const isEditing = editingCatId === item.id;
                        return (
                          <tr key={item.id} className="hover:bg-dark-bg3 transition-colors">
                            <td className="px-6 py-4 font-medium text-white">{item.nombre}</td>
                            <td className="px-6 py-4"><span className="px-2.5 py-1 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-full text-xs font-medium">{item.tipo}</span></td>
                            <td className="px-6 py-4 text-text-muted">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  value={editCatData.valor} 
                                  onChange={e => {
                                    let rawValue = e.target.value.replace(/\D/g, '');
                                    if (rawValue === '') {
                                      setEditCatData({...editCatData, valor: ''});
                                    } else {
                                      const numValue = parseInt(rawValue, 10);
                                      setEditCatData({...editCatData, valor: '$' + numValue.toLocaleString('es-CL')});
                                    }
                                  }}
                                  className="w-full px-2 py-1 bg-dark-bg border border-brand-cyan rounded text-sm text-white focus:outline-none"
                                />
                              ) : item.valor}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                <input 
                                  type="checkbox" 
                                  checked={editCatData.desechable} 
                                  onChange={e => setEditCatData({...editCatData, desechable: e.target.checked})}
                                  className="accent-brand-cyan w-4 h-4 cursor-pointer"
                                />
                              ) : (item.desechable ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                 <input 
                                   type="checkbox" 
                                   checked={editCatData.serializado} 
                                   onChange={e => setEditCatData({...editCatData, serializado: e.target.checked})}
                                   className="accent-brand-cyan w-4 h-4 cursor-pointer"
                                 />
                              ) : (item.serializado ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {isEditing ? (
                                 <input 
                                   type="checkbox" 
                                   checked={editCatData.mantencion} 
                                   onChange={e => setEditCatData({...editCatData, mantencion: e.target.checked})}
                                   className="accent-brand-cyan w-4 h-4 cursor-pointer"
                                 />
                              ) : (item.mantencion ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {isEditing ? (
                                 <>
                                   <button 
                                     onClick={() => setConfirmCatAction({ type: 'edit', id: item.id, data: editCatData })}
                                     className="text-brand-green hover:opacity-80 transition-opacity mr-3"
                                   >
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                   </button>
                                   <button 
                                     onClick={() => setEditingCatId(null)}
                                     className="text-brand-red hover:opacity-80 transition-opacity"
                                   >
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                   </button>
                                 </>
                              ) : (
                                 <>
                                   <button 
                                     onClick={() => {
                                       setEditingCatId(item.id);
                                       setEditCatData({ ...item });
                                     }}
                                     className="text-text-muted hover:text-brand-cyan transition-colors mr-3"
                                   >
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                   </button>
                                   <button 
                                     onClick={() => setConfirmCatAction({ type: 'delete', id: item.id })}
                                     className="text-text-muted hover:text-brand-red transition-colors"
                                   >
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                   </button>
                                 </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-xl p-8">
                            <Icons.Traceability size={48} className="text-text-muted mb-4 opacity-20" />
                            <p className="text-text-muted rajdhani text-lg">No hay materiales registrados en el catálogo.</p>
                            <button onClick={() => setShowAddMaterialModal(true)} className="mt-4 text-brand-cyan hover:underline">Agregar el primer material</button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!materialDetailRoute && activeTab === 'donaciones' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-8">
                <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Donaciones y Campanas</h3>
                <p className="mt-2 text-sm" style={{ color: palette.muted }}>Gestiona campanas de recaudacion de fondos y genera enlaces de pago.</p>
              </div>

              {loadingCampanas ? (
                <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-16 text-center text-text-muted">
                  Cargando campanas de donaciones...
                </div>
              ) : campanasError ? (
                <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-6 text-center">
                  <p className="font-semibold text-brand-red">{campanasError}</p>
                  <button onClick={fetchCampanasDonaciones} className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20">
                    Reintentar
                  </button>
                </div>
              ) : (
                <>
              {donationLinkError && (
                <div className="mb-6 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                  {donationLinkError}
                </div>
              )}

              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                <h4 className="text-sm font-bold text-white">Campanas Activas</h4>
              </div>
              <div className="mb-8 grid gap-5 lg:grid-cols-3">
                {campanasActivas.length > 0 ? campanasActivas.map(campaign => (
                  <article key={campaign.id} className="overflow-hidden rounded-xl border border-brand-cyan/40 bg-dark-surface shadow-lg">
                    <div className="p-5">
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592L5.5 14H4a2 2 0 01-2-2V9a2 2 0 012-2h1.5l2.083-5.832A1.76 1.76 0 0111 1.76v4.122zM19 7v10M15 10v4"></path></svg>
                        </div>
                        <span className="rounded border border-brand-green/20 bg-brand-green/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-green">Activa</span>
                      </div>
                      <h5 className="min-h-10 text-base font-bold leading-snug text-white">{campaign.nombre}</h5>
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>
                        {formatDateChile(campaign.fechaInicio)} - {formatDateChile(campaign.fechaFin)}
                      </p>
                      {campaign.descripcion && <p className="mt-3 line-clamp-2 text-xs text-text-muted">{campaign.descripcion}</p>}
                      <div className="mt-7 flex items-end justify-between gap-4">
                        <p className="text-2xl font-bold text-white">{formatCurrency(campaign.montoRecaudado)}</p>
                        <div className="text-right text-xs text-text-muted">
                          <p>Meta</p>
                          <p className="font-semibold text-white">{formatCurrency(campaign.metaMonto)}</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-dark-bg3">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-brand-cyan" style={{ width: `${campaign.progress}%` }}></div>
                      </div>
                      <p className="mt-2 text-right text-xs text-brand-cyan">{campaign.progress}% logrado</p>
                    </div>
                    <div className="flex items-center justify-between border-t border-dark-border bg-dark-bg2 px-5 py-3">
                      <button className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs font-semibold text-white transition-colors hover:border-brand-cyan/50">Ver detalles</button>
                      <button
                        type="button"
                        onClick={() => generateAndCopyDonationLink(campaign)}
                        disabled={generatingDonationLinkId === campaign.id}
                        className="rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-semibold text-blue-200 transition-colors hover:bg-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {generatingDonationLinkId === campaign.id ? 'Generando...' : copiedDonationSlug === (campaign.slug || String(campaign.id)) ? 'Link copiado' : 'Generar Link'}
                      </button>
                    </div>
                  </article>
                )) : (
                  <div className="rounded-xl border border-dashed border-dark-border bg-dark-surface px-6 py-14 text-center text-text-muted lg:col-span-3">
                    No hay campanas activas.
                  </div>
                )}
              </div>

              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-text-muted"></span>
                <h4 className="text-sm font-bold text-white">Campanas Finalizadas</h4>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {campanasFinalizadas.length > 0 ? campanasFinalizadas.map(campaign => (
                <article key={campaign.id} className="overflow-hidden rounded-xl border border-dark-border bg-dark-surface opacity-90 shadow-lg">
                  <div className="p-5">
                    <div className="mb-5 flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-dark-border bg-dark-bg3 text-text-muted">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      </div>
                      <span className="rounded border border-dark-border bg-dark-bg3 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-text-muted">Finalizada</span>
                    </div>
                    <h5 className="text-base font-bold leading-snug text-white">{campaign.nombre}</h5>
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-text-muted">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3M5 11h14M5 5h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2z"></path></svg>
                      Cerrada el {formatDateChile(campaign.fechaFin)}
                    </p>
                    <div className="mt-6 rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                      <p className="text-xs text-text-muted">Total recaudado</p>
                      <p className="mt-1 text-xl font-bold text-white">{formatCurrency(campaign.montoRecaudado)}</p>
                    </div>
                  </div>
                </article>
                )) : (
                  <div className="rounded-xl border border-dashed border-dark-border bg-dark-surface px-6 py-14 text-center text-text-muted lg:col-span-3">
                    No hay campanas finalizadas.
                  </div>
                )}
              </div>
                </>
              )}
            </div>
          )}

          {!materialDetailRoute && activeTab === 'vehiculos' && (
            <VehiculosView />
          )}

          {!materialDetailRoute && activeTab === 'epp' && (
            <EppView eppData={eppData} setEppData={setEppData} />
          )}

          {!materialDetailRoute && activeTab !== 'bodegas' && activeTab !== 'catalogo' && activeTab !== 'vehiculos' && activeTab !== 'epp' && activeTab !== 'donaciones' && (
            <div className="p-8 flex items-center justify-center h-full">
              <p className="text-text-muted text-lg">Contenido en construcción...</p>
            </div>
          )}
        </div>

        {showCreateCampanaModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateCampana} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Crear campana de donaciones</h3>
                <button type="button" onClick={closeCreateCampanaModal} disabled={savingCampana} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Nombre</label>
                    <input
                      autoFocus
                      type="text"
                      value={newCampanaData.nombre}
                      onChange={(e) => setNewCampanaData({ ...newCampanaData, nombre: e.target.value })}
                      disabled={savingCampana}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                      placeholder="Ej. Compra carro"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Meta monto</label>
                    <input
                      type="text"
                      value={newCampanaData.metaMonto}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setNewCampanaData({
                          ...newCampanaData,
                          metaMonto: rawValue ? '$' + parseInt(rawValue, 10).toLocaleString('es-CL') : '',
                        });
                      }}
                      disabled={savingCampana}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                      placeholder="$20.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Descripcion</label>
                  <textarea
                    rows="3"
                    value={newCampanaData.descripcion}
                    onChange={(e) => setNewCampanaData({ ...newCampanaData, descripcion: e.target.value })}
                    disabled={savingCampana}
                    className="w-full resize-none px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Describe el objetivo de la campana..."
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Fecha inicio</label>
                    <input
                      type="date"
                      value={newCampanaData.fechaInicio}
                      onChange={(e) => setNewCampanaData({ ...newCampanaData, fechaInicio: e.target.value })}
                      disabled={savingCampana}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Fecha fin</label>
                    <input
                      type="date"
                      value={newCampanaData.fechaFin}
                      onChange={(e) => setNewCampanaData({ ...newCampanaData, fechaFin: e.target.value })}
                      disabled={savingCampana}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Imagen URL</label>
                  <input
                    type="text"
                    value={newCampanaData.imagenUrl}
                    onChange={(e) => setNewCampanaData({ ...newCampanaData, imagenUrl: e.target.value })}
                    disabled={savingCampana}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Opcional"
                  />
                </div>

                {createCampanaError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                    {createCampanaError}
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button type="button" onClick={closeCreateCampanaModal} disabled={savingCampana} className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={savingCampana} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                  {savingCampana ? 'Creando...' : 'Crear campana'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddUbicacionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateUbicacion} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Nueva Ubicación</h3>
                <button type="button" onClick={closeAddUbicacionModal} disabled={savingUbicacion} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Tipo de ubicacion</label>
                  <select
                    autoFocus
                    value={newUbicacionData.idTipoUbicacion}
                    onChange={(e) => setNewUbicacionData({ ...newUbicacionData, idTipoUbicacion: e.target.value })}
                    disabled={loadingTiposUbicacion || savingUbicacion || tiposUbicacion.length === 0}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                  >
                    <option value="">{loadingTiposUbicacion ? 'Cargando tipos...' : 'Selecciona un tipo'}</option>
                    {tiposUbicacion.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                </div>
                {currentUbicacion && (
                  <p className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs text-text-muted">
                    Se creara dentro de {currentUbicacion.name} (id ubicacion {currentUbicacion.idUbicacion || 'no disponible'}).
                  </p>
                )}
                {currentUbicacion && !currentUbicacion.idUbicacion && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    No se pudo identificar el IdUbicacion del padre.
                  </p>
                )}
                <label className="block text-sm font-medium text-text-muted mb-2">Nombre de la ubicación</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                  placeholder="Ej. Gaveta 3, Bodega central..."
                  value={newUbicacionData.nombre}
                  onChange={(e) => setNewUbicacionData({ ...newUbicacionData, nombre: e.target.value })}
                  disabled={savingUbicacion}
                />
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Descripcion</label>
                  <textarea
                    rows={4}
                    className="w-full resize-none px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Detalle breve de la ubicacion"
                    value={newUbicacionData.descripcion}
                    onChange={(e) => setNewUbicacionData({ ...newUbicacionData, descripcion: e.target.value })}
                    disabled={savingUbicacion}
                  />
                </div>

                {!loadingTiposUbicacion && tiposUbicacion.length === 0 && !addUbicacionError && (
                  <p className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs text-text-muted">
                    No hay tipos disponibles para crear en este nivel.
                  </p>
                )}

                {addUbicacionError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {addUbicacionError}
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddUbicacionModal}
                  disabled={savingUbicacion}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canCreateUbicacion || savingUbicacion || loadingTiposUbicacion}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Crear Ubicación
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddTipoUbicacionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateTipoUbicacion} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Tipo de Ubicacion</h3>
                <button type="button" onClick={closeAddTipoUbicacionModal} disabled={savingTipoUbicacion} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Nombre del tipo</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Ej. Bodega, Caja, Gaveta..."
                    value={newTipoUbicacionData.nombre}
                    onChange={(e) => setNewTipoUbicacionData({ ...newTipoUbicacionData, nombre: e.target.value })}
                    disabled={savingTipoUbicacion}
                  />
                </div>
                <label className="flex items-center justify-between gap-4 rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-white">Tipo raiz</span>
                    <span className="block text-xs text-text-muted">Aparecera como opcion para crear ubicaciones principales.</span>
                  </span>
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-brand-red"
                    checked={newTipoUbicacionData.esTipoRaiz}
                    onChange={(e) => setNewTipoUbicacionData({ ...newTipoUbicacionData, esTipoRaiz: e.target.checked })}
                    disabled={savingTipoUbicacion}
                  />
                </label>

                {addTipoUbicacionError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {addTipoUbicacionError}
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddTipoUbicacionModal}
                  disabled={savingTipoUbicacion}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canCreateTipoUbicacion || savingTipoUbicacion}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTipoUbicacion ? 'Creando...' : 'Siguiente'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showTipoRelationsModal && createdTipoUbicacion && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateTipoRelations} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white rajdhani">Relacionar Tipo de Ubicacion</h3>
                  <p className="mt-1 text-xs text-text-muted">Tipo creado: {createdTipoUbicacion.nombre}</p>
                </div>
                <button type="button" onClick={closeTipoRelationsModal} disabled={savingTipoRelations} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-white">Que tipos pueden contener este tipo?</p>
                  <p className="mt-1 text-xs text-text-muted">Se creara una relacion por cada tipo seleccionado.</p>
                </div>

                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {tiposArbolUbicacion.filter(tipo => String(tipo.id) !== String(createdTipoUbicacion.id)).map(tipo => {
                    const isSelected = selectedTipoPadreIds.includes(tipo.id);
                    return (
                      <button
                        key={tipo.id}
                        type="button"
                        onClick={() => toggleTipoPadreSelection(tipo.id)}
                        disabled={savingTipoRelations}
                        className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50 ${isSelected ? 'border-brand-cyan/40 bg-brand-cyan/10' : 'border-dark-border bg-dark-bg hover:border-brand-cyan/30'}`}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-white">{tipo.nombre}</span>
                          <span className="block text-xs text-text-muted">{tipo.esTipoRaiz ? 'Tipo raiz' : 'Sububicacion'}{tipo.idCompania ? ` - Compania ${tipo.idCompania}` : ''}</span>
                        </span>
                        <span className={`flex h-5 w-5 items-center justify-center rounded border ${isSelected ? 'border-brand-cyan bg-brand-cyan text-dark-bg' : 'border-dark-border bg-dark-bg3'}`}>
                          {isSelected && <span className="text-xs font-bold">+</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {tiposArbolUbicacion.filter(tipo => String(tipo.id) !== String(createdTipoUbicacion.id)).length === 0 && (
                  <p className="rounded-lg border border-dark-border bg-dark-bg px-3 py-3 text-sm text-text-muted">
                    No hay otros tipos disponibles para relacionar.
                  </p>
                )}

                {tipoRelationsError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {tipoRelationsError}
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeTipoRelationsModal}
                  disabled={savingTipoRelations}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                >
                  Omitir
                </button>
                <button
                  type="submit"
                  disabled={selectedTipoPadreIds.length === 0 || savingTipoRelations}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingTipoRelations ? 'Guardando...' : 'Guardar relaciones'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddStockMinimoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateStockMinimo} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Stock Minimo</h3>
                <button type="button" onClick={closeAddStockMinimoModal} disabled={savingStockMinimo} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="max-h-[72vh] overflow-y-auto p-6 space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Nombre</label>
                    <input
                      autoFocus
                      type="text"
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                      placeholder="Ej. Stock Gaveta 1"
                      value={newStockMinimoData.nombre}
                      onChange={(e) => setNewStockMinimoData({ ...newStockMinimoData, nombre: e.target.value })}
                      disabled={savingStockMinimo}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Ubicacion</label>
                    <select
                      value={newStockMinimoData.idUbicacion}
                      onChange={(e) => setNewStockMinimoData({ ...newStockMinimoData, idUbicacion: e.target.value })}
                      disabled={savingStockMinimo || ubicaciones.length === 0}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    >
                      <option value="">{ubicaciones.length > 0 ? 'Selecciona una ubicacion' : 'No hay ubicaciones disponibles'}</option>
                      {ubicaciones.map(ubicacion => (
                        <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">Materiales del stock</p>
                      <p className="mt-1 text-xs text-text-muted">Selecciona materiales y define la cantidad minima de cada uno.</p>
                    </div>
                    <span className="rounded border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-1 text-xs text-brand-cyan">
                      {newStockMinimoData.materiales.length} seleccionados
                    </span>
                  </div>

                  <div className="rounded-xl border border-dark-border bg-dark-bg p-3">
                    <div className="mb-3">
                      <input
                        type="text"
                        value={stockMaterialSearch}
                        onChange={(e) => setStockMaterialSearch(e.target.value)}
                        disabled={savingStockMinimo || loadingStockMateriales}
                        className="w-full rounded-lg border border-dark-border bg-dark-bg2 px-4 py-2.5 text-sm text-white placeholder-text-muted outline-none transition-all disabled:opacity-50 focus:border-brand-cyan"
                        placeholder="Buscar material por nombre..."
                      />
                    </div>
                    {loadingStockMateriales ? (
                      <p className="py-8 text-center text-sm text-text-muted">Cargando materiales...</p>
                    ) : stockMaterialesError ? (
                      <div className="rounded-lg border border-brand-red/30 bg-brand-red/10 p-4 text-center">
                        <p className="text-sm font-semibold text-brand-red">{stockMaterialesError}</p>
                        <button
                          type="button"
                          onClick={fetchStockMateriales}
                          className="mt-3 rounded-lg border border-brand-red/40 bg-brand-red/10 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-red/20"
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : visibleStockMateriales.length > 0 ? (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {visibleStockMateriales.map(material => {
                          const selectedMaterial = getSelectedStockMaterial(material.id);
                          const isSelected = Boolean(selectedMaterial);
                          return (
                            <div
                              key={material.id}
                              className={`rounded-lg border px-3 py-3 transition-colors ${isSelected ? 'border-brand-cyan/40 bg-brand-cyan/10' : 'border-dark-border bg-dark-bg2'}`}
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <button
                                  type="button"
                                  onClick={() => toggleStockMaterial(material.id)}
                                  disabled={savingStockMinimo}
                                  className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-50"
                                >
                                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border ${isSelected ? 'border-brand-cyan bg-brand-cyan text-dark-bg' : 'border-dark-border bg-dark-bg3'}`}>
                                    {isSelected && <span className="text-xs font-bold">+</span>}
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-white">{material.nombre}</span>
                                    <span className="block truncate text-xs text-text-muted">{material.tipo}</span>
                                  </span>
                                </button>
                                <label className="flex items-center gap-2 text-xs text-text-muted">
                                  Cantidad
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedMaterial?.cantidad || 1}
                                    onChange={(e) => updateStockMaterialCantidad(material.id, e.target.value)}
                                    disabled={!isSelected || savingStockMinimo}
                                    className="w-20 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-all disabled:opacity-50 focus:border-brand-cyan"
                                  />
                                </label>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="py-8 text-center text-sm text-text-muted">
                        {stockMaterialSearch.trim() ? 'No se encontraron materiales con ese nombre.' : 'No hay materiales creados disponibles.'}
                      </p>
                    )}
                  </div>
                </div>

                {addStockMinimoError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {addStockMinimoError}
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddStockMinimoModal}
                  disabled={savingStockMinimo}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!canCreateStockMinimo || savingStockMinimo}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingStockMinimo ? 'Creando...' : 'Crear Stock'}
                </button>
              </div>
            </form>
          </div>
        )}

        {confirmCatAction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${confirmCatAction.type === 'edit' ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/20' : 'bg-brand-red/10 text-brand-red border border-brand-red/20'}`}>
                  {confirmCatAction.type === 'edit' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-white rajdhani">
                  {confirmCatAction.type === 'edit' ? 'Confirmar Cambios' : 'Eliminar Registro'}
                </h3>
              </div>
              <div className="p-6">
                <p className="text-text-muted text-sm leading-relaxed">
                  {confirmCatAction.type === 'edit' 
                    ? '¿Estás seguro que deseas guardar los cambios realizados en este material?' 
                    : '¿Estás seguro que deseas eliminar este material del catálogo? Esta acción no se puede deshacer.'}
                </p>
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  onClick={() => setConfirmCatAction(null)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (confirmCatAction.type === 'edit') {
                      setCatalogo(catalogo.map(item => item.id === confirmCatAction.id ? confirmCatAction.data : item));
                      setEditingCatId(null);
                    } else if (confirmCatAction.type === 'delete') {
                      setCatalogo(catalogo.filter(item => item.id !== confirmCatAction.id));
                    }
                    setConfirmCatAction(null);
                  }}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 ${confirmCatAction.type === 'edit' ? 'bg-brand-cyan shadow-[0_4px_15px_rgba(56,189,248,0.3)]' : 'bg-brand-red shadow-[0_4px_15px_rgba(232,55,42,0.3)]'}`}
                >
                  {confirmCatAction.type === 'edit' ? 'Guardar Cambios' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddMaterialModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateMaterial} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Nuevo Material</h3>
                <button type="button" onClick={closeAddMaterialModal} disabled={savingMaterial} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Nombre del material</label>
                  <input
                    autoFocus
                    type="text"
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    placeholder="Ej. Esmeril Angular..."
                    value={newMaterialData.nombre}
                    disabled={savingMaterial}
                    onChange={(e) => setNewMaterialData({...newMaterialData, nombre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Tipo de producto</label>
                  <select
                    value={newMaterialData.idTipoProducto}
                    onChange={(e) => setNewMaterialData({...newMaterialData, idTipoProducto: e.target.value})}
                    disabled={savingMaterial}
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border text-white rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none disabled:opacity-50"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {TIPOS_PRODUCTO.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Descripcion</label>
                  <textarea
                    rows="3"
                    className="w-full resize-none px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Ej. Herramienta para corte y desbaste..."
                    value={newMaterialData.descripcion}
                    disabled={savingMaterial}
                    onChange={(e) => setNewMaterialData({...newMaterialData, descripcion: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Valor Unitario</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    placeholder="Ej. $15.000"
                    value={newMaterialData.valorUnitario}
                    disabled={savingMaterial}
                    onChange={(e) => {
                      let rawValue = e.target.value.replace(/\D/g, '');
                      if (rawValue === '') {
                        setNewMaterialData({...newMaterialData, valorUnitario: ''});
                      } else {
                        const numValue = parseInt(rawValue, 10);
                        setNewMaterialData({...newMaterialData, valorUnitario: '$' + numValue.toLocaleString('es-CL')});
                      }
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { key: 'esConsumible', label: 'Consumible' },
                    { key: 'esSerializacion', label: 'Serializado' },
                    { key: 'requiereMantencion', label: 'Mantencion' },
                  ].map(option => (
                    <label key={option.key} className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-text-main">
                      <input
                        type="checkbox"
                        checked={newMaterialData[option.key]}
                        disabled={savingMaterial}
                        onChange={(e) => setNewMaterialData({...newMaterialData, [option.key]: e.target.checked})}
                        className="h-4 w-4 accent-brand-cyan"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
                {addMaterialError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                    {addMaterialError}
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeAddMaterialModal}
                  disabled={savingMaterial}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingMaterial || !newMaterialData.nombre.trim() || !newMaterialData.descripcion.trim() || !newMaterialData.idTipoProducto}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(232,55,42,0.3)]"
                >
                  {savingMaterial ? 'Guardando...' : 'Agregar Material'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showAssignEppModal && (
          <AssignEppModal 
            onClose={() => setShowAssignEppModal(false)}
            onAssign={(newAssignments) => {
              setEppData(prev => {
                const assignmentIds = new Set(newAssignments.map(item => item.id));
                return [
                  ...newAssignments,
                  ...prev.filter(item => !assignmentIds.has(item.id)),
                ];
              });
            }}
          />
        )}

        {showInventoryMaterialModal && (
          <AddInventoryMaterialModal
            idUbicacion={activeUbicacion}
            onClose={() => setShowInventoryMaterialModal(false)}
            onAdded={refreshActiveUbicacion}
          />
        )}

        {movingMaterial && (
          <MoveMaterialModal
            material={movingMaterial}
            origen={selectedOrigen}
            onClose={() => setMovingMaterial(null)}
            onMoved={refreshActiveUbicacion}
          />
        )}
      </main>
    </div>
  );
}

export default Dashboard;
