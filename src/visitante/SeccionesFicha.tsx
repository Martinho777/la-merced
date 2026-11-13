import { useTranslation } from 'react-i18next'
import { Santi } from '@/componentes/Santi/Santi'
import { SantiBurbuja } from '@/componentes/SantiBurbuja'

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
