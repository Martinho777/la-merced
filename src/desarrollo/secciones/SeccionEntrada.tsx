// Sección de /estilos (solo desarrollo) con los componentes del bloque 4: SantiBurbuja y
// GrupoOpciones. Los textos son de prueba, no van a i18n.

import { useState } from 'react'
import { GrupoOpciones } from '@/componentes/GrupoOpciones'
import { Santi } from '@/componentes/Santi/Santi'
import { SantiBurbuja } from '@/componentes/SantiBurbuja'

export function Seccion() {
  const [opcion, setOpcion] = useState('a')

  return (
    <section className="pagina-estilos__seccion">
      <h2 className="texto-title-2">SantiBurbuja</h2>
      <SantiBurbuja cola="abajo">
        Apunta la cámara a la fachada para ubicarnos. Solo es una vez.
      </SantiBurbuja>
      <Santi pose="phone" tamano="sm" />
      <div className="pagina-estilos__fila">
        <Santi pose="head-smile" tamano="sm" />
        <SantiBurbuja cola="izquierda">¿Lo estás viendo?</SantiBurbuja>
      </div>

      <h2 className="texto-title-2">GrupoOpciones</h2>
      <GrupoOpciones
        leyenda="Lista"
        nombre="estilos-lista"
        valor={opcion}
        onCambiar={setOpcion}
        opciones={[
          { valor: 'a', titulo: 'Recomendada', subtitulo: 'Todos los puntos · [X] min' },
          { valor: 'b', titulo: 'Esencial', subtitulo: 'Lo más importante · [X] min' },
          { valor: 'c', titulo: 'No disponible', etiquetaNoDisponible: 'Próximamente' },
        ]}
      />
      <GrupoOpciones
        leyenda="Cuadrícula"
        nombre="estilos-cuadricula"
        disposicion="cuadricula"
        valor="principal"
        onCambiar={() => {}}
        opciones={[
          { valor: 'principal', titulo: 'Destacada', subtitulo: '1 punto', destacada: true },
          { valor: 'b', titulo: 'Media columna', etiquetaNoDisponible: 'Próximamente' },
          { valor: 'c', titulo: 'Media columna', etiquetaNoDisponible: 'Próximamente' },
        ]}
      />
    </section>
  )
}
