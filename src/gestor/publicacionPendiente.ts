// Aviso de «hay cambios sin publicar» en el inicio del gestor. Lo que se aprueba ya lo ve el visitante;
// «Publicar» actualiza la copia de respaldo que la app usa si la base falla (src/datos/respaldo.ts).
// Cada pantalla que guarda algo lo marca; una publicación exitosa lo limpia. Vive en este navegador:
// es un recordatorio para quien edita, no el estado real de la publicación.

const CLAVE = 'la-merced:gestor:sin-publicar'

function almacen(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/** Anota que se guardó algo que la próxima publicación debe recoger. */
export function marcarCambiosSinPublicar(): void {
  try {
    almacen()?.setItem(CLAVE, new Date().toISOString())
  } catch {
    // Sin almacenamiento no hay recordatorio; publicar sigue funcionando igual.
  }
}

export function hayCambiosSinPublicar(): boolean {
  try {
    return Boolean(almacen()?.getItem(CLAVE))
  } catch {
    return false
  }
}

export function limpiarCambiosSinPublicar(): void {
  try {
    almacen()?.removeItem(CLAVE)
  } catch {
    // Nada que limpiar.
  }
}
