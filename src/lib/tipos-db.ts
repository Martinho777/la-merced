// Tipos de la base de datos. NO EDITAR A MANO.
// Se regeneran con `npm run db:types` después de cada migración.
// (Versión inicial escrita a partir de supabase/migrations/ hasta enlazar el proyecto.)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      fichas: {
        Row: {
          actualizado_en: string
          audio_id: string | null
          creado_en: string
          dato_santi: string | null
          estado: Database['public']['Enums']['estado_contenido']
          historia: string | null
          id: string
          idioma: Database['public']['Enums']['idioma']
          punto_id: string
          que_ves: string | null
          revisado_en: string | null
          revisado_por: string | null
          titulo: string
          transcripcion: string | null
        }
        Insert: {
          actualizado_en?: string
          audio_id?: string | null
          creado_en?: string
          dato_santi?: string | null
          estado?: Database['public']['Enums']['estado_contenido']
          historia?: string | null
          id?: string
          idioma: Database['public']['Enums']['idioma']
          punto_id: string
          que_ves?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          titulo: string
          transcripcion?: string | null
        }
        Update: {
          actualizado_en?: string
          audio_id?: string | null
          creado_en?: string
          dato_santi?: string | null
          estado?: Database['public']['Enums']['estado_contenido']
          historia?: string | null
          id?: string
          idioma?: Database['public']['Enums']['idioma']
          punto_id?: string
          que_ves?: string | null
          revisado_en?: string | null
          revisado_por?: string | null
          titulo?: string
          transcripcion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'fichas_audio_id_fkey'
            columns: ['audio_id']
            isOneToOne: false
            referencedRelation: 'medios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fichas_punto_id_fkey'
            columns: ['punto_id']
            isOneToOne: false
            referencedRelation: 'puntos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'fichas_revisado_por_fkey'
            columns: ['revisado_por']
            isOneToOne: false
            referencedRelation: 'perfiles'
            referencedColumns: ['id']
          },
        ]
      }
      fuentes: {
        Row: {
          actualizado_en: string
          cita: string
          creado_en: string
          id: string
          tipo: string
          url: string | null
        }
        Insert: {
          actualizado_en?: string
          cita: string
          creado_en?: string
          id?: string
          tipo: string
          url?: string | null
        }
        Update: {
          actualizado_en?: string
          cita?: string
          creado_en?: string
          id?: string
          tipo?: string
          url?: string | null
        }
        Relationships: []
      }
      medios: {
        Row: {
          actualizado_en: string
          alto: number | null
          ancho: number | null
          creado_en: string
          credito: string | null
          derechos: string | null
          duracion_s: number | null
          fecha_original: string | null
          id: string
          idioma: Database['public']['Enums']['idioma'] | null
          orden: number
          peso_bytes: number | null
          punto_id: string | null
          ruta: string
          texto_alternativo: Json
          tipo: Database['public']['Enums']['tipo_medio']
        }
        Insert: {
          actualizado_en?: string
          alto?: number | null
          ancho?: number | null
          creado_en?: string
          credito?: string | null
          derechos?: string | null
          duracion_s?: number | null
          fecha_original?: string | null
          id?: string
          idioma?: Database['public']['Enums']['idioma'] | null
          orden?: number
          peso_bytes?: number | null
          punto_id?: string | null
          ruta: string
          texto_alternativo?: Json
          tipo: Database['public']['Enums']['tipo_medio']
        }
        Update: {
          actualizado_en?: string
          alto?: number | null
          ancho?: number | null
          creado_en?: string
          credito?: string | null
          derechos?: string | null
          duracion_s?: number | null
          fecha_original?: string | null
          id?: string
          idioma?: Database['public']['Enums']['idioma'] | null
          orden?: number
          peso_bytes?: number | null
          punto_id?: string | null
          ruta?: string
          texto_alternativo?: Json
          tipo?: Database['public']['Enums']['tipo_medio']
        }
        Relationships: [
          {
            foreignKeyName: 'medios_punto_id_fkey'
            columns: ['punto_id']
            isOneToOne: false
            referencedRelation: 'puntos'
            referencedColumns: ['id']
          },
        ]
      }
      perfiles: {
        Row: {
          actualizado_en: string
          creado_en: string
          id: string
          nombre: string | null
          rol: Database['public']['Enums']['rol_usuario'] | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          id: string
          nombre?: string | null
          rol?: Database['public']['Enums']['rol_usuario'] | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          id?: string
          nombre?: string | null
          rol?: Database['public']['Enums']['rol_usuario'] | null
        }
        Relationships: []
      }
      punto_fuentes: {
        Row: {
          actualizado_en: string
          creado_en: string
          fuente_id: string
          nivel_confianza: Database['public']['Enums']['nivel_confianza']
          nota: string | null
          punto_id: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          fuente_id: string
          nivel_confianza: Database['public']['Enums']['nivel_confianza']
          nota?: string | null
          punto_id: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          fuente_id?: string
          nivel_confianza?: Database['public']['Enums']['nivel_confianza']
          nota?: string | null
          punto_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'punto_fuentes_fuente_id_fkey'
            columns: ['fuente_id']
            isOneToOne: false
            referencedRelation: 'fuentes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'punto_fuentes_punto_id_fkey'
            columns: ['punto_id']
            isOneToOne: false
            referencedRelation: 'puntos'
            referencedColumns: ['id']
          },
        ]
      }
      puntos: {
        Row: {
          actualizado_en: string
          creado_en: string
          es_esencial: boolean
          id: string
          orden: number
          pos_x: number | null
          pos_y: number | null
          slug: string
          tiene_3d: boolean
          zona_id: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          es_esencial?: boolean
          id?: string
          orden: number
          pos_x?: number | null
          pos_y?: number | null
          slug: string
          tiene_3d?: boolean
          zona_id: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          es_esencial?: boolean
          id?: string
          orden?: number
          pos_x?: number | null
          pos_y?: number | null
          slug?: string
          tiene_3d?: boolean
          zona_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'puntos_zona_id_fkey'
            columns: ['zona_id']
            isOneToOne: false
            referencedRelation: 'zonas'
            referencedColumns: ['id']
          },
        ]
      }
      zonas: {
        Row: {
          actualizado_en: string
          contorno_id: string | null
          creado_en: string
          disponible: boolean
          id: string
          ilustracion_id: string | null
          orden: number
          slug: string
          usa_camara: boolean
        }
        Insert: {
          actualizado_en?: string
          contorno_id?: string | null
          creado_en?: string
          disponible?: boolean
          id?: string
          ilustracion_id?: string | null
          orden: number
          slug: string
          usa_camara?: boolean
        }
        Update: {
          actualizado_en?: string
          contorno_id?: string | null
          creado_en?: string
          disponible?: boolean
          id?: string
          ilustracion_id?: string | null
          orden?: number
          slug?: string
          usa_camara?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'zonas_contorno_id_fkey'
            columns: ['contorno_id']
            isOneToOne: false
            referencedRelation: 'medios'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'zonas_ilustracion_id_fkey'
            columns: ['ilustracion_id']
            isOneToOne: false
            referencedRelation: 'medios'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      es_admin: { Args: never; Returns: boolean }
      es_carpeta_de_medios: { Args: { nombre: string }; Returns: boolean }
      es_personal: { Args: never; Returns: boolean }
      rol_actual: {
        Args: never
        Returns: Database['public']['Enums']['rol_usuario']
      }
    }
    Enums: {
      estado_contenido: 'borrador' | 'revision' | 'aprobado'
      idioma: 'es' | 'cak' | 'en'
      nivel_confianza: 'documentado' | 'probable' | 'especulativo'
      rol_usuario: 'editor' | 'revisor' | 'admin'
      tipo_medio: 'foto' | 'foto_historica' | 'audio' | 'ilustracion' | 'modelo_3d'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]

export const Constants = {
  public: {
    Enums: {
      estado_contenido: ['borrador', 'revision', 'aprobado'],
      idioma: ['es', 'cak', 'en'],
      nivel_confianza: ['documentado', 'probable', 'especulativo'],
      rol_usuario: ['editor', 'revisor', 'admin'],
      tipo_medio: ['foto', 'foto_historica', 'audio', 'ilustracion', 'modelo_3d'],
    },
  },
} as const
