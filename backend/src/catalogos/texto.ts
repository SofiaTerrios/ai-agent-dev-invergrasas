// Lowercase without accents, as stored in ciudades.nombre_busqueda.
export function normalizarBusqueda(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .trim();
}

// Trims and collapses inner spaces of a catalog name.
export function limpiarNombre(nombre: string) {
  return nombre.trim().replace(/\s+/g, ' ');
}
