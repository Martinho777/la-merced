// Datos para el reporte de faltantes (src/gestor/faltantes.ts): todos los puntos con sus fichas en
// cualquier estado (el personal las ve todas, por las reglas de acceso), fotos y fuentes.

import { supabase } from '@/lib/supabase'
import type { FotoReporte, IdiomaReporte, PuntoReporte } from '@/gestor/faltantes'

type Textos = Partial<Record<IdiomaReporte, string>>

function textos(valor: unknown): Textos {
  if (typeof valor !== 'object' || valor === null || Array.isArray(valor)) return {}
  return Object.fromEntries(
    Object.entries(valor).filter(([, v]) => typeof v === 'string'),
  ) as Textos
}

export async function leerPuntosParaReporte(): Promise<PuntoReporte[]> {
  const { data, error } = await supabase.from('puntos').select(
    `id, slug, orden, zonas!inner(slug),
       fichas(idioma, estado, titulo, que_ves, historia, dato_santi, transcripcion,
              audio:medios!fichas_audio_id_fkey(idioma)),
       medios!medios_punto_id_fkey(tipo, ruta, texto_alternativo, credito, fecha_original, derechos),
       punto_fuentes(nivel_confianza, fuentes!inner(cita, url, tipo))`,
  )
  if (error) throw new Error(`No se pudieron leer los puntos para el reporte: ${error.message}`)

  return data.map((punto) => ({
    id: punto.id,
    slug: punto.slug,
    orden: punto.orden,
    zona: punto.zonas.slug,
    fichas: punto.fichas.map((f) => ({
      idioma: f.idioma,
      estado: f.estado,
      titulo: f.titulo,
      que_ves: f.que_ves,
      historia: f.historia,
      dato_santi: f.dato_santi,
      transcripcion: f.transcripcion,
      audio: f.audio ? { idioma: f.audio.idioma } : null,
    })),
    fotos: punto.medios
      .filter((m) => m.tipo === 'foto' || m.tipo === 'foto_historica')
      .map((m): FotoReporte => ({
        tipo: m.tipo === 'foto' ? 'foto' : 'foto_historica',
        ruta: m.ruta,
        textoAlternativo: textos(m.texto_alternativo),
        credito: m.credito,
        fecha: m.fecha_original,
        derechos: m.derechos,
      })),
    fuentes: punto.punto_fuentes.map((v) => ({
      cita: v.fuentes.cita,
      url: v.fuentes.url,
      tipo: v.fuentes.tipo,
      nivel: v.nivel_confianza,
    })),
  }))
}
