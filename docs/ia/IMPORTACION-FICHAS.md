# Importación de las fichas de la URL

Cómo cargar al gestor el material que entrega el equipo de investigación (la URL). Código:
`src/importacion/importar.ts` (validación e importación, probadas en `importar.test.ts`) y
`scripts/importar-fichas.ts` (conexión con Supabase y conversión de fotos).

**Estado al 25 nov 2026:** no hay material de la URL en el repositorio ni en la base. La importación está
implementada y probada con datos simulados; **la carga real está pendiente** de que llegue la entrega.

## Qué hace

- Crea el punto si no existe (por zona y número), sube fotos y audios al bucket `medios` y crea las fichas
  **en estado «revision»**, solo en los idiomas que trae la entrega. Nada se traduce ni se completa.
- Vincula las fuentes con su nivel de confianza (la fuente se reconoce por su cita exacta).
- **Repetible:** una ficha que ya existe no se sobrescribe (se informa como omitida); cada archivo se nombra
  por su huella SHA-256, así que el mismo archivo nunca se sube dos veces.
- Anota la **procedencia** (`origen`, `entrega`, `archivo`, `sha256`) en fichas, medios y fuentes. La
  procedencia no se publica.
- Al terminar escribe `<carpeta>/resumen-importacion.json` con lo importado, lo omitido y los errores.

## Cómo se corre

Requisitos: Node 24, `.env.local` con las variables públicas y **la migración
`20261125000001_audios_procedencia_publicaciones.sql` aplicada** (columna `procedencia`).

```bash
CORREO_IMPORTACION=<cuenta del gestor> npm run importar -- <carpeta-de-la-entrega>            # simula
CORREO_IMPORTACION=<cuenta del gestor> npm run importar -- <carpeta-de-la-entrega> --aplicar  # importa
```

Pide la contraseña sin mostrarla (o se pasa en `CLAVE_IMPORTACION`, nunca en el repositorio). Usa la clave
pública: las reglas de acceso deciden qué puede escribir la cuenta (editor, revisor o admin). Sin
`--aplicar` no escribe nada y dice qué haría.

## Formato de la entrega

La URL entrega Word o Google Docs (`07.docx`) y archivos sueltos (ver
`documentos/material-que-necesitamos-de-la-url.pdf`). El equipo los pasa a esta carpeta, copiando el texto
**tal cual** al manifiesto:

```
entrega-2026-11-23/
  manifiesto.json
  fotos/07.jpg
  fotos/07-historica-1.jpg
  audios/07-es.mp3
  audios/07-cak.mp3
```

`manifiesto.json` (todas las rutas son relativas a la carpeta):

```json
{
  "entrega": {
    "origen": "URL",
    "fecha": "2026-11-23",
    "descripcion": "Primera entrega, fachada principal"
  },
  "fichas": [
    {
      "numero": 7,
      "zona": "fachada-principal",
      "esencial": true,
      "idiomas": {
        "es": {
          "titulo": "…",
          "que_ves": "…",
          "historia": "…",
          "dato_santi": "…",
          "transcripcion": "Texto exacto de audios/07-es.mp3"
        },
        "cak": { "titulo": "…", "transcripcion": "…" }
      },
      "foto": {
        "archivo": "fotos/07.jpg",
        "texto_alternativo": { "es": "…", "en": "…", "cak": "…" },
        "credito": "Autor, colección",
        "fecha": "2026",
        "derechos": "Autorizada por …"
      },
      "fotos_historicas": [
        {
          "archivo": "fotos/07-historica-1.jpg",
          "texto_alternativo": { "es": "…" },
          "credito": "…",
          "fecha": "ca. 1920",
          "derechos": "…"
        }
      ],
      "fuentes": [
        {
          "cita": "Referencia completa",
          "tipo": "libro",
          "url": null,
          "nivel": "documentado",
          "nota": "Qué dato respalda"
        }
      ],
      "audios": { "es": "audios/07-es.mp3", "cak": "audios/07-cak.mp3" }
    }
  ]
}
```

Reglas que valida antes de escribir (una ficha con errores se rechaza sin detener las demás):

| Campo                             | Regla                                                                                                 |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `entrega.origen`, `entrega.fecha` | Obligatorios; fecha `AAAA-MM-DD`                                                                      |
| `numero`                          | Entero desde 1, sin repetirse dentro de la zona                                                       |
| `zona`                            | `fachada-principal`, `fachada-secundaria` o `interior`                                                |
| `idiomas`                         | Al menos uno; solo `es`, `en`, `cak`; cada uno con `titulo`                                           |
| `foto`, `fotos_historicas[]`      | `archivo` JPEG, PNG, WebP, TIFF o HEIC; `texto_alternativo.es` obligatorio                            |
| `fuentes[]`                       | `cita`; `tipo` ∈ archivo, libro, entrevista, sitio_web; `nivel` ∈ documentado, probable, especulativo |
| `audios`                          | MP3 o M4A, y solo para un idioma que tenga ficha en la entrega                                        |

Las fotos se reducen a 2000 px y se convierten a WebP (como hace el gestor). Los audios se suben tal cual;
el bucket rechaza más de 50 MB. Un archivo nombrado en el manifiesto que no está en la carpeta se omite y se
informa. Si una ficha de un idioma ya existe en el gestor, no se toca (ni su audio): hay que revisarla a mano.
