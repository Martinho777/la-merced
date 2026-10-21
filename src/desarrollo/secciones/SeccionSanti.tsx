// Sección de Santi en /estilos (solo desarrollo): todas las poses y las secuencias de habla, para
// revisar que sean consistentes.

import {
  HABLA,
  HABLA_CABEZA,
  HABLA_CABEZA_CERRADA,
  HABLA_CABEZA_O,
  HABLA_O,
  POSES,
  type SantiPose,
} from '@/assets/santi'
import { Santi } from '@/componentes/Santi/Santi'
import './SeccionSanti.css'

const SECUENCIAS: { nombre: string; cuadros: readonly SantiPose[] }[] = [
  { nombre: 'Habla (cuerpo): HABLA + HABLA_O', cuadros: [...HABLA, HABLA_O] },
  {
    nombre: 'Habla (cabeza): HABLA_CABEZA + HABLA_CABEZA_O + HABLA_CABEZA_CERRADA',
    cuadros: [...HABLA_CABEZA, HABLA_CABEZA_O, HABLA_CABEZA_CERRADA],
  },
]

export function Seccion() {
  return (
    <section className="pagina-estilos__seccion">
      <h2 className="texto-title-2">Santi</h2>
      <div className="pagina-estilos__fila">
        <Santi pose="wave" tamano="sm" />
        <Santi pose="wave" tamano="md" />
        <Santi pose="wave" tamano="lg" />
      </div>
      <h3 className="texto-heading">Poses</h3>
      <div className="pagina-estilos__santi-grilla">
        {POSES.map((pose) => (
          <figure key={pose} className="pagina-estilos__santi">
            <Santi pose={pose} />
            <figcaption className="texto-caption">{pose}</figcaption>
          </figure>
        ))}
      </div>
      {SECUENCIAS.map(({ nombre, cuadros }) => (
        <div key={nombre} className="pagina-estilos__grupo">
          <h3 className="texto-heading">{nombre}</h3>
          <div className="pagina-estilos__santi-fila">
            {cuadros.map((pose) => (
              <figure key={pose} className="pagina-estilos__santi">
                <Santi pose={pose} />
                <figcaption className="texto-caption">{pose}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
      <p className="texto-small pagina-estilos__nota">
        Parpadeo: todavía no hay cuadros en santi-originales/.
      </p>
    </section>
  )
}
