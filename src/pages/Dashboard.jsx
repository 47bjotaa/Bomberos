import React, { useEffect, useRef, useState } from 'react';
import { Icons } from '../components/ui/Icons';
import BodegaCard from '../components/dashboard/BodegaCard';
import LocationItemsView from '../components/dashboard/LocationItemsView';
import MaterialDetailView from '../components/dashboard/MaterialDetailView';
import VehiculosView from '../components/dashboard/VehiculosView';
import EppView from '../components/dashboard/EppView';
import EppDetailView from '../components/dashboard/EppDetailView';
import AssignEppModal from '../components/dashboard/AssignEppModal';
import AddInventoryMaterialModal from '../components/dashboard/AddInventoryMaterialModal';
import AddBomberoModal from '../components/dashboard/AddBomberoModal';
import MoveMaterialModal from '../components/dashboard/MoveMaterialModal';
import LogoCuartelAmigo from '../components/ui/LogoCuartelAmigo';
import { useTheme } from '../context/ThemeContext';
import { apiFetch, authService } from '../services/api';
import { goToPublicHome } from '../utils/constants';
import { getThemePalette } from '../utils/themePalette';
import { getUserPermissionSet, hasAnyPermission, hasPermission, PERMISSIONS } from '../utils/permissions';
import InicioView from '../components/dashboard/InicioView';
import ReportsView from '../components/dashboard/ReportsView';

const GENERAL_INVENTORY_ID = 'general-inventory';
const TIPOS_PRODUCTO = [
  { id: 1, nombre: 'EPP' },
  { id: 2, nombre: 'Material de agua' },
  { id: 3, nombre: 'Material de rescate' },
  { id: 4, nombre: 'Acceso y ventilacion' },
  { id: 5, nombre: 'Material especifico' },
];
const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DONATION_PAGE_SIZE_OPTIONS = [8, 16, 32, 64];

const DEFAULT_PAYMENT_CONFIG = {
  apiKey: '',
  secretKey: '',
  commerceId: '',
  ambiente: 'Sandbox',
  urlApi: 'https://sandbox.flow.cl/api',
  urlConfirmacion: 'https://api.cuartelamigo.cl/api/donaciones/flow/confirmacion',
  urlRetorno: 'https://www.cuartelamigo.cl/donacion-gracias',
  paymentMethodDefault: '9',
  monedaDefault: 'CLP',
  timeoutSegundos: '',
  activo: true,
};

const getMaterialDetailRoute = (pathname) => {
  const eppItemMatch = pathname.match(/^\/dashboard\/epp\/items\/([^/]+)$/);
  if (eppItemMatch) {
    return { type: 'epp-item', id: eppItemMatch[1], fallback: {} };
  }

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

const getStockMinimoDetailId = (pathname) => {
  const stockMatch = pathname.match(/^\/dashboard\/stockminimos\/([^/]+)$/);
  return stockMatch ? stockMatch[1] : null;
};

const getInitialDashboardTab = (pathname) => {
  if (pathname.startsWith('/dashboard/mis-datos')) return 'mis-datos';
  if (pathname.startsWith('/dashboard/bodegas')) return 'bodegas';
  if (pathname.startsWith('/dashboard/vehiculos')) return 'vehiculos';
  if (pathname.startsWith('/dashboard/epp')) return 'epp';
  if (pathname.startsWith('/dashboard/donaciones')) return 'donaciones';
  if (pathname.startsWith('/dashboard/personal')) return 'personal';
  if (pathname.startsWith('/dashboard/reportes')) return 'reportes';
  if (pathname.startsWith('/dashboard/libro-guardia')) return 'libro-guardia';
  return 'inicio';
};

const getInitialInventoryView = (pathname) => (
  pathname.startsWith('/dashboard/stockminimos/') ? 'stocks' : 'ubicaciones'
);

const getInitialPersonalView = (pathname) => (
  pathname.startsWith('/dashboard/personal/importar') ? 'importar' : 'listado'
);

function Dashboard({ setView }) {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(() => getInitialDashboardTab(window.location.pathname));
  const [inventoryView, setInventoryView] = useState(() => getInitialInventoryView(window.location.pathname));
  const [personalView, setPersonalView] = useState(() => getInitialPersonalView(window.location.pathname));
  const [materialDetailRoute, setMaterialDetailRoute] = useState(() => getMaterialDetailRoute(window.location.pathname));
  const [stockMinimoDetailId, setStockMinimoDetailId] = useState(() => getStockMinimoDetailId(window.location.pathname));
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);
  const [showingEppDetail, setShowingEppDetail] = useState(false);
  const [bomberoProfile, setBomberoProfile] = useState(null);
  const [loadingBomberoProfile, setLoadingBomberoProfile] = useState(false);
  const [bomberoProfileError, setBomberoProfileError] = useState('');
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [contactProfileData, setContactProfileData] = useState({ email: '', telefono: '', genero: '' });
  const [savingContactProfile, setSavingContactProfile] = useState(false);
  const [contactProfileError, setContactProfileError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [markingNotificationId, setMarkingNotificationId] = useState(null);
  const [bomberosPersonal, setBomberosPersonal] = useState([]);
  const [loadingBomberosPersonal, setLoadingBomberosPersonal] = useState(false);
  const [bomberosPersonalError, setBomberosPersonalError] = useState('');
  const [inactivatingUsuarioId, setInactivatingUsuarioId] = useState(null);
  const [personalActionError, setPersonalActionError] = useState('');
  const [bomberoPendingInactivation, setBomberoPendingInactivation] = useState(null);
  const [showAddBomberoModal, setShowAddBomberoModal] = useState(false);
  const [activePersonalTab, setActivePersonalTab] = useState('activos');
  const [personalImportFile, setPersonalImportFile] = useState(null);
  const [downloadingPersonalTemplate, setDownloadingPersonalTemplate] = useState(false);
  const [uploadingPersonalImport, setUploadingPersonalImport] = useState(false);
  const [personalImportError, setPersonalImportError] = useState('');
  const [personalImportSuccess, setPersonalImportSuccess] = useState('');
  const [personalImportInputKey, setPersonalImportInputKey] = useState(0);

  const [ubicaciones, setUbicaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingUbicaciones, setLoadingUbicaciones] = useState(true);
  const [ubicacionesError, setUbicacionesError] = useState('');
  const [catalogo, setCatalogo] = useState([]);
  const [valueUpdateMaterial, setValueUpdateMaterial] = useState(null);
  const [valueUpdateInput, setValueUpdateInput] = useState('');
  const [savingValueUpdate, setSavingValueUpdate] = useState(false);
  const [valueUpdateError, setValueUpdateError] = useState('');
  const [confirmCatAction, setConfirmCatAction] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('Todos los tipos');
  const [filtroNombre, setFiltroNombre] = useState('');
  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPageSize, setCatalogPageSize] = useState(20);
  const [catalogTotal, setCatalogTotal] = useState(0);
  const [catalogTotalPages, setCatalogTotalPages] = useState(1);
  const [catalogServerPaginated, setCatalogServerPaginated] = useState(false);
  const catalogRequestId = useRef(0);
  const [showAddMaterialModal, setShowAddMaterialModal] = useState(false);
  const [savingMaterial, setSavingMaterial] = useState(false);
  const [addMaterialError, setAddMaterialError] = useState('');
  const [catalogImportFile, setCatalogImportFile] = useState(null);
  const [catalogImportMode, setCatalogImportMode] = useState('Crear');
  const [downloadingCatalogTemplate, setDownloadingCatalogTemplate] = useState(false);
  const [uploadingCatalogImport, setUploadingCatalogImport] = useState(false);
  const [catalogImportError, setCatalogImportError] = useState('');
  const [catalogImportSuccess, setCatalogImportSuccess] = useState('');
  const [catalogImportInputKey, setCatalogImportInputKey] = useState(0);
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
  const [tiposArbolSearch, setTiposArbolSearch] = useState('');
  const [tiposArbolPage, setTiposArbolPage] = useState(1);
  const [tiposArbolPageSize, setTiposArbolPageSize] = useState(10);
  const [deletingTipoUbicacionId, setDeletingTipoUbicacionId] = useState(null);
  const [deleteTipoUbicacionError, setDeleteTipoUbicacionError] = useState('');
  const [tipoUbicacionPendingDelete, setTipoUbicacionPendingDelete] = useState(null);
  const [showAddTipoUbicacionModal, setShowAddTipoUbicacionModal] = useState(false);
  const [newTipoUbicacionData, setNewTipoUbicacionData] = useState({ nombre: '', esTipoRaiz: false });
  const [savingTipoUbicacion, setSavingTipoUbicacion] = useState(false);
  const [addTipoUbicacionError, setAddTipoUbicacionError] = useState('');
  const [showTipoRelationsModal, setShowTipoRelationsModal] = useState(false);
  const [createdTipoUbicacion, setCreatedTipoUbicacion] = useState(null);
  const [selectedTipoPadreIds, setSelectedTipoPadreIds] = useState([]);
  const [savingTipoRelations, setSavingTipoRelations] = useState(false);
  const [tipoRelationsError, setTipoRelationsError] = useState('');
  const [editingTipoRelations, setEditingTipoRelations] = useState(null);
  const [tipoChildrenRelations, setTipoChildrenRelations] = useState([]);
  const [loadingTipoChildrenRelations, setLoadingTipoChildrenRelations] = useState(false);
  const [selectedTipoHijoId, setSelectedTipoHijoId] = useState('');
  const [savingTipoChildRelation, setSavingTipoChildRelation] = useState(false);
  const [deletingTipoChildRelationId, setDeletingTipoChildRelationId] = useState(null);
  const [editTipoRelationsError, setEditTipoRelationsError] = useState('');
  const [stockMinimos, setStockMinimos] = useState([]);
  const [loadingStockMinimos, setLoadingStockMinimos] = useState(false);
  const [stockMinimosError, setStockMinimosError] = useState('');
  const [stockMinimoDetail, setStockMinimoDetail] = useState(null);
  const [loadingStockMinimoDetail, setLoadingStockMinimoDetail] = useState(false);
  const [stockMinimoDetailError, setStockMinimoDetailError] = useState('');
  const [stockMinimoInventoryItems, setStockMinimoInventoryItems] = useState([]);
  const [loadingStockMinimoInventory, setLoadingStockMinimoInventory] = useState(false);
  const [stockMinimoInventoryError, setStockMinimoInventoryError] = useState('');
  const [showAddStockMinimoModal, setShowAddStockMinimoModal] = useState(false);
  const [editingStockMinimoId, setEditingStockMinimoId] = useState(null);
  const [newStockMinimoData, setNewStockMinimoData] = useState({ nombre: '', idUbicacion: '', materiales: [] });
  const [stockMateriales, setStockMateriales] = useState([]);
  const [stockMaterialSearch, setStockMaterialSearch] = useState('');
  const [loadingStockMateriales, setLoadingStockMateriales] = useState(false);
  const [stockMaterialesError, setStockMaterialesError] = useState('');
  const [savingStockMinimo, setSavingStockMinimo] = useState(false);
  const [addStockMinimoError, setAddStockMinimoError] = useState('');
  const [stockMinimoPendingDelete, setStockMinimoPendingDelete] = useState(null);
  const [deletingStockMinimoId, setDeletingStockMinimoId] = useState(null);
  const [deleteStockMinimoError, setDeleteStockMinimoError] = useState('');
  const [showAssignEppModal, setShowAssignEppModal] = useState(false);
  const [eppData, setEppData] = useState([
    { id: 1, equipo: 'Casco Estructural Gallet F1', codigo: 'EPP-CAS-001', asignadoA: 'Juan Pérez', inicial: 'J', fecha: '12 Oct 2023', estado: 'Buen Estado' },
    { id: 2, equipo: 'Cota Estructural Lion', codigo: 'EPP-COT-015', asignadoA: 'María González', inicial: 'M', fecha: '05 Nov 2023', estado: 'Desgastada' },
    { id: 3, equipo: 'Botas de Rescate Haix', codigo: 'EPP-BOT-042', asignadoA: 'Carlos Soto', inicial: 'C', fecha: '10 Ene 2024', estado: 'Buen Estado' },
    { id: 4, equipo: 'Guantes Estructurales Seiz', codigo: 'EPP-GUA-088', asignadoA: 'Ana Rojas', inicial: 'A', fecha: '22 Feb 2024', estado: 'Buen Estado' },
    { id: 5, equipo: 'Esclavina (Monja)', codigo: 'EPP-ESC-102', asignadoA: 'Luis Méndez', inicial: 'L', fecha: '01 Mar 2024', estado: 'Buen Estado' }
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
  const [selectedCampanaDetalle, setSelectedCampanaDetalle] = useState(null);
  const [donacionesCampana, setDonacionesCampana] = useState([]);
  const [loadingDonacionesCampana, setLoadingDonacionesCampana] = useState(false);
  const [donacionesCampanaError, setDonacionesCampanaError] = useState('');
  const [filtroNombreDonante, setFiltroNombreDonante] = useState('');
  const [filtroNombreBomberoDonacion, setFiltroNombreBomberoDonacion] = useState('');
  const [donacionesPage, setDonacionesPage] = useState(1);
  const [donacionesPageSize, setDonacionesPageSize] = useState(8);
  const [donacionesView, setDonacionesView] = useState('campanas');
  const [campanasListView, setCampanasListView] = useState('activas');
  const [filtroNombreCampana, setFiltroNombreCampana] = useState('');
  const [filtroFechaInicioCampana, setFiltroFechaInicioCampana] = useState('');
  const [filtroFechaFinCampana, setFiltroFechaFinCampana] = useState('');
  const [paymentConfigData, setPaymentConfigData] = useState(DEFAULT_PAYMENT_CONFIG);
  const [savingPaymentConfig, setSavingPaymentConfig] = useState(false);
  const [paymentConfigError, setPaymentConfigError] = useState('');
  const [paymentConfigSuccess, setPaymentConfigSuccess] = useState('');
  const [librosGuardia, setLibrosGuardia] = useState([]);
  const [loadingLibrosGuardia, setLoadingLibrosGuardia] = useState(false);
  const [librosGuardiaError, setLibrosGuardiaError] = useState('');
  const [showCreateLibroGuardiaModal, setShowCreateLibroGuardiaModal] = useState(false);
  const [savingLibroGuardia, setSavingLibroGuardia] = useState(false);
  const [createLibroGuardiaError, setCreateLibroGuardiaError] = useState('');
  const [newLibroGuardiaData, setNewLibroGuardiaData] = useState({ nombre: '', duracion: 'Diario', estado: 'Abierto' });
  const [activeLibrosGuardiaTab, setActiveLibrosGuardiaTab] = useState('abiertos');
  const [librosGuardiaMonthFilter, setLibrosGuardiaMonthFilter] = useState('');
  const [librosGuardiaYearFilter, setLibrosGuardiaYearFilter] = useState('');
  const [selectedLibroGuardia, setSelectedLibroGuardia] = useState(null);
  const [registrosLibroGuardia, setRegistrosLibroGuardia] = useState([]);
  const [loadingRegistrosLibroGuardia, setLoadingRegistrosLibroGuardia] = useState(false);
  const [registrosLibroGuardiaError, setRegistrosLibroGuardiaError] = useState('');
  const [registrosPage, setRegistrosPage] = useState(1);
  const [registrosPageSize, setRegistrosPageSize] = useState(20);
  const [registrosTotal, setRegistrosTotal] = useState(0);
  const [registrosTotalPages, setRegistrosTotalPages] = useState(1);
  const [registrosServerPaginated, setRegistrosServerPaginated] = useState(false);
  const registrosRequestId = useRef(0);
  const [showCreateRegistroModal, setShowCreateRegistroModal] = useState(false);
  const [savingRegistroLibroGuardia, setSavingRegistroLibroGuardia] = useState(false);
  const [createRegistroError, setCreateRegistroError] = useState('');
  const [newRegistroData, setNewRegistroData] = useState({ fecha: '', hora: '', detalle: '' });
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
      const nextMaterialDetailRoute = getMaterialDetailRoute(window.location.pathname);
      const nextStockMinimoDetailId = getStockMinimoDetailId(window.location.pathname);
      setMaterialDetailRoute(nextMaterialDetailRoute);
      setStockMinimoDetailId(nextStockMinimoDetailId);
      if (nextStockMinimoDetailId) {
        setActiveTab('bodegas');
        setInventoryView('stocks');
        return;
      }
      setStockMinimoDetail(null);
      setStockMinimoDetailError('');
      if (!nextMaterialDetailRoute) {
        const nextTab = getInitialDashboardTab(window.location.pathname);
        setActiveTab(nextTab);
        setInventoryView(getInitialInventoryView(window.location.pathname));
        setPersonalView(nextTab === 'personal' ? getInitialPersonalView(window.location.pathname) : 'listado');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    fetchBomberoProfile();
  }, []);

  useEffect(() => {
    fetchNotifications();

    const intervalId = window.setInterval(fetchNotifications, 60000);
    return () => window.clearInterval(intervalId);
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
    if (stockMinimoDetailId) {
      fetchStockMinimoDetail(stockMinimoDetailId);
    }
  }, [stockMinimoDetailId]);

  useEffect(() => {
    if (activeTab === 'bodegas' && inventoryView === 'catalogo') {
      const timeoutId = window.setTimeout(
        () => fetchCatalogo(catalogPage, catalogPageSize),
        filtroNombre.trim() ? 250 : 0,
      );

      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [activeTab, inventoryView, catalogPage, catalogPageSize, filtroNombre, filtroTipo]);

  useEffect(() => {
    if (activeTab === 'donaciones') {
      fetchCampanasDonaciones();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'personal') {
      fetchBomberosPersonal();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'libro-guardia') {
      fetchLibrosGuardia();
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedLibroGuardia) {
      fetchRegistrosLibroGuardia(selectedLibroGuardia, registrosPage, registrosPageSize);
    }
  }, [registrosPage, registrosPageSize]);

  useEffect(() => {
    if (activeTab !== 'donaciones') return undefined;

    const refreshDonaciones = () => {
      fetchCampanasDonaciones();
      if (selectedCampanaDetalle) {
        fetchDonacionesCampana(selectedCampanaDetalle);
      }
    };

    const handleFocus = () => refreshDonaciones();
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshDonaciones();
      }
    };
    const intervalId = window.setInterval(refreshDonaciones, 300000);

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab, selectedCampanaDetalle]);

  useEffect(() => {
    if (selectedCampanaDetalle) {
      fetchDonacionesCampana(selectedCampanaDetalle);
    }
  }, [selectedCampanaDetalle]);

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

  const getPaginationPayload = (payload) => {
    if (!payload || Array.isArray(payload)) return null;

    const source = payload.pagination
      || payload.paginacion
      || payload.meta
      || payload.data?.pagination
      || payload.data?.paginacion
      || payload.data?.meta
      || (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data) ? payload.data : null)
      || (payload.result && typeof payload.result === 'object' && !Array.isArray(payload.result) ? payload.result : null)
      || payload;
    const total = source.totalItems ?? source.totalRegistros ?? source.totalCount ?? source.total;
    const totalPages = source.totalPages ?? source.totalPaginas;

    if (total === undefined && totalPages === undefined) return null;

    return {
      total: total === undefined ? null : Number(total),
      totalPages: totalPages === undefined ? null : Number(totalPages),
    };
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

  const parseJwtPayload = (token) => {
    if (!token) return {};

    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return {};

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const jsonPayload = decodeURIComponent(
        window.atob(paddedBase64)
          .split('')
          .map(char => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
          .join('')
      );

      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('No se pudo decodificar el token:', error);
      return {};
    }
  };

  const getTokenClaim = (payload, claimNames) => {
    for (const claimName of claimNames) {
      if (payload?.[claimName] !== undefined && payload?.[claimName] !== null && payload?.[claimName] !== '') {
        return payload[claimName];
      }
    }

    return null;
  };

  const getSessionUser = () => {
    const tokenPayload = parseJwtPayload(localStorage.getItem('token'));
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const mergedPermissions = [
        ...(Array.isArray(tokenPayload.permisos) ? tokenPayload.permisos : []),
        ...(Array.isArray(storedUser.permisos) ? storedUser.permisos : []),
      ];

      return {
        ...tokenPayload,
        ...storedUser,
        idRol: storedUser.idRol || tokenPayload.idRol || tokenPayload.rolId || tokenPayload.roleId || tokenPayload.idRole,
        permisos: mergedPermissions.length > 0 ? mergedPermissions : (storedUser.permisos || tokenPayload.permisos),
      };
    } catch {
      return tokenPayload;
    }
  };

  const getCurrentBomberoIdFromSession = () => {
    const tokenPayload = parseJwtPayload(localStorage.getItem('token'));
    const user = getSessionUser();

    return getTokenClaim(tokenPayload, [
      'idBombero',
      'IdBombero',
      'bomberoId',
      'BomberoId',
      'id_bombero',
      'nameid',
      'unique_name',
      'sub',
      'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier',
    ]) || user.idBombero || user.id;
  };

  const getProfileInitials = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'U';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const formatProfileName = (name = '') => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (parts.length <= 1) return parts[0] || 'Usuario';

    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
  };

  const fetchBomberoProfile = async () => {
    setLoadingBomberoProfile(true);
    setBomberoProfileError('');

    try {
      if (canManageOwnUser) {
        const data = await apiFetch('/api/Usuarios/perfil');
        setBomberoProfile(data);
        localStorage.setItem('user', JSON.stringify({
          ...getSessionUser(),
          idBombero: data.idBombero,
          idUsuario: data.idUsuario,
          email: data.email,
          cargo: data.cargo,
        }));
        return data;
      }

      const idBombero = getCurrentBomberoIdFromSession();
      if (!idBombero) {
        setBomberoProfileError('No se pudo obtener el id del bombero desde la sesión.');
        return null;
      }

      const data = await apiFetch(`/api/bomberos/${idBombero}`);
      setBomberoProfile(data);
      localStorage.setItem('user', JSON.stringify({
        ...getSessionUser(),
        idBombero: data.idBombero || idBombero,
        idUsuario: data.idUsuario,
        idCompania: data.idCompania,
        email: data.email,
        cargo: data.cargo,
      }));
      return data;
    } catch (error) {
      console.error('No se pudieron cargar los datos del bombero:', error);
      setBomberoProfileError(error.message || 'No se pudieron cargar los datos del bombero.');
      return null;
    } finally {
      setLoadingBomberoProfile(false);
    }
  };

  const sessionUser = getSessionUser();
  const permissionSet = getUserPermissionSet(sessionUser);
  const can = (permission) => hasPermission(permissionSet, permission);
  const canAny = (permissions) => hasAnyPermission(permissionSet, permissions);
  const canViewInventory = can(PERMISSIONS.VER_INVENTARIO);
  const canCreateMaterial = can(PERMISSIONS.CREAR_MATERIAL);
  const canEditMaterial = can(PERMISSIONS.EDITAR_MATERIAL);
  const canAddStock = can(PERMISSIONS.AGREGAR_STOCK);
  const canMoveMaterial = can(PERMISSIONS.MOVER_MATERIAL);
  const canChangeMaterialState = can(PERMISSIONS.CAMBIAR_ESTADO_MATERIAL);
  const canRegisterDamageLoss = can(PERMISSIONS.REGISTRAR_DANO_PERDIDA);
  const canDeactivateMaterial = can(PERMISSIONS.DAR_BAJA_MATERIAL);
  const canManageLocations = can(PERMISSIONS.GESTIONAR_UBICACIONES);
  const canManageVehicles = can(PERMISSIONS.GESTIONAR_VEHICULOS);
  const canViewEpp = can(PERMISSIONS.VER_EPP);
  const canViewOwnEpp = can(PERMISSIONS.VER_EPP_PROPIO);
  const canManageEpp = can(PERMISSIONS.GESTIONAR_EPP);
  const canViewReports = canAny([PERMISSIONS.VER_REPORTES, PERMISSIONS.VER_REPORTES_BASICOS]);
  const canViewFullReports = can(PERMISSIONS.VER_REPORTES);
  const canViewBomberos = can(PERMISSIONS.VER_BOMBEROS);
  const canManageUsers = can(PERMISSIONS.GESTIONAR_USUARIOS);
  const canManageOwnUser = can(PERMISSIONS.GESTIONAR_USUARIO_PROPIO);
  const canViewLibroGuardia = can(PERMISSIONS.VER_LIBRO_GUARDIA);
  const canCreateLibroGuardia = can(PERMISSIONS.CREAR_LIBRO_GUARDIA);
  const canRegisterLibroGuardia = can(PERMISSIONS.REGISTRAR_LIBRO_GUARDIA);
  const canViewDonaciones = can(PERMISSIONS.VER_DONACIONES);
  const canManageDonaciones = can(PERMISSIONS.GESTIONAR_DONACIONES);
  const canCreateDonationLink = can(PERMISSIONS.CREAR_LINK_DONACION);
  const canViewPaymentConfig = can(PERMISSIONS.VER_CONFIGURACION_PAGO);
  const canManagePaymentConfig = can(PERMISSIONS.GESTIONAR_CONFIGURACION_PAGO);
  const canManageMaintenances = can(PERMISSIONS.GESTIONAR_MANTENCIONES);
  const canManageObservations = can(PERMISSIONS.GESTIONAR_OBSERVACIONES);
  const headerProfileName = loadingBomberoProfile
    ? 'Cargando...'
    : formatProfileName(bomberoProfile?.nombre || sessionUser.email || 'Usuario');
  const headerProfileCargo = bomberoProfile?.cargo || sessionUser.cargo || 'Sin cargo';
  const headerProfileInitials = getProfileInitials(bomberoProfile?.nombre || sessionUser.email || 'Usuario');
  const bomberoProfileStatus = bomberoProfile?.estadoUsuario || bomberoProfile?.estado;

  const getCurrentBomberoId = async () => {
    if (bomberoProfile?.idBombero) return bomberoProfile.idBombero;

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
    if (!canCreateDonationLink || !campaign?.id || generatingDonationLinkId) return;

    setGeneratingDonationLinkId(campaign.id);
    setDonationLinkError('');

    try {
      const idBombero = await getCurrentBomberoId();
      if (!idBombero) {
        throw new Error('No se pudo identificar el bombero de la sesión.');
      }

      const linkData = await apiFetch(`/api/campanasdonaciones/${campaign.id}/bomberos/link`, {
        method: 'POST',
        body: JSON.stringify({
          idBombero: Number(idBombero),
          urlBasePublica: 'https://www.cuartelamigo.cl',
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
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Santiago',
    }).format(date);
  };

  const formatDateTimeChile = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
      idCampanaDonacion: campana.idCampanaDonacion || campana.id,
      idCompania: campana.idCompania,
      nombre: campana.nombre || 'Campaña sin nombre',
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

  const mapLibroGuardia = (libro) => ({
    id: libro.idLibroGuardia || libro.idLibro || libro.id,
    nombre: libro.nombre || libro.name || 'Libro de guardia',
    duracion: libro.duracion || '',
    estado: libro.estado || 'Cerrado',
    fechaInicio: libro.fechaInicio || '',
    fechaFin: libro.fechaFin || '',
    fechaCreacion: libro.fechaCreacion || libro.createdAt || '',
    cantidadRegistros: Number(libro.cantidadRegistros || 0),
  });

  const mapRegistroLibroGuardia = (registro) => ({
    id: registro.idRegistro || registro.id,
    idLibro: registro.idLibro,
    idUsuario: registro.idUsuario,
    emailUsuario: registro.emailUsuario || '',
    fecha: registro.fecha || '',
    hora: registro.hora || '',
    detalle: registro.detalle || '',
  });

  const getChileDateValue = () => (
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago' }).format(new Date())
  );

  const getCurrentTimeValue = () => (
    new Intl.DateTimeFormat('es-CL', {
      timeZone: 'America/Santiago',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).format(new Date())
  );

  const fetchLibrosGuardia = async () => {
    setLoadingLibrosGuardia(true);
    setLibrosGuardiaError('');

    try {
      const data = await apiFetch('/api/librosguardia');
      setLibrosGuardia(getArrayPayload(data, ['libros', 'librosGuardia', 'librosDeGuardia', 'items']).map(mapLibroGuardia).filter(libro => libro.id));
    } catch (error) {
      setLibrosGuardiaError(error.message || 'No se pudieron cargar los libros de guardia.');
      setLibrosGuardia([]);
    } finally {
      setLoadingLibrosGuardia(false);
    }
  };

  const openCreateLibroGuardiaModal = () => {
    if (!canCreateLibroGuardia) return;

    setNewLibroGuardiaData({ nombre: '', duracion: 'Diario', estado: 'Abierto' });
    setCreateLibroGuardiaError('');
    setShowCreateLibroGuardiaModal(true);
  };

  const closeCreateLibroGuardiaModal = () => {
    if (savingLibroGuardia) return;
    setShowCreateLibroGuardiaModal(false);
    setCreateLibroGuardiaError('');
  };

  const handleCreateLibroGuardia = async (event) => {
    event.preventDefault();
    if (!canCreateLibroGuardia) return;

    const payload = {
      nombre: newLibroGuardiaData.nombre.trim(),
      duracion: newLibroGuardiaData.duracion.trim(),
      estado: newLibroGuardiaData.estado,
      fechaCreacion: new Date().toISOString(),
    };

    if (!payload.nombre || !payload.duracion || !payload.estado) {
      setCreateLibroGuardiaError('Completa nombre, duracion y estado.');
      return;
    }

    setSavingLibroGuardia(true);
    setCreateLibroGuardiaError('');

    try {
      const createdLibro = await apiFetch('/api/librosguardia', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const mappedLibro = mapLibroGuardia({ ...payload, ...(createdLibro || {}) });
      setLibrosGuardia(current => (mappedLibro.id ? [mappedLibro, ...current] : current));
      setShowCreateLibroGuardiaModal(false);
      setNewLibroGuardiaData({ nombre: '', duracion: 'Diario', estado: 'Abierto' });
      await fetchLibrosGuardia();
    } catch (error) {
      setCreateLibroGuardiaError(error.message || 'No se pudo crear el libro de guardia.');
    } finally {
      setSavingLibroGuardia(false);
    }
  };

  const mapUbicacion = (u) => {
    const idVehiculo = u.idVehiculo || u.idCarro || null;
    const idUbicacion = u.idUbicacion || u.idUbicacionActual || u.idUbicacionHija || (!idVehiculo ? u.id : null);

    return {
      id: idUbicacion || u.id || idVehiculo,
      idUbicacion,
      idVehiculo,
      name: u.nombre || u.name || u.nombreUbicacion || u.descripcion || 'Ubicación',
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
    estadoInventario: item.estadoInventario || item.estadoItem || item.estadoMaterial || item.estado || '',
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

    const isEpp = String(material.categoria || material.tipo || material.nombreTipoProducto || '').toLowerCase().includes('epp');
    if (isEpp && isSerializado) {
      const nextRoute = {
        type: 'epp-item',
        id: detailId,
        fallback: material,
      };
      window.history.pushState({}, '', `/dashboard/epp/items/${detailId}`);
      setMaterialDetailRoute(nextRoute);
      return;
    }

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
    if (window.location.pathname.startsWith('/dashboard/materiales/') || window.location.pathname.startsWith('/dashboard/epp/items/')) {
      window.history.pushState({}, '', '/dashboard');
    }

    setMaterialDetailRoute(null);
  };

  const openStockMinimoDetail = (stock) => {
    if (!stock?.id) return;

    window.history.pushState({}, '', `/dashboard/stockminimos/${stock.id}`);
    setActiveTab('bodegas');
    setInventoryView('stocks');
    setMaterialDetailRoute(null);
    setStockMinimoDetail(null);
    setStockMinimoDetailError('');
    setStockMinimoInventoryItems([]);
    setStockMinimoInventoryError('');
    setStockMinimoDetailId(stock.id);
  };

  const closeStockMinimoDetail = () => {
    if (window.location.pathname.startsWith('/dashboard/stockminimos/')) {
      window.history.pushState({}, '', '/dashboard');
    }

    setStockMinimoDetailId(null);
    setStockMinimoDetail(null);
    setStockMinimoDetailError('');
    setStockMinimoInventoryItems([]);
    setStockMinimoInventoryError('');
    setActiveTab('bodegas');
    setInventoryView('stocks');
  };

  const canAccessTab = (tab) => {
    switch (tab) {
      case 'inicio':
        return true;
      case 'bodegas':
        return canViewInventory;
      case 'vehiculos':
        return can(PERMISSIONS.VER_VEHICULOS);
      case 'epp':
        return canViewEpp || canViewOwnEpp;
      case 'libro-guardia':
        return canViewLibroGuardia;
      case 'donaciones':
        return canViewDonaciones;
      case 'personal':
        return canViewBomberos;
      case 'reportes':
        return canViewReports;
      case 'mis-datos':
        return canManageOwnUser;
      default:
        return false;
    }
  };

  const canAccessInventoryView = (viewId) => {
    switch (viewId) {
      case 'ubicaciones':
      case 'stocks':
      case 'catalogo':
        return canViewInventory;
      case 'arbol':
        return canManageLocations;
      case 'importar-catalogo':
        return canCreateMaterial;
      default:
        return false;
    }
  };

  const getFirstAllowedTab = () => (
    ['inicio', 'bodegas', 'vehiculos', 'epp', 'libro-guardia', 'donaciones', 'personal', 'reportes', 'mis-datos']
      .find(canAccessTab) || 'inicio'
  );

  const selectDashboardTab = (tab) => {
    if (!canAccessTab(tab)) return;

    setActiveTab(tab);
    setMaterialDetailRoute(null);
    setStockMinimoDetailId(null);
    setStockMinimoDetail(null);
    setStockMinimoInventoryItems([]);
    setStockMinimoInventoryError('');
    setShowNotificationsMenu(false);
    setShowProfileMenu(false);
    if (tab !== 'donaciones') {
      setSelectedCampanaDetalle(null);
    }
    if (tab !== 'libro-guardia') {
      closeRegistrosLibroGuardia();
    }
    setPersonalView('listado');

    const nextPath = tab === 'mis-datos'
      ? '/dashboard/mis-datos'
      : tab === 'reportes'
        ? '/dashboard/reportes'
        : tab === 'personal'
          ? '/dashboard/personal'
          : '/dashboard';
    if (
      window.location.pathname.startsWith('/dashboard/materiales/')
      || window.location.pathname.startsWith('/dashboard/epp/items/')
      || window.location.pathname.startsWith('/dashboard/stockminimos/')
      || window.location.pathname.startsWith('/dashboard/mis-datos')
      || window.location.pathname.startsWith('/dashboard/reportes')
      || window.location.pathname.startsWith('/dashboard/personal')
      || tab === 'mis-datos'
      || tab === 'reportes'
      || tab === 'personal'
    ) {
      window.history.pushState({}, '', nextPath);
    }
  };

  const selectInventoryView = (viewId) => {
    if (!canAccessInventoryView(viewId)) return;

    setInventoryView(viewId);
    setMaterialDetailRoute(null);
    setStockMinimoDetailId(null);
    setStockMinimoDetail(null);
    setStockMinimoDetailError('');
    setStockMinimoInventoryItems([]);
    setStockMinimoInventoryError('');

    if (window.location.pathname.startsWith('/dashboard/stockminimos/')) {
      window.history.pushState({}, '', '/dashboard');
    }
  };

  useEffect(() => {
    if (materialDetailRoute) {
      const canSeeDetail = materialDetailRoute.type === 'epp-item'
        ? (canViewEpp || canViewOwnEpp)
        : canViewInventory;

      if (!canSeeDetail) {
        setMaterialDetailRoute(null);
        setActiveTab(getFirstAllowedTab());
        return;
      }
    }

    if (stockMinimoDetailId && !canViewInventory) {
      setStockMinimoDetailId(null);
      setStockMinimoDetail(null);
      setStockMinimoInventoryItems([]);
      setActiveTab(getFirstAllowedTab());
      return;
    }

    if (!canAccessTab(activeTab)) {
      setActiveTab(getFirstAllowedTab());
      return;
    }

    if (activeTab === 'bodegas' && !canAccessInventoryView(inventoryView)) {
      setInventoryView(canAccessInventoryView('ubicaciones') ? 'ubicaciones' : 'catalogo');
    }
  }, [activeTab, inventoryView, materialDetailRoute, stockMinimoDetailId]);


  const fetchCatalogo = async (page = catalogPage, pageSize = catalogPageSize) => {
    const requestId = ++catalogRequestId.current;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });

      if (filtroNombre.trim()) {
        query.set('search', filtroNombre.trim());
      }

      if (filtroTipo !== 'Todos los tipos') {
        query.set('tipo', filtroTipo);
      }

      const data = await apiFetch(`/api/materiales/creados?${query.toString()}`);
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
      const pagination = getPaginationPayload(data);

      if (requestId !== catalogRequestId.current) return;

      setCatalogo(mappedData);
      setCatalogServerPaginated(Boolean(pagination));
      setCatalogTotal(pagination?.total ?? mappedData.length);
      setCatalogTotalPages(Math.max(1, pagination?.totalPages ?? Math.ceil((pagination?.total ?? mappedData.length) / pageSize)));
    } catch (error) {
      if (requestId !== catalogRequestId.current) return;

      console.error("Error al cargar catalogo:", error);
      setCatalogo([]);
      setCatalogTotal(0);
      setCatalogTotalPages(1);
      setCatalogServerPaginated(false);
    } finally {
      if (requestId === catalogRequestId.current) {
        setLoading(false);
      }
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationsError('');

    try {
      const data = await apiFetch('/api/notificaciones?leida=false');
      setNotifications(getArrayPayload(data));
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      setNotificationsError(error.message || 'No se pudieron cargar las notificaciones.');
      setNotifications([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const mapBomberoPersonal = (bombero) => ({
    id: bombero.idBombero || bombero.id,
    idUsuario: bombero.idUsuario,
    nombre: bombero.nombre || 'Bombero',
    rut: bombero.rut || '',
    email: bombero.email || '',
    telefono: bombero.telefono || '',
    genero: bombero.genero || '',
    cargo: bombero.cargo || 'Voluntario',
    estado: bombero.estadoUsuario || bombero.estado || 'Sin estado',
  });

  const getBomberoInitials = (nombre = '') => {
    const parts = nombre.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'B';
    return parts.slice(0, 2).map(part => part[0]).join('').toUpperCase();
  };

  const fetchBomberosPersonal = async () => {
    setLoadingBomberosPersonal(true);
    setBomberosPersonalError('');
    setPersonalActionError('');

    try {
      const data = await apiFetch('/api/bomberos');
      setBomberosPersonal(getArrayPayload(data).map(mapBomberoPersonal).filter(bombero => bombero.id));
    } catch (error) {
      setBomberosPersonalError(error.message || 'No se pudo cargar el personal.');
      setBomberosPersonal([]);
    } finally {
      setLoadingBomberosPersonal(false);
    }
  };

  const resetPersonalImportFeedback = () => {
    setPersonalImportError('');
    setPersonalImportSuccess('');
  };

  const openPersonalImportView = () => {
    if (!canManageUsers) return;

    resetPersonalImportFeedback();
    setPersonalImportFile(null);
    setPersonalImportInputKey(current => current + 1);
    setPersonalView('importar');
    window.history.pushState({}, '', '/dashboard/personal/importar');
  };

  const closePersonalImportView = () => {
    if (uploadingPersonalImport || downloadingPersonalTemplate) return;

    resetPersonalImportFeedback();
    setPersonalImportFile(null);
    setPersonalImportInputKey(current => current + 1);
    setPersonalView('listado');
    if (window.location.pathname.startsWith('/dashboard/personal/importar')) {
      window.history.pushState({}, '', '/dashboard/personal');
    }
  };

  const handleDownloadPersonalTemplate = async () => {
    if (!canManageUsers) return;

    setDownloadingPersonalTemplate(true);
    resetPersonalImportFeedback();

    try {
      const templateBlob = await apiFetch('/api/bomberos/importar/plantilla', {
        responseType: 'blob',
      });
      const downloadUrl = window.URL.createObjectURL(templateBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'plantilla-importacion-bomberos.xlsx';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setPersonalImportSuccess('Plantilla descargada. Completala y luego cargala en el paso 2.');
    } catch (error) {
      setPersonalImportError(error.message || 'No se pudo descargar la plantilla.');
    } finally {
      setDownloadingPersonalTemplate(false);
    }
  };

  const handlePersonalImportFileChange = (event) => {
    setPersonalImportFile(event.target.files?.[0] || null);
    resetPersonalImportFeedback();
  };

  const handlePersonalImport = async (event) => {
    event.preventDefault();
    if (!canManageUsers) return;

    resetPersonalImportFeedback();

    if (!personalImportFile) {
      setPersonalImportError('Selecciona una plantilla Excel completada antes de importar.');
      return;
    }

    const fileName = personalImportFile.name.toLowerCase();
    if (!fileName.endsWith('.xlsx')) {
      setPersonalImportError('El archivo debe estar en formato .xlsx.');
      return;
    }

    const body = new FormData();
    body.append('archivo', personalImportFile);
    setUploadingPersonalImport(true);

    try {
      await apiFetch('/api/bomberos/importar', {
        method: 'POST',
        body,
      });
      setPersonalImportFile(null);
      setPersonalImportInputKey(current => current + 1);
      setPersonalImportSuccess('Importacion finalizada correctamente. El personal ya fue actualizado.');
      await fetchBomberosPersonal();
    } catch (error) {
      setPersonalImportError(error.message || 'No se pudo importar el personal.');
    } finally {
      setUploadingPersonalImport(false);
    }
  };

  const isBomberoActivo = (bombero) => String(bombero.estado).toLowerCase() === 'activo';

  const openInactivateUsuarioModal = (bombero) => {
    if (!canManageUsers) return;

    if (!bombero?.idUsuario || inactivatingUsuarioId) {
      if (!bombero?.idUsuario) setPersonalActionError('No se pudo identificar el usuario que deseas dar de baja.');
      return;
    }

    setPersonalActionError('');
    setBomberoPendingInactivation(bombero);
  };

  const closeInactivateUsuarioModal = () => {
    if (inactivatingUsuarioId) return;
    setBomberoPendingInactivation(null);
    setPersonalActionError('');
  };

  const handleInactivateUsuario = async () => {
    const bombero = bomberoPendingInactivation;
    if (!canManageUsers || !bombero?.idUsuario || inactivatingUsuarioId) return;

    setInactivatingUsuarioId(bombero.idUsuario);
    setPersonalActionError('');

    try {
      await apiFetch(`/api/Usuarios/${bombero.idUsuario}/inactivar`, {
        method: 'PATCH',
      });
      setBomberosPersonal(current => current.map(item => (
        String(item.idUsuario) === String(bombero.idUsuario)
          ? { ...item, estado: 'Inactivo' }
          : item
      )));
      setBomberoPendingInactivation(null);
    } catch (error) {
      setPersonalActionError(error.message || 'No se pudo dar de baja al usuario.');
    } finally {
      setInactivatingUsuarioId(null);
    }
  };

  const openEditContactModal = () => {
    if (!canManageOwnUser) return;

    setContactProfileData({
      email: bomberoProfile?.email || '',
      telefono: bomberoProfile?.telefono || '',
      genero: bomberoProfile?.genero || '',
    });
    setContactProfileError('');
    setShowEditContactModal(true);
  };

  const closeEditContactModal = () => {
    if (savingContactProfile) return;
    setShowEditContactModal(false);
    setContactProfileError('');
  };

  const handleUpdateContactProfile = async (event) => {
    event.preventDefault();
    if (!canManageOwnUser) return;

    const payload = {
      email: contactProfileData.email.trim(),
      telefono: contactProfileData.telefono.trim(),
      genero: contactProfileData.genero,
    };

    if (!payload.email || !payload.telefono || !payload.genero) {
      setContactProfileError('Completa email, telefono y genero.');
      return;
    }

    setSavingContactProfile(true);
    setContactProfileError('');

    try {
      await apiFetch('/api/Usuarios/perfil/contacto', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setBomberoProfile(current => ({ ...current, ...payload }));
      localStorage.setItem('user', JSON.stringify({ ...getSessionUser(), email: payload.email }));
      setShowEditContactModal(false);
    } catch (error) {
      setContactProfileError(error.message || 'No se pudieron actualizar los datos de contacto.');
    } finally {
      setSavingContactProfile(false);
    }
  };

  const markNotificationAsRead = async (notification) => {
    if (!notification?.idNotificacion || markingNotificationId) return;

    setMarkingNotificationId(notification.idNotificacion);
    setNotificationsError('');

    try {
      await apiFetch(`/api/notificaciones/${notification.idNotificacion}/leer`, {
        method: 'PATCH',
      });
      setNotifications(prev => prev.filter(item => item.idNotificacion !== notification.idNotificacion));
    } catch (error) {
      console.error('Error al marcar notificacion como leida:', error);
      setNotificationsError(error.message || 'No se pudo marcar la notificacion como leida.');
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const fetchCampanasDonaciones = async () => {
    setLoadingCampanas(true);
    setCampanasError('');

    try {
      const [activasData, finalizadasData, canceladasData] = await Promise.all([
        apiFetch('/api/campanasdonaciones?estado=Activa'),
        apiFetch('/api/campanasdonaciones?estado=Finalizada'),
        apiFetch('/api/campanasdonaciones?estado=Cancelada'),
      ]);

      setCampanasActivas(getArrayPayload(activasData).map(mapCampana));
      setCampanasFinalizadas([
        ...getArrayPayload(finalizadasData).map(mapCampana),
        ...getArrayPayload(canceladasData).map(mapCampana),
      ]);
    } catch (error) {
      console.error('Error al cargar campañas de donaciones:', error);
      setCampanasError(error.message || 'No se pudieron cargar las campañas de donaciones.');
      setCampanasActivas([]);
      setCampanasFinalizadas([]);
    } finally {
      setLoadingCampanas(false);
    }
  };

  const fetchDonacionesCampana = async (campana) => {
    if (!campana?.idCompania || !campana?.idCampanaDonacion) {
      setDonacionesCampana([]);
      setDonacionesCampanaError('No se pudo identificar la compañía o la campaña.');
      return;
    }

    setLoadingDonacionesCampana(true);
    setDonacionesCampanaError('');

    try {
      const data = await apiFetch(`/api/companias/${campana.idCompania}/donaciones?idCampaniaDonacion=${campana.idCampanaDonacion}&estadoPago=Pagada`);
      setDonacionesCampana(getArrayPayload(data));
    } catch (error) {
      console.error('Error al cargar donaciones de campana:', error);
      setDonacionesCampanaError(error.message || 'No se pudieron cargar las donaciones.');
      setDonacionesCampana([]);
    } finally {
      setLoadingDonacionesCampana(false);
    }
  };

  const openCampanaDetalle = (campana) => {
    setSelectedCampanaDetalle(campana);
    setDonacionesCampana([]);
    setDonacionesCampanaError('');
    setFiltroNombreDonante('');
    setFiltroNombreBomberoDonacion('');
  };

  const closeCampanaDetalle = () => {
    setSelectedCampanaDetalle(null);
    setDonacionesCampana([]);
    setDonacionesCampanaError('');
    setFiltroNombreDonante('');
    setFiltroNombreBomberoDonacion('');
  };

  const selectDonacionesView = (view) => {
    if (view === 'configuracion' && !canViewPaymentConfig && !canManagePaymentConfig) return;

    setDonacionesView(view);
    setPaymentConfigError('');
    setPaymentConfigSuccess('');
    if (view !== 'campanas') {
      closeCampanaDetalle();
    }
  };

  const fetchRegistrosLibroGuardia = async (libro = selectedLibroGuardia, page = registrosPage, pageSize = registrosPageSize) => {
    if (!libro?.id) return;

    const requestId = ++registrosRequestId.current;
    setLoadingRegistrosLibroGuardia(true);
    setRegistrosLibroGuardiaError('');

    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const data = await apiFetch(`/api/librosguardia/${libro.id}/registros?${query.toString()}`);
      const mappedRegistros = getArrayPayload(data, ['registros', 'items']).map(mapRegistroLibroGuardia);
      const pagination = getPaginationPayload(data);

      if (requestId !== registrosRequestId.current) return;

      setRegistrosLibroGuardia(mappedRegistros);
      setRegistrosServerPaginated(Boolean(pagination));
      setRegistrosTotal(pagination?.total ?? mappedRegistros.length);
      setRegistrosTotalPages(Math.max(1, pagination?.totalPages ?? Math.ceil((pagination?.total ?? mappedRegistros.length) / pageSize)));
    } catch (error) {
      if (requestId !== registrosRequestId.current) return;

      setRegistrosLibroGuardiaError(error.message || 'No se pudieron cargar los registros del libro.');
      setRegistrosLibroGuardia([]);
      setRegistrosTotal(0);
      setRegistrosTotalPages(1);
      setRegistrosServerPaginated(false);
    } finally {
      if (requestId === registrosRequestId.current) {
        setLoadingRegistrosLibroGuardia(false);
      }
    }
  };

  const openRegistrosLibroGuardia = (libro) => {
    setSelectedLibroGuardia(libro);
    setRegistrosPage(1);
    setRegistrosLibroGuardia([]);
    setRegistrosLibroGuardiaError('');
    if (registrosPage === 1) {
      fetchRegistrosLibroGuardia(libro, 1, registrosPageSize);
    }
  };

  const closeRegistrosLibroGuardia = () => {
    registrosRequestId.current += 1;
    setSelectedLibroGuardia(null);
    setRegistrosPage(1);
    setRegistrosLibroGuardia([]);
    setRegistrosLibroGuardiaError('');
  };

  const openCreateRegistroModal = () => {
    if (!canRegisterLibroGuardia) return;

    setNewRegistroData({
      fecha: getChileDateValue(),
      hora: getCurrentTimeValue(),
      detalle: '',
    });
    setCreateRegistroError('');
    setShowCreateRegistroModal(true);
  };

  const closeCreateRegistroModal = () => {
    if (savingRegistroLibroGuardia) return;
    setShowCreateRegistroModal(false);
    setCreateRegistroError('');
  };

  const handleCreateRegistroLibroGuardia = async (event) => {
    event.preventDefault();
    if (!canRegisterLibroGuardia || !selectedLibroGuardia?.id) return;

    const payload = {
      fecha: newRegistroData.fecha,
      hora: newRegistroData.hora.length === 5 ? `${newRegistroData.hora}:00` : newRegistroData.hora,
      detalle: newRegistroData.detalle.trim(),
    };

    if (!payload.fecha || !newRegistroData.hora || !payload.detalle) {
      setCreateRegistroError('Completa fecha, hora y detalle del registro.');
      return;
    }

    setSavingRegistroLibroGuardia(true);
    setCreateRegistroError('');

    try {
      await apiFetch(`/api/librosguardia/${selectedLibroGuardia.id}/registros`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setShowCreateRegistroModal(false);
      setNewRegistroData({ fecha: '', hora: '', detalle: '' });
      await fetchRegistrosLibroGuardia(selectedLibroGuardia, registrosPage, registrosPageSize);
      setLibrosGuardia(current => current.map(libro => (
        String(libro.id) === String(selectedLibroGuardia.id)
          ? { ...libro, cantidadRegistros: libro.cantidadRegistros + 1 }
          : libro
      )));
    } catch (error) {
      setCreateRegistroError(error.message || 'No se pudo crear el registro.');
    } finally {
      setSavingRegistroLibroGuardia(false);
    }
  };

  const handlePaymentConfigChange = (field, value) => {
    setPaymentConfigData(prev => ({
      ...prev,
      [field]: value,
    }));
    setPaymentConfigError('');
    setPaymentConfigSuccess('');
  };

  const resetPaymentConfigData = () => {
    setPaymentConfigData(DEFAULT_PAYMENT_CONFIG);
    setPaymentConfigError('');
    setPaymentConfigSuccess('');
  };

  const handleSavePaymentConfig = async (event) => {
    event.preventDefault();
    if (!canManagePaymentConfig) return;

    setPaymentConfigError('');
    setPaymentConfigSuccess('');

    const payload = {
      apiKey: paymentConfigData.apiKey.trim(),
      secretKey: paymentConfigData.secretKey.trim(),
      commerceId: paymentConfigData.commerceId.trim() || null,
      ambiente: paymentConfigData.ambiente,
      urlApi: paymentConfigData.urlApi.trim(),
      urlConfirmacion: paymentConfigData.urlConfirmacion.trim(),
      urlRetorno: paymentConfigData.urlRetorno.trim(),
      paymentMethodDefault: Number(paymentConfigData.paymentMethodDefault),
      monedaDefault: paymentConfigData.monedaDefault.trim() || 'CLP',
      timeoutSegundos: paymentConfigData.timeoutSegundos === '' ? null : Number(paymentConfigData.timeoutSegundos),
      activo: paymentConfigData.activo,
    };

    if (!payload.apiKey || !payload.secretKey || !payload.urlApi || !payload.urlConfirmacion || !payload.urlRetorno) {
      setPaymentConfigError('Completa API Key, Secret Key y URLs para guardar la configuracion.');
      return;
    }

    if (!Number.isFinite(payload.paymentMethodDefault) || payload.paymentMethodDefault <= 0) {
      setPaymentConfigError('El metodo de pago debe ser un numero mayor a cero.');
      return;
    }

    if (payload.timeoutSegundos !== null && (!Number.isFinite(payload.timeoutSegundos) || payload.timeoutSegundos <= 0)) {
      setPaymentConfigError('El timeout debe quedar vacio o ser un numero mayor a cero.');
      return;
    }

    setSavingPaymentConfig(true);

    try {
      await apiFetch('/api/configuracionespagos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setPaymentConfigSuccess('Configuración de pago guardada correctamente.');
    } catch (error) {
      setPaymentConfigError(error.message || 'No se pudo guardar la configuración de pago.');
    } finally {
      setSavingPaymentConfig(false);
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
    if (!canManageDonaciones) return;

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
    if (!canManageDonaciones) return;

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
      setCreateCampanaError('Completa nombre, descripción, meta y fechas para crear la campaña.');
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
      setCreateCampanaError(error.message || 'No se pudo crear la campaña.');
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

  const openValueUpdateModal = (material) => {
    if (!canEditMaterial) return;

    setValueUpdateMaterial(material);
    setValueUpdateInput(formatCurrency(material.valorUnitario ?? material.valor ?? 0));
    setValueUpdateError('');
  };

  const closeValueUpdateModal = () => {
    if (savingValueUpdate) return;
    setValueUpdateMaterial(null);
    setValueUpdateInput('');
    setValueUpdateError('');
  };

  const handleValueUpdateChange = (event) => {
    const rawValue = event.target.value.replace(/\D/g, '');

    if (rawValue === '') {
      setValueUpdateInput('');
      return;
    }

    setValueUpdateInput(formatCurrency(rawValue));
  };

  const handleUpdateMaterialValue = async (event) => {
    event.preventDefault();
    if (!canEditMaterial || !valueUpdateMaterial?.id) return;

    const nextValue = parseCurrencyValue(valueUpdateInput);
    setSavingValueUpdate(true);
    setValueUpdateError('');

    try {
      await apiFetch(`/api/materiales/${valueUpdateMaterial.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ valorUnitario: nextValue }),
      });

      setCatalogo(prev => prev.map(item => (
        item.id === valueUpdateMaterial.id
          ? { ...item, valor: formatCurrency(nextValue), valorUnitario: nextValue }
          : item
      )));
      setValueUpdateMaterial(null);
      setValueUpdateInput('');
      setValueUpdateError('');
    } catch (error) {
      setValueUpdateError(error.message || 'No se pudo actualizar el valor unitario.');
    } finally {
      setSavingValueUpdate(false);
    }
  };

  const handleCreateMaterial = async (event) => {
    event.preventDefault();
    if (!canCreateMaterial) return;

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
      setAddMaterialError('Completa tipo, nombre y descripción para crear el material.');
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

  const resetCatalogImportFeedback = () => {
    setCatalogImportError('');
    setCatalogImportSuccess('');
  };

  const openCatalogImportView = () => {
    if (!canCreateMaterial) return;

    resetCatalogImportFeedback();
    setInventoryView('importar-catalogo');
  };

  const handleDownloadCatalogTemplate = async () => {
    if (!canCreateMaterial) return;

    setDownloadingCatalogTemplate(true);
    resetCatalogImportFeedback();

    try {
      const templateBlob = await apiFetch('/api/materiales/importar-catalogo/plantilla', {
        responseType: 'blob',
      });
      const downloadUrl = window.URL.createObjectURL(templateBlob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = 'plantilla-importacion-materiales.xlsx';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();
      window.URL.revokeObjectURL(downloadUrl);
      setCatalogImportSuccess('Plantilla descargada. Completala y luego cargala en el paso 2.');
    } catch (error) {
      setCatalogImportError(error.message || 'No se pudo descargar la plantilla.');
    } finally {
      setDownloadingCatalogTemplate(false);
    }
  };

  const handleCatalogImportFileChange = (event) => {
    setCatalogImportFile(event.target.files?.[0] || null);
    resetCatalogImportFeedback();
  };

  const handleCatalogImport = async (event) => {
    event.preventDefault();
    if (!canCreateMaterial) return;

    resetCatalogImportFeedback();

    if (!catalogImportFile) {
      setCatalogImportError('Selecciona una plantilla Excel completada antes de importar.');
      return;
    }

    const fileName = catalogImportFile.name.toLowerCase();
    if (!fileName.endsWith('.xlsx')) {
      setCatalogImportError('El archivo debe estar en formato .xlsx.');
      return;
    }

    const body = new FormData();
    body.append('archivo', catalogImportFile);
    body.append('modoImportacion', catalogImportMode);
    setUploadingCatalogImport(true);

    try {
      await apiFetch('/api/materiales/importar-catalogo', {
        method: 'POST',
        body,
      });
      setCatalogImportFile(null);
      setCatalogImportInputKey(current => current + 1);
      setCatalogImportSuccess('Importación finalizada correctamente. El catálogo ya fue actualizado.');
      await fetchCatalogo();
    } catch (error) {
      setCatalogImportError(error.message || 'No se pudo importar el catálogo.');
    } finally {
      setUploadingCatalogImport(false);
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
  const selectedUbicacionName = isGeneralInventario ? 'General' : selectedUbicacion?.name || currentUbicacion?.name || 'Ubicación';
  const selectedUbicacionTipo = selectedUbicacion?.nombreTipo || currentUbicacion?.nombreTipo || '';
  const isGeneralVehiculo = currentUbicacion?.id === activeUbicacion && selectedUbicacionTipo.toLowerCase() === 'vehiculo';
  const addMaterialDisabledReason = isGeneralInventario
    ? 'Selecciona una ubicación específica para añadir materiales.'
    : isGeneralVehiculo ? 'No se pueden añadir materiales en General de una ubicación tipo Vehículo. Selecciona una gaveta o sububicación.' : '';
  const selectedOrigen = selectedUbicacion ? { ...selectedUbicacion, name: selectedUbicacionName } : { id: activeUbicacion, name: selectedUbicacionName };
  const palette = getThemePalette(theme);
  const bomberosActivos = bomberosPersonal.filter(isBomberoActivo);
  const bomberosInactivos = bomberosPersonal.filter(bombero => !isBomberoActivo(bombero));
  const currentPersonalData = activePersonalTab === 'activos' ? bomberosActivos : bomberosInactivos;
  const renderPersonalTable = (bomberos, canInactivate) => (
    <div className="overflow-x-auto overflow-y-hidden rounded-xl border shadow-lg" style={{ borderColor: palette.border, background: palette.card }}>
      <table className="w-full text-left text-sm">
        <thead className="border-b" style={{ borderColor: palette.border, background: palette.bg2, color: palette.muted }}>
          <tr>
            <th className="px-5 py-3 font-semibold">Nombre del Bombero</th>
            <th className="px-5 py-3 font-semibold">RUT</th>
            <th className="px-5 py-3 font-semibold">Cargo</th>
            <th className="px-5 py-3 font-semibold">Estado</th>
            <th className="px-5 py-3 text-right font-semibold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {bomberos.length > 0 ? bomberos.map(bombero => (
            <tr key={bombero.id} className="border-b last:border-b-0" style={{ borderColor: palette.border }}>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/10 text-sm font-bold text-brand-cyan">
                    {getBomberoInitials(bombero.nombre)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold" style={{ color: palette.text }}>{bombero.nombre}</p>
                    <p className="mt-1 truncate text-xs" style={{ color: palette.muted }}>{bombero.email || 'Sin email registrado'}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 font-mono text-xs" style={{ color: palette.muted }}>{bombero.rut || '-'}</td>
              <td className="px-5 py-4">
                <span className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
                  {bombero.cargo}
                </span>
              </td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: canInactivate ? '#22C55E' : palette.muted }}>
                  <span className={`h-2 w-2 rounded-full ${canInactivate ? 'bg-green-500' : 'bg-slate-500'}`}></span>
                  {bombero.estado}
                </span>
              </td>
              <td className="px-5 py-4 text-right">
                {canInactivate ? (
                  <button
                    type="button"
                    onClick={() => openInactivateUsuarioModal(bombero)}
                    disabled={String(inactivatingUsuarioId) === String(bombero.idUsuario)}
                    className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red/20 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {String(inactivatingUsuarioId) === String(bombero.idUsuario) ? 'Procesando...' : 'Dar Baja'}
                  </button>
                ) : (
                  <span className="text-xs" style={{ color: palette.muted }}>Sin acciones</span>
                )}
              </td>
            </tr>
          )) : (
            <tr>
              <td colSpan="5" className="px-5 py-10 text-center" style={{ color: palette.muted }}>
                No hay bomberos {canInactivate ? 'activos' : 'inactivos'}.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
  const inventoryViews = [
    { id: 'ubicaciones', label: 'Ubicaciones principales' },
    { id: 'arbol', label: 'Árbol de ubicaciones' },
    { id: 'stocks', label: 'Stocks mínimos' },
    { id: 'catalogo', label: 'Catálogo' },
  ].filter(view => canAccessInventoryView(view.id));
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
    nombre: tipo.nombre || tipo.name || tipo.nombreTipo || 'Tipo de ubicación',
    idCompania: tipo.idCompania,
    esTipoRaiz: toBoolean(tipo.esTipoRaiz),
  });

  const mapTipoRelation = (relation) => ({
    id: relation.idTipoUbicacionRelacion || `${relation.idTipoUbicacionPadre}-${relation.idTipoUbicacionHijo}`,
    idTipoUbicacionRelacion: relation.idTipoUbicacionRelacion,
    idTipoUbicacionPadre: relation.idTipoUbicacionPadre,
    nombreTipoPadre: relation.nombreTipoPadre,
    idTipoUbicacionHijo: relation.idTipoUbicacionHijo,
    nombreTipoHijo: relation.nombreTipoHijo || 'Tipo de ubicación',
    esTipoRaizHijo: toBoolean(relation.esTipoRaizHijo),
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
      setTiposArbolError(error.message || 'No se pudieron cargar los tipos de ubicación.');
      setTiposArbolUbicacion([]);
      return [];
    } finally {
      setLoadingTiposArbol(false);
    }
  };

  const fetchTipoChildrenRelations = async (tipoPadreId) => {
    if (!tipoPadreId) return [];

    setLoadingTipoChildrenRelations(true);
    setEditTipoRelationsError('');

    try {
      const data = await apiFetch(`/api/relaciontipoubicaciones/${tipoPadreId}`);
      const relations = getArrayPayload(data, ['relaciones', 'relacionTipoUbicaciones', 'tipos'])
        .map(mapTipoRelation)
        .filter(relation => relation.idTipoUbicacionHijo);
      setTipoChildrenRelations(relations);
      return relations;
    } catch (error) {
      setEditTipoRelationsError(error.message || 'No se pudieron cargar los tipos admitidos.');
      setTipoChildrenRelations([]);
      return [];
    } finally {
      setLoadingTipoChildrenRelations(false);
    }
  };

  const openEditTipoRelationsModal = async (tipo) => {
    if (!canManageLocations) return;

    setEditingTipoRelations(tipo);
    setSelectedTipoHijoId('');
    setEditTipoRelationsError('');
    setTipoChildrenRelations([]);
    await fetchTipoChildrenRelations(tipo.id);
  };

  const closeEditTipoRelationsModal = () => {
    if (loadingTipoChildrenRelations || savingTipoChildRelation || deletingTipoChildRelationId) return;

    setEditingTipoRelations(null);
    setTipoChildrenRelations([]);
    setSelectedTipoHijoId('');
    setEditTipoRelationsError('');
  };

  const handleAddTipoChildRelation = async (event) => {
    event.preventDefault();
    if (!canManageLocations || !editingTipoRelations?.id || !selectedTipoHijoId || savingTipoChildRelation) return;

    const tipoHijo = tiposArbolUbicacion.find(tipo => String(tipo.id) === String(selectedTipoHijoId));
    setSavingTipoChildRelation(true);
    setEditTipoRelationsError('');

    try {
      await apiFetch('/api/relaciontipoubicaciones', {
        method: 'POST',
        body: JSON.stringify({
          idCompania: Number(editingTipoRelations.idCompania || tipoHijo?.idCompania || 0),
          idTipoUbicacionPadre: Number(editingTipoRelations.id),
          idTipoUbicacionHijo: Number(selectedTipoHijoId),
        }),
      });

      setSelectedTipoHijoId('');
      await fetchTipoChildrenRelations(editingTipoRelations.id);
    } catch (error) {
      setEditTipoRelationsError(error.message || 'No se pudo agregar el tipo admitido.');
    } finally {
      setSavingTipoChildRelation(false);
    }
  };

  const handleDeleteTipoChildRelation = async (relation) => {
    if (!canManageLocations || !editingTipoRelations?.id || !relation?.idTipoUbicacionHijo || deletingTipoChildRelationId) return;

    const relationId = relation.idTipoUbicacionRelacion || relation.id;
    setDeletingTipoChildRelationId(relationId);
    setEditTipoRelationsError('');

    try {
      await apiFetch('/api/relaciontipoubicaciones', {
        method: 'DELETE',
        body: JSON.stringify({
          idTipoUbicacionPadre: Number(editingTipoRelations.id),
          idTipoUbicacionHijo: Number(relation.idTipoUbicacionHijo),
        }),
      });

      setTipoChildrenRelations(prev => prev.filter(item => String(item.idTipoUbicacionHijo) !== String(relation.idTipoUbicacionHijo)));
      await fetchTipoChildrenRelations(editingTipoRelations.id);
    } catch (error) {
      setEditTipoRelationsError(error.message || 'No se pudo eliminar la relacion.');
    } finally {
      setDeletingTipoChildRelationId(null);
    }
  };

  const openDeleteTipoUbicacionModal = (tipo) => {
    if (!canManageLocations || !tipo?.id || deletingTipoUbicacionId) return;

    setDeleteTipoUbicacionError('');
    setTipoUbicacionPendingDelete(tipo);
  };

  const closeDeleteTipoUbicacionModal = () => {
    if (deletingTipoUbicacionId) return;
    setTipoUbicacionPendingDelete(null);
    setDeleteTipoUbicacionError('');
  };

  const handleDeleteTipoUbicacion = async () => {
    const tipo = tipoUbicacionPendingDelete;
    if (!canManageLocations || !tipo?.id || deletingTipoUbicacionId) return;

    setDeletingTipoUbicacionId(tipo.id);
    setDeleteTipoUbicacionError('');

    try {
      await apiFetch(`/api/tipoubicaciones/${tipo.id}`, {
        method: 'DELETE',
      });

      setTiposArbolUbicacion(prev => prev.filter(item => String(item.id) !== String(tipo.id)));
      setTiposUbicacion(prev => prev.filter(item => String(item.id) !== String(tipo.id)));
      await fetchTiposArbolUbicacion();
      setTipoUbicacionPendingDelete(null);
    } catch (error) {
      setDeleteTipoUbicacionError(error.message || 'No se pudo eliminar el tipo de ubicación.');
    } finally {
      setDeletingTipoUbicacionId(null);
    }
  };

  const openAddTipoUbicacionModal = () => {
    if (!canManageLocations) return;

    setNewTipoUbicacionData({ nombre: '', esTipoRaiz: false });
    setAddTipoUbicacionError('');
    setDeleteTipoUbicacionError('');
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
    if (!canManageLocations || !canCreateTipoUbicacion || savingTipoUbicacion) return;

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
      setAddTipoUbicacionError(error.message || 'No se pudo crear el tipo de ubicación.');
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
      setTipoRelationsError(error.message || 'No se pudieron crear las relaciones del tipo de ubicación.');
    } finally {
      setSavingTipoRelations(false);
    }
  };

  const mapStockMinimo = (stock) => ({
    id: stock.idStockMinimo || stock.id,
    idUbicacion: stock.idUbicacion,
    nombreUbicacion: stock.nombreUbicacion || stock.ubicacion || 'Ubicación',
    nombre: stock.nombre || stock.name || 'Stock mínimo',
  });

  const mapStockMinimoDetail = (stock) => ({
    id: stock.idStockMinimo || stock.id,
    idUbicacion: stock.idUbicacion,
    nombreUbicacion: stock.nombreUbicacion || stock.ubicacion || 'Ubicación',
    nombre: stock.nombre || stock.name || 'Stock mínimo',
    materiales: getArrayPayload(stock, ['materiales']).map(material => ({
      id: material.idStockMaterial || material.id || material.idMaterial,
      idStockMaterial: material.idStockMaterial || material.id,
      idMaterial: material.idMaterial,
      nombreMaterial: material.nombreMaterial || material.nombre || 'Material',
      cantidad: Number(material.cantidad || 0),
    })),
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
      setStockMinimosError(error.message || 'No se pudieron cargar los stocks mínimos.');
      setStockMinimos([]);
    } finally {
      setLoadingStockMinimos(false);
    }
  };

  async function fetchStockMinimoDetail(idStockMinimo = stockMinimoDetailId) {
    if (!idStockMinimo) return;

    setLoadingStockMinimoDetail(true);
    setStockMinimoDetailError('');
    setStockMinimoInventoryItems([]);
    setStockMinimoInventoryError('');

    try {
      const data = await apiFetch(`/api/stockminimos/${idStockMinimo}`);
      const detailPayload = data?.data || data?.result || data;
      const detail = mapStockMinimoDetail(detailPayload);
      setStockMinimoDetail(detail);

      if (detail.idUbicacion) {
        fetchStockMinimoInventory(detail.idUbicacion);
      }
    } catch (error) {
      setStockMinimoDetailError(error.message || 'No se pudo cargar el detalle del stock mínimo.');
      setStockMinimoDetail(null);
    } finally {
      setLoadingStockMinimoDetail(false);
    }
  }

  const fetchStockMinimoInventory = async (idUbicacion) => {
    if (!idUbicacion) return;

    setLoadingStockMinimoInventory(true);
    setStockMinimoInventoryError('');

    try {
      const data = await apiFetch(`/api/materiales?idUbicacion=${idUbicacion}`);
      setStockMinimoInventoryItems(mapMateriales(data));
    } catch (error) {
      setStockMinimoInventoryError(error.message || 'No se pudo cargar el inventario actual.');
      setStockMinimoInventoryItems([]);
    } finally {
      setLoadingStockMinimoInventory(false);
    }
  };

  const getStockMinimoCurrentQuantity = (idMaterial) => (
    stockMinimoInventoryItems
      .filter(item => String(item.idMaterial) === String(idMaterial))
      .reduce((total, item) => total + (Number(item.cantidad) || 0), 0)
  );

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
    if (!canAddStock) return;

    setEditingStockMinimoId(null);
    setNewStockMinimoData({ nombre: '', idUbicacion: '', materiales: [] });
    setStockMaterialSearch('');
    setAddStockMinimoError('');
    setStockMaterialesError('');
    setShowAddStockMinimoModal(true);
    await fetchStockMateriales();
  };

  const openEditStockMinimoModal = async () => {
    if (!canAddStock || !stockMinimoDetail) return;

    const selectedMaterials = (stockMinimoDetail.materiales || [])
      .filter(material => material.idMaterial)
      .map(material => ({
        idMaterial: Number(material.idMaterial),
        cantidad: Math.max(1, Number(material.cantidad) || 1),
      }));

    setEditingStockMinimoId(stockMinimoDetail.id || stockMinimoDetailId);
    setNewStockMinimoData({
      nombre: stockMinimoDetail.nombre || '',
      idUbicacion: stockMinimoDetail.idUbicacion ? String(stockMinimoDetail.idUbicacion) : '',
      materiales: selectedMaterials,
    });
    setStockMaterialSearch('');
    setAddStockMinimoError('');
    setStockMaterialesError('');
    setShowAddStockMinimoModal(true);

    const loadedMaterials = await fetchStockMateriales();
    const loadedIds = new Set(loadedMaterials.map(material => String(material.id)));
    const missingMaterials = (stockMinimoDetail.materiales || [])
      .filter(material => material.idMaterial && !loadedIds.has(String(material.idMaterial)))
      .map(material => ({
        id: material.idMaterial,
        nombre: material.nombreMaterial || 'Material',
        tipo: 'Actual',
        descripcion: '',
      }));

    if (missingMaterials.length > 0) {
      setStockMateriales(currentMaterials => [...currentMaterials, ...missingMaterials]);
    }
  };

  const closeAddStockMinimoModal = () => {
    if (savingStockMinimo) return;

    setShowAddStockMinimoModal(false);
    setEditingStockMinimoId(null);
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

  const handleSaveStockMinimo = async (event) => {
    event.preventDefault();
    if (!canAddStock || !canCreateStockMinimo || savingStockMinimo) return;

    setSavingStockMinimo(true);
    setAddStockMinimoError('');

    try {
      const payload = {
        idUbicacion: Number(newStockMinimoData.idUbicacion),
        nombre: newStockMinimoData.nombre.trim(),
        materiales: newStockMinimoData.materiales.map(material => ({
          idMaterial: Number(material.idMaterial),
          cantidad: Number(material.cantidad),
        })),
      };

      await apiFetch(editingStockMinimoId ? `/api/stockminimos/${editingStockMinimoId}` : '/api/stockminimos', {
        method: editingStockMinimoId ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setShowAddStockMinimoModal(false);
      const editedId = editingStockMinimoId;
      setEditingStockMinimoId(null);
      await fetchStockMinimos();
      if (editedId) {
        await fetchStockMinimoDetail(editedId);
      }
    } catch (error) {
      setAddStockMinimoError(error.message || (editingStockMinimoId ? 'No se pudo editar el stock mínimo.' : 'No se pudo crear el stock mínimo.'));
    } finally {
      setSavingStockMinimo(false);
    }
  };

  const openDeleteStockMinimoModal = (event, stock) => {
    event.stopPropagation();
    if (!canAddStock || !stock?.id || deletingStockMinimoId) return;

    setDeleteStockMinimoError('');
    setStockMinimoPendingDelete(stock);
  };

  const closeDeleteStockMinimoModal = () => {
    if (deletingStockMinimoId) return;

    setStockMinimoPendingDelete(null);
    setDeleteStockMinimoError('');
  };

  const handleDeleteStockMinimo = async () => {
    const stock = stockMinimoPendingDelete;
    if (!canAddStock || !stock?.id || deletingStockMinimoId) return;

    setDeletingStockMinimoId(stock.id);
    setDeleteStockMinimoError('');

    try {
      await apiFetch(`/api/stockminimos/${stock.id}`, {
        method: 'DELETE',
      });
      setStockMinimos(current => current.filter(item => String(item.id) !== String(stock.id)));
      setStockMinimoPendingDelete(null);
    } catch (error) {
      setDeleteStockMinimoError(error.message || 'No se pudo eliminar el stock mínimo.');
    } finally {
      setDeletingStockMinimoId(null);
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
          throw new Error('No se pudo identificar el tipo de la ubicación padre.');
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
      setAddUbicacionError(error.message || 'No se pudieron cargar los tipos de ubicación.');
    } finally {
      setLoadingTiposUbicacion(false);
    }
  };

  const openAddUbicacionModal = async () => {
    if (!canManageLocations) return;

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

  const filtroDonanteNormalizado = filtroNombreDonante.trim().toLowerCase();
  const filtroBomberoDonacionNormalizado = filtroNombreBomberoDonacion.trim().toLowerCase();
  const filtroCampanaNormalizado = filtroNombreCampana.trim().toLowerCase();
  const getDateOnlyTime = (value, endOfDay = false) => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    date.setHours(endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0);
    return date.getTime();
  };
  const campanaMatchesFilters = (campana) => {
    const nombreMatches = !filtroCampanaNormalizado || String(campana.nombre || '').toLowerCase().includes(filtroCampanaNormalizado);
    const filterStart = getDateOnlyTime(filtroFechaInicioCampana);
    const filterEnd = getDateOnlyTime(filtroFechaFinCampana, true);
    const campanaStart = getDateOnlyTime(campana.fechaInicio);
    const campanaEnd = getDateOnlyTime(campana.fechaFin, true) || campanaStart;
    const dateMatches = (!filterStart || (campanaEnd || campanaStart || 0) >= filterStart)
      && (!filterEnd || (campanaStart || campanaEnd || 0) <= filterEnd);

    return nombreMatches && dateMatches;
  };
  const currentCampanas = campanasListView === 'activas' ? campanasActivas : campanasFinalizadas;
  const filteredCampanas = currentCampanas.filter(campanaMatchesFilters);
  const currentCampanasTitle = campanasListView === 'activas' ? 'Campañas activas' : 'Campañas finalizadas';
  const currentCampanasEmptyMessage = campanasListView === 'activas' ? 'No hay campañas activas.' : 'No hay campañas finalizadas.';
  const catalogoFiltrado = catalogo
    .filter(item => filtroTipo === 'Todos los tipos' || item.tipo === filtroTipo)
    .filter(item => (item.nombre || '').toLowerCase().includes(filtroNombre.trim().toLowerCase()));
  const catalogRows = catalogServerPaginated
    ? catalogo
    : catalogoFiltrado.slice((catalogPage - 1) * catalogPageSize, catalogPage * catalogPageSize);
  const catalogItemCount = catalogServerPaginated ? catalogTotal : catalogoFiltrado.length;
  const catalogPageCount = catalogServerPaginated
    ? catalogTotalPages
    : Math.max(1, Math.ceil(catalogItemCount / catalogPageSize));
  const tiposArbolSearchNormalized = tiposArbolSearch.trim().toLowerCase();
  const tiposArbolFiltrados = tiposArbolUbicacion.filter(tipo => (
    !tiposArbolSearchNormalized || String(tipo.nombre || '').toLowerCase().includes(tiposArbolSearchNormalized)
  ));
  const tiposArbolItemCount = tiposArbolFiltrados.length;
  const tiposArbolPageCount = Math.max(1, Math.ceil(tiposArbolItemCount / tiposArbolPageSize));
  const safeTiposArbolPage = Math.min(tiposArbolPage, tiposArbolPageCount);
  const tiposArbolRows = tiposArbolFiltrados.slice(
    (safeTiposArbolPage - 1) * tiposArbolPageSize,
    safeTiposArbolPage * tiposArbolPageSize
  );
  const registrosRows = registrosServerPaginated
    ? registrosLibroGuardia
    : registrosLibroGuardia.slice((registrosPage - 1) * registrosPageSize, registrosPage * registrosPageSize);
  const registrosItemCount = registrosServerPaginated ? registrosTotal : registrosLibroGuardia.length;
  const registrosPageCount = registrosServerPaginated
    ? registrosTotalPages
    : Math.max(1, Math.ceil(registrosItemCount / registrosPageSize));
  const librosGuardiaMonths = [
    { value: '01', label: 'Enero' },
    { value: '02', label: 'Febrero' },
    { value: '03', label: 'Marzo' },
    { value: '04', label: 'Abril' },
    { value: '05', label: 'Mayo' },
    { value: '06', label: 'Junio' },
    { value: '07', label: 'Julio' },
    { value: '08', label: 'Agosto' },
    { value: '09', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];
  const getLibroGuardiaDate = (value) => {
    if (!value) return null;
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T12:00:00` : value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const getLibroGuardiaDates = (libro) => (
    [libro.fechaInicio, libro.fechaFin, libro.fechaCreacion]
      .map(getLibroGuardiaDate)
      .filter(Boolean)
  );
  const libroGuardiaMatchesDateFilters = (libro) => {
    if (!librosGuardiaMonthFilter && !librosGuardiaYearFilter) return true;

    const dates = getLibroGuardiaDates(libro);
    return dates.some(date => {
      const monthMatches = !librosGuardiaMonthFilter || String(date.getMonth() + 1).padStart(2, '0') === librosGuardiaMonthFilter;
      const yearMatches = !librosGuardiaYearFilter || String(date.getFullYear()) === librosGuardiaYearFilter;
      return monthMatches && yearMatches;
    });
  };
  const librosGuardiaAbiertos = librosGuardia.filter(libro => String(libro.estado).toLowerCase().includes('abierto'));
  const librosGuardiaCerrados = librosGuardia.filter(libro => !String(libro.estado).toLowerCase().includes('abierto'));
  const filteredLibrosGuardiaAbiertos = librosGuardiaAbiertos.filter(libroGuardiaMatchesDateFilters);
  const filteredLibrosGuardiaCerrados = librosGuardiaCerrados.filter(libroGuardiaMatchesDateFilters);
  const currentLibrosGuardia = activeLibrosGuardiaTab === 'abiertos' ? filteredLibrosGuardiaAbiertos : filteredLibrosGuardiaCerrados;
  const librosGuardiaYearOptions = Array.from(new Set(
    librosGuardia
      .flatMap(getLibroGuardiaDates)
      .map(date => String(date.getFullYear()))
  )).sort((a, b) => Number(b) - Number(a));
  const donacionesCampanaFiltradas = donacionesCampana.filter((donacion) => {
    const nombreDonante = String(donacion.nombreDonante || '').toLowerCase();
    const nombreBombero = String(donacion.nombreBombero || donacion.nombreUsuarioCreador || donacion.nombreUsuario || '').toLowerCase();

    return (!filtroDonanteNormalizado || nombreDonante.includes(filtroDonanteNormalizado))
      && (!filtroBomberoDonacionNormalizado || nombreBombero.includes(filtroBomberoDonacionNormalizado));
  });
  const donacionesItemCount = donacionesCampanaFiltradas.length;
  const donacionesPageCount = Math.max(1, Math.ceil(donacionesItemCount / donacionesPageSize));
  const safeDonacionesPage = Math.min(donacionesPage, donacionesPageCount);
  const donacionesRows = donacionesCampanaFiltradas.slice(
    (safeDonacionesPage - 1) * donacionesPageSize,
    safeDonacionesPage * donacionesPageSize
  );

  useEffect(() => {
    setDonacionesPage(1);
  }, [filtroNombreDonante, filtroNombreBomberoDonacion, donacionesPageSize, selectedCampanaDetalle?.id]);

  useEffect(() => {
    if (donacionesPage > donacionesPageCount) {
      setDonacionesPage(donacionesPageCount);
    }
  }, [donacionesPage, donacionesPageCount]);

  const handleCreateUbicacion = async (event) => {
    event.preventDefault();
    if (!canManageLocations || !canCreateUbicacion || savingUbicacion) return;

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
      setAddUbicacionError(error.message || 'No se pudo crear la ubicación.');
    } finally {
      setSavingUbicacion(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-dark-bg text-text-main overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="flex justify-between items-center px-5 py-3 border-b border-dark-border bg-dark-surface z-20 relative flex-shrink-0">
        {/* Left: Logo */}
        <div className="flex items-center cursor-pointer hover:opacity-80 transition-opacity mr-3 md:mr-6" onClick={goToPublicHome}>
          <LogoCuartelAmigo size={68} />
        </div>

        {/* Center: Navigation Icons */}
        <nav className="flex-1 flex items-center justify-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => selectDashboardTab('inicio')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'inicio' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Dashboard /> <span className="hidden lg:inline">Inicio</span>
          </button>
          <button style={{ display: canAccessTab('bodegas') ? undefined : 'none' }} onClick={() => selectDashboardTab('bodegas')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'bodegas' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Inventory /> <span className="hidden lg:inline">Inventario</span>
          </button>
          <button style={{ display: canAccessTab('vehiculos') ? undefined : 'none' }} onClick={() => selectDashboardTab('vehiculos')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'vehiculos' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Truck /> <span className="hidden lg:inline">Vehículos</span>
          </button>
          <button style={{ display: canAccessTab('epp') ? undefined : 'none' }} onClick={() => selectDashboardTab('epp')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'epp' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Shield /> <span className="hidden lg:inline">EPP</span>
          </button>
          <button style={{ display: canAccessTab('libro-guardia') ? undefined : 'none' }} onClick={() => selectDashboardTab('libro-guardia')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'libro-guardia' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Traceability /> <span className="hidden lg:inline">Libro Guardia</span>
          </button>
          <button style={{ display: canAccessTab('donaciones') ? undefined : 'none' }} onClick={() => selectDashboardTab('donaciones')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'donaciones' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Finance /> <span className="hidden lg:inline">Donaciones</span>
          </button>
          <button style={{ display: canAccessTab('personal') ? undefined : 'none' }} onClick={() => selectDashboardTab('personal')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'personal' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.User /> <span className="hidden lg:inline">Personal</span>
          </button>
          <button style={{ display: canAccessTab('reportes') ? undefined : 'none' }} onClick={() => selectDashboardTab('reportes')} className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === 'reportes' ? 'bg-gradient-to-r from-brand-red/10 to-brand-ember/10 text-brand-red border border-brand-red/30 shadow-[0_0_10px_rgba(232,55,42,0.1)]' : 'text-text-muted hover:bg-dark-bg3 hover:text-white'}`}>
            <Icons.Report /> <span className="hidden lg:inline">Reportes</span>
          </button>
        </nav>

        {/* Right: User Profile & Actions */}
        <div className="flex items-center gap-3 ml-3 md:ml-6 relative">
          <button 
            onClick={toggleTheme} 
            className="theme-toggle !h-9 !w-9"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <Icons.Moon /> : <Icons.Sun />}
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotificationsMenu(prev => !prev);
                setShowProfileMenu(false);
                if (!showNotificationsMenu) {
                  fetchNotifications();
                }
              }}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-dark-border bg-dark-bg2 text-text-main transition-colors hover:border-brand-cyan/50 hover:text-white"
              title="Notificaciones"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0m6 0H9"></path></svg>
              {notifications.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border border-dark-surface bg-brand-red px-1 text-[10px] font-bold text-white">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {showNotificationsMenu && (
              <div className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl">
                <div className="flex items-center justify-between border-b border-dark-border bg-dark-bg2 px-4 py-3">
                  <div>
                    <p className="rajdhani text-base font-bold text-white">Notificaciones</p>
                    <p className="text-xs text-text-muted">{notifications.length} sin leer</p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchNotifications}
                    disabled={loadingNotifications}
                    className="rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-xs font-semibold text-text-main transition-colors hover:border-brand-cyan/50 hover:text-white disabled:opacity-50"
                  >
                    Actualizar
                  </button>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {loadingNotifications ? (
                    <div className="px-4 py-8 text-center text-sm text-text-muted">Cargando notificaciones...</div>
                  ) : notificationsError ? (
                    <div className="px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-brand-red">{notificationsError}</p>
                    </div>
                  ) : notifications.length > 0 ? notifications.map(notification => (
                    <div key={notification.idNotificacion} className="border-b border-dark-border px-4 py-3 last:border-b-0">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-white">{notification.titulo}</p>
                          <p className="mt-1 text-xs text-text-muted">{notification.mensaje}</p>
                        </div>
                        <span className="shrink-0 rounded border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-0.5 text-[10px] font-semibold text-brand-cyan">
                          {notification.tipo}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-text-muted">{formatDateTimeChile(notification.fechaCreacion)}</span>
                        <button
                          type="button"
                          onClick={() => markNotificationAsRead(notification)}
                          disabled={markingNotificationId === notification.idNotificacion}
                          className="rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:border-brand-green/40 hover:text-brand-green disabled:opacity-50"
                        >
                          {markingNotificationId === notification.idNotificacion ? 'Marcando...' : 'Marcar leida'}
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="px-4 py-10 text-center text-sm text-text-muted">
                      No tienes notificaciones sin leer.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div
            className="flex items-center gap-3 cursor-pointer hover:bg-dark-bg3 p-1.5 rounded-lg transition-colors"
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotificationsMenu(false);
            }}
          >
            <div className="text-right hidden md:block">
              <div className="text-sm font-semibold" style={{ color: palette.text }}>{headerProfileName}</div>
              <div className="text-xs text-brand-cyan">{headerProfileCargo}</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-dark-bg2 border border-brand-cyan flex items-center justify-center text-text-main font-bold text-xs shadow-[0_0_10px_rgba(56,189,248,0.2)]">{headerProfileInitials}</div>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-dark-surface border border-dark-border rounded-lg shadow-xl overflow-hidden z-50">
              {canManageOwnUser && (
                <button
                  onClick={() => selectDashboardTab('mis-datos')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-text-main hover:bg-dark-bg3 hover:text-white transition-colors text-left"
                >
                  <svg className="w-4 h-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A8.966 8.966 0 0112 15c2.21 0 4.236.8 5.803 2.127M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  Mis Datos
                </button>
              )}
              <button
                onClick={() => {
                  authService.logout();
                  goToPublicHome();
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
      <main className="flex-1 flex flex-col overflow-hidden bg-dark-bg relative" onClick={() => {
        if (showProfileMenu) setShowProfileMenu(false);
        if (showNotificationsMenu) setShowNotificationsMenu(false);
      }}>
        {/* Sub Header (Actions specific to active tab) */}
        {activeTab !== 'vehiculos' && activeTab !== 'libro-guardia' && !materialDetailRoute && !stockMinimoDetailId && (
          <div className="flex justify-between items-center px-6 py-3 border-b border-dark-border bg-dark-bg2 z-10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-dark-bg flex items-center justify-center text-brand-cyan border border-dark-border shadow-[0_0_10px_rgba(56,189,248,0.1)]">
                {activeTab === 'bodegas' && inventoryView === 'catalogo' ? <Icons.Traceability /> : activeTab === 'epp' ? <Icons.Shield /> : activeTab === 'donaciones' ? <Icons.Finance /> : activeTab === 'reportes' ? <Icons.Report /> : activeTab === 'personal' || activeTab === 'mis-datos' ? <Icons.User /> : <Icons.Inventory />}
              </div>
              <div className="flex flex-col">
                {activeTab === 'bodegas' ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {inventoryViews.map(view => (
                      <button
                        key={view.id}
                        type="button"
                        onClick={() => selectInventoryView(view.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-bold rajdhani tracking-wide transition-colors ${inventoryView === view.id ? 'bg-brand-red/10 text-brand-red border border-brand-red/30' : 'text-text-muted border border-transparent hover:bg-brand-red/10 hover:text-brand-red'}`}
                      >
                        {view.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <h2 className="text-lg font-bold rajdhani tracking-wide leading-tight" style={{ color: palette.text }}>
                    {activeTab === 'mis-datos' ? 'Mis Datos' : activeTab === 'personal' ? (personalView === 'importar' ? 'Importar personal' : 'Personal del Cuartel') : activeTab === 'reportes' ? 'Reportes' : activeTab === 'donaciones' ? 'Donaciones y Campañas' : activeTab === 'catalogo' ? 'Catálogo de Materiales' : activeTab === 'epp' ? 'Equipos de Protección Personal (EPP)' : activeTab === 'inicio' ? 'Panel de Control' : 'Dashboard'}
                  </h2>
                )}
                {activeTab === 'inicio' && <span className="text-xs text-text-muted mt-0.5">Visión general del estado del cuartel y recursos</span>}
                {activeTab === 'epp' && <span className="text-xs text-text-muted mt-0.5">Controla la asignación y estado del equipamiento de los voluntarios</span>}
                {activeTab === 'donaciones' && <span className="text-xs text-text-muted mt-0.5">Gestiona campañas de recaudación y enlaces de pago</span>}
                {activeTab === 'personal' && <span className="text-xs text-text-muted mt-0.5">Gestiona bomberos, cargos y datos de contacto</span>}
                {activeTab === 'mis-datos' && <span className="text-xs text-text-muted mt-0.5">Información del bombero asociado a tu sesión</span>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {activeTab === 'bodegas' && inventoryView === 'ubicaciones' && canManageLocations && (
                <button onClick={openAddUbicacionModal} className="px-3.5 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors shadow-[0_4px_15px_rgba(232,55,42,0.3)]">Agregar ubicación</button>
              )}
              {activeTab === 'bodegas' && inventoryView === 'catalogo' && canCreateMaterial && (
                <>
                  <button onClick={openCatalogImportView} className="px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Importar catálogo
                  </button>
                  <button onClick={() => {
                    resetNewMaterialData();
                    setShowAddMaterialModal(true);
                  }} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
                    <span>+</span> Agregar material
                  </button>
                </>
              )}
              {activeTab === 'epp' && !showingEppDetail && canManageEpp && (
                <button onClick={() => setShowAssignEppModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                  Asignar EPP
                </button>
              )}
              {activeTab === 'donaciones' && donacionesView === 'campanas' && selectedCampanaDetalle && canCreateDonationLink && (
                <button
                  type="button"
                  onClick={() => generateAndCopyDonationLink(selectedCampanaDetalle)}
                  disabled={generatingDonationLinkId === selectedCampanaDetalle.id}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 010 5.656l-1.414 1.414a4 4 0 01-5.656-5.656l1.414-1.414m7.656 3.656l1.414-1.414a4 4 0 00-5.656-5.656l-1.414 1.414"></path></svg>
                  {generatingDonationLinkId === selectedCampanaDetalle.id ? 'Generando...' : copiedDonationSlug === (selectedCampanaDetalle.slug || String(selectedCampanaDetalle.id)) ? 'Link copiado' : 'Generar link'}
                </button>
              )}
              {activeTab === 'donaciones' && donacionesView === 'campanas' && !selectedCampanaDetalle && canManageDonaciones && (
                <button onClick={openCreateCampanaModal} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(59,130,246,0.4)]">
                  <span className="text-base leading-none">+</span>
                  Crear campaña
                </button>
              )}
              {activeTab === 'personal' && personalView === 'listado' && (
                <>
                  {canManageUsers && (
                    <button type="button" onClick={openPersonalImportView} className="px-4 py-2 text-sm font-medium text-text-main bg-dark-bg3 border border-dark-border rounded-lg hover:bg-dark-bg2 transition-colors flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                      Importar personal
                    </button>
                  )}
                  {canManageUsers && (
                    <button type="button" onClick={() => setShowAddBomberoModal(true)} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-red to-brand-ember rounded-lg hover:opacity-90 transition-colors flex items-center gap-2 shadow-[0_4px_15px_rgba(232,55,42,0.3)]">
                      <span className="text-base leading-none">+</span>
                      Agregar bombero
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {materialDetailRoute && (
            materialDetailRoute.type === 'epp-item' ? (
              (canViewEpp || canViewOwnEpp) ? (
                <EppDetailView
                  itemId={materialDetailRoute.id}
                  onBack={closeMaterialDetail}
                  canEdit={canEditMaterial || canManageEpp}
                  canDeactivate={canDeactivateMaterial}
                  canManageImages={canEditMaterial || canManageEpp}
                  canManageObservations={canManageObservations}
                  canManageMaintenances={canManageMaintenances}
                />
              ) : null
            ) : (
              canViewInventory ? (
                <MaterialDetailView
                  route={materialDetailRoute}
                  onBack={closeMaterialDetail}
                  onRemoved={refreshActiveUbicacion}
                  canDeactivate={canDeactivateMaterial}
                  canManageImages={canEditMaterial}
                  canManageObservations={canManageObservations}
                  canManageMaintenances={canManageMaintenances}
                  canRegisterDamageLoss={canRegisterDamageLoss}
                  canChangeState={canChangeMaterialState}
                />
              ) : null
            )
          )}

          {!materialDetailRoute && stockMinimoDetailId && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={closeStockMinimoDetail}
                    className="mt-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan"
                    style={{ borderColor: palette.border, background: palette.card, color: palette.text }}
                  >
                    Volver
                  </button>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Stock mínimo</p>
                    <h3 className="rajdhani mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-bold" style={{ color: palette.text }}>
                      <span>{stockMinimoDetail?.nombre || 'Detalle de stock'}</span>
                      <span className="rounded border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-1 text-sm font-semibold text-brand-cyan">
                        {stockMinimoDetail?.nombreUbicacion || 'Cargando ubicación...'}
                      </span>
                    </h3>
                  </div>
                </div>
                {canAddStock && (
                  <button
                    type="button"
                    onClick={openEditStockMinimoModal}
                    disabled={loadingStockMinimoDetail || Boolean(stockMinimoDetailError) || !stockMinimoDetail}
                    className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.25)] transition-opacity hover:opacity-90"
                  >
                    Agregar material
                  </button>
                )}
              </div>

              {loadingStockMinimoDetail ? (
                <div className="rounded-xl border p-8 text-center" style={{ borderColor: palette.border, background: palette.card }}>
                  <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-brand-cyan/20 border-t-brand-cyan"></div>
                  <p className="text-sm" style={{ color: palette.muted }}>Cargando detalle del stock mínimo...</p>
                </div>
              ) : stockMinimoDetailError ? (
                <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-6 text-center">
                  <p className="font-semibold text-brand-red">{stockMinimoDetailError}</p>
                  <button
                    type="button"
                    onClick={() => fetchStockMinimoDetail(stockMinimoDetailId)}
                    className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20"
                  >
                    Reintentar
                  </button>
                </div>
              ) : (
                <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="rounded-xl border p-5" style={{ borderColor: palette.border, background: palette.card }}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h4 className="rajdhani text-lg font-bold" style={{ color: palette.text }}>Materiales requeridos</h4>
                      <span className="rounded border border-brand-cyan/20 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan">
                        {stockMinimoDetail?.materiales?.length || 0} materiales
                      </span>
                    </div>

                    {stockMinimoInventoryError && (
                      <p className="mb-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                        {stockMinimoInventoryError}
                      </p>
                    )}

                    {stockMinimoDetail?.materiales?.length > 0 ? (
                      <div className="overflow-x-auto overflow-y-hidden rounded-lg border" style={{ borderColor: palette.border }}>
                        <table className="w-full text-left text-sm">
                          <thead style={{ background: palette.bg2, color: palette.muted }}>
                            <tr>
                              <th className="px-4 py-3 font-semibold">Material</th>
                              <th className="px-4 py-3 text-center font-semibold">Stock mínimo</th>
                              <th className="px-4 py-3 text-center font-semibold">Inventario actual</th>
                              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {stockMinimoDetail.materiales.map((material, index) => {
                              const currentQuantity = getStockMinimoCurrentQuantity(material.idMaterial);
                              return (
                                <tr
                                  key={`${material.id}-${material.idMaterial}`}
                                  className={index > 0 ? 'border-t' : ''}
                                  style={{ borderColor: palette.border, background: index % 2 === 0 ? palette.bg : palette.cardSoft }}
                                >
                                  <td className="px-4 py-3">
                                    <p className="truncate font-semibold" style={{ color: palette.text }}>{material.nombreMaterial}</p>
                                    {material.idMaterial && (
                                      <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>ID material {material.idMaterial}</p>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="inline-flex min-w-14 justify-center rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1.5 font-mono font-bold text-brand-cyan">
                                      x{material.cantidad}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-center">
                                    <span
                                      className={`inline-flex min-w-14 justify-center rounded-lg border px-3 py-1.5 font-mono font-bold ${!loadingStockMinimoInventory && currentQuantity < material.cantidad ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-dark-border bg-dark-bg3 text-white'}`}
                                    >
                                      {loadingStockMinimoInventory ? '...' : `x${currentQuantity}`}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-1.5 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red/20"
                                    >
                                      Eliminar
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dashed px-4 py-10 text-center" style={{ borderColor: palette.border }}>
                        <p className="text-sm" style={{ color: palette.muted }}>Este stock mínimo no tiene materiales asociados.</p>
                      </div>
                    )}
                  </div>

                  <aside className="rounded-xl border p-5" style={{ borderColor: palette.border, background: palette.card }}>
                    <h4 className="rajdhani text-lg font-bold" style={{ color: palette.text }}>Resumen</h4>
                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span style={{ color: palette.muted }}>ID stock</span>
                        <span className="font-semibold" style={{ color: palette.text }}>{stockMinimoDetail?.id || stockMinimoDetailId}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span style={{ color: palette.muted }}>Ubicación</span>
                        <span className="text-right font-semibold" style={{ color: palette.text }}>{stockMinimoDetail?.nombreUbicacion || '-'}</span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span style={{ color: palette.muted }}>ID ubicación</span>
                        <span className="font-semibold" style={{ color: palette.text }}>{stockMinimoDetail?.idUbicacion || '-'}</span>
                      </div>
                    </div>
                  </aside>
                </div>
              )}
            </div>
          )}

          {activeTab === 'inicio' && (
            <div className="h-full p-4 sm:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
              <InicioView
                onNavigate={selectDashboardTab}
                canViewBomberos={canViewBomberos}
                canViewVehiculos={can(PERMISSIONS.VER_VEHICULOS)}
                canViewEpp={canViewEpp}
                canViewInventory={canViewInventory}
                canViewDonaciones={canViewDonaciones}
              />
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'bodegas' && inventoryView === 'ubicaciones' && (
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
                  canAddMaterial={canAddStock}
                  canMoveMaterial={canMoveMaterial}
                  addMaterialDisabledReason={addMaterialDisabledReason}
                  onSelectMaterial={openMaterialDetail}
                  onMoveMaterial={canMoveMaterial ? (material) => setMovingMaterial(material) : undefined}
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
                  padding: '24px',
                  borderLeft: `1px solid ${palette.border}`,
                  boxSizing: 'border-box'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '18px' }}>
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
                    <h3 style={{ color: palette.text, fontSize: '21px', fontWeight: 700, margin: 0 }}>
                      {currentUbicacion ? currentUbicacion.name : 'Ubicaciones principales'}
                    </h3>
                    <p style={{ color: palette.muted, fontSize: '13px', margin: '6px 0 0' }}>
                      {currentUbicacion ? 'Selecciona General para ver la ubicación actual o abre una sububicación.' : 'Selecciona una ubicación principal para cargar sus materiales y sububicaciones.'}
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
                    {!currentUbicacion && (
                      <button
                        onClick={selectGeneralInventario}
                        className="transition-all duration-200 hover:border-brand-cyan/60! hover:bg-brand-cyan/10! hover:shadow-[0_0_22px_rgba(56,189,248,0.18)] focus-visible:border-brand-cyan/60! focus-visible:bg-brand-cyan/10! focus-visible:shadow-[0_0_22px_rgba(56,189,248,0.18)] focus-visible:outline-none"
                        style={{
                          minHeight: '122px',
                          borderRadius: '10px',
                          border: isGeneralInventario ? `1px solid ${palette.cyan}` : `1px solid ${palette.borderStrong}`,
                          background: isGeneralInventario ? palette.cyanSoft : palette.card,
                          color: palette.text,
                          cursor: 'pointer',
                          padding: '16px',
                          textAlign: 'center',
                          fontWeight: 700
                        }}
                      >
                        <div style={{ marginBottom: '8px', color: palette.cyan }}>General</div>
                        Todos los materiales
                      </button>
                    )}
                    {currentUbicacion && subUbicaciones.length > 0 && (
                      <button
                        onClick={selectGeneralUbicacion}
                        className="transition-all duration-200 hover:border-brand-cyan/60! hover:bg-brand-cyan/10! hover:shadow-[0_0_22px_rgba(56,189,248,0.18)] focus-visible:border-brand-cyan/60! focus-visible:bg-brand-cyan/10! focus-visible:shadow-[0_0_22px_rgba(56,189,248,0.18)] focus-visible:outline-none"
                        style={{
                          minHeight: '122px',
                          borderRadius: '10px',
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
                        className="transition-all duration-200 hover:border-brand-cyan/60! hover:bg-brand-cyan/10! hover:shadow-[0_0_22px_rgba(56,189,248,0.18)] focus-visible:border-brand-cyan/60! focus-visible:bg-brand-cyan/10! focus-visible:shadow-[0_0_22px_rgba(56,189,248,0.18)] focus-visible:outline-none"
                        style={{
                          minHeight: '122px',
                          borderRadius: '10px',
                          border: activeUbicacion === ubi.id ? `1px solid ${palette.cyan}` : `1px solid ${palette.borderStrong}`,
                          background: activeUbicacion === ubi.id ? palette.cyanSoft : palette.card,
                          color: palette.text,
                          cursor: 'pointer',
                          padding: '16px',
                          textAlign: 'center',
                          fontWeight: 700
                        }}
                      >
                        <div style={{ marginBottom: '8px', color: palette.cyan }}>▣</div>
                        {ubi.name}
                      </button>
                    )) : (
                      <div style={{ gridColumn: '1 / -1', border: `1px dashed ${palette.borderStrong}`, borderRadius: '14px', padding: '56px 24px', textAlign: 'center', color: palette.muted }}>
                        {currentUbicacion ? 'Esta ubicación no tiene sububicaciones.' : 'No se encontraron ubicaciones registradas.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'bodegas' && inventoryView === 'arbol' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Árbol de ubicaciones</h3>
                  <p className="mt-2 text-sm" style={{ color: palette.muted }}>Tipos disponibles para construir ubicaciones principales y sububicaciones.</p>
                </div>
                {canManageLocations && (
                  <button
                    type="button"
                    onClick={openAddTipoUbicacionModal}
                    className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-colors hover:opacity-90"
                  >
                    Agregar tipo de ubicación
                  </button>
                )}
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: palette.border, background: palette.card }}>
                {loadingTiposArbol ? (
                  <p className="text-sm" style={{ color: palette.muted }}>Cargando tipos de ubicación...</p>
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
                  <>
                    {deleteTipoUbicacionError && (
                      <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm font-semibold text-brand-red">
                        {deleteTipoUbicacionError}
                      </div>
                    )}
                    <div className="mb-5">
                      <div className="relative">
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                          type="text"
                          value={tiposArbolSearch}
                          onChange={(event) => {
                            setTiposArbolSearch(event.target.value);
                            setTiposArbolPage(1);
                          }}
                          placeholder="Buscar tipo de ubicación..."
                          className="w-full rounded-lg border py-2 pl-10 pr-4 text-sm outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                          style={{ background: palette.bg3, borderColor: palette.border, color: palette.text }}
                        />
                      </div>
                    </div>
                    {tiposArbolRows.length > 0 ? (
                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {tiposArbolRows.map(tipo => {
                        const isDeletingTipo = String(deletingTipoUbicacionId) === String(tipo.id);

                        return (
                          <div
                            key={tipo.id}
                            className="rounded-xl border p-5"
                            style={{ borderColor: palette.borderStrong, background: palette.bg, color: palette.text }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="rajdhani text-lg font-bold" style={{ color: palette.text }}>{tipo.nombre}</p>
                              </div>
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${tipo.esTipoRaiz ? 'border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan' : 'border-dark-border bg-dark-bg3 text-text-muted'}`}
                              >
                                {tipo.esTipoRaiz ? 'Ubicación principal' : 'Sububicación'}
                              </span>
                            </div>
                            {canManageLocations && (
                              <div className="mt-5 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => openEditTipoRelationsModal(tipo)}
                                  className="rounded-lg border px-3 py-2 text-xs font-semibold transition-colors hover:border-brand-cyan/50 hover:bg-brand-cyan/10 hover:text-brand-cyan"
                                  style={{ borderColor: palette.borderStrong, color: palette.muted }}
                                  title="Editar tipo de ubicación"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeleteTipoUbicacionModal(tipo)}
                                  disabled={isDeletingTipo || Boolean(deletingTipoUbicacionId)}
                                  className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red/20 disabled:cursor-not-allowed disabled:opacity-60"
                                  title="Eliminar tipo de ubicación"
                                >
                                  {isDeletingTipo ? 'Eliminando...' : 'Eliminar'}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed px-6 py-12 text-center" style={{ borderColor: palette.borderStrong }}>
                        <p className="font-semibold" style={{ color: palette.text }}>No hay tipos que coincidan con la busqueda.</p>
                      </div>
                    )}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-sm" style={{ color: palette.muted }}>
                      <div className="flex items-center gap-2">
                        <span>Mostrar</span>
                        <select
                          value={tiposArbolPageSize}
                          onChange={(event) => {
                            setTiposArbolPageSize(Number(event.target.value));
                            setTiposArbolPage(1);
                          }}
                          className="rounded-lg border px-3 py-2 outline-none focus:border-brand-cyan"
                          style={{ borderColor: palette.border, background: palette.bg3, color: palette.text }}
                        >
                          {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
                        </select>
                        <span>por página</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span>{tiposArbolItemCount} registros - Página {safeTiposArbolPage} de {tiposArbolPageCount}</span>
                        <button
                          type="button"
                          onClick={() => setTiposArbolPage(current => Math.max(1, current - 1))}
                          disabled={safeTiposArbolPage <= 1}
                          className="rounded-lg border px-3 py-2 transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ borderColor: palette.border, color: palette.text }}
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => setTiposArbolPage(current => Math.min(tiposArbolPageCount, current + 1))}
                          disabled={safeTiposArbolPage >= tiposArbolPageCount}
                          className="rounded-lg border px-3 py-2 transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-40"
                          style={{ borderColor: palette.border, color: palette.text }}
                        >
                          Siguiente
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-14 text-center" style={{ borderColor: palette.borderStrong }}>
                    <p className="font-semibold" style={{ color: palette.text }}>No hay tipos de ubicación registrados.</p>
                    <p className="mt-2 text-sm" style={{ color: palette.muted }}>Crea el primer tipo para usarlo al agregar ubicaciones.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'bodegas' && inventoryView === 'stocks' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Stocks mínimos</h3>
                  <p className="mt-2 text-sm" style={{ color: palette.muted }}>Control de materiales que requieren reposición según su stock mínimo.</p>
                </div>
                {canAddStock && (
                  <button
                    type="button"
                    onClick={openAddStockMinimoModal}
                    className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-2 text-sm font-medium text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-colors hover:opacity-90"
                  >
                    Agregar stock mínimo
                  </button>
                )}
              </div>

              <div className="rounded-xl border p-5" style={{ borderColor: palette.border, background: palette.card }}>
                {loadingStockMinimos ? (
                  <p className="text-sm" style={{ color: palette.muted }}>Cargando stocks mínimos...</p>
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
                        className="group rounded-xl border p-5 transition-all hover:border-brand-cyan/40 hover:shadow-[0_0_18px_rgba(56,189,248,0.08)]"
                        style={{ borderColor: palette.borderStrong, background: palette.bg, color: palette.text }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="rajdhani text-lg font-bold transition-colors group-hover:text-brand-cyan" style={{ color: palette.text }}>{stock.nombre}</p>
                            <p className="mt-1 text-sm" style={{ color: palette.muted }}>{stock.nombreUbicacion}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => openStockMinimoDetail(stock)}
                            className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2.5 py-1 text-xs font-semibold text-brand-cyan transition-colors hover:border-brand-cyan/50 hover:bg-brand-cyan/20"
                          >
                            Ver detalle
                          </button>
                        </div>
                        {canAddStock && (
                          <div className="mt-5 flex justify-end">
                            <button
                              type="button"
                              onClick={(event) => openDeleteStockMinimoModal(event, stock)}
                              onKeyDown={(event) => event.stopPropagation()}
                              disabled={Boolean(deletingStockMinimoId)}
                              className="flex-shrink-0 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red/20 disabled:cursor-not-allowed disabled:opacity-60"
                              title="Eliminar stock mínimo"
                            >
                              {String(deletingStockMinimoId) === String(stock.id) ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-16 text-center" style={{ borderColor: palette.borderStrong }}>
                    <p className="font-semibold" style={{ color: palette.text }}>No hay stocks mínimos registrados</p>
                    <p className="mt-2 text-sm" style={{ color: palette.muted }}>Cuando se creen configuraciones de stock mínimo, aparecerán aquí.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'bodegas' && inventoryView === 'catalogo' && (
            <div className="h-full overflow-auto p-8 custom-scrollbar">
              <div className="mb-6 flex-shrink-0">
                <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Catálogo de Materiales</h3>
                <p className="mt-2 text-sm" style={{ color: palette.muted }}>Administra los materiales base disponibles para el inventario.</p>
              </div>
              <div className="mb-6 flex flex-shrink-0 gap-4">
                <div className="flex-1 relative">
                  <svg className="w-5 h-5 absolute left-3 top-2.5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Buscar por nombre..." 
                    className="w-full pl-10 pr-4 py-2 bg-dark-bg3 border border-dark-border text-text-main rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all text-sm placeholder-text-muted" 
                    value={filtroNombre}
                    onChange={(e) => {
                      setFiltroNombre(e.target.value);
                      setCatalogPage(1);
                    }}
                  />
                </div>
                <div className="w-64 relative">
                  <select 
                    value={filtroTipo}
                    onChange={(e) => {
                      setFiltroTipo(e.target.value);
                      setCatalogPage(1);
                    }}
                    className="w-full px-4 py-2 bg-dark-bg3 border border-dark-border text-text-main rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none text-sm"
                  >
                    <option value="Todos los tipos">Todos los tipos</option>
                    {Array.from(new Set([...TIPOS_PRODUCTO.map(tipo => tipo.nombre), ...catalogo.map(item => item.tipo)])).map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <svg className="w-4 h-4 absolute right-3 top-3 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>

              <div
                className="custom-scrollbar max-h-[27rem] overflow-auto rounded-xl border border-dark-border bg-dark-surface shadow-lg"
                style={{ scrollbarGutter: 'stable' }}
              >
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-dark-bg2 border-b border-dark-border text-text-muted font-medium rajdhani text-base">
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
                    ) : catalogRows.length > 0 ? (
                      catalogRows.map(item => (
                          <tr key={item.id} className="cursor-pointer transition-all hover:bg-brand-cyan/10 hover:shadow-[inset_3px_0_0_rgba(56,189,248,0.75),0_0_18px_rgba(56,189,248,0.08)]">
                            <td className="px-6 py-3 font-medium text-text-main">{item.nombre}</td>
                            <td className="px-6 py-3"><span className="px-2.5 py-1 bg-brand-cyan/10 border border-brand-cyan/20 text-brand-cyan rounded-full text-xs font-medium">{item.tipo}</span></td>
                            <td className="px-6 py-3 text-text-muted">
                              {item.valor}
                            </td>
                            <td className="px-6 py-3 text-center">
                              {item.desechable ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>}
                            </td>
                            <td className="px-6 py-3 text-center">
                              {item.serializado ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>}
                            </td>
                            <td className="px-6 py-3 text-center">
                              {item.mantencion ? <span className="text-brand-green">✓</span> : <span className="text-text-muted">—</span>}
                            </td>
                            <td className="px-6 py-3 text-right">
                              <div className="flex justify-end gap-2">
                                {canEditMaterial && (
                                  <button
                                    onClick={() => openValueUpdateModal(item)}
                                    className="whitespace-nowrap rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-1.5 text-xs font-semibold text-brand-cyan transition-colors hover:border-brand-cyan/60 hover:bg-brand-cyan/15"
                                  >
                                    Actualizar valor
                                  </button>
                                )}
                                {canDeactivateMaterial && (
                                  <button
                                    onClick={() => setConfirmCatAction({ type: 'delete', id: item.id })}
                                    className="whitespace-nowrap rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-1.5 text-xs font-semibold text-brand-red transition-colors hover:border-brand-red/60 hover:bg-brand-red/15"
                                  >
                                    Borrar
                                  </button>
                                )}
                                {!canEditMaterial && !canDeactivateMaterial && (
                                  <span className="text-xs text-text-muted">Sin acciones</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center justify-center border-2 border-dashed border-dark-border rounded-xl p-8">
                            <Icons.Traceability size={48} className="text-text-muted mb-4 opacity-20" />
                            <p className="text-text-muted rajdhani text-lg">
                              {filtroNombre.trim() || filtroTipo !== 'Todos los tipos'
                                ? 'No hay materiales que coincidan con los filtros.'
                                : 'No hay materiales registrados en el catálogo.'}
                            </p>
                            {canCreateMaterial && (
                              <button onClick={() => setShowAddMaterialModal(true)} className="mt-4 text-brand-cyan hover:underline">Agregar el primer material</button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!loading && catalogItemCount > 0 && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-text-muted">
                  <div className="flex items-center gap-2">
                    <span>Mostrar</span>
                    <select
                      value={catalogPageSize}
                      onChange={(event) => {
                        setCatalogPageSize(Number(event.target.value));
                        setCatalogPage(1);
                      }}
                      className="rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2 text-text-main outline-none focus:border-brand-cyan"
                    >
                      {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
                    </select>
                    <span>por página</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>{catalogItemCount} registros - Página {catalogPage} de {catalogPageCount}</span>
                    <button
                      type="button"
                      onClick={() => setCatalogPage(current => Math.max(1, current - 1))}
                      disabled={catalogPage <= 1}
                      className="rounded-lg border border-dark-border px-3 py-2 text-text-main transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatalogPage(current => Math.min(catalogPageCount, current + 1))}
                      disabled={catalogPage >= catalogPageCount}
                      className="rounded-lg border border-dark-border px-3 py-2 text-text-main transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'bodegas' && inventoryView === 'importar-catalogo' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Catálogo de materiales</p>
                  <h3 className="rajdhani mt-2 text-3xl font-bold" style={{ color: palette.text }}>Importar catálogo</h3>
                  <p className="mt-2 max-w-2xl text-sm" style={{ color: palette.muted }}>
                    Descarga la plantilla, completala respetando sus validaciones y carga el archivo para crear o actualizar materiales masivamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => selectInventoryView('catalogo')}
                  disabled={uploadingCatalogImport || downloadingCatalogTemplate}
                  className="rounded-lg border border-dark-border bg-dark-surface px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Volver al catálogo
                </button>
              </div>

              <div className="grid max-w-6xl gap-5 lg:grid-cols-2">
                <section className="rounded-xl border border-dark-border bg-dark-surface p-6 shadow-lg">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/10 font-bold text-brand-cyan">1</span>
                    <div>
                      <h4 className="rajdhani text-xl font-bold text-text-main">Descarga la plantilla</h4>
                      <p className="text-sm text-text-muted">Archivo Excel listo para rellenar.</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
                    <p className="font-semibold text-text-main">plantilla-importacion-materiales.xlsx</p>
                    <ul className="mt-3 space-y-2 text-sm text-text-muted">
                      <li>Hoja Catálogo con tabla, filtros y encabezado fijo.</li>
                      <li>200 filas disponibles para completar.</li>
                      <li>Desplegables para TipoMaterial y opciones Si / No.</li>
                      <li>Validacion numerica para ValorUnitario y hoja Opciones.</li>
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadCatalogTemplate}
                    disabled={downloadingCatalogTemplate || uploadingCatalogImport}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm font-bold text-brand-cyan transition-colors hover:bg-brand-cyan/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    {downloadingCatalogTemplate ? 'Descargando...' : 'Descargar plantilla'}
                  </button>
                </section>

                <form onSubmit={handleCatalogImport} className="rounded-xl border border-dark-border bg-dark-surface p-6 shadow-lg">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-red/30 bg-brand-red/10 font-bold text-brand-red">2</span>
                    <div>
                      <h4 className="rajdhani text-xl font-bold text-text-main">Importa el archivo</h4>
                      <p className="text-sm text-text-muted">Carga tu plantilla completada.</p>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">Modo de importacion</span>
                    <select
                      value={catalogImportMode}
                      onChange={(event) => {
                        setCatalogImportMode(event.target.value);
                        resetCatalogImportFeedback();
                      }}
                      disabled={uploadingCatalogImport}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-text-main outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                    >
                      <option value="Crear">Crear</option>
                      <option value="Actualizar">Actualizar</option>
                      <option value="CrearOActualizar">Crear o actualizar</option>
                    </select>
                  </label>

                  <label className="mt-5 block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">Archivo Excel</span>
                    <span className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-5 text-center transition-colors hover:border-brand-cyan/50">
                      <svg className="mb-2 h-6 w-6 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5.002 5.002 0 0115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <span className="text-sm font-semibold text-text-main">
                        {catalogImportFile?.name || 'Seleccionar plantilla completada'}
                      </span>
                      <span className="mt-1 text-xs text-text-muted">Formato permitido: .xlsx</span>
                      <input
                        key={catalogImportInputKey}
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handleCatalogImportFileChange}
                        disabled={uploadingCatalogImport}
                        className="sr-only"
                      />
                    </span>
                  </label>

                  {(catalogImportError || catalogImportSuccess) && (
                    <p className={`mt-5 rounded-lg border px-4 py-3 text-sm ${catalogImportError ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-brand-green/30 bg-brand-green/10 text-brand-green'}`}>
                      {catalogImportError || catalogImportSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!catalogImportFile || uploadingCatalogImport || downloadingCatalogTemplate}
                    className="mt-5 w-full rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingCatalogImport ? 'Importando...' : 'Importar catálogo'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'donaciones' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => selectDonacionesView('campanas')}
                  className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${donacionesView === 'campanas' ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-dark-border bg-dark-surface text-text-muted hover:bg-brand-red/10 hover:text-brand-red'}`}
                >
                  Campañas
                </button>
                {(canViewPaymentConfig || canManagePaymentConfig) && (
                  <button
                    type="button"
                    onClick={() => selectDonacionesView('configuracion')}
                    className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${donacionesView === 'configuracion' ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-dark-border bg-dark-surface text-text-muted hover:bg-brand-red/10 hover:text-brand-red'}`}
                  >
                    Configuración de pago
                  </button>
                )}
              </div>

              {donacionesView === 'campanas' && selectedCampanaDetalle ? (
                <div>
                  <button
                    type="button"
                    onClick={closeCampanaDetalle}
                    className="mb-6 inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:border-brand-cyan/50 hover:text-white"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Volver a campañas
                  </button>

                  <div className="mb-8 rounded-xl border border-dark-border bg-dark-surface p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <span className={`mb-3 inline-flex rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${selectedCampanaDetalle.estado === 'Activa' ? 'border-brand-green/20 bg-brand-green/10 text-brand-green' : 'border-dark-border bg-dark-bg3 text-text-muted'}`}>
                          {selectedCampanaDetalle.estado}
                        </span>
                        <h3 className="rajdhani text-3xl font-bold text-white">{selectedCampanaDetalle.nombre}</h3>
                        <p className="mt-2 max-w-3xl text-sm text-text-muted">{selectedCampanaDetalle.descripcion}</p>
                      </div>
                      <div className="min-w-52 rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-right">
                        <p className="text-xs text-text-muted">Recaudado</p>
                        <p className="mt-1 text-2xl font-bold text-white">{formatCurrency(selectedCampanaDetalle.montoRecaudado)}</p>
                        <p className="mt-1 text-xs text-text-muted">Meta {formatCurrency(selectedCampanaDetalle.metaMonto)}</p>
                      </div>
                    </div>
                  </div>

                  <section>
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="rajdhani text-2xl font-bold text-white">Donaciones</h4>
                        <p className="mt-1 text-sm text-text-muted">Donaciones pagadas asociadas a esta campaña.</p>
                      </div>
                    </div>

                    {donationLinkError && (
                      <div className="mb-4 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                        {donationLinkError}
                      </div>
                    )}

                    <div className="mb-4 grid gap-3 md:grid-cols-2">
                      <div className="relative">
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input
                          type="text"
                          value={filtroNombreDonante}
                          onChange={(event) => setFiltroNombreDonante(event.target.value)}
                          placeholder="Buscar por nombre donante..."
                          className="w-full rounded-lg border border-dark-border bg-dark-bg3 py-2 pl-10 pr-4 text-sm text-text-main outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                        />
                      </div>
                      <div className="relative">
                        <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        <input
                          type="text"
                          value={filtroNombreBomberoDonacion}
                          onChange={(event) => setFiltroNombreBomberoDonacion(event.target.value)}
                          placeholder="Buscar por nombre bombero..."
                          className="w-full rounded-lg border border-dark-border bg-dark-bg3 py-2 pl-10 pr-4 text-sm text-text-main outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                        />
                      </div>
                    </div>

                    <div
                      className="custom-scrollbar max-h-[34rem] overflow-auto rounded-xl border border-dark-border bg-dark-surface shadow-lg"
                      style={{ scrollbarGutter: 'stable' }}
                    >
                      <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 z-10 bg-dark-bg2 border-b border-dark-border text-text-muted rajdhani text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-4 font-semibold">Telefono</th>
                            <th className="px-5 py-4 font-semibold">Donante</th>
                            <th className="px-5 py-4 font-semibold">Email</th>
                            <th className="px-5 py-4 font-semibold">Monto</th>
                            <th className="px-5 py-4 font-semibold">Bombero</th>
                            <th className="px-5 py-4 font-semibold">Estado</th>
                            <th className="px-5 py-4 font-semibold">Fecha</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-dark-border">
                          {loadingDonacionesCampana ? (
                            <tr>
                              <td colSpan="7" className="px-5 py-16 text-center text-text-muted">Cargando donaciones...</td>
                            </tr>
                          ) : donacionesCampanaError ? (
                            <tr>
                              <td colSpan="7" className="px-5 py-16 text-center">
                                <p className="font-semibold text-brand-red">{donacionesCampanaError}</p>
                                <button onClick={() => fetchDonacionesCampana(selectedCampanaDetalle)} className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20">
                                  Reintentar
                                </button>
                              </td>
                            </tr>
                          ) : donacionesRows.length > 0 ? donacionesRows.map(donacion => (
                            <tr key={donacion.idDonacion || `${donacion.emailDonante}-${donacion.fechaPago || donacion.fechaCreacion}`} className="hover:bg-dark-bg3 transition-colors">
                              <td className="px-5 py-3 text-text-muted">{donacion.telefonoDonante || donacion.telefono || '-'}</td>
                              <td className="px-5 py-3 font-semibold text-white">{donacion.nombreDonante}</td>
                              <td className="px-5 py-3 text-text-muted">{donacion.emailDonante}</td>
                              <td className="px-5 py-3 font-bold text-white">{formatCurrency(donacion.monto)}</td>
                              <td className="px-5 py-3 text-brand-cyan">{donacion.nombreBombero || donacion.nombreUsuarioCreador || donacion.nombreUsuario || '-'}</td>
                              <td className="px-5 py-3">
                                <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${donacion.estadoPago === 'Pagada' ? 'border-brand-green/20 bg-brand-green/10 text-brand-green' : 'border-yellow-500/20 bg-yellow-500/10 text-yellow-300'}`}>
                                  {donacion.estadoPago}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-text-muted">{formatDateChile(donacion.fechaPago || donacion.fechaCreacion)}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan="7" className="px-5 py-16 text-center text-text-muted">
                                {donacionesCampana.length > 0 ? 'No hay donaciones que coincidan con los filtros.' : 'No hay donaciones pagadas para esta campaña.'}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {!loadingDonacionesCampana && !donacionesCampanaError && donacionesItemCount > 0 && (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm text-text-muted">
                        <div className="flex items-center gap-2">
                          <span>Mostrar</span>
                          <select
                            value={donacionesPageSize}
                            onChange={(event) => {
                              setDonacionesPageSize(Number(event.target.value));
                              setDonacionesPage(1);
                            }}
                            className="rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2 text-text-main outline-none focus:border-brand-cyan"
                          >
                            {DONATION_PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
                          </select>
                          <span>por página</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-text-main">
                            {donacionesItemCount} registros - Página {safeDonacionesPage} de {donacionesPageCount}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setDonacionesPage(page => Math.max(1, page - 1))}
                              disabled={safeDonacionesPage <= 1}
                              className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-text-main transition-colors hover:border-brand-cyan/50 disabled:opacity-50"
                            >
                              Anterior
                            </button>
                            <button
                              type="button"
                              onClick={() => setDonacionesPage(page => Math.min(donacionesPageCount, page + 1))}
                              disabled={safeDonacionesPage >= donacionesPageCount}
                              className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-text-main transition-colors hover:border-brand-cyan/50 disabled:opacity-50"
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </section>
                </div>
              ) : donacionesView === 'configuracion' && (canViewPaymentConfig || canManagePaymentConfig) ? (
                <form onSubmit={handleSavePaymentConfig} className="max-w-5xl rounded-xl border border-dark-border bg-dark-surface shadow-lg">
                  <div className="border-b border-dark-border px-6 py-5">
                    <h3 className="rajdhani text-2xl font-bold text-text-main">Configuración de pago</h3>
                    <p className="mt-1 text-sm text-text-muted">Credenciales y URLs usadas para crear pagos Flow.</p>
                  </div>

                  <div className="grid gap-5 p-6 md:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">API Key Flow</span>
                      <input
                        type="text"
                        value={paymentConfigData.apiKey}
                        onChange={(event) => handlePaymentConfigChange('apiKey', event.target.value)}
                        disabled={!canManagePaymentConfig || savingPaymentConfig}
                        className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-text-main outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                        placeholder="TU_API_KEY_FLOW"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">Secret Key Flow</span>
                      <input
                        type="password"
                        value={paymentConfigData.secretKey}
                        onChange={(event) => handlePaymentConfigChange('secretKey', event.target.value)}
                        disabled={!canManagePaymentConfig || savingPaymentConfig}
                        className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-text-main outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                        placeholder="TU_SECRET_KEY_FLOW"
                      />
                    </label>
                  </div>

                  {(paymentConfigError || paymentConfigSuccess) && (
                    <div className={`mx-6 mb-5 rounded-lg border px-4 py-3 text-sm ${paymentConfigError ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-brand-green/30 bg-brand-green/10 text-brand-green'}`}>
                      {paymentConfigError || paymentConfigSuccess}
                    </div>
                  )}

                  {canManagePaymentConfig && (
                    <div className="flex flex-wrap items-center justify-end gap-3 border-t border-dark-border px-6 py-4">
                      <button
                        type="button"
                        onClick={resetPaymentConfigData}
                        disabled={savingPaymentConfig}
                        className="rounded-lg border border-dark-border bg-dark-bg px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Restaurar valores
                      </button>
                      <button
                        type="submit"
                        disabled={savingPaymentConfig}
                        className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow-[0_4px_15px_rgba(59,130,246,0.35)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {savingPaymentConfig ? 'Guardando...' : 'Guardar configuración'}
                      </button>
                    </div>
                  )}
                </form>
              ) : (
                <>
              <div className="mb-8">
                <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Donaciones y Campañas</h3>
                <p className="mt-2 text-sm" style={{ color: palette.muted }}>Gestiona campañas de recaudación de fondos y genera enlaces de pago.</p>
              </div>

              {loadingCampanas ? (
                <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-16 text-center text-text-muted">
                  Cargando campañas de donaciones...
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

              <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCampanasListView('activas')}
                    className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${campanasListView === 'activas' ? 'border-brand-green/30 bg-brand-green/10 text-brand-green' : 'border-dark-border bg-dark-surface text-text-muted hover:border-brand-green/40 hover:text-white'}`}
                  >
                    Campañas activas
                  </button>
                  <button
                    type="button"
                    onClick={() => setCampanasListView('finalizadas')}
                    className={`rounded-lg border px-4 py-2 text-sm font-bold transition-colors ${campanasListView === 'finalizadas' ? 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan' : 'border-dark-border bg-dark-surface text-text-muted hover:border-brand-cyan/40 hover:text-white'}`}
                  >
                    Campañas finalizadas
                  </button>
                </div>
                <p className="text-sm font-semibold text-text-muted">{filteredCampanas.length} de {currentCampanas.length} campañas</p>
              </div>

              <div className="mb-6 grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_12rem]">
                <div className="relative">
                  <svg className="absolute left-3 top-2.5 h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input
                    type="text"
                    value={filtroNombreCampana}
                    onChange={(event) => setFiltroNombreCampana(event.target.value)}
                    placeholder="Buscar por nombre..."
                    className="w-full rounded-lg border border-dark-border bg-dark-bg3 py-2 pl-10 pr-4 text-sm text-text-main outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  />
                </div>
                <input
                  type="date"
                  value={filtroFechaInicioCampana}
                  onChange={(event) => setFiltroFechaInicioCampana(event.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2 text-sm text-text-main outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  aria-label="Filtrar desde"
                />
                <input
                  type="date"
                  value={filtroFechaFinCampana}
                  onChange={(event) => setFiltroFechaFinCampana(event.target.value)}
                  className="w-full rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2 text-sm text-text-main outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan"
                  aria-label="Filtrar hasta"
                />
              </div>

              {campanasListView === 'activas' && (
                <>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-green"></span>
                <h4 className="text-sm font-bold text-white">{currentCampanasTitle}</h4>
              </div>
              <div className="mb-8 grid gap-5 lg:grid-cols-3">
                {filteredCampanas.length > 0 ? filteredCampanas.map(campaign => (
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
                      <button onClick={() => openCampanaDetalle(campaign)} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs font-semibold text-text-main transition-colors hover:border-brand-cyan/50">Ver detalles</button>
                      {canCreateDonationLink && (
                        <button
                          type="button"
                          onClick={() => generateAndCopyDonationLink(campaign)}
                          disabled={generatingDonationLinkId === campaign.id}
                          className="rounded-lg bg-blue-600/20 px-3 py-2 text-xs font-semibold text-text-main transition-colors hover:bg-blue-600/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {generatingDonationLinkId === campaign.id ? 'Generando...' : copiedDonationSlug === (campaign.slug || String(campaign.id)) ? 'Link copiado' : 'Generar link'}
                        </button>
                      )}
                    </div>
                  </article>
                )) : (
                  <div className="rounded-xl border border-dashed border-dark-border bg-dark-surface px-6 py-14 text-center text-text-muted lg:col-span-3">
                    {currentCampanas.length > 0 ? 'No hay campañas que coincidan con los filtros.' : currentCampanasEmptyMessage}
                  </div>
                )}
              </div>
                </>
              )}

              {campanasListView === 'finalizadas' && (
                <>
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-text-muted"></span>
                <h4 className="text-sm font-bold text-white">{currentCampanasTitle}</h4>
              </div>
              <div className="grid gap-5 lg:grid-cols-3">
                {filteredCampanas.length > 0 ? filteredCampanas.map(campaign => (
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
                    <button onClick={() => openCampanaDetalle(campaign)} className="mt-4 rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs font-semibold text-text-main transition-colors hover:border-brand-cyan/50">
                      Ver detalles
                    </button>
                  </div>
                </article>
                )) : (
                  <div className="rounded-xl border border-dashed border-dark-border bg-dark-surface px-6 py-14 text-center text-text-muted lg:col-span-3">
                    {currentCampanas.length > 0 ? 'No hay campañas que coincidan con los filtros.' : currentCampanasEmptyMessage}
                  </div>
                )}
              </div>
                </>
              )}
                </>
              )}
                </>
              )}
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'libro-guardia' && (
            <div className="h-full overflow-auto" style={{ background: palette.bg, color: palette.text }}>
              <div className="border-b px-8 py-5" style={{ borderColor: palette.border, background: palette.bg2 }}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan [&>svg]:h-5 [&>svg]:w-5">
                      <Icons.Shield />
                    </div>
                    <div>
                      <h2 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Libros de Guardia</h2>
                      <p className="mt-1 text-sm" style={{ color: palette.muted }}>Gestiona los registros de novedades y servicio de guardia</p>
                    </div>
                  </div>
                  {((selectedLibroGuardia && canRegisterLibroGuardia) || (!selectedLibroGuardia && canCreateLibroGuardia)) && (
                    <button
                      type="button"
                      onClick={selectedLibroGuardia ? openCreateRegistroModal : openCreateLibroGuardiaModal}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_15px_rgba(232,55,42,0.25)] transition-opacity hover:opacity-90"
                    >
                      <span className="text-base leading-none">+</span>
                      {selectedLibroGuardia ? 'Agregar registro' : 'Crear libro'}
                    </button>
                  )}
                </div>
              </div>

              <div className="px-8 py-7">
                {selectedLibroGuardia ? (
                  <section className="min-h-[calc(100vh-235px)] rounded-2xl border p-6 shadow-lg" style={{ borderColor: palette.border, background: palette.card }}>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={closeRegistrosLibroGuardia}
                          className="rounded-lg border border-dark-border bg-dark-surface px-3 py-2 text-sm font-semibold text-text-main transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan"
                        >
                          Volver
                        </button>
                        <div>
                          <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>{selectedLibroGuardia.nombre}</h3>
                          <p className="mt-1 text-sm" style={{ color: palette.muted }}>Registros de novedades del libro</p>
                        </div>
                      </div>
                      <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-xs font-semibold text-brand-cyan">
                        {registrosItemCount} registros
                      </span>
                    </div>
                    {loadingRegistrosLibroGuardia ? (
                      <div className="rounded-xl border px-6 py-16 text-center text-sm" style={{ borderColor: palette.border, background: palette.card, color: palette.muted }}>
                        Cargando registros...
                      </div>
                    ) : registrosLibroGuardiaError ? (
                      <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-8 text-center">
                        <p className="text-sm font-semibold text-brand-red">{registrosLibroGuardiaError}</p>
                        <button type="button" onClick={() => fetchRegistrosLibroGuardia(selectedLibroGuardia)} className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white">
                          Reintentar
                        </button>
                      </div>
                    ) : registrosRows.length > 0 ? (
                      <>
                        <div className="overflow-x-auto rounded-xl border shadow-lg" style={{ borderColor: palette.border, background: palette.card }}>
                          <table className="w-full text-left text-sm">
                            <thead style={{ background: palette.bg2, color: palette.muted }}>
                              <tr>
                                <th className="px-5 py-4 font-semibold">Fecha</th>
                                <th className="px-5 py-4 font-semibold">Hora</th>
                                <th className="px-5 py-4 font-semibold">Detalle</th>
                                <th className="px-5 py-4 font-semibold">Usuario</th>
                              </tr>
                            </thead>
                            <tbody>
                              {registrosRows.map(registro => (
                                <tr key={registro.id || `${registro.fecha}-${registro.hora}-${registro.detalle}`} className="border-t border-dark-border">
                                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-brand-cyan">{formatDateChile(registro.fecha)}</td>
                                  <td className="whitespace-nowrap px-5 py-4" style={{ color: palette.muted }}>{registro.hora || '-'}</td>
                                  <td className="px-5 py-4" style={{ color: palette.text }}>{registro.detalle || 'Sin detalle'}</td>
                                  <td className="px-5 py-4" style={{ color: palette.muted }}>{registro.emailUsuario || '-'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm" style={{ color: palette.muted }}>
                          <div className="flex items-center gap-2">
                            <span>Mostrar</span>
                            <select
                              value={registrosPageSize}
                              onChange={(event) => {
                                setRegistrosPageSize(Number(event.target.value));
                                setRegistrosPage(1);
                              }}
                              className="rounded-lg border px-3 py-2 outline-none focus:border-brand-cyan"
                              style={{ borderColor: palette.border, background: palette.bg3, color: palette.text }}
                            >
                              {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size}</option>)}
                            </select>
                            <span>por página</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span>{registrosItemCount} registros - Página {registrosPage} de {registrosPageCount}</span>
                            <button
                              type="button"
                              onClick={() => setRegistrosPage(current => Math.max(1, current - 1))}
                              disabled={registrosPage <= 1}
                              className="rounded-lg border px-3 py-2 transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-40"
                              style={{ borderColor: palette.border, color: palette.text }}
                            >
                              Anterior
                            </button>
                            <button
                              type="button"
                              onClick={() => setRegistrosPage(current => Math.min(registrosPageCount, current + 1))}
                              disabled={registrosPage >= registrosPageCount}
                              className="rounded-lg border px-3 py-2 transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-40"
                              style={{ borderColor: palette.border, color: palette.text }}
                            >
                              Siguiente
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rounded-xl border border-dashed px-6 py-16 text-center" style={{ borderColor: palette.border, background: palette.card }}>
                        <p className="text-sm font-semibold" style={{ color: palette.text }}>Este libro aún no tiene registros.</p>
                        {canRegisterLibroGuardia && (
                          <button type="button" onClick={openCreateRegistroModal} className="mt-4 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-dark-bg">
                            Agregar primer registro
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                ) : loadingLibrosGuardia ? (
                  <div className="rounded-xl border px-6 py-16 text-center text-sm" style={{ borderColor: palette.border, background: palette.card, color: palette.muted }}>
                    Cargando libros de guardia...
                  </div>
                ) : librosGuardiaError ? (
                  <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-8 text-center">
                    <p className="text-sm font-semibold text-brand-red">{librosGuardiaError}</p>
                    <button
                      type="button"
                      onClick={fetchLibrosGuardia}
                      className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : librosGuardia.length > 0 ? (
                  <section className="min-h-[calc(100vh-235px)] rounded-2xl border p-6 shadow-lg" style={{ borderColor: palette.border, background: palette.card }}>
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b pb-5" style={{ borderColor: palette.border }}>
                      <div>
                        <h3 className="rajdhani text-xl font-bold" style={{ color: palette.text }}>Libros disponibles</h3>
                        <p className="mt-1 text-sm" style={{ color: palette.muted }}>Consulta las novedades registradas o agrega un nuevo evento de guardia.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: palette.border, background: palette.bg }}>
                          <p className="text-xs" style={{ color: palette.muted }}>Libros</p>
                          <p className="mt-1 text-xl font-bold" style={{ color: palette.text }}>{librosGuardia.length}</p>
                        </div>
                        <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-2 text-center">
                          <p className="text-xs text-brand-cyan">Abiertos</p>
                          <p className="mt-1 text-xl font-bold text-brand-cyan">{librosGuardiaAbiertos.length}</p>
                        </div>
                        <div className="rounded-lg border px-4 py-2 text-center" style={{ borderColor: palette.border, background: palette.bg }}>
                          <p className="text-xs" style={{ color: palette.muted }}>Cerrados</p>
                          <p className="mt-1 text-xl font-bold" style={{ color: palette.text }}>{librosGuardiaCerrados.length}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveLibrosGuardiaTab('abiertos')}
                          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${activeLibrosGuardiaTab === 'abiertos' ? 'bg-dark-bg3 border-dark-border text-text-main' : 'border-transparent bg-transparent text-text-muted hover:text-text-main'}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-brand-cyan"></span>
                          Abiertos <span className="ml-1 rounded-full bg-brand-cyan/10 px-2 py-0.5 text-xs font-bold text-brand-cyan">{filteredLibrosGuardiaAbiertos.length}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveLibrosGuardiaTab('cerrados')}
                          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${activeLibrosGuardiaTab === 'cerrados' ? 'bg-dark-bg3 border-dark-border text-text-main' : 'border-transparent bg-transparent text-text-muted hover:text-text-main'}`}
                        >
                          <span className="h-2 w-2 rounded-full bg-slate-500"></span>
                          Cerrados <span className="ml-1 rounded-full border border-dark-border bg-dark-bg3 px-2 py-0.5 text-xs font-bold text-text-muted">{filteredLibrosGuardiaCerrados.length}</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold" style={{ color: palette.muted }}>Mes</span>
                          <select
                            value={librosGuardiaMonthFilter}
                            onChange={(event) => setLibrosGuardiaMonthFilter(event.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-cyan"
                            style={{ borderColor: palette.border, background: palette.bg3, color: palette.text }}
                          >
                            <option value="">Todos</option>
                            {librosGuardiaMonths.map(month => (
                              <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold" style={{ color: palette.muted }}>Año</span>
                          <select
                            value={librosGuardiaYearFilter}
                            onChange={(event) => setLibrosGuardiaYearFilter(event.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-brand-cyan"
                            style={{ borderColor: palette.border, background: palette.bg3, color: palette.text }}
                          >
                            <option value="">Todos</option>
                            {librosGuardiaYearOptions.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </div>

                    {currentLibrosGuardia.length > 0 ? (
                      <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                      {currentLibrosGuardia.map((libro) => {
                      const isActive = String(libro.estado).toLowerCase().includes('abierto');
                      return (
                        <article
                          key={libro.id}
                          className={`flex min-h-60 flex-col overflow-hidden rounded-xl border transition-all hover:border-brand-cyan/50 hover:shadow-lg ${isActive ? 'border-brand-cyan/40' : 'border-dark-border'}`}
                          style={{ background: palette.bg }}
                        >
                          <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: palette.border, background: palette.bg2 }}>
                            <span className={`inline-flex items-center gap-2 text-xs font-semibold ${isActive ? 'text-brand-cyan' : 'text-text-muted'}`}>
                              <span className={`h-2 w-2 rounded-full ${isActive ? 'bg-brand-cyan' : 'bg-slate-500'}`}></span>
                              {libro.estado}
                            </span>
                            <span className="rounded-md border border-dark-border bg-dark-bg3 px-2 py-1 text-xs text-text-muted">
                              {libro.cantidadRegistros} registros
                            </span>
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <div className="flex items-center gap-4">
                              <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl border [&>svg]:h-7 [&>svg]:w-7 ${isActive ? 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan' : 'border-dark-border bg-dark-bg3 text-text-muted'}`}>
                                <Icons.Traceability />
                              </div>
                              <div className="min-w-0">
                                <h3 className="truncate text-lg font-bold" style={{ color: palette.text }}>{libro.nombre}</h3>
                                <p className="mt-1 text-sm" style={{ color: palette.muted }}>
                                  {libro.duracion || 'Sin duracion'}
                                </p>
                              </div>
                            </div>
                            {(libro.fechaInicio || libro.fechaFin) && (
                              <p className="mt-5 rounded-lg border px-3 py-2.5 text-sm" style={{ borderColor: palette.border, background: palette.cardSoft, color: palette.muted }}>
                                {formatDateChile(libro.fechaInicio)} - {formatDateChile(libro.fechaFin)}
                              </p>
                            )}
                            <div className="mt-auto pt-5">
                              <button type="button" onClick={() => openRegistrosLibroGuardia(libro)} className="flex w-full items-center justify-between rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-3 text-sm font-semibold text-brand-cyan transition-colors hover:bg-brand-cyan/15">
                                Ver registros →
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                      })}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed px-6 py-16 text-center" style={{ borderColor: palette.border, background: palette.bg }}>
                        <p className="text-sm font-semibold" style={{ color: palette.text }}>
                          No hay libros {activeLibrosGuardiaTab === 'abiertos' ? 'abiertos' : 'cerrados'} con ese filtro.
                        </p>
                        {(librosGuardiaMonthFilter || librosGuardiaYearFilter) && (
                          <button
                            type="button"
                            onClick={() => {
                              setLibrosGuardiaMonthFilter('');
                              setLibrosGuardiaYearFilter('');
                            }}
                            className="mt-4 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-2 text-sm font-semibold text-brand-cyan transition-colors hover:bg-brand-cyan/15"
                          >
                            Limpiar filtros
                          </button>
                        )}
                      </div>
                    )}
                  </section>
                ) : (
                  <div className="rounded-xl border border-dashed px-6 py-16 text-center" style={{ borderColor: palette.border, background: palette.card }}>
                    <p className="text-sm font-semibold" style={{ color: palette.text }}>No hay libros de guardia creados.</p>
                    {canCreateLibroGuardia && (
                      <button
                        type="button"
                        onClick={openCreateLibroGuardiaModal}
                        className="mt-4 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-semibold text-dark-bg transition-opacity hover:opacity-90"
                      >
                        Crear primer libro
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'personal' && personalView === 'importar' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-brand-cyan">Personal del cuartel</p>
                  <h3 className="rajdhani mt-2 text-3xl font-bold" style={{ color: palette.text }}>Importar personal</h3>
                  <p className="mt-2 max-w-2xl text-sm" style={{ color: palette.muted }}>
                    Descarga la plantilla oficial, completa los datos y carga el archivo Excel para registrar bomberos masivamente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closePersonalImportView}
                  disabled={uploadingPersonalImport || downloadingPersonalTemplate}
                  className="rounded-lg border border-dark-border bg-dark-surface px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:border-brand-cyan/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Volver al personal
                </button>
              </div>

              <div className="grid max-w-6xl gap-5 lg:grid-cols-2">
                <section className="rounded-xl border border-dark-border bg-dark-surface p-6 shadow-lg">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-cyan/30 bg-brand-cyan/10 font-bold text-brand-cyan">1</span>
                    <div>
                      <h4 className="rajdhani text-xl font-bold text-text-main">Descarga la plantilla</h4>
                      <p className="text-sm text-text-muted">Archivo Excel con las columnas requeridas.</p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
                    <p className="font-semibold text-text-main">plantilla-importacion-bomberos.xlsx</p>
                    <div className="mt-3 grid gap-2 text-sm text-text-muted sm:grid-cols-2">
                      <span className="rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2">Nombre</span>
                      <span className="rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2">Rut</span>
                      <span className="rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2">Email</span>
                      <span className="rounded-lg border border-dark-border bg-dark-bg3 px-3 py-2">Cargo</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadPersonalTemplate}
                    disabled={downloadingPersonalTemplate || uploadingPersonalImport}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-3 text-sm font-bold text-brand-cyan transition-colors hover:bg-brand-cyan/15 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    {downloadingPersonalTemplate ? 'Descargando...' : 'Descargar plantilla'}
                  </button>
                </section>

                <form onSubmit={handlePersonalImport} className="rounded-xl border border-dark-border bg-dark-surface p-6 shadow-lg">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-red/30 bg-brand-red/10 font-bold text-brand-red">2</span>
                    <div>
                      <h4 className="rajdhani text-xl font-bold text-text-main">Importa el archivo</h4>
                      <p className="text-sm text-text-muted">Carga la plantilla completada.</p>
                    </div>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-text-muted">Archivo Excel</span>
                    <span className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-5 text-center transition-colors hover:border-brand-cyan/50">
                      <svg className="mb-2 h-7 w-7 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5.002 5.002 0 0115.9 6H16a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                      <span className="text-sm font-semibold text-text-main">
                        {personalImportFile?.name || 'Seleccionar plantilla completada'}
                      </span>
                      <span className="mt-1 text-xs text-text-muted">Formato permitido: .xlsx</span>
                      <input
                        key={personalImportInputKey}
                        type="file"
                        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        onChange={handlePersonalImportFileChange}
                        disabled={uploadingPersonalImport}
                        className="sr-only"
                      />
                    </span>
                  </label>

                  {(personalImportError || personalImportSuccess) && (
                    <p className={`mt-5 rounded-lg border px-4 py-3 text-sm ${personalImportError ? 'border-brand-red/30 bg-brand-red/10 text-brand-red' : 'border-brand-green/30 bg-brand-green/10 text-brand-green'}`}>
                      {personalImportError || personalImportSuccess}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!personalImportFile || uploadingPersonalImport || downloadingPersonalTemplate}
                    className="mt-5 w-full rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-3 text-sm font-bold text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingPersonalImport ? 'Importando...' : 'Importar personal'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'personal' && personalView === 'listado' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mx-auto max-w-6xl">
                <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 p-2 text-brand-cyan">
                      <Icons.User />
                    </div>
                    <div>
                      <h3 className="rajdhani text-2xl font-bold" style={{ color: palette.text }}>Personal del Cuartel</h3>
                      <p className="mt-2 text-sm" style={{ color: palette.muted }}>Gestiona los bomberos, sus cargos y datos de contacto.</p>
                    </div>
                  </div>
                </div>

                {loadingBomberosPersonal ? (
                  <div className="rounded-xl border px-5 py-16 text-center" style={{ borderColor: palette.border, background: palette.card, color: palette.muted }}>
                    Cargando personal...
                  </div>
                ) : bomberosPersonalError ? (
                  <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-5 text-center">
                    <p className="font-semibold text-brand-red">{bomberosPersonalError}</p>
                    <button type="button" onClick={fetchBomberosPersonal} className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20">
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-7">
                    {personalActionError && (
                      <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
                        {personalActionError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setActivePersonalTab('activos')}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${activePersonalTab === 'activos' ? 'bg-dark-bg3 border-dark-border text-text-main' : 'border-transparent bg-transparent text-text-muted hover:text-text-main'}`}
                      >
                        <Icons.User className="h-4 w-4 text-brand-cyan" />
                        Activos <span className="ml-1 rounded-full bg-brand-cyan/10 px-2 py-0.5 text-xs font-bold text-brand-cyan">{bomberosActivos.length}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePersonalTab('inactivos')}
                        className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${activePersonalTab === 'inactivos' ? 'bg-dark-bg3 border-dark-border text-text-main' : 'border-transparent bg-transparent text-text-muted hover:text-text-main'}`}
                      >
                        <Icons.User className="h-4 w-4 text-text-muted" />
                        Inactivos <span className="ml-1 rounded-full border border-dark-border bg-dark-bg3 px-2 py-0.5 text-xs font-bold text-text-muted">{bomberosInactivos.length}</span>
                      </button>
                    </div>
                    {renderPersonalTable(currentPersonalData, activePersonalTab === 'activos' && canManageUsers)}
                  </div>
                )}
              </div>
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'reportes' && (
            <ReportsView
              palette={palette}
              canViewFullReports={canViewFullReports}
              canViewBasicReports={canViewReports}
            />
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'vehiculos' && (
            <VehiculosView
              canManageVehicles={canManageVehicles}
              canManageImages={canManageVehicles}
              canManageObservations={canManageObservations}
              canManageMaintenances={canManageMaintenances}
            />
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'epp' && (
            <EppView
              eppData={eppData}
              setEppData={setEppData}
              onDetailChange={setShowingEppDetail}
              canViewCompanyEpp={canViewEpp}
              canViewOwnEpp={canViewOwnEpp}
              canManageEpp={canManageEpp}
              canChangeState={canChangeMaterialState}
              canDeactivate={canDeactivateMaterial}
              canManageObservations={canManageObservations}
              canManageMaintenances={canManageMaintenances}
            />
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab === 'mis-datos' && (
            <div className="h-full overflow-auto p-8" style={{ background: palette.bg, color: palette.text }}>
              <div className="mx-auto max-w-5xl">
                {loadingBomberoProfile ? (
                  <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-16 text-center text-text-muted">
                    Cargando tus datos...
                  </div>
                ) : bomberoProfileError ? (
                  <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 p-6 text-center">
                    <p className="font-semibold text-brand-red">{bomberoProfileError}</p>
                    <button
                      type="button"
                      onClick={fetchBomberoProfile}
                      className="mt-4 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-red/20"
                    >
                      Reintentar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <section className="rounded-xl border border-dark-border bg-dark-surface p-6">
                      <div className="flex flex-wrap items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-brand-cyan bg-dark-bg2 text-xl font-bold text-white shadow-[0_0_18px_rgba(56,189,248,0.18)]">
                          {headerProfileInitials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="rajdhani text-3xl font-bold text-white">{bomberoProfile?.nombre || 'Sin nombre registrado'}</h3>
                          <p className="mt-1 text-sm text-brand-cyan">{bomberoProfile?.cargo || 'Sin cargo registrado'}</p>
                        </div>
                        <div className="ml-auto flex flex-wrap items-center gap-3">
                          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${bomberoProfileStatus === 'Activo' ? 'border-brand-green/20 bg-brand-green/10 text-brand-green' : 'border-dark-border bg-dark-bg3 text-text-muted'}`}>
                            {bomberoProfileStatus || 'Sin estado'}
                          </span>
                          <button
                            type="button"
                            onClick={openEditContactModal}
                            className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-4 py-2 text-sm font-semibold text-brand-cyan transition-colors hover:bg-brand-cyan/15"
                          >
                            Editar contacto
                          </button>
                        </div>
                      </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2">
                      {[
                        ['RUT', bomberoProfile?.rut],
                        ['Email', bomberoProfile?.email],
                        ['Telefono', bomberoProfile?.telefono],
                        ['Genero', bomberoProfile?.genero],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-dark-border bg-dark-surface p-5">
                          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">{label}</p>
                          <p className="mt-2 break-words text-base font-semibold text-white">{value || '-'}</p>
                        </div>
                      ))}
                    </section>
                  </div>
                )}
              </div>
            </div>
          )}

          {!materialDetailRoute && !stockMinimoDetailId && activeTab !== 'bodegas' && activeTab !== 'catalogo' && activeTab !== 'vehiculos' && activeTab !== 'epp' && activeTab !== 'donaciones' && activeTab !== 'personal' && activeTab !== 'reportes' && activeTab !== 'mis-datos' && (
            <div className="p-8 flex items-center justify-center h-full">
              <p className="text-text-muted text-lg">Contenido en construcción...</p>
            </div>
          )}
        </div>

        {showEditContactModal && canManageOwnUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <form onSubmit={handleUpdateContactProfile} className="w-full max-w-lg overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h3 className="rajdhani text-lg font-semibold text-white">Editar datos de contacto</h3>
                  <p className="mt-1 text-xs text-text-muted">Actualiza tu información personal visible.</p>
                </div>
                <button type="button" onClick={closeEditContactModal} disabled={savingContactProfile} className="text-text-muted transition-colors hover:text-white disabled:opacity-50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="space-y-4 p-6">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-muted">Email</span>
                  <input
                    autoFocus
                    type="email"
                    value={contactProfileData.email}
                    onChange={(event) => setContactProfileData(current => ({ ...current, email: event.target.value }))}
                    disabled={savingContactProfile}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                    placeholder="bombero@correo.cl"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-muted">Telefono</span>
                  <input
                    type="tel"
                    value={contactProfileData.telefono}
                    onChange={(event) => setContactProfileData(current => ({ ...current, telefono: event.target.value }))}
                    disabled={savingContactProfile}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                    placeholder="+56912345678"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-muted">Genero</span>
                  <select
                    value={contactProfileData.genero}
                    onChange={(event) => setContactProfileData(current => ({ ...current, genero: event.target.value }))}
                    disabled={savingContactProfile}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-white outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                  >
                    <option value="">Selecciona genero</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                    <option value="Prefiero no informar">Prefiero no informar</option>
                  </select>
                </label>
                {contactProfileError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                    {contactProfileError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <button type="button" onClick={closeEditContactModal} disabled={savingContactProfile} className="px-4 py-2 text-sm font-medium text-text-main transition-colors hover:text-white disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={savingContactProfile} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  {savingContactProfile ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showCreateCampanaModal && canManageDonaciones && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateCampana} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-text-main rajdhani">Crear campaña de donaciones</h3>
                <button type="button" onClick={closeCreateCampanaModal} disabled={savingCampana} className="text-text-muted hover:text-text-main transition-colors disabled:opacity-50">
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
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
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
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                      placeholder="$20.000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Descripción</label>
                  <textarea
                    rows="3"
                    value={newCampanaData.descripcion}
                    onChange={(e) => setNewCampanaData({ ...newCampanaData, descripcion: e.target.value })}
                    disabled={savingCampana}
                    className="w-full resize-none px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Describe el objetivo de la campaña..."
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
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Fecha fin</label>
                    <input
                      type="date"
                      value={newCampanaData.fechaFin}
                      onChange={(e) => setNewCampanaData({ ...newCampanaData, fechaFin: e.target.value })}
                      disabled={savingCampana}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
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
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
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
                  {savingCampana ? 'Creando...' : 'Crear campaña'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddUbicacionModal && canManageLocations && (
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
                  <label className="block text-sm font-medium text-text-muted mb-2">Tipo de ubicación</label>
                  <select
                    autoFocus
                    value={newUbicacionData.idTipoUbicacion}
                    onChange={(e) => setNewUbicacionData({ ...newUbicacionData, idTipoUbicacion: e.target.value })}
                    disabled={loadingTiposUbicacion || savingUbicacion || tiposUbicacion.length === 0}
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                  >
                    <option value="">{loadingTiposUbicacion ? 'Cargando tipos...' : 'Selecciona un tipo'}</option>
                    {tiposUbicacion.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                </div>
                {currentUbicacion && (
                  <p className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs text-text-muted">
                    Se creará dentro de {currentUbicacion.name} (id ubicación {currentUbicacion.idUbicacion || 'no disponible'}).
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
                  className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                  placeholder="Ej. Gaveta 3, Bodega central..."
                  value={newUbicacionData.nombre}
                  onChange={(e) => setNewUbicacionData({ ...newUbicacionData, nombre: e.target.value })}
                  disabled={savingUbicacion}
                />
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Descripción</label>
                  <textarea
                    rows={4}
                    className="w-full resize-none px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Detalle breve de la ubicación"
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

        {showAddTipoUbicacionModal && canManageLocations && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateTipoUbicacion} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">Agregar Tipo de Ubicación</h3>
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
                    className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    placeholder="Ej. Bodega, Caja, Gaveta..."
                    value={newTipoUbicacionData.nombre}
                    onChange={(e) => setNewTipoUbicacionData({ ...newTipoUbicacionData, nombre: e.target.value })}
                    disabled={savingTipoUbicacion}
                  />
                </div>
                <label className="flex items-center justify-between gap-4 rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                  <span>
                    <span className="block text-sm font-semibold text-text-main">Tipo raiz</span>
                    <span className="block text-xs text-text-muted">Aparecerá como opción para crear ubicaciones principales.</span>
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

        {tipoUbicacionPendingDelete && canManageLocations && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: palette.overlay }}
            onClick={closeDeleteTipoUbicacionModal}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-xl border shadow-2xl"
              style={{ borderColor: palette.border, background: palette.surface }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: palette.text }}>Eliminar tipo de ubicación</h3>
                  <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>Árbol de ubicaciones</p>
                </div>
                <button
                  type="button"
                  onClick={closeDeleteTipoUbicacionModal}
                  disabled={Boolean(deletingTipoUbicacionId)}
                  className="rounded-lg px-2 py-1 text-xl leading-none transition-colors hover:text-brand-red disabled:opacity-50"
                  style={{ color: palette.muted }}
                  aria-label="Cerrar"
                >
                  x
                </button>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed" style={{ color: palette.muted }}>
                  Estás a punto de eliminar el tipo <span className="font-semibold" style={{ color: palette.text }}>{tipoUbicacionPendingDelete.nombre}</span>. Esta acción no se puede deshacer.
                </p>
                {deleteTipoUbicacionError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                    {deleteTipoUbicacionError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
                <button
                  type="button"
                  onClick={closeDeleteTipoUbicacionModal}
                  disabled={Boolean(deletingTipoUbicacionId)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:text-brand-cyan disabled:opacity-50"
                  style={{ color: palette.muted }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTipoUbicacion}
                  disabled={Boolean(deletingTipoUbicacionId)}
                  className="rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingTipoUbicacionId ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showTipoRelationsModal && createdTipoUbicacion && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateTipoRelations} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-lg overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white rajdhani">Relacionar Tipo de Ubicación</h3>
                  <p className="mt-1 text-xs text-text-muted">Tipo creado: {createdTipoUbicacion.nombre}</p>
                </div>
                <button type="button" onClick={closeTipoRelationsModal} disabled={savingTipoRelations} className="text-text-muted hover:text-white transition-colors disabled:opacity-50">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-text-main">Que tipos pueden contener este tipo?</p>
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
                          <span className="block text-sm font-semibold text-text-main">{tipo.nombre}</span>
                          <span className="block text-xs text-text-muted">{tipo.esTipoRaiz ? 'Tipo raíz' : 'Sububicación'}{tipo.idCompania ? ` - Compañía ${tipo.idCompania}` : ''}</span>
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

        {editingTipoRelations && canManageLocations && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleAddTipoChildRelation} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-white rajdhani">Editar Tipo de Ubicación</h3>
                  <p className="mt-1 text-xs text-text-muted">Tipos admitidos dentro de {editingTipoRelations.nombre}</p>
                </div>
                <button
                  type="button"
                  onClick={closeEditTipoRelationsModal}
                  disabled={loadingTipoChildrenRelations || savingTipoChildRelation || Boolean(deletingTipoChildRelationId)}
                  className="text-text-muted hover:text-white transition-colors disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="max-h-[72vh] overflow-y-auto p-6 space-y-5">
                <div>
                  <p className="mb-3 text-sm font-semibold text-white">Tipos que admite</p>
                  {loadingTipoChildrenRelations ? (
                    <p className="rounded-lg border border-dark-border bg-dark-bg px-4 py-4 text-sm text-text-muted">
                      Cargando tipos admitidos...
                    </p>
                  ) : tipoChildrenRelations.length > 0 ? (
                    <div className="space-y-2">
                      {tipoChildrenRelations.map(relation => {
                        const relationId = relation.idTipoUbicacionRelacion || relation.id;
                        const isDeletingRelation = String(deletingTipoChildRelationId) === String(relationId);

                        return (
                          <div key={relationId} className="flex items-center justify-between gap-3 rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
                            <span>
                              <span className="block text-sm font-semibold text-white">{relation.nombreTipoHijo}</span>
                              <span className="block text-xs text-text-muted">ID tipo {relation.idTipoUbicacionHijo}{relation.esTipoRaizHijo ? ' - Tipo raíz' : ' - Sububicación'}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteTipoChildRelation(relation)}
                              disabled={isDeletingRelation || Boolean(deletingTipoChildRelationId) || savingTipoChildRelation}
                              className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs font-semibold text-brand-red transition-colors hover:bg-brand-red/20 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isDeletingRelation ? 'Eliminando...' : 'Eliminar'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dark-border bg-dark-bg px-4 py-4 text-sm text-text-muted">
                      Este tipo aún no admite otros tipos de ubicación.
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-4">
                  <label className="block text-sm font-semibold text-white mb-2">Agregar tipo admitido</label>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <select
                      value={selectedTipoHijoId}
                      onChange={(event) => setSelectedTipoHijoId(event.target.value)}
                      disabled={loadingTipoChildrenRelations || savingTipoChildRelation || Boolean(deletingTipoChildRelationId)}
                      className="min-w-0 flex-1 px-4 py-3 bg-dark-surface border border-dark-border rounded-lg text-white focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    >
                      <option value="">Seleccionar tipo de ubicación</option>
                      {tiposArbolUbicacion
                        .filter(tipo => String(tipo.id) !== String(editingTipoRelations.id))
                        .filter(tipo => !tipo.esTipoRaiz)
                        .filter(tipo => !tipoChildrenRelations.some(relation => String(relation.idTipoUbicacionHijo) === String(tipo.id)))
                        .map(tipo => (
                          <option key={tipo.id} value={tipo.id}>
                            {tipo.nombre}{tipo.esTipoRaiz ? ' - Raíz' : ' - Sububicación'}
                          </option>
                        ))}
                    </select>
                    <button
                      type="submit"
                      disabled={!selectedTipoHijoId || savingTipoChildRelation || loadingTipoChildrenRelations || Boolean(deletingTipoChildRelationId)}
                      className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {savingTipoChildRelation ? 'Agregando...' : 'Agregar'}
                    </button>
                  </div>
                  {tiposArbolUbicacion
                    .filter(tipo => String(tipo.id) !== String(editingTipoRelations.id))
                    .filter(tipo => !tipo.esTipoRaiz)
                    .filter(tipo => !tipoChildrenRelations.some(relation => String(relation.idTipoUbicacionHijo) === String(tipo.id))).length === 0 && (
                    <p className="mt-3 text-xs text-text-muted">No quedan tipos disponibles para agregar.</p>
                  )}
                </div>

                {editTipoRelationsError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {editTipoRelationsError}
                  </p>
                )}
              </div>

              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end">
                <button
                  type="button"
                  onClick={closeEditTipoRelationsModal}
                  disabled={loadingTipoChildrenRelations || savingTipoChildRelation || Boolean(deletingTipoChildRelationId)}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                >
                  Cerrar
                </button>
              </div>
            </form>
          </div>
        )}

        {showCreateLibroGuardiaModal && canCreateLibroGuardia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <form onSubmit={handleCreateLibroGuardia} className="w-full max-w-lg overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h3 className="rajdhani text-lg font-semibold text-text-main">Crear libro de guardia</h3>
                  <p className="mt-1 text-xs text-text-muted">Define el periodo y estado inicial del libro.</p>
                </div>
                <button type="button" onClick={closeCreateLibroGuardiaModal} disabled={savingLibroGuardia} className="text-text-muted transition-colors hover:text-text-main disabled:opacity-50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-muted">Nombre</label>
                  <input
                    autoFocus
                    type="text"
                    value={newLibroGuardiaData.nombre}
                    onChange={(event) => setNewLibroGuardiaData(current => ({ ...current, nombre: event.target.value }))}
                    disabled={savingLibroGuardia}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-text-main outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                    placeholder="Ej. Libro Noviembre 2026"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-muted">Duracion</label>
                  <select
                    value={newLibroGuardiaData.duracion}
                    onChange={(event) => setNewLibroGuardiaData(current => ({ ...current, duracion: event.target.value }))}
                    disabled={savingLibroGuardia}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-text-main outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                  >
                    <option value="Diario" className="bg-dark-surface text-text-main">Diario</option>
                    <option value="Semanal" className="bg-dark-surface text-text-main">Semanal</option>
                    <option value="Mensual" className="bg-dark-surface text-text-main">Mensual</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-text-muted">Estado</label>
                  <select
                    value={newLibroGuardiaData.estado}
                    onChange={(event) => setNewLibroGuardiaData(current => ({ ...current, estado: event.target.value }))}
                    disabled={savingLibroGuardia}
                    className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-text-main outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                  >
                    <option value="Abierto" className="bg-dark-surface text-text-main">Abierto</option>
                    <option value="Cerrado" className="bg-dark-surface text-text-main">Cerrado</option>
                  </select>
                </div>
                {createLibroGuardiaError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {createLibroGuardiaError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <button
                  type="button"
                  onClick={closeCreateLibroGuardiaModal}
                  disabled={savingLibroGuardia}
                  className="px-4 py-2 text-sm font-medium text-text-main transition-colors hover:text-text-main disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingLibroGuardia}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingLibroGuardia ? 'Creando...' : 'Crear libro'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showCreateRegistroModal && selectedLibroGuardia && canRegisterLibroGuardia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <form onSubmit={handleCreateRegistroLibroGuardia} className="w-full max-w-xl overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h3 className="rajdhani text-lg font-semibold text-text-main">Agregar registro</h3>
                  <p className="mt-1 text-xs text-text-muted">{selectedLibroGuardia.nombre}</p>
                </div>
                <button type="button" onClick={closeCreateRegistroModal} disabled={savingRegistroLibroGuardia} className="text-text-muted transition-colors hover:text-text-main disabled:opacity-50">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-muted">Fecha</span>
                    <input
                      type="date"
                      value={newRegistroData.fecha}
                      onChange={(event) => setNewRegistroData(current => ({ ...current, fecha: event.target.value }))}
                      disabled={savingRegistroLibroGuardia}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-text-main outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-muted">Hora</span>
                    <input
                      type="time"
                      step="1"
                      value={newRegistroData.hora}
                      onChange={(event) => setNewRegistroData(current => ({ ...current, hora: event.target.value }))}
                      disabled={savingRegistroLibroGuardia}
                      className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-text-main outline-none transition-all focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-text-muted">Detalle</span>
                  <textarea
                    autoFocus
                    rows="5"
                    value={newRegistroData.detalle}
                    onChange={(event) => setNewRegistroData(current => ({ ...current, detalle: event.target.value }))}
                    disabled={savingRegistroLibroGuardia}
                    className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg px-4 py-3 text-sm text-text-main outline-none transition-all placeholder-text-muted focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan disabled:opacity-50"
                    placeholder="Describe la novedad registrada..."
                  />
                </label>
                {createRegistroError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                    {createRegistroError}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <button
                  type="button"
                  onClick={closeCreateRegistroModal}
                  disabled={savingRegistroLibroGuardia}
                  className="px-4 py-2 text-sm font-medium text-text-main transition-colors hover:text-white disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingRegistroLibroGuardia || !newRegistroData.fecha || !newRegistroData.hora || !newRegistroData.detalle.trim()}
                  className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {savingRegistroLibroGuardia ? 'Guardando...' : 'Guardar registro'}
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddStockMinimoModal && canAddStock && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSaveStockMinimo} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white rajdhani">
                  {editingStockMinimoId ? 'Editar Stock Mínimo' : 'Agregar Stock Mínimo'}
                </h3>
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
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                      placeholder="Ej. Stock Gaveta 1"
                      value={newStockMinimoData.nombre}
                      onChange={(e) => setNewStockMinimoData({ ...newStockMinimoData, nombre: e.target.value })}
                      disabled={savingStockMinimo}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-muted mb-2">Ubicación</label>
                    <select
                      value={newStockMinimoData.idUbicacion}
                      onChange={(e) => setNewStockMinimoData({ ...newStockMinimoData, idUbicacion: e.target.value })}
                      disabled={savingStockMinimo || ubicaciones.length === 0}
                      className="w-full px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-main focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                    >
                      <option value="">{ubicaciones.length > 0 ? 'Selecciona una ubicación' : 'No hay ubicaciones disponibles'}</option>
                      {ubicaciones.map(ubicacion => (
                        <option key={ubicacion.id} value={ubicacion.id}>{ubicacion.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-text-main">Materiales del stock</p>
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
                        className="w-full rounded-lg border border-dark-border bg-dark-bg2 px-4 py-2.5 text-sm text-text-main placeholder-text-muted outline-none transition-all disabled:opacity-50 focus:border-brand-cyan"
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
                      <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                        {visibleStockMateriales.map(material => {
                          const selectedMaterial = getSelectedStockMaterial(material.id);
                          const isSelected = Boolean(selectedMaterial);
                          return (
                            <div
                              key={material.id}
                              className={`rounded-lg border px-3 py-2 transition-colors ${isSelected ? 'border-brand-cyan/40 bg-brand-cyan/10' : 'border-dark-border bg-dark-bg2'}`}
                            >
                              <div className="grid grid-cols-[minmax(0,1fr)_104px] items-center gap-3">
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
                                <label className="flex items-center justify-end gap-2 text-xs text-text-muted">
                                  <span className="hidden sm:inline">Cant.</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedMaterial?.cantidad || 1}
                                    onChange={(e) => updateStockMaterialCantidad(material.id, e.target.value)}
                                    disabled={!isSelected || savingStockMinimo}
                                    className="h-9 w-16 rounded-lg border border-dark-border bg-dark-bg px-2 text-center text-sm text-white outline-none transition-all disabled:opacity-50 focus:border-brand-cyan"
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
                  {savingStockMinimo ? (editingStockMinimoId ? 'Guardando...' : 'Creando...') : (editingStockMinimoId ? 'Guardar cambios' : 'Crear Stock')}
                </button>
              </div>
            </form>
          </div>
        )}

        {valueUpdateMaterial && canEditMaterial && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form onSubmit={handleUpdateMaterialValue} className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2">
                <h3 className="text-lg font-semibold text-white rajdhani">Actualizar valor</h3>
                <p className="mt-1 truncate text-sm text-text-muted">{valueUpdateMaterial.nombre}</p>
              </div>
              <div className="p-6">
                <label className="block text-sm font-medium text-text-muted mb-2">Valor Unitario</label>
                <input
                  autoFocus
                  type="text"
                  value={valueUpdateInput}
                  onChange={handleValueUpdateChange}
                  disabled={savingValueUpdate}
                  className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
                  placeholder="Ej. $15.000"
                />
                {valueUpdateError && (
                  <p className="mt-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                    {valueUpdateError}
                  </p>
                )}
              </div>
              <div className="px-6 py-4 bg-dark-bg2 border-t border-dark-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeValueUpdateModal}
                  disabled={savingValueUpdate}
                  className="px-4 py-2 text-sm font-medium text-text-main hover:text-white transition-colors disabled:opacity-50"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={savingValueUpdate}
                  className="px-4 py-2 text-sm font-medium text-white bg-brand-cyan rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(56,189,248,0.3)]"
                >
                  {savingValueUpdate ? 'Guardando...' : 'Aceptar'}
                </button>
              </div>
            </form>
          </div>
        )}

        {stockMinimoPendingDelete && canAddStock && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: palette.overlay }}
            onClick={closeDeleteStockMinimoModal}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-xl border shadow-2xl"
              style={{ borderColor: palette.border, background: palette.surface }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: palette.text }}>Eliminar stock mínimo</h3>
                  <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>Configuración de reposición</p>
                </div>
                <button
                  type="button"
                  onClick={closeDeleteStockMinimoModal}
                  disabled={Boolean(deletingStockMinimoId)}
                  className="rounded-lg px-2 py-1 text-xl leading-none transition-colors hover:text-brand-red disabled:opacity-50"
                  style={{ color: palette.muted }}
                  aria-label="Cerrar"
                >
                  x
                </button>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed" style={{ color: palette.muted }}>
                  Estás a punto de eliminar <span className="font-semibold" style={{ color: palette.text }}>{stockMinimoPendingDelete.nombre}</span>. Esta acción no se puede deshacer.
                </p>
                {deleteStockMinimoError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                    {deleteStockMinimoError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
                <button
                  type="button"
                  onClick={closeDeleteStockMinimoModal}
                  disabled={Boolean(deletingStockMinimoId)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:text-brand-cyan disabled:opacity-50"
                  style={{ color: palette.muted }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStockMinimo}
                  disabled={Boolean(deletingStockMinimoId)}
                  className="rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deletingStockMinimoId ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmCatAction && canDeactivateMaterial && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-dark-surface border border-dark-border rounded-xl w-full max-w-sm overflow-hidden shadow-2xl fade-in">
              <div className="px-6 py-4 border-b border-dark-border bg-dark-bg2 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-red/10 text-brand-red border border-brand-red/20">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </div>
                <h3 className="text-lg font-semibold text-white rajdhani">
                  Eliminar Registro
                </h3>
              </div>
              <div className="p-6">
                <p className="text-text-muted text-sm leading-relaxed">
                  ¿Estás seguro que deseas eliminar este material del catálogo? Esta acción no se puede deshacer.
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
                    if (confirmCatAction.type === 'delete') {
                      setCatalogo(catalogo.filter(item => item.id !== confirmCatAction.id));
                    }
                    setConfirmCatAction(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90 bg-brand-red shadow-[0_4px_15px_rgba(232,55,42,0.3)]"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {showAddMaterialModal && canCreateMaterial && (
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
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
                    placeholder="Ej. Esmeril Angular..."
                    value={newMaterialData.nombre}
                    disabled={savingMaterial}
                    onChange={(e) => setNewMaterialData({...newMaterialData, nombre: e.target.value})}
                  />
                  <p className="mt-2 text-xs leading-relaxed text-text-muted">
                    Formato recomendado: nombre base del material + medida o subtipo si aplica + marca al final. Ej: Manguera 1 1/2 pulgadas Key Fire.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Tipo de producto</label>
                  <select
                    value={newMaterialData.idTipoProducto}
                    onChange={(e) => setNewMaterialData({...newMaterialData, idTipoProducto: e.target.value})}
                    disabled={savingMaterial}
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border text-text-main rounded-lg outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan appearance-none disabled:opacity-50"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {TIPOS_PRODUCTO.map(tipo => (
                      <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">Descripción</label>
                  <textarea
                    rows="3"
                    className="w-full resize-none px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all disabled:opacity-50"
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
                    className="w-full px-4 py-2.5 bg-dark-bg border border-dark-border rounded-lg text-text-main placeholder-text-muted focus:outline-none focus:border-brand-cyan focus:ring-1 focus:ring-brand-cyan transition-all"
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
                    { key: 'requiereMantencion', label: 'Mantención' },
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

        {showAssignEppModal && canManageEpp && (
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

        {showAddBomberoModal && canManageUsers && (
          <AddBomberoModal
            onClose={() => setShowAddBomberoModal(false)}
            onAdded={fetchBomberosPersonal}
          />
        )}

        {bomberoPendingInactivation && canManageUsers && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            style={{ background: palette.overlay }}
            onClick={closeInactivateUsuarioModal}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-xl border shadow-2xl"
              style={{ borderColor: palette.border, background: palette.surface }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: palette.text }}>Dar de baja bombero</h3>
                  <p className="mt-0.5 text-xs" style={{ color: palette.muted }}>Cambio de estado de usuario</p>
                </div>
                <button
                  type="button"
                  onClick={closeInactivateUsuarioModal}
                  disabled={Boolean(inactivatingUsuarioId)}
                  className="rounded-lg px-2 py-1 text-xl leading-none transition-colors hover:text-brand-red disabled:opacity-50"
                  style={{ color: palette.muted }}
                  aria-label="Cerrar"
                >
                  x
                </button>
              </div>

              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed" style={{ color: palette.muted }}>
                  Estás a punto de dar de baja a <span className="font-semibold" style={{ color: palette.text }}>{bomberoPendingInactivation.nombre}</span>. El usuario quedara inactivo y ya no aparecera en la lista de bomberos activos.
                </p>
                {personalActionError && (
                  <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-sm text-brand-red">
                    {personalActionError}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t px-6 py-4" style={{ borderColor: palette.border, background: palette.bg2 }}>
                <button
                  type="button"
                  onClick={closeInactivateUsuarioModal}
                  disabled={Boolean(inactivatingUsuarioId)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold transition-colors hover:text-brand-cyan disabled:opacity-50"
                  style={{ color: palette.muted }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleInactivateUsuario}
                  disabled={Boolean(inactivatingUsuarioId)}
                  className="rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {inactivatingUsuarioId ? 'Procesando...' : 'Confirmar baja'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showInventoryMaterialModal && canAddStock && (
          <AddInventoryMaterialModal
            idUbicacion={activeUbicacion}
            onClose={() => setShowInventoryMaterialModal(false)}
            onAdded={refreshActiveUbicacion}
          />
        )}

        {movingMaterial && canMoveMaterial && (
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
