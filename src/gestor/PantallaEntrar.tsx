import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { LogIn } from 'lucide-react'
import { BarraSuperior } from '@/componentes/BarraSuperior'
import { Boton } from '@/componentes/Boton'
import { ErrorInicioSesion, iniciarSesion, type SesionGestor } from '@/datos/sesion'
import { Campo } from '@/gestor/componentes/Campo'

type Error = 'faltanDatos' | 'errorCredenciales' | 'errorConexion'

/** Inicio de sesión del gestor con correo y contraseña. */
export function PantallaEntrar({ alEntrar }: { alEntrar: (sesion: SesionGestor) => void }) {
  const { t } = useTranslation('gestor')
  const navegar = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  async function entrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!correo.trim() || !contrasena) {
      setError('faltanDatos')
      return
    }
    setEnviando(true)
    setError(null)
    try {
      alEntrar(await iniciarSesion(correo, contrasena))
    } catch (e) {
      const credenciales = e instanceof ErrorInicioSesion && e.motivo === 'credenciales'
      setError(credenciales ? 'errorCredenciales' : 'errorConexion')
      setEnviando(false)
    }
  }

  return (
    <section className="gestor">
      <BarraSuperior
        etiqueta={t('entrar.volver')}
        etiquetaAccesible={t('entrar.volverAccesible')}
        onVolver={() => navegar('/')}
      />
      <div className="gestor__titulos">
        <h1 className="gestor__titulo texto-title-1">{t('entrar.titulo')}</h1>
        <p className="gestor__texto texto-body">{t('entrar.texto')}</p>
      </div>
      <form className="gestor__formulario" onSubmit={entrar} noValidate>
        <Campo
          etiqueta={t('entrar.correo')}
          type="email"
          autoComplete="username"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
        />
        <Campo
          etiqueta={t('entrar.contrasena')}
          type="password"
          autoComplete="current-password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
        />
        {error && (
          <p className="gestor__error texto-body" role="alert">
            {t(`entrar.${error}`)}
          </p>
        )}
        <Boton type="submit" icono={LogIn} cargando={enviando} anchoCompleto>
          {t('entrar.boton')}
        </Boton>
      </form>
    </section>
  )
}
