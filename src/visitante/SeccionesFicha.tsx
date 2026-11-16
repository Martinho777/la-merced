import { useTranslation } from 'react-i18next'
import { ExternalLink } from 'lucide-react'
import { Insignia } from '@/componentes/Insignia'
import { TONO_NIVEL } from '@/componentes/nivelConfianza'
import { Santi } from '@/componentes/Santi/Santi'
import { SantiBurbuja } from '@/componentes/SantiBurbuja'
import type { FuenteFicha } from '@/datos/puntos'

/**
 * «Dato de Santi»: el dato curioso de la ficha, dicho por Santi en su burbuja. Sin dato no se muestra
 * la sección: es un extra de la ficha, y nunca se inventa.
 */
export function DatoSanti({ dato }: { dato: string | null | undefined }) {
  const { t } = useTranslation()
  if (!dato?.trim()) return null

  return (
    <section className="ficha__seccion">
      <h2 className="ficha__subtitulo texto-title-2">{t('punto.datoSanti')}</h2>
      <div className="ficha__dato">
        <Santi pose="head-wink" tamano="sm" className="ficha__dato-santi" />
        <SantiBurbuja cola="izquierda" className="ficha__dato-burbuja">
          {dato}
        </SantiBurbuja>
      </div>
    </section>
  )
}

/**
 * «Fuentes»: de dónde sale lo que dice la ficha y qué tan seguro es cada dato (documentado, probable o
 * especulativo). Sin fuentes no se muestra la sección.
 */
export function FuentesFicha({ fuentes }: { fuentes: readonly FuenteFicha[] }) {
  const { t } = useTranslation()
  if (fuentes.length === 0) return null

  return (
    <section className="ficha__seccion">
      <h2 className="ficha__subtitulo texto-title-2">{t('punto.fuentes.titulo')}</h2>
      <p className="ficha__fuentes-ayuda texto-small">{t('punto.fuentes.ayuda')}</p>
      <ul className="ficha__fuentes">
        {fuentes.map((fuente, i) => (
          <li key={`${fuente.cita}-${i}`} className="ficha__fuente">
            <Insignia tono={TONO_NIVEL[fuente.nivel]}>
              {t(`punto.fuentes.niveles.${fuente.nivel}`)}
            </Insignia>
            <p className="ficha__fuente-cita texto-body">{fuente.cita}</p>
            {fuente.nota && <p className="ficha__fuente-nota texto-small">{fuente.nota}</p>}
            {fuente.url && (
              <a
                className="ficha__fuente-enlace texto-small-strong"
                href={fuente.url}
                target="_blank"
                rel="noreferrer"
              >
                {t('punto.fuentes.enlace')}
                <span className="visualmente-oculto">{t('punto.fuentes.otraPestana')}</span>
                <ExternalLink className="ficha__fuente-icono" aria-hidden="true" />
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  )
}
