import type { ImagenPunto } from '@/datos/puntos'

type Props = {
  imagen: ImagenPunto | null
  /** Clase del marco, que define sus dimensiones. */
  className: string
}

/**
 * Espacio de una fotografía. Sin imagen conserva dimensiones, borde y fondo y queda vacío; cuando los
 * datos traen una ruta, la muestra. Si la imagen falla, el navegador deja ver el mismo fondo.
 */
export function FotoReservada({ imagen, className }: Props) {
  return (
    <div className={`foto-reservada ${className}`}>
      {imagen?.url && (
        <img
          className="foto-reservada__imagen"
          src={imagen.url}
          alt={imagen.textoAlternativo}
          decoding="async"
          loading="lazy"
          onError={(evento) => {
            evento.currentTarget.hidden = true
          }}
        />
      )}
    </div>
  )
}
