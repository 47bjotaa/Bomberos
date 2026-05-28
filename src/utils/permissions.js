export const PERMISSIONS = {
  VER_INVENTARIO: 'VER_INVENTARIO',
  VER_VEHICULOS: 'VER_VEHICULOS',
  CREAR_MATERIAL: 'CREAR_MATERIAL',
  EDITAR_MATERIAL: 'EDITAR_MATERIAL',
  AGREGAR_STOCK: 'AGREGAR_STOCK',
  MOVER_MATERIAL: 'MOVER_MATERIAL',
  REGISTRAR_DANO_PERDIDA: 'REGISTRAR_DANO_PERDIDA',
  CAMBIAR_ESTADO_MATERIAL: 'CAMBIAR_ESTADO_MATERIAL',
  DAR_BAJA_MATERIAL: 'DAR_BAJA_MATERIAL',
  GESTIONAR_UBICACIONES: 'GESTIONAR_UBICACIONES',
  GESTIONAR_VEHICULOS: 'GESTIONAR_VEHICULOS',
  VER_EPP: 'VER_EPP',
  VER_EPP_PROPIO: 'VER_EPP_PROPIO',
  GESTIONAR_EPP: 'GESTIONAR_EPP',
  GESTIONAR_MANTENCIONES: 'GESTIONAR_MANTENCIONES',
  GESTIONAR_OBSERVACIONES: 'GESTIONAR_OBSERVACIONES',
  VER_REPORTES: 'VER_REPORTES',
  VER_REPORTES_BASICOS: 'VER_REPORTES_BASICOS',
  VER_BOMBEROS: 'VER_BOMBEROS',
  GESTIONAR_USUARIOS: 'GESTIONAR_USUARIOS',
  GESTIONAR_USUARIO_PROPIO: 'GESTIONAR_USUARIO_PROPIO',
  GESTIONAR_ROLES: 'GESTIONAR_ROLES',
  VER_LIBRO_GUARDIA: 'VER_LIBRO_GUARDIA',
  CREAR_LIBRO_GUARDIA: 'CREAR_LIBRO_GUARDIA',
  REGISTRAR_LIBRO_GUARDIA: 'REGISTRAR_LIBRO_GUARDIA',
  VER_DONACIONES: 'VER_DONACIONES',
  GESTIONAR_DONACIONES: 'GESTIONAR_DONACIONES',
  CREAR_LINK_DONACION: 'CREAR_LINK_DONACION',
  GESTIONAR_CONFIGURACION_PAGO: 'GESTIONAR_CONFIGURACION_PAGO',
  VER_CONFIGURACION_PAGO: 'VER_CONFIGURACION_PAGO',
};

const PERMISSION_BY_ID = {
  1: PERMISSIONS.VER_INVENTARIO,
  2: PERMISSIONS.VER_VEHICULOS,
  3: PERMISSIONS.CREAR_MATERIAL,
  4: PERMISSIONS.EDITAR_MATERIAL,
  5: PERMISSIONS.AGREGAR_STOCK,
  6: PERMISSIONS.MOVER_MATERIAL,
  7: PERMISSIONS.REGISTRAR_DANO_PERDIDA,
  8: PERMISSIONS.CAMBIAR_ESTADO_MATERIAL,
  9: PERMISSIONS.DAR_BAJA_MATERIAL,
  10: PERMISSIONS.GESTIONAR_UBICACIONES,
  11: PERMISSIONS.GESTIONAR_VEHICULOS,
  12: PERMISSIONS.VER_EPP,
  13: PERMISSIONS.VER_EPP_PROPIO,
  14: PERMISSIONS.GESTIONAR_EPP,
  15: PERMISSIONS.GESTIONAR_MANTENCIONES,
  16: PERMISSIONS.GESTIONAR_OBSERVACIONES,
  17: PERMISSIONS.VER_REPORTES,
  18: PERMISSIONS.VER_REPORTES_BASICOS,
  19: PERMISSIONS.VER_BOMBEROS,
  20: PERMISSIONS.GESTIONAR_USUARIOS,
  21: PERMISSIONS.GESTIONAR_USUARIO_PROPIO,
  22: PERMISSIONS.GESTIONAR_ROLES,
  23: PERMISSIONS.VER_LIBRO_GUARDIA,
  24: PERMISSIONS.CREAR_LIBRO_GUARDIA,
  25: PERMISSIONS.REGISTRAR_LIBRO_GUARDIA,
  26: PERMISSIONS.VER_DONACIONES,
  27: PERMISSIONS.GESTIONAR_DONACIONES,
  28: PERMISSIONS.CREAR_LINK_DONACION,
  29: PERMISSIONS.GESTIONAR_CONFIGURACION_PAGO,
  30: PERMISSIONS.VER_CONFIGURACION_PAGO,
};

const ROLE_PERMISSION_IDS = {
  capitan: Array.from({ length: 30 }, (_, index) => index + 1),
  director: Array.from({ length: 30 }, (_, index) => index + 1),
  teniente: [1, 2, 5, 6, 7, 8, 9, 12, 13, 18, 21, 23, 24, 25],
  ayudante: [1, 2, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 18, 19, 21, 23, 24, 25, 26, 28],
  voluntario: [1, 2, 6, 13, 16, 21, 23, 25, 26, 28],
};

const ROLE_KEY_BY_ID = {
  1: 'capitan',
  2: 'teniente',
  3: 'ayudante',
  4: 'voluntario',
  5: 'director',
};

const normalizeRole = (value = '') => (
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
);

const addPermissionValue = (permissionSet, value) => {
  if (value === undefined || value === null || value === '') return;

  if (typeof value === 'number' || /^\d+$/.test(String(value))) {
    const code = PERMISSION_BY_ID[Number(value)];
    if (code) permissionSet.add(code);
    return;
  }

  const code = String(value).trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(PERMISSIONS, code)) {
    permissionSet.add(code);
  }
};

const normalizePermissionList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(/[,\s]+/)
      .map(permission => permission.trim())
      .filter(Boolean);
  }
  return [];
};

export const getUserPermissionSet = (user = {}) => {
  const permissionSet = new Set();
  const rawPermissions = [
    ...normalizePermissionList(user.permisos),
    ...normalizePermissionList(user.permissions),
    ...normalizePermissionList(user.permisosUsuario),
  ];

  rawPermissions.forEach((permission) => {
    if (permission && typeof permission === 'object') {
      addPermissionValue(permissionSet, permission.codigo || permission.codigoPermiso || permission.nombre || permission.permiso);
      addPermissionValue(permissionSet, permission.idPermiso || permission.id);
      return;
    }

    addPermissionValue(permissionSet, permission);
  });

  const roleId = user.idRol || user.rolId || user.roleId || user.idRole;
  const roleKey = ROLE_KEY_BY_ID[Number(roleId)] || normalizeRole(user.cargo || user.rol || user.role || user.nombreRol);
  (ROLE_PERMISSION_IDS[roleKey] || []).forEach(id => addPermissionValue(permissionSet, id));

  return permissionSet;
};

export const hasPermission = (permissionSet, permission) => permissionSet.has(permission);

export const hasAnyPermission = (permissionSet, permissions = []) => (
  permissions.some(permission => hasPermission(permissionSet, permission))
);
