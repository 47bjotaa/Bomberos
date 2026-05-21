import { useCallback, useEffect, useRef, useState } from 'react';
import { Icons } from '../../components/ui/Icons';
import { apiFetch } from '../../services/api';

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

const isImageFile = (fileItem) => {
  const contentType = fileItem?.contentType || fileItem?.file?.type || '';
  const name = fileItem?.nombre || fileItem?.nombreOriginal || fileItem?.file?.name || '';

  return contentType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(name);
};

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
  modelo: v.modelo || v.descripcion || 'Sin especificar',
  descripcion: v.descripcion || v.modelo || 'Sin descripcion registrada.',
  estado: v.estadoVehiculo || v.estado || 'Operativo',
  estadoUbicacion: v.estadoUbicacion || '',
  observaciones: Array.isArray(v.observaciones) ? v.observaciones : [],
  mantenciones: Array.isArray(v.mantenciones) ? v.mantenciones : [],
});

function VehiculosView() {
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
  const [loadingVehicleImages, setLoadingVehicleImages] = useState(false);
  const [vehicleImagesError, setVehicleImagesError] = useState('');
  const [uploadingVehicleImage, setUploadingVehicleImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');
  const imageRequestRef = useRef(0);

  const [showAddObs, setShowAddObs] = useState(false);
  const [newObs, setNewObs] = useState({ observacion: '' });
  const [observationImages, setObservationImages] = useState([]);
  const [observationSaving, setObservationSaving] = useState(false);
  const [observationError, setObservationError] = useState('');
  const [observationNotice, setObservationNotice] = useState('');
  const observationImagesRef = useRef([]);

  const [showAddMant, setShowAddMant] = useState(false);
  const [newMant, setNewMant] = useState({ fecha: '', tipo: 'Preventiva', descripcion: '' });
  const [maintenanceFiles, setMaintenanceFiles] = useState([]);
  const [maintenanceSaving, setMaintenanceSaving] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');
  const [maintenanceNotice, setMaintenanceNotice] = useState('');
  const maintenanceFilesRef = useRef([]);

  const fetchVehiculos = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/vehiculos');
      setVehiculos(getArrayPayload(data, ['vehiculos']).map(mapVehiculo));
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

  const updateVehiculo = (updatedV) => {
    setVehiculos((current) => current.map((v) => v.id === updatedV.id ? updatedV : v));
    setSelectedVehiculo(updatedV);
  };

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
        setVehicleImages(imagesWithUrls.filter((image) => image?.url));
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
    setShowAddMant(false);
    setNewMant({ fecha: '', tipo: 'Preventiva', descripcion: '' });
    maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
    setMaintenanceFiles([]);
    setMaintenanceError('');
    setMaintenanceNotice('');
    setImageUploadError('');
  };

  const openDetail = (vehiculo) => {
    setSelectedVehiculo(vehiculo);
    setView('detail');
    setVehicleImages([]);
    setVehicleImagesError('');
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
    if (savingVehiculo) return;

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
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !imageBasePath || uploadingVehicleImage) return;

    const formDataImage = new FormData();
    formDataImage.append('archivo', file);

    setUploadingVehicleImage(true);
    setImageUploadError('');

    try {
      await apiFetch(imageBasePath, {
        method: 'POST',
        body: formDataImage,
      });
      await fetchVehicleImages();
    } catch (err) {
      setImageUploadError(err.message || 'No se pudo subir la imagen.');
    } finally {
      setUploadingVehicleImage(false);
    }
  };

  const handleObservationImageChange = (event) => {
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

  const handleCreateObservation = async (event) => {
    event.preventDefault();

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
    } catch (err) {
      setObservationError(err.message || 'No se pudo crear la observacion.');
    } finally {
      setObservationSaving(false);
    }
  };

  const handleCreateMaintenance = async (event) => {
    event.preventDefault();

    const descripcion = newMant.descripcion.trim();
    const tipo = newMant.tipo.trim();
    if (!descripcion || !tipo || !selectedId || maintenanceSaving) return;

    const payload = {
      idVehiculo: Number(selectedId),
      ...(newMant.fecha ? { fecha: newMant.fecha } : {}),
      descripcion,
      tipo,
    };

    setMaintenanceSaving(true);
    setMaintenanceError('');
    setMaintenanceNotice('');

    try {
      const endpoint = newMant.fecha ? '/api/mantenciones/programadas' : '/api/mantenciones/realizadas';
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
        estadoMantencion: createdMaintenance?.estadoMantencion || (newMant.fecha ? 'Programada' : 'Realizada'),
        fecha: createdMaintenance?.fecha || payload.fecha || new Date().toISOString(),
      };

      updateVehiculo({
        ...selectedVehiculo,
        mantenciones: [nextMaintenance, ...(selectedVehiculo.mantenciones || [])],
      });
      setNewMant({ fecha: '', tipo: 'Preventiva', descripcion: '' });
      maintenanceFiles.forEach((file) => URL.revokeObjectURL(file.preview));
      setMaintenanceFiles([]);
      setShowAddMant(false);

      if (fileUploadError) {
        setMaintenanceNotice(`La mantencion fue creada, pero no se pudieron subir los archivos: ${fileUploadError.message || 'revisa el endpoint de archivos.'}`);
      }
    } catch (err) {
      setMaintenanceError(err.message || 'No se pudo crear la mantencion.');
    } finally {
      setMaintenanceSaving(false);
    }
  };

  if (view === 'list') {
    return (
      <div className="p-8 pb-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h3 className="rajdhani mb-1 text-2xl font-semibold tracking-wide text-white">Parque Automotriz</h3>
            <p className="text-sm text-text-muted">Gestiona los vehiculos, carros y ambulancias de la compania.</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="rounded-lg bg-gradient-to-r from-brand-red to-brand-ember px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_15px_rgba(232,55,42,0.3)] transition-colors hover:opacity-90">
            Agregar vehiculo
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red"></div>
              <p className="rajdhani text-lg text-text-muted">Cargando parque automotriz...</p>
            </div>
          ) : vehiculos.length > 0 ? (
            vehiculos.map((v) => (
              <div
                key={v.id}
                onClick={() => openDetail(v)}
                className="group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border border-dark-border bg-dark-surface pt-8 pb-4 transition-all hover:border-brand-cyan/50 hover:shadow-lg hover:shadow-brand-cyan/5"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center text-text-muted transition-transform group-hover:scale-110">
                  <Icons.Truck />
                </div>
                <div className="w-full border-t border-dark-border bg-dark-bg/50 px-4 py-3 text-center">
                  <div className="mb-1 text-sm font-semibold text-white">{v.nombre}</div>
                  <div className="text-xs text-text-muted">{v.modelo} - {v.patente}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-dark-border py-20">
              <Icons.Truck size={48} className="mb-4 text-text-muted opacity-20" />
              <p className="rajdhani text-lg text-text-muted">No hay vehiculos registrados.</p>
              <button onClick={() => setShowAddModal(true)} className="mt-4 text-brand-cyan hover:underline">Registrar el primer vehiculo</button>
            </div>
          )}
        </div>

        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
            <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-dark-border bg-dark-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-dark-border px-6 py-4">
                <div>
                  <h3 className="rajdhani text-xl font-bold text-white">Agregar Vehiculo</h3>
                  <p className="mt-1 text-sm text-text-muted">Registra una nueva unidad del parque automotriz.</p>
                </div>
                <button type="button" onClick={closeAddModal} className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-dark-bg3 hover:text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="custom-scrollbar max-h-[calc(88vh-76px)] overflow-y-auto p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Nomenclatura <span className="text-brand-red">*</span></span>
                    <input required type="text" value={formData.nomenclatura} onChange={(e) => setFormData({ ...formData, nomenclatura: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan" placeholder="Ej: B-1, RX-2, AB1234" />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Patente <span className="text-brand-red">*</span></span>
                    <input required type="text" value={formData.patente} onChange={(e) => setFormData({ ...formData, patente: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan" placeholder="Ej: AB-12-34" />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Tipo de vehiculo <span className="text-brand-red">*</span></span>
                    <input required type="text" value={formData.tipoVehiculo} onChange={(e) => setFormData({ ...formData, tipoVehiculo: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan" placeholder="Ej: Carro bomba, ambulancia, rescate" />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-text-main">Estado del vehiculo</span>
                    <select value={formData.estadoVehiculo} onChange={(e) => setFormData({ ...formData, estadoVehiculo: e.target.value })} className="w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all focus:border-brand-cyan">
                      <option value="Operativo">Operativo</option>
                      <option value="En Mantencion">En Mantencion</option>
                      <option value="Fuera de Servicio">Fuera de Servicio</option>
                    </select>
                  </label>

                  <label className="block md:col-span-2">
                    <span className="mb-2 block text-sm font-medium text-text-main">Descripcion</span>
                    <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} className="min-h-[110px] w-full rounded-lg border border-dark-border bg-dark-bg px-4 py-2.5 text-white outline-none transition-all placeholder:text-text-muted focus:border-brand-cyan" placeholder="Marca, modelo, capacidad, observaciones generales..." />
                  </label>
                </div>

                {addError && (
                  <div className="mt-5 rounded-lg border border-brand-red/30 bg-brand-red/10 p-3 text-sm text-brand-red">
                    {addError}
                  </div>
                )}

                <div className="mt-6 flex justify-end gap-3 border-t border-dark-border pt-5">
                  <button type="button" onClick={closeAddModal} className="rounded-lg border border-dark-border bg-dark-bg px-5 py-2.5 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg3 hover:text-white">
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
      <div className="h-full w-full max-w-none p-6 pb-20 lg:p-8">
        <div className="mb-8 flex items-center justify-between border-b border-dark-border pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('list')} className="flex items-center gap-2 border-r border-dark-border pr-4 text-sm font-medium text-text-muted transition-colors hover:text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Volver
            </button>
            <h3 className="rajdhani text-xl font-bold text-white">Detalle del Vehiculo</h3>
          </div>
          <button className="flex items-center gap-2 rounded-lg border border-dark-border bg-dark-bg3 px-4 py-2 text-sm font-medium text-text-main transition-colors hover:bg-dark-bg2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Editar
          </button>
        </div>

        <div className="mb-8 grid gap-8 rounded-xl border border-dark-border bg-dark-surface p-6 xl:grid-cols-[minmax(320px,480px)_1fr]">
          <div>
            <div className="relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-dark-border bg-dark-bg text-text-muted group">
              {loadingVehicleImages ? (
                <p className="text-sm">Cargando imagenes...</p>
              ) : primaryVehicleImage ? (
                <img src={primaryVehicleImage.url} alt={v.nombre} className="h-full w-full object-cover" />
              ) : (
                <div className="mb-4 scale-150 opacity-30">
                  <Icons.Truck />
                </div>
              )}
              <label className={`flex cursor-pointer items-center gap-2 rounded-md border border-dark-border bg-dark-bg3 px-3 py-1.5 text-xs font-medium transition-colors hover:text-white ${primaryVehicleImage ? 'absolute bottom-4 opacity-0 group-hover:opacity-100' : 'relative'}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {uploadingVehicleImage ? 'Subiendo...' : primaryVehicleImage ? 'Cambiar foto' : 'Anadir foto'}
                <input type="file" hidden accept="image/*" onChange={handleVehicleImageChange} disabled={uploadingVehicleImage} />
              </label>
            </div>
            {(vehicleImagesError || imageUploadError) && (
              <p className="mt-3 rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                {vehicleImagesError || imageUploadError}
              </p>
            )}
            {vehicleImages.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {vehicleImages.slice(1, 5).map((image) => (
                  <a key={image.idArchivo} href={image.url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded border border-dark-border">
                    <img src={image.url} alt={image.nombre} className="h-20 w-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col justify-center">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-brand-green/20 bg-brand-green/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-brand-green">Estado: {v.estado}</span>
              <span className="text-xs font-medium text-brand-cyan">{v.tipo}</span>
            </div>
            <h2 className="rajdhani mb-3 text-3xl font-bold text-white">{v.nombre}</h2>
            <p className="mb-8 max-w-5xl leading-relaxed text-text-muted">{v.descripcion}</p>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-lg border border-dark-border bg-dark-bg px-5 py-3">
                <div className="mb-1 text-xs text-text-muted">Tipo de Vehiculo</div>
                <div className="text-sm font-semibold text-white">{v.tipo}</div>
              </div>
              <div className="flex flex-col justify-center rounded-lg border border-dark-border bg-dark-bg px-5 py-3">
                <div className="mb-1 flex items-center justify-between text-xs text-text-muted">
                  Patente
                  {!isEditingPatente && (
                    <button onClick={() => { setIsEditingPatente(true); setTempPatente(v.patente); }} className="transition-colors hover:text-brand-cyan">
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                  )}
                </div>
                {isEditingPatente ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input autoFocus type="text" value={tempPatente} onChange={(e) => setTempPatente(e.target.value)} className="w-full rounded border border-brand-cyan bg-dark-bg2 px-2 py-1 text-sm text-white focus:outline-none" />
                    <button onClick={() => { updateVehiculo({ ...v, patente: tempPatente }); setIsEditingPatente(false); }} className="text-brand-green hover:opacity-80"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg></button>
                    <button onClick={() => setIsEditingPatente(false)} className="text-brand-red hover:opacity-80"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                  </div>
                ) : (
                  <div className="text-sm font-semibold text-white">{v.patente}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
          <section>
            <div className="mb-4 flex items-center justify-between border-b border-dark-border pb-2">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-white">
                <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                Observaciones
              </h4>
              <button onClick={() => setShowAddObs((current) => !current)} className="flex items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-brand-cyan">
                <span>{showAddObs ? '-' : '+'}</span> {showAddObs ? 'Cancelar' : 'Agregar'}
              </button>
            </div>

            <div className="space-y-4">
              {showAddObs && (
                <form onSubmit={handleCreateObservation} className="mb-4 rounded-lg border border-brand-cyan/50 bg-dark-bg2 p-4">
                  <textarea placeholder="Detalle de la observacion" value={newObs.observacion} onChange={(e) => setNewObs({ observacion: e.target.value })} className="mb-3 min-h-[96px] w-full rounded border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none" />
                  <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-4 text-center transition-colors hover:border-brand-cyan/60">
                    <span className="text-sm font-semibold text-white">
                      {observationImages.length >= 3 ? 'Limite de 3 imagenes alcanzado' : 'Seleccionar imagenes'}
                    </span>
                    <span className="mt-1 text-xs text-text-muted">Puedes adjuntar hasta 3 imagenes.</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleObservationImageChange} disabled={observationSaving || observationImages.length >= 3} />
                  </label>
                  {observationImages.length > 0 && (
                    <div className="mb-3 grid grid-cols-3 gap-3">
                      {observationImages.map((image, index) => (
                        <div key={`${image.file.name}-${image.preview}`} className="relative overflow-hidden rounded-lg border border-dark-border bg-dark-bg">
                          <img src={image.preview} alt={image.file.name} className="h-24 w-full object-cover" />
                          <p className="truncate px-2 py-1 text-[11px] text-text-muted">{image.file.name}</p>
                          <button type="button" onClick={() => removeObservationImage(index)} disabled={observationSaving} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50">
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {observationError && <p className="mb-3 rounded border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{observationError}</p>}
                  <div className="flex justify-end">
                    <button type="submit" disabled={!newObs.observacion.trim() || observationSaving} className="rounded bg-brand-cyan px-3 py-1.5 text-xs font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                      {observationSaving ? 'Guardando...' : 'Guardar Observacion'}
                    </button>
                  </div>
                </form>
              )}

              {observationNotice && (
                <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                  {observationNotice}
                </p>
              )}

              {(v.observaciones || []).map((obs, idx) => (
                <div key={getObservationId(obs) || idx} className="rounded-lg border border-dark-border bg-dark-surface p-4">
                  <span className="text-xs text-text-muted">{formatDate(obs.fecha)}</span>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">{obs.observacion || obs.desc || obs.descripcion || 'Sin detalle'}</p>
                </div>
              ))}

              {(v.observaciones || []).length === 0 && !showAddObs && (
                <div className="rounded-lg border border-dashed border-dark-border p-6 text-center text-sm text-text-muted">
                  No hay observaciones registradas.
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between border-b border-dark-border pb-2">
              <h4 className="flex items-center gap-2 text-lg font-semibold text-white">
                <svg className="h-5 w-5 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Mantenciones
              </h4>
              <button onClick={() => setShowAddMant((current) => !current)} className="flex items-center gap-1 text-xs font-medium text-text-muted transition-colors hover:text-brand-cyan">
                <span>{showAddMant ? '-' : '+'}</span> {showAddMant ? 'Cancelar' : 'Agregar'}
              </button>
            </div>

            <div className="space-y-4">
              {showAddMant && (
                <form onSubmit={handleCreateMaintenance} className="mb-4 rounded-lg border border-brand-cyan/50 bg-dark-bg2 p-4">
                  <div className="mb-3 grid gap-3 md:grid-cols-2">
                    <input type="date" value={newMant.fecha} onChange={(e) => setNewMant({ ...newMant, fecha: e.target.value })} className="rounded border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none" />
                    <select value={newMant.tipo} onChange={(e) => setNewMant({ ...newMant, tipo: e.target.value })} className="rounded border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none">
                      <option value="Preventiva">Preventiva</option>
                      <option value="Correctiva">Correctiva</option>
                    </select>
                  </div>
                  <textarea placeholder="Detalle de la mantencion" value={newMant.descripcion} onChange={(e) => setNewMant({ ...newMant, descripcion: e.target.value })} className="mb-3 min-h-[96px] w-full rounded border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white focus:border-brand-cyan focus:outline-none" />
                  <label className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-dark-border bg-dark-bg px-4 py-4 text-center transition-colors hover:border-brand-cyan/60">
                    <span className="text-sm font-semibold text-white">Seleccionar archivos</span>
                    <span className="mt-1 text-xs text-text-muted">Puedes adjuntar imagenes, PDF u otros documentos.</span>
                    <input type="file" multiple className="hidden" onChange={handleMaintenanceFileChange} disabled={maintenanceSaving} />
                  </label>
                  {maintenanceFiles.length > 0 && (
                    <div className="mb-3 grid grid-cols-2 gap-3">
                      {maintenanceFiles.map((fileItem, index) => (
                        <div key={`${fileItem.file.name}-${fileItem.preview}`} className="relative rounded-lg border border-dark-border bg-dark-bg p-2">
                          {isImageFile(fileItem) ? (
                            <img src={fileItem.preview} alt={fileItem.file.name} className="mb-2 h-24 w-full rounded object-cover" />
                          ) : (
                            <div className="mb-2 flex h-24 items-center justify-center rounded bg-brand-cyan/10 text-2xl text-brand-cyan">
                              PDF
                            </div>
                          )}
                          <p className="truncate pr-7 text-xs font-semibold text-white">{fileItem.file.name}</p>
                          <button type="button" onClick={() => removeMaintenanceFile(index)} disabled={maintenanceSaving} className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white transition-opacity hover:opacity-80 disabled:opacity-50">
                            x
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {maintenanceError && <p className="mb-3 rounded border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">{maintenanceError}</p>}
                  <div className="flex justify-end">
                    <button type="submit" disabled={!newMant.descripcion.trim() || !newMant.tipo.trim() || maintenanceSaving} className="rounded bg-brand-cyan px-3 py-1.5 text-xs font-bold text-dark-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                      {maintenanceSaving ? 'Guardando...' : 'Guardar Mantencion'}
                    </button>
                  </div>
                </form>
              )}

              {maintenanceNotice && (
                <p className="rounded-lg border border-brand-red/30 bg-brand-red/10 px-3 py-2 text-xs text-brand-red">
                  {maintenanceNotice}
                </p>
              )}

              {(v.mantenciones || []).map((mant, idx) => (
                <div key={getMaintenanceId(mant) || idx} className="rounded-lg border border-dark-border bg-dark-surface p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <span className="text-xs text-text-muted">{formatDate(mant.fecha)}</span>
                    <span className="rounded-full border border-brand-cyan/20 bg-brand-cyan/10 px-2 py-0.5 text-[11px] font-bold text-brand-cyan">{mant.estadoMantencion || mant.tipo || 'Mantencion'}</span>
                  </div>
                  <h5 className="mb-1 text-sm font-semibold text-white">{mant.tipo || 'Mantencion'}</h5>
                  <p className="text-sm leading-relaxed text-text-muted">{mant.descripcion || mant.desc || 'Sin detalle'}</p>
                </div>
              ))}

              {(v.mantenciones || []).length === 0 && !showAddMant && (
                <div className="rounded-lg border border-dashed border-dark-border p-6 text-center text-sm text-text-muted">
                  No hay mantenciones registradas.
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return null;
}

export default VehiculosView;
