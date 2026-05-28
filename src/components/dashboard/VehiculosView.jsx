import { useCallback, useEffect, useRef, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { apiFetch } from '../../services/api';

const VEHICLE_TYPES = [
  'Carro bomba',
  'Ambulancia',
  'Rescate',
];

const getArrayPayload = (payload, keys = []) => {
  if (Array.isArray(payload)) return payload;

  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }

  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.value)) return payload.value;

  if (payload?.data && typeof payload.data === 'object') return getArrayPayload(payload.data, keys);
  if (payload?.result && typeof payload.result === 'object') return getArrayPayload(payload.result, keys);

  return [];
};

const getImageFileId = (image) => {
  if (typeof image === 'number' || typeof image === 'string') return image;
  return image?.idArchivo || image?.id || null;
};

const getTemporaryImageUrl = (payload) => {
  if (typeof payload === 'string') return payload;
  return payload?.url || payload?.data?.url || payload?.result?.url || '';
};

const getObservationId = (payload) => (
  payload?.idObservacion || payload?.id || payload?.data?.idObservacion || payload?.data?.id || null
);

const getMaintenanceId = (payload) => (
  payload?.idMantencion || payload?.id || payload?.data?.idMantencion || payload?.data?.id || null
);

const fetchVehiclePreviewImage = async (vehicleId) => {
  if (!vehicleId) return '';

  const imageBasePath = `/api/vehiculos/${vehicleId}/imagenes`;
  const imageListPayload = await apiFetch(imageBasePath);
  const firstImage = getArrayPayload(imageListPayload, ['imagenes', 'archivos', 'files'])[0];
  if (!firstImage) return '';

  const directUrl = getTemporaryImageUrl(firstImage);
  if (directUrl) return directUrl;

  const idArchivo = getImageFileId(firstImage);
  if (!idArchivo) return '';

  const urlPayload = await apiFetch(`${imageBasePath}/${idArchivo}/url`);
  return getTemporaryImageUrl(urlPayload);
};

const isImageFile = (fileItem) => {
  const contentType = fileItem?.contentType || fileItem?.file?.type || '';
  const name = fileItem?.nombre || fileItem?.nombreOriginal || fileItem?.file?.name || '';

  return contentType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name);
};

const isMaintenancePending = (maintenance) => (
  String(maintenance?.estadoMantencion || '').toLowerCase().includes('pendiente')
  || String(maintenance?.estadoMantencion || '').toLowerCase().includes('programada')
);

const formatDate = (value) => {
  if (!value) return 'Sin fecha';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const mapVehiculo = (v) => ({
  id: v.idVehiculo || v.id,
  idVehiculo: v.idVehiculo || v.id,
  nombre: v.nombre || v.name || v.nomenclatura || `Unidad ${v.patente || ''}`,
  patente: v.patente || 'S/N',
  tipo: v.tipoVehiculo || v.tipo || 'Material Mayor',
  modelo: v.modelo || v.descripcion || v.descripcionUbicacion || 'Sin especificar',
  descripcion: v.descripcion || v.descripcionUbicacion || v.modelo || 'Sin descripción registrada.',
  estado: v.estadoVehiculo || v.estado || 'Operativo',
  estadoUbicacion: v.estadoUbicacion || '',
  observaciones: Array.isArray(v.observaciones) ? v.observaciones : [],
  mantenciones: Array.isArray(v.mantenciones) ? v.mantenciones : [],
});

function VehiculosView({
  canManageVehicles = true,
  canManageImages = true,
  canManageObservations = true,
  canManageMaintenances = true,
}) {
  const [view, setView] = useState('list');
  const [selectedVehiculo, setSelectedVehiculo] = useState(null);
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingVehiculo, setSavingVehiculo] = useState(false);
  const [addError, setAddError] = useState('');

  const [formData, setFormData] = useState({
    descripcion: '',
    nomenclatura: '',
    tipoVehiculo: '',
    estadoVehiculo: 'Operativo',
    patente: '',
  });

  const [isEditingPatente, setIsEditingPatente] = useState(false);
  const [tempPatente, setTempPatente] = useState('');
  const [vehicleImages, setVehicleImages] = useState([]);
  const [vehiclePreviewImages, setVehiclePreviewImages] = useState({});
  const [loadingVehicleDetail, setLoadingVehicleDetail] = useState(false);
  const [vehicleDetailError, setVehicleDetailError] = useState('');
  const [loadingVehicleImages, setLoadingVehicleImages] = useState(false);
  const [vehicleImagesError, setVehicleImagesError] = useState('');
  const [uploadingVehicleImage, setUploadingVehicleImage] = useState(false);
  const [deletingVehicleImageId, setDeletingVehicleImageId] = useState(null);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageRequestRef = useRef(0);
  const vehiclePreviewRequestRef = useRef(0);

  const [showAddObs, setShowAddObs] = useState(false);
  const [newObs, setNewObs] = useState({ observacion: '' });
  const [observationImages, setObservationImages] = useState([]);
  const [observationSaving, setObservationSaving] = useState(false);
  const [observationError, setObservationError] = useState('');
  const [observationNotice, setObservationNotice] = useState('');
  const [selectedObservation, setSelectedObservation] = useState(null);
  const [observationDetailImages, setObservationDetailImages] = useState([]);
  const [loadingObservationImages, setLoadingObservationImages] = useState(false);
  const [observationImagesError, setObservationImagesError] = useState('');
  const observationImagesRef = useRef([]);

  const [maintenanceModalMode, setMaintenanceModalMode] = useState(null);
  const [newMant, setNewMant] = useState({ fecha: '', tipo: 'Preventiva', descripcion: '' });
  const [maintenanceFiles, setMaintenanceFiles] = useState([]);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');
  const [maintenanceNotice, setMaintenanceNotice] = useState('');
  const [markingMaintenanceId, setMarkingMaintenanceId] = useState(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [maintenanceDetailFiles, setMaintenanceDetailFiles] = useState([]);
  const [loadingMaintenanceFiles, setLoadingMaintenanceFiles] = useState(false);
  const [maintenanceFilesError, setMaintenanceFilesError] = useState('');
  const maintenanceFilesRef = useRef([]);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/vehiculos');
      const mappedVehicles = getArrayPayload(data, ['vehiculos']).map(mapVehiculo);
      setVehiculos(mappedVehicles);
      setVehiclePreviewImages({});

      const requestId = vehiclePreviewRequestRef.current + 1;
      vehiclePreviewRequestRef.current = requestId;
      Promise.all(mappedVehicles.map(async (vehiculo) => {
        try {
          const url = await fetchVehiclePreviewImage(vehiculo.idVehiculo || vehiculo.id);
          return url ? [vehiculo.id, url] : null;
        } catch {
          return null;
        }
      })).then((previews) => {
        if (vehiclePreviewRequestRef.current === requestId) {
          setVehiclePreviewImages(Object.fromEntries(previews.filter(Boolean)));
        }
      });
    } catch (error) {
      console.error('Error al cargar vehiculos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchVehiculos();
  }, []);

  const selectedId = selectedVehiculo?.idVehiculo || selectedVehiculo?.id;
  const imageBasePath = selectedId ? `/api/vehiculos/${selectedId}/imagenes` : '';
  const vehicleTargetQuery = selectedId ? `idVehiculo=${encodeURIComponent(selectedId)}` : '';
  const primaryVehicleImage = vehicleImages[0] || null;
  const vehicleImageSlotsAvailable = Math.max(0, 3 - vehicleImages.length);

  const updateVehiculo = (updatedV) => {
    setVehiculos((current) => current.map((v) => v.id === updatedV.id ? updatedV : v));
    setSelectedVehiculo(updatedV);
  };

  const fetchVehicleDetail = useCallback(async () => {
    if (!selectedId) return;

    setLoadingVehicleDetail(true);
    setVehicleDetailError('');

    try {
      const data = await apiFetch(`/api/vehiculos/${selectedId}`);
      const mappedDetail = mapVehiculo(data);

      setVehiculos((current) => current.map((vehiculo) => (
        String(vehiculo.id) === String(mappedDetail.id)
          ? { ...vehiculo, ...mappedDetail }
          : vehiculo
      )));
      setSelectedVehiculo((current) => (
        current && String(current.id) === String(mappedDetail.id)
          ? { ...current, ...mappedDetail }
          : mappedDetail
      ));
    } catch (err) {
      setVehicleDetailError(err.message || 'No se pudo cargar el detalle del vehiculo.');
    } finally {
      setLoadingVehicleDetail(false);
    }
  }, [selectedId]);

  const fetchVehicleImages = useCallback(async () => {
    if (!imageBasePath) return;

    const requestId = imageRequestRef.current + 1;
    imageRequestRef.current = requestId;
    setLoadingVehicleImages(true);
    setVehicleImagesError('');

    try {
      const imageListPayload = await apiFetch(imageBasePath);
      const imageList = getArrayPayload(imageListPayload, ['imagenes', 'archivos', 'files']);
      const imagesWithUrls = await Promise.all(imageList.map(async (image) => {
        const idArchivo = getImageFileId(image);
        if (!idArchivo) return null;

        const urlPayload = await apiFetch(`${imageBasePath}/${idArchivo}/url`);
        const url = getTemporaryImageUrl(urlPayload);

        return {
          idArchivo,
          nombre: image?.nombreOriginal || image?.nombre || `Imagen ${idArchivo}`,
          contentType: image?.contentType || '',
          fechaSubida: image?.fechaSubida || '',
          url,
        };
      }));

      if (imageRequestRef.current === requestId) {
        const validImages = imagesWithUrls.filter((image) => image?.url);
        setVehicleImages(validImages);
        setVehiclePreviewImages(current => ({
          ...current,
          [selectedId]: validImages[0]?.url || '',
        }));
      }
    } catch (err) {
      if (imageRequestRef.current === requestId) {
        setVehicleImagesError(err.message || 'No se pudieron cargar las imagenes del vehiculo.');
        setVehicleImages([]);
      }
    } finally {
      if (imageRequestRef.current === requestId) setLoadingVehicleImages(false);
    }
  }, [imageBasePath]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (view === 'detail') fetchVehicleImages();
  }, [fetchVehicleImages, view]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (view === 'detail') fetchVehicleDetail();
  }, [fetchVehicleDetail, view]);

  useEffect(() => {
    if (!selectedObservation || !vehicleTargetQuery) return;

    let mounted = true;
    const idObservacion = getObservationId(selectedObservation);

    const fetchObservationImages = async () => {
      if (!idObservacion) {
        setObservationDetailImages([]);
        setObservationImagesError('Esta observacion no tiene id para consultar imagenes.');
        return;
      }

      setLoadingObservationImages(true);
      setObservationImagesError('');
      setObservationDetailImages([]);

      try {
        const imageListPayload = await apiFetch(`/api/observaciones/${idObservacion}/imagenes?${vehicleTargetQuery}`);
        const imageList = getArrayPayload(imageListPayload, ['imagenes', 'archivos', 'files']);
        const imagesWithUrls = await Promise.all(imageList.map(async (image) => {
          const idArchivo = getImageFileId(image);
          if (!idArchivo) return null;

          const urlPayload = await apiFetch(`/api/observaciones/${idObservacion}/imagenes/${idArchivo}/url?${vehicleTargetQuery}`);
          const url = getTemporaryImageUrl(urlPayload);

          return {
            idArchivo,
            nombre: image?.nombreOriginal || image?.nombre || `Imagen ${idArchivo}`,
            contentType: image?.contentType || '',
            tamanioBytes: image?.tamanioBytes || 0,
            fechaSubida: image?.fechaSubida || '',
            url,
          };
        }));

        if (mounted) {
          setObservationDetailImages(imagesWithUrls.filter((image) => image?.url));
        }
      } catch (err) {
        if (mounted) {
          setObservationImagesError(err.message || 'No se pudieron cargar las imagenes.');
        }
      } finally {
        if (mounted) {
          setLoadingObservationImages(false);
        }
      }
    };

    fetchObservationImages();

    return () => {
      mounted = false;
    };
  }, [selectedObservation, vehicleTargetQuery]);

  useEffect(() => {
    if (!selectedMaintenance || !vehicleTargetQuery) return;

    let mounted = true;
    const idMantencion = getMaintenanceId(selectedMaintenance);

    const fetchMaintenanceFiles = async () => {
      if (!idMantencion) {
        setMaintenanceDetailFiles([]);
        setMaintenanceFilesError('Esta mantención no tiene id para consultar archivos.');
        return;
      }

      setLoadingMaintenanceFiles(true);
      setMaintenanceFilesError('');
      setMaintenanceDetailFiles([]);

      try {
        const fileListPayload = await apiFetch(`/api/mantenciones/${idMantencion}/archivos?${vehicleTargetQuery}`);
        const fileList = getArrayPayload(fileListPayload, ['archivos', 'imagenes', 'files']);
        const filesWithUrls = await Promise.all(fileList.map(async (file) => {
          const idArchivo = getImageFileId(file);
          if (!idArchivo) return null;

          const urlPayload = await apiFetch(`/api/mantenciones/${idMantencion}/archivos/${idArchivo}/url?${vehicleTargetQuery}`);
          const url = getTemporaryImageUrl(urlPayload);

          return {
            idArchivo,
            nombre: file?.nombreOriginal || file?.nombre || `Archivo ${idArchivo}`,
            contentType: file?.contentType || '',
            tamanioBytes: file?.tamanioBytes || 0,
            fechaSubida: file?.fechaSubida || '',
            url,
          };
        }));

        if (mounted) {
          setMaintenanceDetailFiles(filesWithUrls.filter((file) => file?.url));
        }
      } catch (err) {
        if (mounted) {
          setMaintenanceFilesError(err.message || 'No se pudieron cargar los archivos.');
        }
      } finally {
        if (mounted) {
          setLoadingMaintenanceFiles(false);
        }
      }
    };

    fetchMaintenanceFiles();

    return () => {
      mounted = false;
    };
  }, [selectedMaintenance, vehicleTargetQuery]);

  useEffect(() => {
    observationImagesRef.current = observationImages;
  }, [observationImages]);

  useEffect(() => {
    maintenanceFilesRef.current = maintenanceFiles;
  }, [maintenanceFiles]);

  useEffect(() => () => {
    observationImagesRef.current.forEach((image) => URL.revokeObjectURL(image.preview));
    maintenanceFilesRef.current.forEach((file) => URL.revokeObjectURL(file.preview));
  }, []);

  const resetDetailForms = () => {
    setIsEditingPatente(false);
    setShowAddObs(false);
    setNewObs({ observacion: '' });
    observationImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setObservationImages([]);
    setObservationError('');
    setObservationNotice('');
    setSelectedObservation(null);
    setMaintenanceModalMode(null);
    setNewMant({ fecha: '', tipo: 'Preventiva', descripcion: '' });
    maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setMaintenanceFiles([]);
    setMaintenanceError('');
    setMaintenanceNotice('');
    setSelectedMaintenance(null);
    setImageUploadError('');
  };

  const openDetail = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setView('detail');
    setVehicleImages([]);
    setVehicleImagesError('');
    setVehicleDetailError('');
    resetDetailForms();
  };

  const resetAddForm = () => {
    setFormData({
      descripcion: '',
      nomenclatura: '',
      tipoVehiculo: '',
      estadoVehiculo: 'Operativo',
      patente: '',
    });
    setAddError('');
  };

  const closeAddModal = () => {
    if (savingVehiculo) return;
    setShowAddModal(false);
    resetAddForm();
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!canManageVehicles || savingVehiculo) return;

    setSavingVehiculo(true);
    setAddError('');

    const payload = {
      descripcion: formData.descripcion.trim(),
      estadoUbicacion: 'Activa',
      nomenclatura: formData.nomenclatura.trim(),
      tipoVehiculo: formData.tipoVehiculo.trim(),
      estadoVehiculo: formData.estadoVehiculo.trim(),
      patente: formData.patente.trim(),
    };

    try {
      await apiFetch('/api/vehiculos', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await fetchVehiculos();
      setShowAddModal(false);
      resetAddForm();
    } catch (error) {
      setAddError(error.message || 'No se pudo crear el vehiculo.');
    } finally {
      setSavingVehiculo(false);
    }
  };

  const handleVehicleImageChange = async (event) => {
    if (!canManageImages) return;

    const selectedFiles = Array.from(event.target.files || []);
    event.target.value = '';
    if (selectedFiles.length === 0 || !imageBasePath || uploadingVehicleImage || vehicleImageSlotsAvailable === 0) return;

    const filesToUpload = selectedFiles.slice(0, vehicleImageSlotsAvailable);

    setUploadingVehicleImage(true);
    setImageUploadError(selectedFiles.length > vehicleImageSlotsAvailable ? 'Solo puedes tener hasta 3 imagenes del vehiculo.' : '');

    try {
      await Promise.all(filesToUpload.map((file) => {
        const formDataImage = new FormData();
        formDataImage.append('archivo', file);

        return apiFetch(imageBasePath, {
          method: 'POST',
          body: formDataImage,
        });
      }));
      await fetchVehicleImages();
    } catch (err) {
      setImageUploadError(err.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingVehicleImage(false);
    }
  };

  const handleDeleteVehicleImage = async (event, image) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canManageImages || !image?.idArchivo || !imageBasePath || deletingVehicleImageId) return;

    setDeletingVehicleImageId(image.idArchivo);
    setImageUploadError('');
    setVehicleImagesError('');

    try {
      await apiFetch(`${imageBasePath}/${image.idArchivo}`, {
        method: 'DELETE',
      });
      await fetchVehicleImages();
    } catch (err) {
      setVehicleImagesError(err.message || 'No se pudo eliminar la imagen.');
    } finally {
      setDeletingVehicleImageId(null);
    }
  };

  const handleObservationImageChange = (event) => {
    if (!canManageObservations) return;

    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setObservationImages((currentImages) => {
      const availableSlots = Math.max(0, 3 - currentImages.length);
      const nextImages = selectedFiles.slice(0, availableSlots).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      if (selectedFiles.length > availableSlots) {
        setObservationError('Solo puedes subir hasta 3 imagenes por observacion.');
      } else {
        setObservationError('');
      }

      return [...currentImages, ...nextImages];
    });

    event.target.value = '';
  };

  const removeObservationImage = (indexToRemove) => {
    setObservationImages((currentImages) => {
      const imageToRemove = currentImages[indexToRemove];
      if (imageToRemove) URL.revokeObjectURL(imageToRemove.preview);

      return currentImages.filter((_, index) => index !== indexToRemove);
    });
  };

  const handleMaintenanceFileChange = (event) => {
    if (!canManageMaintenances) return;

    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length === 0) return;

    setMaintenanceFiles((currentFiles) => [
      ...currentFiles,
      ...selectedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      })),
    ]);
    setMaintenanceError('');
    event.target.value = '';
  };

  const removeMaintenanceFile = (indexToRemove) => {
    setMaintenanceFiles((currentFiles) => {
      const fileToRemove = currentFiles[indexToRemove];
      if (fileToRemove) URL.revokeObjectURL(fileToRemove.preview);

      return currentFiles.filter((_, index) => index !== indexToRemove);
    });
  };

  const closeObservationModal = () => {
    if (observationSaving) return;

    setShowAddObs(false);
    setNewObs({ observacion: '' });
    observationImages.forEach((image) => URL.revokeObjectURL(image.preview));
    setObservationImages([]);
    setObservationError('');
  };

  const openMaintenanceModal = (mode) => {
    if (!canManageMaintenances) return;

    setMaintenanceModalMode(mode);
    setNewMant({
      fecha: mode === 'programada' ? new Date().toISOString().slice(0, 10) : '',
      tipo: 'Preventiva',
      descripcion: '',
    });
    maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setMaintenanceFiles([]);
    setMaintenanceError('');
    setMaintenanceNotice('');
  };

  const closeMaintenanceModal = () => {
    if (maintenanceSaving) return;

    setMaintenanceModalMode(null);
    setNewMant({ fecha: '', tipo: 'Preventiva', descripcion: '' });
    maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setMaintenanceFiles([]);
    setMaintenanceError('');
  };

  const handleCreateObservation = async (event) => {
    event.preventDefault();
    if (!canManageObservations) return;

    const observacion = newObs.observacion.trim();
    if (!observacion || !selectedId || observationSaving) return;

    const payload = {
      idVehiculo: Number(selectedId),
      observacion,
      fecha: new Date().toISOString(),
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
          const imageFormData = new FormData();
          observationImages.forEach(({ file }) => {
            imageFormData.append('imagenes', file);
          });

          try {
            await apiFetch(`/api/observaciones/${idObservacion}/imagenes?${vehicleTargetQuery}`, {
              method: 'POST',
              body: imageFormData,
            });
          } catch (err) {
            imageUploadError = err;
          }
        }
      }

      const nextObservation = {
        ...payload,
        ...(createdObservation || {}),
        idObservacion: idObservacion || createdObservation?.idObservacion,
        observacion: createdObservation?.observacion || payload.observacion,
        fecha: createdObservation?.fecha || payload.fecha,
      };

      updateVehiculo({
        ...selectedVehiculo,
        observaciones: [nextObservation, ...(selectedVehiculo.observaciones || [])],
      });
      setNewObs({ observacion: '' });
      observationImages.forEach((image) => URL.revokeObjectURL(image.preview));
      setObservationImages([]);
      setShowAddObs(false);

      if (imageUploadError) {
        setObservationNotice(`La observacion fue creada, pero no se pudieron subir las imagenes: ${imageUploadError.message || 'revisa el endpoint de imagenes.'}`);
      }
      await fetchVehicleDetail();
    } catch (err) {
      setObservationError(err.message || 'No se pudo crear la observacion.');
    } finally {
      setObservationSaving(false);
    }
  };

  const handleCreateMaintenance = async (event) => {
    event.preventDefault();
    if (!canManageMaintenances) return;

    const descripcion = newMant.descripcion.trim();
    const tipo = newMant.tipo.trim();
    const isProgramada = maintenanceModalMode === 'programada';
    if (!descripcion || !tipo || !selectedId || maintenanceSaving || (isProgramada && !newMant.fecha)) return;

    const payload = {
      idVehiculo: Number(selectedId),
      ...(isProgramada ? { fecha: newMant.fecha } : {}),
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
              const fileFormData = new FormData();
              fileFormData.append('archivo', file);

              return apiFetch(`/api/mantenciones/${idMantencion}/archivos?${vehicleTargetQuery}`, {
                method: 'POST',
                body: fileFormData,
              });
            }));
          } catch (err) {
            fileUploadError = err;
          }
        }
      }

      const nextMaintenance = {
        ...payload,
        ...(createdMaintenance || {}),
        idMantencion: idMantencion || Date.now(),
        estadoMantencion: createdMaintenance?.estadoMantencion || (isProgramada ? 'Programada' : 'Realizada'),
        fecha: createdMaintenance?.fecha || payload.fecha || new Date().toISOString(),
      };

      updateVehiculo({
        ...selectedVehiculo,
        mantenciones: [nextMaintenance, ...(selectedVehiculo.mantenciones || [])],
      });
      setNewMant({ fecha: '', tipo: 'Preventiva', descripcion: '' });
      maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
      setMaintenanceFiles([]);
      setMaintenanceModalMode(null);

      if (fileUploadError) {
        setMaintenanceNotice(`La mantención fue creada, pero no se pudieron subir los archivos: ${fileUploadError.message || 'revisa el endpoint de archivos.'}`);
      }
      await fetchVehicleDetail();
    } catch (err) {
      setMaintenanceError(err.message || 'No se pudo crear la mantención.');
    } finally {
      setMaintenanceSaving(false);
    }
  };

  const handleMarkMaintenanceAsDone = async (event, maintenance) => {
    event.stopPropagation();
    if (!canManageMaintenances) return;

    const idMantencion = getMaintenanceId(maintenance);
    if (!idMantencion || !selectedId) {
      setMaintenanceNotice('No se pudo marcar como realizada: la mantención no tiene id.');
      return;
    }

    setMarkingMaintenanceId(idMantencion);
    setMaintenanceNotice('');

    try {
      const updatedMaintenance = await apiFetch(`/api/mantenciones/${idMantencion}/realizada`, {
        method: 'PATCH',
        body: JSON.stringify({ idVehiculo: Number(selectedId) }),
      });

      updateVehiculo({
        ...selectedVehiculo,
        mantenciones: (selectedVehiculo.mantenciones || []).map((item) => (
          String(getMaintenanceId(item)) === String(idMantencion)
            ? { ...item, ...(updatedMaintenance || {}), estadoMantencion: updatedMaintenance?.estadoMantencion || 'Realizada' }
            : item
        )),
      });
    } catch (err) {
      setMaintenanceNotice(err.message || 'No se pudo marcar la mantención como realizada.');
    } finally {
      setMarkingMaintenanceId(null);
    }
  };

  if (view === 'list') {
    return (
      <div className="p-8 pb-20">
        <section className="rounded-xl border border-dark-border bg-dark-surface p-6 shadow-lg lg:p-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-dark-border pb-6">
            <div>
              <h3 className="rajdhani mb-1 text-2xl font-semibold tracking-wide text-text-main">Vehiculos</h3>
              <p className="text-sm text-text-muted">Gestiona los vehiculos, carros y ambulancias de la compania.</p>
            </div>
            {canManageVehicles && (
              <button onClick={() => setShowAddModal(true)} className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-colors hover:opacity-90">
                Agregar vehiculo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {loading ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red"></div>
                <p className="rajdhani text-lg text-text-muted">Cargando vehiculos...</p>
              </div>
            ) : vehiculos.length > 0 ? (
              vehiculos.map((v) => (
                <div
                  key={v.id}
                  onClick={() => openDetail(v)}
                  className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-dark-border bg-dark-bg transition-all hover:border-brand-cyan/50 hover:shadow-lg hover:shadow-brand-cyan/5"
                >
                  <div className="flex h-48 w-full items-center justify-center overflow-hidden text-text-muted">
                    {vehiclePreviewImages[v.id] ? (
                      <img src={vehiclePreviewImages[v.id]} alt={v.nombre} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center transition-transform group-hover:scale-110">
                        <Icons.Truck />
                      </div>
                    )}
                  </div>
                  <div className="w-full border-t border-dark-border bg-dark-bg2/60 px-4 py-3 text-center">
                    <div className="mb-1 text-sm font-semibold text-text-main">{v.nombre}</div>
                    <div className="text-xs text-text-muted">{v.modelo} - {v.patente}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-border bg-dark-bg py-20">
                <Icons.Truck size={48} className="mb-4 text-text-muted opacity-20" />
                <p className="rajdhani text-lg text-text-muted">No hay vehiculos registrados.</p>
                {canManageVehicles && (
                  <button onClick={() => setShowAddModal(true)} className="mt-4 text-brand-cyan hover:underline">Registrar el primer vehiculo</button>
                )}
              </div>
            )}
          </div>
        </section>

        {showAddModal && canManageVehicles && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
                <div>
                  <h3 className="rajdhani text-xl font-bold text-text-main">Agregar Vehiculo</h3>
                  <p className="mt-1 text-sm text-text-muted">Registra una nueva unidad del parque automotriz.</p>
                </div>
                <button type="button" onClick={closeAddModal} className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-dark-bg3 hover:text-text-main">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="custom-scrollbar max-h-[calc(88vh-76px)] overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Nomenclatura <span className="text-brand-red">*</span></span>
                    <input required type="text" value={formData.nomenclatura} onChange={(e) => setFormData({ ...formData, nomenclatura: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-text-main outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan" placeholder="Ej: B-1, RX-2, AB1234" />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Patente <span className="text-brand-red">*</span></span>
                    <input required type="text" value={formData.patente} onChange={(e) => setFormData({ ...formData, patente: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-text-main outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan" placeholder="Ej: AB-12-34" />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Tipo de vehiculo <span className="text-brand-red">*</span></span>
                    <select required value={formData.tipoVehiculo} onChange={(e) => setFormData({ ...formData, tipoVehiculo: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-text-main outline-none transition-all focus:border-brand-cyan">
                      <option value="" className="bg-dark-surface text-text-main">Selecciona un tipo</option>
                      {VEHICLE_TYPES.map((type) => (
                        <option key={type} value={type} className="bg-dark-surface text-text-main">{type}</option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Estado del vehiculo</span>
                    <select value={formData.estadoVehiculo} onChange={(e) => setFormData({ ...formData, estadoVehiculo: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-text-main outline-none transition-all focus:border-brand-cyan">
                      <option value="Operativo" className="bg-dark-surface text-text-main">Operativo</option>
                      <option value="En Mantencion" className="bg-dark-surface text-text-main">En Mantención</option>
                      <option value="Fuera de Servicio" className="bg-dark-surface text-text-main">Fuera de Servicio</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-text-main">Descripción</span>
                    <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="min-h-[110px] w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-text-main outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan" placeholder="Marca, modelo, capacidad, observaciones generales..." />
                  </label>
                </div>

                {addError && (
                  <div className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">
                    {addError}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-dark-border pt-5">
                  <button type="button" onClick={closeAddModal} className="rounded-lg border border-dark-border bg-dark-bg px-5 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg3 hover:text-text-main">
                    Cancelar
                  </button>
                  <button type="submit" disabled={savingVehiculo} className="rounded-lg bg-brand-cyan px-5 py-2.5 text-sm font-bold text-dark-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-50">
                    {savingVehiculo ? 'Creando...' : 'Crear vehiculo'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (view === 'detail' && selectedVehiculo) {
    const v = selectedVehiculo;

    return (
      <div className="h-full w-full max-w-none overflow-y-auto p-6 pb-36 lg:p-8 lg:pb-40">
        <div className="mb-8 flex items-center justify-between border-b border-dark-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="flex items-center gap-2 border-r border-dark-border pr-4 text-sm font-medium text-text-muted transition-colors hover:text-text-main">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver
            </button>
            <h3 className="rajdhani text-xl font-bold text-text-main">Detalle del Vehiculo</h3>
          </div>
          {canManageVehicles && (
            <button className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-bg3 px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
              Editar
            </button>
          )}
        </div>

        <div className="mb-8 grid gap-8 rounded-xl border border-dark-border bg-dark-surface p-6 xl:grid-cols-[minmax(320px,480px)_1fr]">
          <div>
            <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-dark-border bg-dark-bg text-text-muted group">
              {loadingVehicleImages ? (
                <p className="text-sm">Cargando imagenes...</p>
              ) : primaryVehicleImage ? (
                <>
                  <img src={primaryVehicleImage.url} alt={v.nombre} className="h-full w-full object-cover" />
                  {canManageImages && (
                    <button
                      type="button"
                      onClick={(event) => handleDeleteVehicleImage(event, primaryVehicleImage)}
                      disabled={deletingVehicleImageId === primaryVehicleImage.idArchivo}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-sm font-bold text-white opacity-0 transition-opacity hover:bg-brand-red disabled:cursor-not-allowed disabled:opacity-50 group-hover:opacity-100"
                      title="Eliminar imagen"
                    >
                      x
                    </button>
                  )}
                </>
              ) : (
                <div className="mb-4 scale-150 opacity-30">
                  <Icons.Truck />
                </div>
              )}
              {canManageImages && (
                <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-dark-border bg-dark-bg3 px-3 py-1.5 text-xs font-medium transition-colors hover:text-white ${vehicleImageSlotsAvailable === 0 ? 'cursor-not-allowed opacity-60' : ''} ${primaryVehicleImage ? 'absolute bottom-4 opacity-0 group-hover:opacity-100' : 'relative'}`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {uploadingVehicleImage ? 'Subiendo...' : vehicleImageSlotsAvailable === 0 ? 'Limite 3/3' : primaryVehicleImage ? 'Agregar imagen' : 'Anadir imagen'}
                  <input type="file" hidden multiple accept="image/*" onChange={handleVehicleImageChange} disabled={uploadingVehicleImage || vehicleImageSlotsAvailable === 0} />
                </label>
              )}
            </div>
            <p className="mt-2 text-xs text-text-muted">
              {vehicleImages.length}/3 imagenes del vehiculo
            </p>
            {(vehicleImagesError || imageUploadError) && (
              <p className="mt-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                {vehicleImagesError || imageUploadError}
              </p>
            )}
            {vehicleImages.length > 1 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {vehicleImages.slice(1, 3).map((image) => (
                  <a key={image.idArchivo} href={image.url} target="_blank" rel="noreferrer" className="group/thumb relative block overflow-hidden rounded border border-dark-border">
                    <img src={image.url} alt={image.nombre} className="h-20 w-full object-cover" />
                    {canManageImages && (
                      <button
                        type="button"
                        onClick={(event) => handleDeleteVehicleImage(event, image)}
                        disabled={deletingVehicleImageId === image.idArchivo}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white opacity-0 transition-opacity hover:bg-brand-red disabled:cursor-not-allowed disabled:opacity-50 group-hover/thumb:opacity-100"
                        title="Eliminar imagen"
                      >
                        x
                      </button>
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                (v.estado || '').toLowerCase().includes('operativ')
                  ? 'border-brand-green/20 bg-brand-green/10 text-brand-green'
                  : (v.estado || '').toLowerCase().includes('mantenc')
                  ? 'border-brand-gold/20 bg-brand-gold/10 text-brand-gold'
                  : 'border-brand-red/20 bg-brand-red/10 text-brand-red'
              }`}>Estado: {v.estado}</span>
              <span className="text-xs font-medium text-brand-cyan">{v.tipo}</span>
            </div>
            <h2 className="rajdhani mb-3 text-3xl font-bold text-text-main">{v.nombre}</h2>
            <p className="mb-8 max-w-5xl leading-relaxed text-text-muted">{v.descripcion}</p>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-dark-border bg-dark-bg px-5 py-3">
                <div className="mb-1 text-xs text-text-muted">Tipo de Vehiculo</div>
                <div className="text-sm font-semibold text-text-main">{v.tipo}</div>
              </div>
              <div className="flex flex-col justify-center rounded-lg border border-dark-border bg-dark-bg px-5 py-3">
                <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                  Patente
                  {!isEditingPatente && canManageVehicles && (
                    <button onClick={() => { setIsEditingPatente(true); setTempPatente(v.patente); }} className="transition-colors hover:text-brand-cyan">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
                </div>
                {isEditingPatente && canManageVehicles ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input autoFocus type="text" value={tempPatente} onChange={(e) => setTempPatente(e.target.value)} className="w-full rounded border border-brand-cyan bg-dark-bg2 px-2 py-1 text-sm text-text-main focus:outline-none" />
                    <button onClick={() => { updateVehiculo({ ...v, patente: tempPatente }); setIsEditingPatente(false); }} className="text-brand-green hover:opacity-80"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                    <button onClick={() => setIsEditingPatente(false)} className="text-brand-red hover:opacity-80"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-text-main">{v.patente}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {vehicleDetailError && (
          <p className="mb-6 rounded-lg border border-brand-red/30 bg-brand-red/10 px-4 py-3 text-sm text-brand-red">
            {vehicleDetailError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <section className="rounded-xl border border-dark-border bg-dark-surface/40 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
            <div className="mb-4 flex items-center justify-between border-b border-dark-border pb-3">
              <div>
                <h4 className="flex items-center gap-2 text-lg font-semibold text-text-main">
                  <svg className="h-5 w-5 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  Observaciones
                </h4>
                <p className="mt-0.5 text-xs text-text-muted">{(v.observaciones || []).length} registradas</p>
              </div>
              {canManageObservations && (
                <button onClick={() => setShowAddObs(true)} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan">
                  + Agregar
                </button>
              )}
            </div>

            <div className="custom-scrollbar max-h-[330px] space-y-3 overflow-y-auto pr-1">
              {observationNotice && (
                <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                  {observationNotice}
                </p>
              )}

              {loadingVehicleDetail && (
                <div className="rounded-lg border border-dashed border-dark-border p-6 text-center text-sm text-text-muted">
                  Cargando observaciones...
                </div>
              )}

              {!loadingVehicleDetail && (v.observaciones || []).map((obs, idx) => (
                <button
                  key={getObservationId(obs) || idx}
                  type="button"
                  onClick={() => setSelectedObservation(obs)}
                  className="block min-h-[92px] w-full rounded-lg border border-dark-border bg-dark-bg p-4 text-left transition-colors hover:border-brand-cyan/50 hover:bg-dark-bg2 hover:shadow-[0_0_18px_rgba(56,189,248,0.08)]"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold text-brand-cyan">{formatDate(obs.fecha)}</span>
                    <span className="rounded-full border border-dark-border px-2 py-0.5 text-[11px] text-text-muted">Obs.</span>
                  </div>
                  <p className="text-sm leading-relaxed text-text-muted">{obs.observacion || obs.desc || obs.descripcion || 'Sin detalle'}</p>
                </button>
              ))}

              {!loadingVehicleDetail && (v.observaciones || []).length === 0 && (
                <div className="rounded-lg border border-dashed border-dark-border p-6 text-center text-sm text-text-muted">
                  No hay observaciones registradas.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-dark-border bg-dark-surface/40 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.16)]">
            <div className="mb-4 flex items-center justify-between border-b border-dark-border pb-3">
              <div>
                <h4 className="flex items-center gap-2 text-lg font-semibold text-text-main">
                  <svg className="h-5 w-5 text-brand-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Mantenciones
                </h4>
                <p className="mt-0.5 text-xs text-text-muted">{(v.mantenciones || []).length} registradas</p>
              </div>
              {canManageMaintenances && (
                <div className="flex items-center gap-2">
                  <button onClick={() => openMaintenanceModal('programada')} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan">
                    Programar
                  </button>
                  <button onClick={() => openMaintenanceModal('realizada')} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-1.5 text-xs font-semibold text-text-muted transition-colors hover:border-brand-cyan/40 hover:text-brand-cyan">
                    + Agregar
                  </button>
                </div>
              )}
            </div>

            <div className="custom-scrollbar max-h-[330px] space-y-3 overflow-y-auto pr-1">
              {maintenanceNotice && (
                <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                  {maintenanceNotice}
                </p>
              )}

              {loadingVehicleDetail && (
                <div className="rounded-lg border border-dashed border-dark-border p-6 text-center text-sm text-text-muted">
                  Cargando mantenciones...
                </div>
              )}

              {!loadingVehicleDetail && (v.mantenciones || []).map((mant, idx) => (
                <article
                  key={getMaintenanceId(mant) || idx}
                  onClick={() => setSelectedMaintenance(mant)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedMaintenance(mant);
                    }
                  }}
                  className="block min-h-[92px] w-full cursor-pointer rounded-lg border border-dark-border bg-dark-bg p-4 text-left transition-colors hover:border-brand-cyan/50 hover:bg-dark-bg2 hover:shadow-[0_0_18px_rgba(56,189,248,0.08)]"
                >
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="text-xs font-semibold text-brand-cyan">{formatDate(mant.fecha)}</span>
                    <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-0.5 text-[11px] font-bold text-brand-cyan">{mant.estadoMantencion || mant.tipo || 'Mantención'}</span>
                  </div>
                  <h5 className="mb-1 text-sm font-semibold text-text-main">{mant.tipo || 'Mantención'}</h5>
                  <p className="text-sm leading-relaxed text-text-muted">{mant.descripcion || mant.desc || 'Sin detalle'}</p>
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
              ))}

              {!loadingVehicleDetail && (v.mantenciones || []).length === 0 && (
                <div className="rounded-lg border border-dashed border-dark-border p-6 text-center text-sm text-text-muted">
                  No hay mantenciones registradas.
                </div>
              )}
            </div>
          </section>
        </div>

        {selectedObservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedObservation(null)}>
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{formatDate(selectedObservation.fecha)}</p>
                  <h3 className="mt-1 text-lg font-bold text-text-main">Detalle de observacion</h3>
                  <p className="mt-0.5 truncate text-xs text-text-muted">{v.nombre}</p>
                </div>
                <button type="button" onClick={() => setSelectedObservation(null)} className="px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red">
                  x
                </button>
              </div>

              <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Fecha</p>
                    <p className="mt-2 text-sm font-bold text-text-main">{formatDate(selectedObservation.fecha)}</p>
                  </div>
                  <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">ID observacion</p>
                    <p className="mt-2 text-sm font-bold text-text-main">{getObservationId(selectedObservation) || 'Sin id'}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-dark-border bg-dark-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Descripción</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-main">
                    {selectedObservation.observacion || selectedObservation.descripcion || selectedObservation.desc || 'Sin detalle'}
                  </p>
                </div>

                <div className="mt-5">
                  <h4 className="mb-3 text-sm font-bold text-text-main">Imagenes</h4>
                  {loadingObservationImages ? (
                    <div className="rounded-lg border border-dark-border py-8 text-center text-sm text-text-muted">
                      Cargando imagenes...
                    </div>
                  ) : observationImagesError ? (
                    <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                      {observationImagesError}
                    </p>
                  ) : observationDetailImages.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {observationDetailImages.map((image) => (
                        <a
                          key={image.idArchivo}
                          href={image.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg border border-dark-border bg-dark-bg transition-colors hover:border-brand-cyan/60"
                        >
                          <img src={image.url} alt={image.nombre} className="h-44 w-full object-cover" />
                          <div className="px-3 py-2">
                            <p className="truncate text-xs font-semibold text-text-main">{image.nombre}</p>
                            {image.fechaSubida && (
                              <p className="mt-1 text-[11px] text-text-muted">{formatDate(image.fechaSubida)}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-dark-border px-4 py-8 text-center text-sm text-text-muted">
                      Esta observacion no tiene imagenes.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMaintenance && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setSelectedMaintenance(null)}>
            <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-start justify-between gap-4 border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{formatDate(selectedMaintenance.fecha)}</p>
                  <h3 className="mt-1 text-lg font-bold text-text-main">Detalle de mantención</h3>
                  <p className="mt-0.5 truncate text-xs text-text-muted">{v.nombre}</p>
                </div>
                <button type="button" onClick={() => setSelectedMaintenance(null)} className="px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red">
                  x
                </button>
              </div>

              <div className="max-h-[calc(90vh-80px)] overflow-y-auto p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Fecha</p>
                    <p className="mt-2 text-sm font-bold text-text-main">{formatDate(selectedMaintenance.fecha)}</p>
                  </div>
                  <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Tipo</p>
                    <p className="mt-2 text-sm font-bold text-text-main">{selectedMaintenance.tipo || 'Mantención'}</p>
                  </div>
                  <div className="rounded-lg border border-dark-border bg-dark-bg p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Estado</p>
                    <p className="mt-2 text-sm font-bold text-text-main">{selectedMaintenance.estadoMantencion || 'Sin estado'}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-dark-border bg-dark-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Descripción</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-main">
                    {selectedMaintenance.descripcion || selectedMaintenance.desc || 'Sin detalle'}
                  </p>
                </div>

                <div className="mt-3 rounded-lg border border-dark-border bg-dark-bg p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">ID mantención</p>
                  <p className="mt-2 text-sm font-bold text-text-main">{getMaintenanceId(selectedMaintenance) || 'Sin id'}</p>
                </div>

                <div className="mt-5">
                  <h4 className="mb-3 text-sm font-bold text-text-main">Imagenes y archivos</h4>
                  {loadingMaintenanceFiles ? (
                    <div className="rounded-lg border border-dark-border py-8 text-center text-sm text-text-muted">
                      Cargando archivos...
                    </div>
                  ) : maintenanceFilesError ? (
                    <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                      {maintenanceFilesError}
                    </p>
                  ) : maintenanceDetailFiles.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {maintenanceDetailFiles.map((file) => (
                        <a
                          key={file.idArchivo}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg border border-dark-border bg-dark-bg transition-colors hover:border-brand-cyan/60"
                        >
                          {isImageFile(file) ? (
                            <img src={file.url} alt={file.nombre} className="h-44 w-full object-cover" />
                          ) : (
                            <div className="flex h-44 items-center justify-center bg-brand-cyan/10 text-3xl font-bold text-brand-cyan">
                              PDF
                            </div>
                          )}
                          <div className="px-3 py-2">
                            <p className="truncate text-xs font-semibold text-text-main">{file.nombre}</p>
                            {file.fechaSubida && (
                              <p className="mt-1 text-[11px] text-text-muted">{formatDate(file.fechaSubida)}</p>
                            )}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-dark-border px-4 py-8 text-center text-sm text-text-muted">
                      Esta mantención no tiene archivos.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {showAddObs && canManageObservations && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeObservationModal}>
            <form onSubmit={handleCreateObservation} className="w-full max-w-xl overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-text-main">Agregar observacion</h3>
                  <p className="mt-0.5 text-xs text-text-muted">{v.nombre}</p>
                </div>
                <button type="button" onClick={closeObservationModal} disabled={observationSaving} className="px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red disabled:opacity-50">
                  x
                </button>
              </div>

              <div className="space-y-4 p-6">
                <textarea placeholder="Detalle de la observacion" value={newObs.observacion} onChange={(e) => setNewObs({ observacion: e.target.value })} disabled={observationSaving} className="min-h-[130px] w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-text-main focus:border-brand-cyan focus:outline-none disabled:opacity-60" />
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-5 text-center transition-colors hover:border-brand-cyan/60">
                  <span className="text-sm font-semibold text-text-main">
                    {observationImages.length >= 3 ? 'Limite de 3 imagenes alcanzado' : 'Seleccionar imagenes'}
                  </span>
                  <span className="mt-1 text-xs text-text-muted">Puedes adjuntar hasta 3 imagenes.</span>
                  <input type="file" multiple accept="image/*" className="hidden" onChange={handleObservationImageChange} disabled={observationSaving || observationImages.length >= 3} />
                </label>
                {observationImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {observationImages.map((image, index) => (
                      <div key={`${image.file.name}-${image.preview}`} className="relative overflow-hidden rounded-lg border border-dark-border bg-dark-bg">
                        <img src={image.preview} alt={image.file.name} className="h-24 w-full object-cover" />
                        <p className="truncate px-2 py-1 text-[11px] text-text-muted">{image.file.name}</p>
                        <button type="button" onClick={() => removeObservationImage(index)} disabled={observationSaving} className="absolute right-1 top-1 text-sm font-bold text-white drop-shadow transition-colors hover:text-brand-red disabled:opacity-50">
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {observationError && <p className="rounded border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{observationError}</p>}
              </div>

              <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <button type="button" onClick={closeObservationModal} disabled={observationSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={!newObs.observacion.trim() || observationSaving} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  {observationSaving ? 'Guardando...' : 'Guardar observacion'}
                </button>
              </div>
            </form>
          </div>
        )}

        {maintenanceModalMode && canManageMaintenances && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={closeMaintenanceModal}>
            <form onSubmit={handleCreateMaintenance} className="w-full max-w-xl overflow-hidden rounded-xl border border-dark-border bg-dark-surface shadow-2xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-dark-border bg-dark-bg2 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-text-main">{maintenanceModalMode === 'programada' ? 'Programar mantención' : 'Agregar mantención'}</h3>
                  <p className="mt-0.5 text-xs text-text-muted">{v.nombre}</p>
                </div>
                <button type="button" onClick={closeMaintenanceModal} disabled={maintenanceSaving} className="px-2 py-1 text-xl leading-none text-text-muted transition-colors hover:text-brand-red disabled:opacity-50">
                  x
                </button>
              </div>

              <div className="max-h-[calc(90vh-140px)] space-y-4 overflow-y-auto p-6">
                <div className={`grid gap-3 ${maintenanceModalMode === 'programada' ? 'md:grid-cols-2' : ''}`}>
                  {maintenanceModalMode === 'programada' && (
                    <input required type="date" value={newMant.fecha} onChange={(e) => setNewMant({ ...newMant, fecha: e.target.value })} disabled={maintenanceSaving} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-text-main focus:border-brand-cyan focus:outline-none disabled:opacity-60" />
                  )}
                  <select value={newMant.tipo} onChange={(e) => setNewMant({ ...newMant, tipo: e.target.value })} disabled={maintenanceSaving} className="rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-text-main focus:border-brand-cyan focus:outline-none disabled:opacity-60">
                    <option value="Preventiva">Preventiva</option>
                    <option value="Correctiva">Correctiva</option>
                  </select>
                </div>
                <textarea placeholder="Detalle de la mantención" value={newMant.descripcion} onChange={(e) => setNewMant({ ...newMant, descripcion: e.target.value })} disabled={maintenanceSaving} className="min-h-[130px] w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-text-main focus:border-brand-cyan focus:outline-none disabled:opacity-60" />
                <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-5 text-center transition-colors hover:border-brand-cyan/60">
                  <span className="text-sm font-semibold text-text-main">Seleccionar archivos</span>
                  <span className="mt-1 text-xs text-text-muted">Puedes adjuntar imagenes, PDF u otros documentos.</span>
                  <input type="file" multiple className="hidden" onChange={handleMaintenanceFileChange} disabled={maintenanceSaving} />
                </label>
                {maintenanceFiles.length > 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {maintenanceFiles.map((fileItem, index) => (
                      <div key={`${fileItem.file.name}-${fileItem.preview}`} className="relative rounded-lg border border-dark-border bg-dark-bg p-2">
                        {isImageFile(fileItem) ? (
                          <img src={fileItem.preview} alt={fileItem.file.name} className="mb-2 h-24 w-full rounded object-cover" />
                        ) : (
                          <div className="mb-2 flex h-24 items-center justify-center rounded bg-brand-cyan/10 text-2xl text-brand-cyan">
                            PDF
                          </div>
                        )}
                        <p className="truncate pr-7 text-xs font-semibold text-text-main">{fileItem.file.name}</p>
                        <button type="button" onClick={() => removeMaintenanceFile(index)} disabled={maintenanceSaving} className="absolute right-2 top-2 text-sm font-bold text-white drop-shadow transition-colors hover:text-brand-red disabled:opacity-50">
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {maintenanceError && <p className="rounded border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{maintenanceError}</p>}
              </div>

              <div className="flex justify-end gap-3 border-t border-dark-border bg-dark-bg2 px-6 py-4">
                <button type="button" onClick={closeMaintenanceModal} disabled={maintenanceSaving} className="rounded-lg px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:text-white disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={!newMant.descripcion.trim() || !newMant.tipo.trim() || maintenanceSaving || (maintenanceModalMode === 'programada' && !newMant.fecha)} className="rounded-lg bg-brand-cyan px-4 py-2 text-sm font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  {maintenanceSaving ? 'Guardando...' : maintenanceModalMode === 'programada' ? 'Programar' : 'Guardar mantención'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default VehiculosView;
