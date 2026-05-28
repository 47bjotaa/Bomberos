import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from '../ui/Icons';
import { apiFetch } from '../../services/api';

const EPP_STATES = ['Buen Estado', 'Desgastada', 'Mal Estado'];

const formatDate = (value) => {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
  }).format(date);
};

const getChileDateTime = () => {
  const date = new Date();
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date).replace(' ', 'T');
};

const normalizeEstado = (estadoRaw) => {
  if (!estadoRaw) return 'Buen Estado';
  const lower = estadoRaw.toLowerCase().trim();
  if (lower.includes('buen') || (lower.includes('operativo') && !lower.includes('no'))) {
    return 'Buen Estado';
  }
  if (lower.includes('mal') || lower.includes('baja') || lower.includes('fuera de servicio') || lower.includes('no operativo')) {
    return 'Mal Estado';
  }
  if (lower.includes('desgast') || lower.includes('reparacion') || lower.includes('mantenimiento') || lower.includes('mantencion') || lower.includes('pendiente')) {
    return 'Desgastada';
  }
  return 'Buen Estado';
};

const getDateInputValue = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getArrayPayload = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.items)) return payload.items;
  if (payload?.data && typeof payload.data === 'object') return getArrayPayload(payload.data, keys);
  if (payload?.result && typeof payload.result === 'object') return getArrayPayload(payload.result, keys);

  return [];
};

const getObservationId = (payload) => {
  if (!payload) return null;
  if (typeof payload === 'number' || typeof payload === 'string') return payload;
  return payload.idObservacion || payload.id || payload.data?.idObservacion || payload.data?.id || payload.result?.idObservacion || payload.result?.id || null;
};

const getMaintenanceId = (payload) => {
  if (!payload) return null;
  if (typeof payload === 'number' || typeof payload === 'string') return payload;
  return payload.idMantencion || payload.id || payload.data?.idMantencion || payload.data?.id || payload.result?.idMantencion || payload.result?.id || null;
};

const getImageFileId = (image) => {
  if (typeof image === 'number' || typeof image === 'string') return image;
  return image?.idArchivo || image?.id || null;
};

const getTemporaryImageUrl = (payload) => {
  if (typeof payload === 'string') return payload;
  return payload?.url || payload?.data?.url || '';
};

const getQueryString = (params) => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
};

const isImageFile = (file) => {
  const contentType = file?.contentType || file?.file?.type || '';
  const name = file?.nombre || file?.nombreOriginal || file?.file?.name || '';
  return contentType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name);
};

const isMaintenancePending = (maintenance) => (
  String(maintenance?.estadoMantencion || '').toLowerCase().includes('pendiente')
  || String(maintenance?.estadoMantencion || '').toLowerCase().includes('programada')
);

const sortMaintenances = (maintenances = []) => (
  [...maintenances].sort((a, b) => {
    const aPending = isMaintenancePending(a);
    const bPending = isMaintenancePending(b);
    if (aPending !== bPending) return aPending ? -1 : 1;
    return new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime();
  })
);

function EmptyState({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-dark-border px-4 py-8 text-center text-sm text-text-muted">
      {children}
    </div>
  );
}

function Modal({ title, subtitle, children, footer, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-dark-border bg-dark-bg2 px-6 py-4">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-xs text-text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red"
          >
            x
          </button>
        </div>
        <div className="max-h-[calc(90vh-140px)] overflow-y-auto p-6">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function EppDetailView({
  itemId,
  onBack,
  onRemoved,
  canEdit = true,
  canDeactivate = true,
  canManageImages = true,
  canManageObservations = true,
  canManageMaintenances = true,
}) {
  const [detail, setDetail] = useState(null);
  const [history, setHistory] = useState({ observaciones: [], mantenciones: [], requiereMantencion: true });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [materialImages, setMaterialImages] = useState([]);
  const [loadingMaterialImages, setLoadingMaterialImages] = useState(false);
  const [materialImagesError, setMaterialImagesError] = useState('');
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageUploads, setImageUploads] = useState([]);
  const [imageSaving, setImageSaving] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  const [showObservationForm, setShowObservationForm] = useState(false);
  const [observationText, setObservationText] = useState('');
  const [observationImages, setObservationImages] = useState([]);
  const [observationSaving, setObservationSaving] = useState(false);
  const [observationError, setObservationError] = useState('');
  const [observationNotice, setObservationNotice] = useState('');
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [observationDetailImages, setObservationDetailImages] = useState([]);
  const [loadingObservationImages, setLoadingObservationImages] = useState(false);
  const [observationImagesError, setObservationImagesError] = useState('');

  const [maintenanceModalMode, setMaintenanceModalMode] = useState(null);
  const [maintenanceForm, setMaintenanceForm] = useState({ fecha: '', descripcion: '', tipo: '' });
  const [maintenanceFiles, setMaintenanceFiles] = useState([]);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');
  const [maintenanceNotice, setMaintenanceNotice] = useState('');
  const [markingMaintenanceId, setMarkingMaintenanceId] = useState(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [maintenanceDetailFiles, setMaintenanceDetailFiles] = useState([]);
  const [loadingMaintenanceFiles, setLoadingMaintenanceFiles] = useState(false);
  const [maintenanceFilesError, setMaintenanceFilesError] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ talla: '', estadoEpp: 'Buen Estado', fechaVencimiento: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [deactivationSaving, setDeactivationSaving] = useState(false);
  const [deactivationError, setDeactivationError] = useState('');

  const imageUploadsRef = useRef([]);
  const observationImagesRef = useRef([]);
  const maintenanceFilesRef = useRef([]);

  const targetIds = useMemo(() => ({ idItem: Number(itemId || detail?.idItem || 0) }), [detail?.idItem, itemId]);
  const targetQuery = useMemo(() => getQueryString(targetIds), [targetIds]);
  const materialImageBasePath = useMemo(() => (
    itemId ? `/api/materiales/items/${itemId}/imagenes` : ''
  ), [itemId]);
  const sortedMaintenances = useMemo(() => sortMaintenances(history.mantenciones), [history.mantenciones]);
  const primaryImage = materialImages[0] || null;

  const openEditModal = () => {
    if (!canEdit) return;

    setEditForm({
      talla: detail?.talla || '',
      estadoEpp: normalizeEstado(detail?.estadoEpp || detail?.estadoInventario || 'Buen Estado'),
      fechaVencimiento: getDateInputValue(detail?.fechaVencimiento),
    });
    setEditError('');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    if (editSaving) return;
    setShowEditModal(false);
    setEditError('');
  };

  const openDeactivateModal = () => {
    if (!canDeactivate) return;

    setDeactivationReason('');
    setDeactivationError('');
    setShowDeactivateModal(true);
  };

  const closeDeactivateModal = () => {
    if (deactivationSaving) return;
    setShowDeactivateModal(false);
    setDeactivationError('');
  };

  const resetImageDraft = useCallback(() => {
    setShowImageModal(false);
    imageUploads.forEach((image) => URL.revokeObjectURL(image.preview));
    setImageUploads([]);
    setImageUploadError('');
  }, [imageUploads]);

  const resetObservationDraft = useCallback(() => {
    setShowObservationForm(false);
    setObservationText('');
    observationImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setObservationImages([]);
    setObservationError('');
  }, [observationImages]);

  const resetMaintenanceDraft = useCallback(() => {
    setMaintenanceModalMode(null);
    setMaintenanceForm({ fecha: '', descripcion: '', tipo: '' });
    maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setMaintenanceFiles([]);
    setMaintenanceError('');
  }, [maintenanceFiles]);

  const fetchMaterialImages = useCallback(async () => {
    if (!materialImageBasePath) return;

    setLoadingMaterialImages(true);
    setMaterialImagesError('');

    try {
      const payload = await apiFetch(materialImageBasePath);
      const imageList = getArrayPayload(payload, ['imagenes', 'archivos', 'files']);
      const imagesWithUrls = await Promise.all(imageList.map(async (image) => {
        const idArchivo = getImageFileId(image);
        if (!idArchivo) return null;
        const urlPayload = await apiFetch(`${materialImageBasePath}/${idArchivo}/url`);
        const url = getTemporaryImageUrl(urlPayload);
        return {
          idArchivo,
          nombre: image?.nombreOriginal || image?.nombre || `Imagen ${idArchivo}`,
          contentType: image?.contentType || '',
          fechaSubida: image?.fechaSubida || '',
          url,
        };
      }));

      setMaterialImages(imagesWithUrls.filter((image) => image?.url));
    } catch (fetchError) {
      setMaterialImages([]);
      setMaterialImagesError(fetchError.message || 'No se pudieron cargar las fotos.');
    } finally {
      setLoadingMaterialImages(false);
    }
  }, [materialImageBasePath]);

  useEffect(() => {
    let ignore = false;

    const fetchDetail = async () => {
      if (!itemId) {
        setError('No se pudo identificar el item EPP.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [eppData, generalData] = await Promise.all([
          apiFetch(`/api/materiales/items/${itemId}/detalle-epp`),
          apiFetch(`/api/materiales/items/${itemId}`).catch(() => null),
        ]);

        if (!ignore) {
          const normalizedEppData = {
            ...eppData,
            estadoEpp: normalizeEstado(eppData.estadoEpp || eppData.estadoInventario),
          };
          setDetail(normalizedEppData);
          setHistory({
            observaciones: Array.isArray(generalData?.observaciones) ? generalData.observaciones : [],
            mantenciones: Array.isArray(generalData?.mantenciones) ? generalData.mantenciones : [],
            requiereMantencion: generalData?.requiereMantencion !== false,
          });
        }
      } catch (fetchError) {
        console.error('Error al cargar detalle EPP:', fetchError);
        if (!ignore) {
          setError(fetchError.message || 'No se pudo cargar el detalle EPP.');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchDetail();

    return () => {
      ignore = true;
    };
  }, [itemId]);

  useEffect(() => {
    if (!loading && !error) fetchMaterialImages();
  }, [error, fetchMaterialImages, loading]);

  useEffect(() => {
    imageUploadsRef.current = imageUploads;
  }, [imageUploads]);

  useEffect(() => {
    observationImagesRef.current = observationImages;
  }, [observationImages]);

  useEffect(() => {
    maintenanceFilesRef.current = maintenanceFiles;
  }, [maintenanceFiles]);

  useEffect(() => () => {
    imageUploadsRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    observationImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    maintenanceFilesRef.current.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);

  useEffect(() => {
    if (!selectedObservation) return;

    let mounted = true;
    const idObservacion = getObservationId(selectedObservation);

    const fetchObservationImages = async () => {
      if (!idObservacion) {
        setObservationDetailImages([]);
        return;
      }

      setLoadingObservationImages(true);
      setObservationImagesError('');
      setObservationDetailImages([]);

      try {
        const payload = await apiFetch(`/api/observaciones/${idObservacion}/imagenes?${targetQuery}`);
        const imageList = getArrayPayload(payload, ['imagenes', 'archivos', 'files']);
        const imagesWithUrls = await Promise.all(imageList.map(async (image) => {
          const idArchivo = getImageFileId(image);
          if (!idArchivo) return null;
          const urlPayload = await apiFetch(`/api/observaciones/${idObservacion}/imagenes/${idArchivo}/url?${targetQuery}`);
          const url = getTemporaryImageUrl(urlPayload);
          return {
            idArchivo,
            nombre: image?.nombreOriginal || image?.nombre || `Imagen ${idArchivo}`,
            contentType: image?.contentType || '',
            fechaSubida: image?.fechaSubida || '',
            url,
          };
        }));

        if (mounted) setObservationDetailImages(imagesWithUrls.filter((image) => image?.url));
      } catch (fetchError) {
        if (mounted) setObservationImagesError(fetchError.message || 'No se pudieron cargar las imagenes.');
      } finally {
        if (mounted) setLoadingObservationImages(false);
      }
    };

    fetchObservationImages();

    return () => {
      mounted = false;
    };
  }, [selectedObservation, targetQuery]);

  useEffect(() => {
    if (!selectedMaintenance) return;

    let mounted = true;
    const idMantencion = getMaintenanceId(selectedMaintenance);

    const fetchMaintenanceFiles = async () => {
      if (!idMantencion) {
        setMaintenanceDetailFiles([]);
        return;
      }

      setLoadingMaintenanceFiles(true);
      setMaintenanceFilesError('');
      setMaintenanceDetailFiles([]);

      try {
        const payload = await apiFetch(`/api/mantenciones/${idMantencion}/archivos?${targetQuery}`);
        const fileList = getArrayPayload(payload, ['archivos', 'imagenes', 'files']);
        const filesWithUrls = await Promise.all(fileList.map(async (file) => {
          const idArchivo = getImageFileId(file);
          if (!idArchivo) return null;
          const urlPayload = await apiFetch(`/api/mantenciones/${idMantencion}/archivos/${idArchivo}/url?${targetQuery}`);
          const url = getTemporaryImageUrl(urlPayload);
          return {
            idArchivo,
            nombre: file?.nombreOriginal || file?.nombre || `Archivo ${idArchivo}`,
            contentType: file?.contentType || '',
            fechaSubida: file?.fechaSubida || '',
            url,
          };
        }));

        if (mounted) setMaintenanceDetailFiles(filesWithUrls.filter((file) => file?.url));
      } catch (fetchError) {
        if (mounted) setMaintenanceFilesError(fetchError.message || 'No se pudieron cargar los archivos.');
      } finally {
        if (mounted) setLoadingMaintenanceFiles(false);
      }
    };

    fetchMaintenanceFiles();

    return () => {
      mounted = false;
    };
  }, [selectedMaintenance, targetQuery]);

  const handleImageChange = (event) => {
    if (!canManageImages) return;

    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setImageUploads((current) => [
      ...current,
      ...selectedFiles.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    setImageUploadError('');
    event.target.value = '';
  };

  const handleObservationImageChange = (event) => {
    if (!canManageObservations) return;

    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setObservationImages((current) => {
      const availableSlots = Math.max(0, 3 - current.length);
      const nextFiles = selectedFiles.slice(0, availableSlots).map((file) => ({ file, preview: URL.createObjectURL(file) }));

      if (selectedFiles.length > availableSlots) {
        setObservationError('Solo puedes subir hasta 3 imagenes por observacion.');
      } else {
        setObservationError('');
      }

      return [...current, ...nextFiles];
    });
    event.target.value = '';
  };

  const handleMaintenanceFileChange = (event) => {
    if (!canManageMaintenances) return;

    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setMaintenanceFiles((current) => [
      ...current,
      ...selectedFiles.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    event.target.value = '';
  };

  const removeDraftFile = (setter, indexToRemove) => {
    setter((current) => {
      const fileToRemove = current[indexToRemove];
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);
      return current.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleUploadImages = async (event) => {
    event.preventDefault();
    if (!canManageImages) return;

    if (imageUploads.length === 0 || !materialImageBasePath) return;

    setImageSaving(true);
    setImageUploadError('');

    try {
      await Promise.all(imageUploads.map(({ file }) => {
        const formData = new FormData();
        formData.append('archivo', file);
        return apiFetch(materialImageBasePath, { method: 'POST', body: formData });
      }));

      resetImageDraft();
      await fetchMaterialImages();
    } catch (saveError) {
      setImageUploadError(saveError.message || 'No se pudieron subir las fotos.');
    } finally {
      setImageSaving(false);
    }
  };

  const handleCreateObservation = async (event) => {
    event.preventDefault();
    if (!canManageObservations) return;

    const trimmedObservation = observationText.trim();
    if (!trimmedObservation) return;

    const payload = {
      ...targetIds,
      observacion: trimmedObservation,
      fecha: getChileDateTime(),
    };

    setObservationSaving(true);
    setObservationError('');
    setObservationNotice('');

    try {
      const createdObservation = await apiFetch('/api/observaciones', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const idObservacion = getObservationId(createdObservation);
      let imageUploadError = null;

      if (observationImages.length > 0) {
        if (!idObservacion) {
          imageUploadError = new Error('La respuesta no incluyo idObservacion para subir imagenes.');
        } else {
          const formData = new FormData();
          observationImages.forEach(({ file }) => formData.append('imagenes', file));
          try {
            await apiFetch(`/api/observaciones/${idObservacion}/imagenes?${targetQuery}`, {
              method: 'POST',
              body: formData,
            });
          } catch (uploadError) {
            imageUploadError = uploadError;
          }
        }
      }

      const nextObservation = {
        ...payload,
        ...(createdObservation || {}),
        idObservacion: idObservacion || createdObservation?.idObservacion || Date.now(),
        observacion: createdObservation?.observacion || payload.observacion,
        fecha: createdObservation?.fecha || payload.fecha,
      };

      setHistory((current) => ({
        ...current,
        observaciones: [nextObservation, ...(current.observaciones || [])],
      }));
      resetObservationDraft();

      if (imageUploadError) {
        setObservationNotice(`La observacion fue creada, pero no se pudieron subir sus imagenes: ${imageUploadError.message}`);
      }
    } catch (saveError) {
      setObservationError(saveError.message || 'No se pudo crear la observacion.');
    } finally {
      setObservationSaving(false);
    }
  };

  const openMaintenanceModal = (mode) => {
    if (!canManageMaintenances) return;

    setMaintenanceModalMode(mode);
    setMaintenanceNotice('');
    setMaintenanceError('');
    maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setMaintenanceFiles([]);
    setMaintenanceForm({
      fecha: mode === 'programada' ? getChileDateTime().slice(0, 10) : '',
      descripcion: '',
      tipo: 'Preventiva',
    });
  };

  const handleCreateMaintenance = async (event) => {
    event.preventDefault();
    if (!canManageMaintenances) return;

    const descripcion = maintenanceForm.descripcion.trim();
    const tipo = maintenanceForm.tipo.trim();
    const isProgramada = maintenanceModalMode === 'programada';
    if (!descripcion || !tipo || (isProgramada && !maintenanceForm.fecha)) return;

    const payload = {
      ...targetIds,
      ...(isProgramada ? { fecha: maintenanceForm.fecha } : {}),
      descripcion,
      tipo,
    };

    setMaintenanceSaving(true);
    setMaintenanceError('');
    setMaintenanceNotice('');

    try {
      const endpoint = isProgramada ? '/api/mantenciones/programadas' : '/api/mantenciones/realizadas';
      const createdMaintenance = await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const idMantencion = getMaintenanceId(createdMaintenance);
      let fileUploadError = null;

      if (maintenanceFiles.length > 0) {
        if (!idMantencion) {
          fileUploadError = new Error('La respuesta no incluyo idMantencion para subir archivos.');
        } else {
          try {
            await Promise.all(maintenanceFiles.map(({ file }) => {
              const formData = new FormData();
              formData.append('archivo', file);
              return apiFetch(`/api/mantenciones/${idMantencion}/archivos?${targetQuery}`, {
                method: 'POST',
                body: formData,
              });
            }));
          } catch (uploadError) {
            fileUploadError = uploadError;
          }
        }
      }

      const nextMaintenance = {
        ...payload,
        ...(createdMaintenance || {}),
        idMantencion: idMantencion || createdMaintenance?.idMantencion || Date.now(),
        estadoMantencion: createdMaintenance?.estadoMantencion || (isProgramada ? 'Programada' : 'Realizada'),
        fecha: createdMaintenance?.fecha || payload.fecha || getChileDateTime(),
      };

      setHistory((current) => ({
        ...current,
        mantenciones: [nextMaintenance, ...(current.mantenciones || [])],
      }));
      resetMaintenanceDraft();

      if (fileUploadError) {
        setMaintenanceNotice(`La mantención fue creada, pero no se pudieron subir sus archivos: ${fileUploadError.message}`);
      }
    } catch (saveError) {
      setMaintenanceError(saveError.message || 'No se pudo crear la mantención.');
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const handleMarkMaintenanceAsDone = async (event, maintenance) => {
    event.stopPropagation();
    if (!canManageMaintenances) return;

    const idMantencion = getMaintenanceId(maintenance);
    if (!idMantencion) return;

    setMarkingMaintenanceId(idMantencion);
    setMaintenanceNotice('');

    try {
      const updatedMaintenance = await apiFetch(`/api/mantenciones/${idMantencion}/realizada`, {
        method: 'PATCH',
        body: JSON.stringify(targetIds),
      });

      setHistory((current) => ({
        ...current,
        mantenciones: (current.mantenciones || []).map((item) => (
          String(getMaintenanceId(item)) === String(idMantencion)
            ? { ...item, ...(updatedMaintenance || {}), estadoMantencion: updatedMaintenance?.estadoMantencion || 'Realizada' }
            : item
        )),
      }));
    } catch (saveError) {
      setMaintenanceNotice(saveError.message || 'No se pudo marcar la mantención como realizada.');
    } finally {
      setMarkingMaintenanceId(null);
    }
  };

  const handleUpdateEppDetail = async (event) => {
    event.preventDefault();
    if (!canEdit || !itemId || editSaving) return;

    const payload = {
      talla: editForm.talla.trim(),
      estadoEpp: editForm.estadoEpp,
      fechaVencimiento: editForm.fechaVencimiento ? new Date(editForm.fechaVencimiento).toISOString() : null,
    };

    if (!payload.talla || !payload.estadoEpp || !payload.fechaVencimiento) {
      setEditError('Completa talla, estado y vencimiento.');
      return;
    }

    setEditSaving(true);
    setEditError('');

    try {
      const updatedDetail = await apiFetch(`/api/materiales/items/${itemId}/detalle-epp`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setDetail((current) => ({
        ...current,
        ...(updatedDetail || {}),
        ...payload,
        estadoEpp: normalizeEstado(payload.estadoEpp),
      }));
      setShowEditModal(false);
    } catch (saveError) {
      setEditError(saveError.message || 'No se pudo editar el EPP.');
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeactivateEpp = async (event) => {
    event.preventDefault();
    const motivo = deactivationReason.trim();
    if (!canDeactivate || !itemId || !motivo || deactivationSaving) return;

    setDeactivationSaving(true);
    setDeactivationError('');

    try {
      await apiFetch('/api/materiales/items/restar', {
        method: 'POST',
        body: JSON.stringify({
          idItem: Number(itemId),
          motivo,
          fecha: new Date().toISOString(),
        }),
      });

      setShowDeactivateModal(false);
      await onRemoved?.();
      onBack?.();
    } catch (saveError) {
      setDeactivationError(saveError.message || 'No se pudo dar de baja el EPP.');
    } finally {
      setDeactivationSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto bg-dark-bg p-8 text-text-main fade-in">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface px-4 py-2 text-sm font-semibold text-text-main transition-colors hover:border-brand-cyan/50 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Volver
        </button>
        {!loading && !error && (canEdit || canDeactivate) && (
          <div className="flex items-center gap-2">
            {canEdit && (
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-2 rounded-lg border border-dark-border bg-dark-surface px-4 py-2 text-sm font-semibold text-white transition-colors hover:border-brand-cyan/50"
              >
                <svg className="h-4 w-4 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M4 20h4.5L19 9.5a2.5 2.5 0 00-3.536-3.536L5 16.5V20z"></path></svg>
                Editar
              </button>
            )}
            {canDeactivate && (
              <button
                type="button"
                onClick={openDeactivateModal}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                Dar de baja
              </button>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-dark-border bg-dark-surface px-6 py-20 text-center text-text-muted">
          Cargando detalle EPP...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-brand-red/30 bg-brand-red/10 px-6 py-12 text-center">
          <p className="text-sm font-semibold text-brand-red">{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <section className="rounded-xl border border-dark-border bg-dark-surface p-6 shadow-lg">
            <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-stretch">
              <div className="rounded-xl border border-dark-border bg-dark-bg p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Fotos del item</p>
                    <p className="mt-1 text-sm font-bold text-white">{materialImages.length} registrada{materialImages.length === 1 ? '' : 's'}</p>
                  </div>
                  {canManageImages && (
                    <button
                      type="button"
                      onClick={() => setShowImageModal(true)}
                      className="rounded-lg border border-brand-cyan/30 bg-brand-cyan/10 px-3 py-2 text-xs font-bold text-brand-cyan transition-colors hover:bg-brand-cyan/20"
                    >
                      + Agregar
                    </button>
                  )}
                </div>
                {loadingMaterialImages ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-dark-border text-sm text-text-muted">
                    Cargando fotos...
                  </div>
                ) : materialImagesError ? (
                  <div className="flex h-48 items-center justify-center rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 text-center text-xs text-brand-red">
                    {materialImagesError}
                  </div>
                ) : primaryImage ? (
                  <div className="space-y-2">
                    <a href={primaryImage.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-dark-border">
                      <img src={primaryImage.url} alt={primaryImage.nombre} className="h-48 w-full object-cover" />
                    </a>
                    {materialImages.length > 1 && (
                      <div className="grid grid-cols-4 gap-2">
                        {materialImages.slice(1, 5).map((image) => (
                          <a key={image.idArchivo} href={image.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-md border border-dark-border">
                            <img src={image.url} alt={image.nombre} className="h-14 w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ) : canManageImages ? (
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-surface/60 text-center text-sm text-text-muted transition-colors hover:border-brand-cyan/50 hover:text-brand-cyan"
                  >
                    <span className="font-semibold">Sin fotos</span>
                    <span className="mt-1 text-xs">Agregar primera foto</span>
                  </button>
                ) : (
                  <div className="flex h-48 w-full flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-surface/60 text-center text-sm text-text-muted">
                    <span className="font-semibold">Sin fotos</span>
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-col justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan">
                    <Icons.Shield />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan">Equipo de Protección Personal</p>
                    <h2 className="rajdhani mt-1 text-3xl font-bold text-white">{detail.nombreMaterial || 'EPP sin nombre'}</h2>
                    <p className="mt-2 max-w-3xl text-sm leading-relaxed text-text-muted">{detail.descripcionMaterial || 'Sin descripción registrada.'}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                        normalizeEstado(detail.estadoEpp || detail.estadoInventario) === 'Buen Estado' ? 'bg-brand-green border-brand-green/20 text-white' :
                        normalizeEstado(detail.estadoEpp || detail.estadoInventario) === 'Desgastada' ? 'bg-brand-gold border-brand-gold/20 text-white' :
                        normalizeEstado(detail.estadoEpp || detail.estadoInventario) === 'Mal Estado' ? 'bg-brand-red border-brand-red/20 text-white' :
                        'bg-dark-bg3 border-dark-border text-text-muted'
                      }`}>
                        {normalizeEstado(detail.estadoEpp || detail.estadoInventario)}
                      </span>
                      {detail.nombreTipoProducto && (
                        <span className="inline-flex rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-1 text-xs font-bold text-brand-cyan">
                          {detail.nombreTipoProducto}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-xl border border-brand-cyan/20 bg-brand-cyan/10 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-cyan/80">Código</p>
                    <p className="mt-1 text-lg font-bold text-brand-cyan">{detail.codigoUnico || '-'}</p>
                  </div>
                  <div className="rounded-xl border border-dark-border bg-dark-bg px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Talla</p>
                    <p className="mt-1 text-lg font-bold text-white">{detail.talla || 'Sin talla'}</p>
                  </div>
                  <div className="rounded-xl border border-dark-border bg-dark-bg px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Vencimiento</p>
                    <p className="mt-1 text-lg font-bold text-white">{formatDate(detail.fechaVencimiento)}</p>
                  </div>
                  <div className="rounded-xl border border-dark-border bg-dark-bg px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Inventario</p>
                    <p className="mt-1 text-lg font-bold text-white">{normalizeEstado(detail.estadoInventario || detail.estadoEpp) || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="rajdhani text-xl font-bold text-white">Observaciones</h3>
                    <p className="mt-1 text-sm text-text-muted">Historial y comentarios del item.</p>
                  </div>
                  {canManageObservations && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowObservationForm(true);
                        setObservationError('');
                      }}
                      className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs font-bold text-white transition-colors hover:border-brand-cyan/50"
                    >
                      + Agregar
                    </button>
                  )}
                </div>
                {observationNotice && <p className="mb-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{observationNotice}</p>}
                <div className="custom-scrollbar max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {history.observaciones.length > 0 ? history.observaciones.map((obs) => (
                    <article
                      key={obs.idObservacion || `${obs.fecha}-${obs.observacion}`}
                      className="cursor-pointer rounded-lg border border-dark-border bg-dark-bg p-4 transition-colors hover:border-brand-cyan/50"
                      onClick={() => setSelectedObservation(obs)}
                      role="button"
                      tabIndex={0}
                    >
                      <p className="text-xs text-text-muted">{formatDate(obs.fecha)}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white">{obs.observacion || 'Sin detalle'}</p>
                    </article>
                  )) : (
                    <EmptyState>No hay observaciones registradas.</EmptyState>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-dark-border bg-dark-surface p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="rajdhani text-xl font-bold text-white">Mantenciones</h3>
                    <p className="mt-1 text-sm text-text-muted">Programadas y realizadas.</p>
                  </div>
                  {canManageMaintenances && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openMaintenanceModal('programada')}
                        className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs font-bold text-white transition-colors hover:border-brand-cyan/50"
                      >
                        Programar
                      </button>
                      <button
                        type="button"
                        onClick={() => openMaintenanceModal('realizada')}
                        className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-xs font-bold text-white transition-colors hover:border-brand-cyan/50"
                      >
                        + Agregar
                      </button>
                    </div>
                  )}
                </div>
                {maintenanceNotice && <p className="mb-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{maintenanceNotice}</p>}
                <div className="custom-scrollbar max-h-[360px] space-y-3 overflow-y-auto pr-1">
                  {sortedMaintenances.length > 0 ? sortedMaintenances.map((mant) => (
                    <article
                      key={mant.idMantencion || `${mant.fecha}-${mant.descripcion}`}
                      className="cursor-pointer rounded-lg border border-dark-border bg-dark-bg p-4 transition-colors hover:border-brand-cyan/50"
                      onClick={() => setSelectedMaintenance(mant)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs text-text-muted">{formatDate(mant.fecha)}</p>
                        {mant.estadoMantencion && (
                          <span className="rounded-full bg-brand-cyan/10 px-2 py-0.5 text-xs font-semibold text-brand-cyan">{mant.estadoMantencion}</span>
                        )}
                      </div>
                      <p className="mt-2 text-sm font-bold text-white">{mant.tipo || 'Mantención'}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-text-muted">{mant.descripcion || 'Sin detalle'}</p>
                      {isMaintenancePending(mant) && canManageMaintenances && (
                        <div className="mt-3 flex justify-end">
                          <button
                            type="button"
                            onClick={(event) => handleMarkMaintenanceAsDone(event, mant)}
                            disabled={String(markingMaintenanceId) === String(getMaintenanceId(mant))}
                            className="rounded-lg border border-brand-green/30 bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-green transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {String(markingMaintenanceId) === String(getMaintenanceId(mant)) ? 'Marcando...' : 'Marcar realizada'}
                          </button>
                        </div>
                      )}
                    </article>
                  )) : (
                    <EmptyState>No hay mantenciones registradas.</EmptyState>
                  )}
                </div>
              </div>
          </section>
        </div>
      )}

      {showEditModal && canEdit && (
        <Modal
          title="Editar EPP"
          subtitle={detail?.nombreMaterial}
          onClose={closeEditModal}
          footer={(
            <>
              <button type="button" onClick={closeEditModal} disabled={editSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-brand-cyan disabled:opacity-50">Cancelar</button>
              <button type="submit" form="epp-edit-form" disabled={editSaving} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{editSaving ? 'Guardando...' : 'Guardar cambios'}</button>
            </>
          )}
        >
          <form id="epp-edit-form" onSubmit={handleUpdateEppDetail} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Talla</span>
              <input
                type="text"
                value={editForm.talla}
                onChange={(event) => setEditForm((current) => ({ ...current, talla: event.target.value }))}
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-brand-cyan"
                disabled={editSaving}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Estado</span>
              <select
                value={editForm.estadoEpp}
                onChange={(event) => setEditForm((current) => ({ ...current, estadoEpp: event.target.value }))}
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-brand-cyan"
                disabled={editSaving}
              >
                {EPP_STATES.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Fecha de vencimiento</span>
              <input
                type="date"
                value={editForm.fechaVencimiento}
                onChange={(event) => setEditForm((current) => ({ ...current, fechaVencimiento: event.target.value }))}
                className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-brand-cyan"
                disabled={editSaving}
              />
            </label>
            {editError && <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{editError}</p>}
          </form>
        </Modal>
      )}

      {showDeactivateModal && canDeactivate && (
        <Modal
          title="Dar de baja EPP"
          subtitle={detail?.nombreMaterial}
          onClose={closeDeactivateModal}
          footer={(
            <>
              <button type="button" onClick={closeDeactivateModal} disabled={deactivationSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-brand-cyan disabled:opacity-50">Cancelar</button>
              <button type="submit" form="epp-deactivate-form" disabled={!deactivationReason.trim() || deactivationSaving} className="rounded-lg bg-brand-red px-4 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{deactivationSaving ? 'Procesando...' : 'Confirmar baja'}</button>
            </>
          )}
        >
          <form id="epp-deactivate-form" onSubmit={handleDeactivateEpp} className="space-y-4">
            <div className="rounded-lg border border-dark-border bg-dark-bg px-4 py-3">
              <p className="text-sm font-semibold text-white">{detail?.nombreMaterial || 'EPP'}</p>
              <p className="mt-1 font-mono text-xs text-text-muted">{detail?.codigoUnico || '-'}</p>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Motivo de la baja</span>
              <textarea
                value={deactivationReason}
                onChange={(event) => setDeactivationReason(event.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-text-muted focus:border-brand-cyan"
                placeholder="Describe por que se da de baja"
                disabled={deactivationSaving}
              />
            </label>
            {deactivationError && <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{deactivationError}</p>}
          </form>
        </Modal>
      )}

      {showImageModal && canManageImages && (
        <Modal
          title="Agregar fotos"
          subtitle={detail?.nombreMaterial}
          onClose={() => {
            if (!imageSaving) resetImageDraft();
          }}
          footer={(
            <>
              <button type="button" onClick={resetImageDraft} disabled={imageSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-brand-cyan disabled:opacity-50">Cancelar</button>
              <button type="submit" form="epp-image-form" disabled={imageSaving || imageUploads.length === 0} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{imageSaving ? 'Subiendo...' : 'Subir fotos'}</button>
            </>
          )}
        >
          <form id="epp-image-form" onSubmit={handleUploadImages} className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-6 text-center transition-colors hover:border-brand-cyan/60">
              <span className="text-sm font-semibold text-white">Seleccionar imagenes</span>
              <span className="mt-1 text-xs text-text-muted">PNG, JPG, JPEG o WEBP</span>
              <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" multiple className="hidden" onChange={handleImageChange} disabled={imageSaving} />
            </label>
            {imageUploads.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {imageUploads.map((image, index) => (
                  <div key={`${image.file.name}-${image.preview}`} className="relative overflow-hidden rounded-lg border border-dark-border">
                    <img src={image.preview} alt={image.file.name} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => removeDraftFile(setImageUploads, index)} disabled={imageSaving} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">x</button>
                  </div>
                ))}
              </div>
            )}
            {imageUploadError && <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{imageUploadError}</p>}
          </form>
        </Modal>
      )}

      {showObservationForm && canManageObservations && (
        <Modal
          title="Agregar observacion"
          subtitle={detail?.nombreMaterial}
          onClose={() => {
            if (!observationSaving) resetObservationDraft();
          }}
          footer={(
            <>
              <button type="button" onClick={resetObservationDraft} disabled={observationSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-brand-cyan disabled:opacity-50">Cancelar</button>
              <button type="submit" form="epp-observation-form" disabled={!observationText.trim() || observationSaving} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{observationSaving ? 'Guardando...' : 'Guardar observacion'}</button>
            </>
          )}
        >
          <form id="epp-observation-form" onSubmit={handleCreateObservation} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Observacion</span>
              <textarea value={observationText} onChange={(event) => setObservationText(event.target.value)} rows={5} className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-text-muted focus:border-brand-cyan" placeholder="Escribe el detalle..." />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-5 text-center transition-colors hover:border-brand-cyan/60">
              <span className="text-sm font-semibold text-white">{observationImages.length >= 3 ? 'Limite de 3 imagenes alcanzado' : 'Seleccionar imagenes'}</span>
              <span className="mt-1 text-xs text-text-muted">Maximo 3 fotos.</span>
              <input type="file" accept="image/png,image/jpeg,image/jpg" multiple className="hidden" onChange={handleObservationImageChange} disabled={observationSaving || observationImages.length >= 3} />
            </label>
            {observationImages.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {observationImages.map((image, index) => (
                  <div key={`${image.file.name}-${image.preview}`} className="relative overflow-hidden rounded-lg border border-dark-border">
                    <img src={image.preview} alt={`Vista previa ${index + 1}`} className="h-24 w-full object-cover" />
                    <button type="button" onClick={() => removeDraftFile(setObservationImages, index)} disabled={observationSaving} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">x</button>
                  </div>
                ))}
              </div>
            )}
            {observationError && <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{observationError}</p>}
          </form>
        </Modal>
      )}

      {maintenanceModalMode && canManageMaintenances && (
        <Modal
          title={maintenanceModalMode === 'programada' ? 'Programar mantención' : 'Agregar mantención'}
          subtitle={detail?.nombreMaterial}
          onClose={() => {
            if (!maintenanceSaving) resetMaintenanceDraft();
          }}
          footer={(
            <>
              <button type="button" onClick={resetMaintenanceDraft} disabled={maintenanceSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-brand-cyan disabled:opacity-50">Cancelar</button>
              <button type="submit" form="epp-maintenance-form" disabled={maintenanceSaving || !maintenanceForm.tipo.trim() || !maintenanceForm.descripcion.trim() || (maintenanceModalMode === 'programada' && !maintenanceForm.fecha)} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">{maintenanceSaving ? 'Guardando...' : maintenanceModalMode === 'programada' ? 'Programar' : 'Guardar mantención'}</button>
            </>
          )}
        >
          <form id="epp-maintenance-form" onSubmit={handleCreateMaintenance} className="space-y-4">
            {maintenanceModalMode === 'programada' && (
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Fecha</span>
                <input type="date" value={maintenanceForm.fecha} onChange={(event) => setMaintenanceForm((current) => ({ ...current, fecha: event.target.value }))} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-brand-cyan" disabled={maintenanceSaving} />
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Tipo</span>
              <select value={maintenanceForm.tipo} onChange={(event) => setMaintenanceForm((current) => ({ ...current, tipo: event.target.value }))} className="w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors focus:border-brand-cyan" disabled={maintenanceSaving}>
                <option value="Preventiva">Preventiva</option>
                <option value="Correctiva">Correctiva</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-white">Descripción</span>
              <textarea value={maintenanceForm.descripcion} onChange={(event) => setMaintenanceForm((current) => ({ ...current, descripcion: event.target.value }))} rows={5} className="w-full resize-none rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-text-muted focus:border-brand-cyan" placeholder="Describe la mantención..." disabled={maintenanceSaving} />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-5 text-center transition-colors hover:border-brand-cyan/60">
              <span className="text-sm font-semibold text-white">Seleccionar archivos</span>
              <span className="mt-1 text-xs text-text-muted">Puedes subir imagenes, PDF u otros documentos.</span>
              <input type="file" multiple className="hidden" onChange={handleMaintenanceFileChange} disabled={maintenanceSaving} />
            </label>
            {maintenanceFiles.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {maintenanceFiles.map((fileItem, index) => (
                  <div key={`${fileItem.file.name}-${fileItem.preview}`} className="relative rounded-lg border border-dark-border bg-dark-bg p-2">
                    {isImageFile(fileItem) ? (
                      <img src={fileItem.preview} alt={fileItem.file.name} className="mb-2 h-24 w-full rounded object-cover" />
                    ) : (
                      <div className="mb-2 flex h-24 items-center justify-center rounded bg-brand-cyan/10 text-2xl text-brand-cyan">Archivo</div>
                    )}
                    <p className="truncate pr-7 text-xs font-semibold text-white">{fileItem.file.name}</p>
                    <button type="button" onClick={() => removeDraftFile(setMaintenanceFiles, index)} disabled={maintenanceSaving} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">x</button>
                  </div>
                ))}
              </div>
            )}
            {maintenanceError && <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{maintenanceError}</p>}
          </form>
        </Modal>
      )}

      {selectedObservation && (
        <Modal title="Detalle de observacion" subtitle={formatDate(selectedObservation.fecha)} onClose={() => setSelectedObservation(null)}>
          <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Descripción</p>
            <p className="mt-2 text-sm leading-relaxed text-white">{selectedObservation.observacion || 'Sin detalle'}</p>
          </div>
          <div className="mt-5">
            <h4 className="mb-3 text-sm font-bold text-white">Imagenes</h4>
            {loadingObservationImages ? (
              <EmptyState>Cargando imagenes...</EmptyState>
            ) : observationImagesError ? (
              <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{observationImagesError}</p>
            ) : observationDetailImages.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {observationDetailImages.map((image) => (
                  <a key={image.idArchivo} href={image.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-dark-border bg-dark-bg transition-colors hover:border-brand-cyan/60">
                    <img src={image.url} alt={image.nombre} className="h-44 w-full object-cover" />
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-semibold text-white">{image.nombre}</p>
                      {image.fechaSubida && <p className="mt-1 text-[11px] text-text-muted">{formatDate(image.fechaSubida)}</p>}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState>Esta observacion no tiene imagenes.</EmptyState>
            )}
          </div>
        </Modal>
      )}

      {selectedMaintenance && (
        <Modal title="Detalle de mantención" subtitle={formatDate(selectedMaintenance.fecha)} onClose={() => setSelectedMaintenance(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Tipo</p>
              <p className="mt-2 text-sm font-bold text-white">{selectedMaintenance.tipo || 'Mantención'}</p>
            </div>
            <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Estado</p>
              <p className="mt-2 text-sm font-bold text-white">{selectedMaintenance.estadoMantencion || 'Sin estado'}</p>
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-dark-border bg-dark-bg p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Descripción</p>
            <p className="mt-2 text-sm leading-relaxed text-white">{selectedMaintenance.descripcion || 'Sin detalle'}</p>
          </div>
          <div className="mt-5">
            <h4 className="mb-3 text-sm font-bold text-white">Imagenes y archivos</h4>
            {loadingMaintenanceFiles ? (
              <EmptyState>Cargando archivos...</EmptyState>
            ) : maintenanceFilesError ? (
              <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{maintenanceFilesError}</p>
            ) : maintenanceDetailFiles.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {maintenanceDetailFiles.map((file) => (
                  <a key={file.idArchivo} href={file.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg border border-dark-border bg-dark-bg transition-colors hover:border-brand-cyan/60">
                    {isImageFile(file) ? (
                      <img src={file.url} alt={file.nombre} className="h-44 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 items-center justify-center bg-brand-cyan/10 text-sm font-bold text-brand-cyan">Archivo</div>
                    )}
                    <div className="px-3 py-2">
                      <p className="truncate text-xs font-semibold text-white">{file.nombre}</p>
                      {file.fechaSubida && <p className="mt-1 text-[11px] text-text-muted">{formatDate(file.fechaSubida)}</p>}
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <EmptyState>Esta mantención no tiene archivos.</EmptyState>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default EppDetailView;
