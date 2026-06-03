/* Auto-generado por Supabase MCP — no editar a mano */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      _meta_migrations: {
        Row: {
          applied_at: string
          checksum: string | null
          name: string
        }
        Insert: {
          applied_at?: string
          checksum?: string | null
          name: string
        }
        Update: {
          applied_at?: string
          checksum?: string | null
          name?: string
        }
        Relationships: []
      }
      actas: {
        Row: {
          acta_url: string | null
          asamblea_id: string | null
          asunto: string
          contenido: string | null
          created_at: string
          estado: string
          fecha: string
          firmas_completas: boolean
          firmas_total: number | null
          folio: string
          id: string
          updated_at: string
        }
        Insert: {
          acta_url?: string | null
          asamblea_id?: string | null
          asunto: string
          contenido?: string | null
          created_at?: string
          estado?: string
          fecha: string
          firmas_completas?: boolean
          firmas_total?: number | null
          folio: string
          id?: string
          updated_at?: string
        }
        Update: {
          acta_url?: string | null
          asamblea_id?: string | null
          asunto?: string
          contenido?: string | null
          created_at?: string
          estado?: string
          fecha?: string
          firmas_completas?: boolean
          firmas_total?: number | null
          folio?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actas_asamblea_id_fkey"
            columns: ["asamblea_id"]
            isOneToOne: false
            referencedRelation: "asambleas"
            referencedColumns: ["id"]
          },
        ]
      }
      acuerdos: {
        Row: {
          acta_id: string | null
          asamblea_id: string | null
          created_at: string
          descripcion: string
          estado: Database["public"]["Enums"]["acuerdo_estado"]
          evidencia_url: string | null
          fecha_compromiso: string | null
          fecha_cumplimiento: string | null
          id: string
          numero: string
          observaciones: string | null
          plazo_dias: number | null
          responsable_socio_id: string | null
          updated_at: string
        }
        Insert: {
          acta_id?: string | null
          asamblea_id?: string | null
          created_at?: string
          descripcion: string
          estado?: Database["public"]["Enums"]["acuerdo_estado"]
          evidencia_url?: string | null
          fecha_compromiso?: string | null
          fecha_cumplimiento?: string | null
          id?: string
          numero: string
          observaciones?: string | null
          plazo_dias?: number | null
          responsable_socio_id?: string | null
          updated_at?: string
        }
        Update: {
          acta_id?: string | null
          asamblea_id?: string | null
          created_at?: string
          descripcion?: string
          estado?: Database["public"]["Enums"]["acuerdo_estado"]
          evidencia_url?: string | null
          fecha_compromiso?: string | null
          fecha_cumplimiento?: string | null
          id?: string
          numero?: string
          observaciones?: string | null
          plazo_dias?: number | null
          responsable_socio_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "acuerdos_acta_id_fkey"
            columns: ["acta_id"]
            isOneToOne: false
            referencedRelation: "actas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acuerdos_asamblea_id_fkey"
            columns: ["asamblea_id"]
            isOneToOne: false
            referencedRelation: "asambleas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acuerdos_responsable_socio_id_fkey"
            columns: ["responsable_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      adeudos: {
        Row: {
          concepto: string
          created_at: string
          estatus: Database["public"]["Enums"]["pago_estatus"]
          fecha_origen: string
          fecha_vencimiento: string | null
          id: string
          monto_original: number
          monto_pendiente: number
          notas: string | null
          socio_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          concepto: string
          created_at?: string
          estatus?: Database["public"]["Enums"]["pago_estatus"]
          fecha_origen: string
          fecha_vencimiento?: string | null
          id?: string
          monto_original: number
          monto_pendiente: number
          notas?: string | null
          socio_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          concepto?: string
          created_at?: string
          estatus?: Database["public"]["Enums"]["pago_estatus"]
          fecha_origen?: string
          fecha_vencimiento?: string | null
          id?: string
          monto_original?: number
          monto_pendiente?: number
          notas?: string | null
          socio_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adeudos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      antidoping: {
        Row: {
          antiguedad_meses: number | null
          banco: string | null
          concesion_id: string | null
          created_at: string
          fecha_prueba: string
          fecha_vencimiento: string | null
          hoja: string | null
          id: string
          laboratorio: string | null
          observaciones: string | null
          resultado: string | null
          socio_id: string
          updated_at: string
        }
        Insert: {
          antiguedad_meses?: number | null
          banco?: string | null
          concesion_id?: string | null
          created_at?: string
          fecha_prueba: string
          fecha_vencimiento?: string | null
          hoja?: string | null
          id?: string
          laboratorio?: string | null
          observaciones?: string | null
          resultado?: string | null
          socio_id: string
          updated_at?: string
        }
        Update: {
          antiguedad_meses?: number | null
          banco?: string | null
          concesion_id?: string | null
          created_at?: string
          fecha_prueba?: string
          fecha_vencimiento?: string | null
          hoja?: string | null
          id?: string
          laboratorio?: string | null
          observaciones?: string | null
          resultado?: string | null
          socio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "antidoping_concesion_id_fkey"
            columns: ["concesion_id"]
            isOneToOne: false
            referencedRelation: "concesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "antidoping_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      asambleas: {
        Row: {
          acta_firmada_at: string | null
          acta_firmada_por_user_id: string | null
          asistentes_total: number | null
          convocatoria_firmada_at: string | null
          convocatoria_firmada_por_user_id: string | null
          convocatoria_url: string | null
          created_at: string
          fecha: string
          id: string
          lugar: string | null
          observaciones: string | null
          orden_del_dia: string | null
          quorum_alcanzado: boolean | null
          tipo: Database["public"]["Enums"]["asamblea_tipo"]
          updated_at: string
        }
        Insert: {
          acta_firmada_at?: string | null
          acta_firmada_por_user_id?: string | null
          asistentes_total?: number | null
          convocatoria_firmada_at?: string | null
          convocatoria_firmada_por_user_id?: string | null
          convocatoria_url?: string | null
          created_at?: string
          fecha: string
          id?: string
          lugar?: string | null
          observaciones?: string | null
          orden_del_dia?: string | null
          quorum_alcanzado?: boolean | null
          tipo: Database["public"]["Enums"]["asamblea_tipo"]
          updated_at?: string
        }
        Update: {
          acta_firmada_at?: string | null
          acta_firmada_por_user_id?: string | null
          asistentes_total?: number | null
          convocatoria_firmada_at?: string | null
          convocatoria_firmada_por_user_id?: string | null
          convocatoria_url?: string | null
          created_at?: string
          fecha?: string
          id?: string
          lugar?: string | null
          observaciones?: string | null
          orden_del_dia?: string | null
          quorum_alcanzado?: boolean | null
          tipo?: Database["public"]["Enums"]["asamblea_tipo"]
          updated_at?: string
        }
        Relationships: []
      }
      audiencias: {
        Row: {
          acta_url: string | null
          caso_id: string
          citados: Json | null
          created_at: string
          fecha: string
          hubo_careo: boolean
          id: string
          lugar: string | null
          notas: string | null
          resultado: string | null
        }
        Insert: {
          acta_url?: string | null
          caso_id: string
          citados?: Json | null
          created_at?: string
          fecha: string
          hubo_careo?: boolean
          id?: string
          lugar?: string | null
          notas?: string | null
          resultado?: string | null
        }
        Update: {
          acta_url?: string | null
          caso_id?: string
          citados?: Json | null
          created_at?: string
          fecha?: string
          hubo_careo?: boolean
          id?: string
          lugar?: string | null
          notas?: string | null
          resultado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audiencias_caso_id_fkey"
            columns: ["caso_id"]
            isOneToOne: false
            referencedRelation: "casos_honor_justicia"
            referencedColumns: ["id"]
          },
        ]
      }
      auditoria: {
        Row: {
          accion: string
          created_at: string
          entidad: string
          entidad_id: string | null
          error_mensaje: string | null
          exito: boolean
          id: string
          metadata: Json | null
          rol_activo: string | null
          user_email: string | null
          user_id: string | null
          valor_antes: Json | null
          valor_despues: Json | null
        }
        Insert: {
          accion: string
          created_at?: string
          entidad: string
          entidad_id?: string | null
          error_mensaje?: string | null
          exito?: boolean
          id?: string
          metadata?: Json | null
          rol_activo?: string | null
          user_email?: string | null
          user_id?: string | null
          valor_antes?: Json | null
          valor_despues?: Json | null
        }
        Update: {
          accion?: string
          created_at?: string
          entidad?: string
          entidad_id?: string | null
          error_mensaje?: string | null
          exito?: boolean
          id?: string
          metadata?: Json | null
          rol_activo?: string | null
          user_email?: string | null
          user_id?: string | null
          valor_antes?: Json | null
          valor_despues?: Json | null
        }
        Relationships: []
      }
      bitacora_accidentes: {
        Row: {
          ajustador: string | null
          aseguradora_caso: string | null
          chofer_socio_id: string | null
          ciudad: string | null
          comision_atendio: boolean
          concesion_id: string | null
          costo_estimado: number | null
          costo_real: number | null
          created_at: string
          descripcion: string
          estado: string
          fecha: string
          fecha_liquidacion: string | null
          fotos_urls: Json | null
          gravedad: Database["public"]["Enums"]["gravedad"]
          hubo_fallecidos: boolean
          hubo_lesionados: boolean
          id: string
          liquidado: boolean
          num_fallecidos: number | null
          num_lesionados: number | null
          observaciones: string | null
          parte_oficial_url: string | null
          responsable_socio_id: string | null
          ubicacion: string | null
          updated_at: string
          vehiculo_id: string | null
        }
        Insert: {
          ajustador?: string | null
          aseguradora_caso?: string | null
          chofer_socio_id?: string | null
          ciudad?: string | null
          comision_atendio?: boolean
          concesion_id?: string | null
          costo_estimado?: number | null
          costo_real?: number | null
          created_at?: string
          descripcion: string
          estado?: string
          fecha: string
          fecha_liquidacion?: string | null
          fotos_urls?: Json | null
          gravedad?: Database["public"]["Enums"]["gravedad"]
          hubo_fallecidos?: boolean
          hubo_lesionados?: boolean
          id?: string
          liquidado?: boolean
          num_fallecidos?: number | null
          num_lesionados?: number | null
          observaciones?: string | null
          parte_oficial_url?: string | null
          responsable_socio_id?: string | null
          ubicacion?: string | null
          updated_at?: string
          vehiculo_id?: string | null
        }
        Update: {
          ajustador?: string | null
          aseguradora_caso?: string | null
          chofer_socio_id?: string | null
          ciudad?: string | null
          comision_atendio?: boolean
          concesion_id?: string | null
          costo_estimado?: number | null
          costo_real?: number | null
          created_at?: string
          descripcion?: string
          estado?: string
          fecha?: string
          fecha_liquidacion?: string | null
          fotos_urls?: Json | null
          gravedad?: Database["public"]["Enums"]["gravedad"]
          hubo_fallecidos?: boolean
          hubo_lesionados?: boolean
          id?: string
          liquidado?: boolean
          num_fallecidos?: number | null
          num_lesionados?: number | null
          observaciones?: string | null
          parte_oficial_url?: string | null
          responsable_socio_id?: string | null
          ubicacion?: string | null
          updated_at?: string
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bitacora_accidentes_chofer_socio_id_fkey"
            columns: ["chofer_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_accidentes_concesion_id_fkey"
            columns: ["concesion_id"]
            isOneToOne: false
            referencedRelation: "concesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_accidentes_responsable_socio_id_fkey"
            columns: ["responsable_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bitacora_accidentes_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      branding_config: {
        Row: {
          color_acento: string | null
          color_primario: string | null
          id: number
          logo_url: string | null
          nombre_org: string
          nombre_sistema: string
          tipografia: string | null
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          color_acento?: string | null
          color_primario?: string | null
          id?: number
          logo_url?: string | null
          nombre_org?: string
          nombre_sistema?: string
          tipografia?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          color_acento?: string | null
          color_primario?: string | null
          id?: number
          logo_url?: string | null
          nombre_org?: string
          nombre_sistema?: string
          tipografia?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: []
      }
      casos_honor_justicia: {
        Row: {
          archivado_at: string | null
          cerrado_at: string | null
          consignado_por_socio_id: string | null
          consignado_por_user_id: string | null
          created_at: string
          dictamen: string | null
          estado: Database["public"]["Enums"]["caso_estado"]
          evidencia_url: string | null
          fecha_dictamen: string | null
          fecha_dictamen_max: string | null
          fecha_recibido: string
          hechos: string | null
          id: string
          motivo: string
          numero_caso: string
          origen_modulo: string | null
          sancion_aplicada: string | null
          socio_consignado_id: string
          updated_at: string
        }
        Insert: {
          archivado_at?: string | null
          cerrado_at?: string | null
          consignado_por_socio_id?: string | null
          consignado_por_user_id?: string | null
          created_at?: string
          dictamen?: string | null
          estado?: Database["public"]["Enums"]["caso_estado"]
          evidencia_url?: string | null
          fecha_dictamen?: string | null
          fecha_dictamen_max?: string | null
          fecha_recibido: string
          hechos?: string | null
          id?: string
          motivo: string
          numero_caso: string
          origen_modulo?: string | null
          sancion_aplicada?: string | null
          socio_consignado_id: string
          updated_at?: string
        }
        Update: {
          archivado_at?: string | null
          cerrado_at?: string | null
          consignado_por_socio_id?: string | null
          consignado_por_user_id?: string | null
          created_at?: string
          dictamen?: string | null
          estado?: Database["public"]["Enums"]["caso_estado"]
          evidencia_url?: string | null
          fecha_dictamen?: string | null
          fecha_dictamen_max?: string | null
          fecha_recibido?: string
          hechos?: string | null
          id?: string
          motivo?: string
          numero_caso?: string
          origen_modulo?: string | null
          sancion_aplicada?: string | null
          socio_consignado_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "casos_honor_justicia_consignado_por_socio_id_fkey"
            columns: ["consignado_por_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "casos_honor_justicia_socio_consignado_id_fkey"
            columns: ["socio_consignado_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      concesiones: {
        Row: {
          cesion_sucesion: string | null
          comentarios: string | null
          created_at: string
          es_independiente: boolean
          estado: Database["public"]["Enums"]["concesion_estado"]
          fecha_acuerdo: string | null
          fecha_baja: string | null
          fecha_concesion: string | null
          id: string
          modalidad: string | null
          motivo_baja: string | null
          numero_concesion: string
          ruta_denominada: string | null
          sitio_id: string | null
          socio_id: string
          submodalidad: string | null
          taxi_numero: number | null
          tipo: Database["public"]["Enums"]["concesion_tipo"]
          updated_at: string
        }
        Insert: {
          cesion_sucesion?: string | null
          comentarios?: string | null
          created_at?: string
          es_independiente?: boolean
          estado?: Database["public"]["Enums"]["concesion_estado"]
          fecha_acuerdo?: string | null
          fecha_baja?: string | null
          fecha_concesion?: string | null
          id?: string
          modalidad?: string | null
          motivo_baja?: string | null
          numero_concesion: string
          ruta_denominada?: string | null
          sitio_id?: string | null
          socio_id: string
          submodalidad?: string | null
          taxi_numero?: number | null
          tipo?: Database["public"]["Enums"]["concesion_tipo"]
          updated_at?: string
        }
        Update: {
          cesion_sucesion?: string | null
          comentarios?: string | null
          created_at?: string
          es_independiente?: boolean
          estado?: Database["public"]["Enums"]["concesion_estado"]
          fecha_acuerdo?: string | null
          fecha_baja?: string | null
          fecha_concesion?: string | null
          id?: string
          modalidad?: string | null
          motivo_baja?: string | null
          numero_concesion?: string
          ruta_denominada?: string | null
          sitio_id?: string | null
          socio_id?: string
          submodalidad?: string | null
          taxi_numero?: number | null
          tipo?: Database["public"]["Enums"]["concesion_tipo"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "concesiones_sitio_id_fkey"
            columns: ["sitio_id"]
            isOneToOne: false
            referencedRelation: "sitios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "concesiones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      cuotas_catalogo: {
        Row: {
          activa: boolean
          codigo: string
          created_at: string
          descripcion: string | null
          monto: number
          nombre: string
          recurrencia: string
        }
        Insert: {
          activa?: boolean
          codigo: string
          created_at?: string
          descripcion?: string | null
          monto: number
          nombre: string
          recurrencia: string
        }
        Update: {
          activa?: boolean
          codigo?: string
          created_at?: string
          descripcion?: string | null
          monto?: number
          nombre?: string
          recurrencia?: string
        }
        Relationships: []
      }
      funerario_inscripciones: {
        Row: {
          activa: boolean
          created_at: string
          fecha_alta: string
          fecha_baja: string | null
          id: string
          monto_mensual: number
          motivo_baja: string | null
          notas: string | null
          plan_codigo: string
          socio_id: string
          updated_at: string
        }
        Insert: {
          activa?: boolean
          created_at?: string
          fecha_alta: string
          fecha_baja?: string | null
          id?: string
          monto_mensual: number
          motivo_baja?: string | null
          notas?: string | null
          plan_codigo: string
          socio_id: string
          updated_at?: string
        }
        Update: {
          activa?: boolean
          created_at?: string
          fecha_alta?: string
          fecha_baja?: string | null
          id?: string
          monto_mensual?: number
          motivo_baja?: string | null
          notas?: string | null
          plan_codigo?: string
          socio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funerario_inscripciones_plan_codigo_fkey"
            columns: ["plan_codigo"]
            isOneToOne: false
            referencedRelation: "funerario_planes_catalogo"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "funerario_inscripciones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      funerario_planes_catalogo: {
        Row: {
          activo: boolean
          beneficios: Json
          codigo: string
          created_at: string
          descripcion: string | null
          monto_mensual: number
          nombre: string
        }
        Insert: {
          activo?: boolean
          beneficios?: Json
          codigo: string
          created_at?: string
          descripcion?: string | null
          monto_mensual: number
          nombre: string
        }
        Update: {
          activo?: boolean
          beneficios?: Json
          codigo?: string
          created_at?: string
          descripcion?: string | null
          monto_mensual?: number
          nombre?: string
        }
        Relationships: []
      }
      funerario_servicios: {
        Row: {
          acta_defuncion_url: string | null
          beneficiario_nombre: string
          costo_cubierto: number | null
          costo_excedente: number | null
          costo_total: number | null
          created_at: string
          fecha_servicio: string
          funeraria: string | null
          id: string
          observaciones: string | null
          parentesco: string | null
          plan_codigo: string | null
          socio_titular_id: string
        }
        Insert: {
          acta_defuncion_url?: string | null
          beneficiario_nombre: string
          costo_cubierto?: number | null
          costo_excedente?: number | null
          costo_total?: number | null
          created_at?: string
          fecha_servicio: string
          funeraria?: string | null
          id?: string
          observaciones?: string | null
          parentesco?: string | null
          plan_codigo?: string | null
          socio_titular_id: string
        }
        Update: {
          acta_defuncion_url?: string | null
          beneficiario_nombre?: string
          costo_cubierto?: number | null
          costo_excedente?: number | null
          costo_total?: number | null
          created_at?: string
          fecha_servicio?: string
          funeraria?: string | null
          id?: string
          observaciones?: string | null
          parentesco?: string | null
          plan_codigo?: string | null
          socio_titular_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funerario_servicios_plan_codigo_fkey"
            columns: ["plan_codigo"]
            isOneToOne: false
            referencedRelation: "funerario_planes_catalogo"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "funerario_servicios_socio_titular_id_fkey"
            columns: ["socio_titular_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_choferes: {
        Row: {
          asignado_por_socio_id: string | null
          chofer_socio_id: string
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          foto_credencial_url: string | null
          foto_gafete_url: string | null
          id: string
          motivo_cambio: string | null
          observaciones: string | null
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          asignado_por_socio_id?: string | null
          chofer_socio_id: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio: string
          foto_credencial_url?: string | null
          foto_gafete_url?: string | null
          id?: string
          motivo_cambio?: string | null
          observaciones?: string | null
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          asignado_por_socio_id?: string | null
          chofer_socio_id?: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          foto_credencial_url?: string | null
          foto_gafete_url?: string | null
          id?: string
          motivo_cambio?: string | null
          observaciones?: string | null
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_choferes_asignado_por_socio_id_fkey"
            columns: ["asignado_por_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_choferes_chofer_socio_id_fkey"
            columns: ["chofer_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "historial_choferes_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      impersonaciones: {
        Row: {
          activa: boolean
          fin: string | null
          id: string
          inicio: string
          motivo: string | null
          superadmin_user_id: string
          target_user_id: string
        }
        Insert: {
          activa?: boolean
          fin?: string | null
          id?: string
          inicio?: string
          motivo?: string | null
          superadmin_user_id: string
          target_user_id: string
        }
        Update: {
          activa?: boolean
          fin?: string | null
          id?: string
          inicio?: string
          motivo?: string | null
          superadmin_user_id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      mensualidades_cuotas: {
        Row: {
          cobrado_por_user_id: string | null
          concesion_id: string | null
          created_at: string
          cuota_codigo: string
          estatus: Database["public"]["Enums"]["pago_estatus"]
          fecha_pago: string | null
          id: string
          monto: number
          movimiento_id: string | null
          notas: string | null
          periodo: string
          recibo_url: string | null
          sitio_id_donde_pago: string
          socio_id: string
          updated_at: string
        }
        Insert: {
          cobrado_por_user_id?: string | null
          concesion_id?: string | null
          created_at?: string
          cuota_codigo: string
          estatus?: Database["public"]["Enums"]["pago_estatus"]
          fecha_pago?: string | null
          id?: string
          monto: number
          movimiento_id?: string | null
          notas?: string | null
          periodo: string
          recibo_url?: string | null
          sitio_id_donde_pago: string
          socio_id: string
          updated_at?: string
        }
        Update: {
          cobrado_por_user_id?: string | null
          concesion_id?: string | null
          created_at?: string
          cuota_codigo?: string
          estatus?: Database["public"]["Enums"]["pago_estatus"]
          fecha_pago?: string | null
          id?: string
          monto?: number
          movimiento_id?: string | null
          notas?: string | null
          periodo?: string
          recibo_url?: string | null
          sitio_id_donde_pago?: string
          socio_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mensualidades_cuotas_concesion_id_fkey"
            columns: ["concesion_id"]
            isOneToOne: false
            referencedRelation: "concesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensualidades_cuotas_cuota_codigo_fkey"
            columns: ["cuota_codigo"]
            isOneToOne: false
            referencedRelation: "cuotas_catalogo"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "mensualidades_cuotas_movimiento_id_fkey"
            columns: ["movimiento_id"]
            isOneToOne: false
            referencedRelation: "tesoreria_movimientos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensualidades_cuotas_sitio_id_donde_pago_fkey"
            columns: ["sitio_id_donde_pago"]
            isOneToOne: false
            referencedRelation: "sitios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mensualidades_cuotas_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      modulos_config: {
        Row: {
          activo: boolean
          beta: boolean
          codigo: string
          mantenimiento: boolean
          mensaje_mantenimiento: string | null
          nombre: string
          notas: string | null
          updated_at: string
          updated_by_user_id: string | null
          visible_para_roles: string[]
        }
        Insert: {
          activo?: boolean
          beta?: boolean
          codigo: string
          mantenimiento?: boolean
          mensaje_mantenimiento?: string | null
          nombre: string
          notas?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
          visible_para_roles?: string[]
        }
        Update: {
          activo?: boolean
          beta?: boolean
          codigo?: string
          mantenimiento?: boolean
          mensaje_mantenimiento?: string | null
          nombre?: string
          notas?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
          visible_para_roles?: string[]
        }
        Relationships: []
      }
      polizas: {
        Row: {
          comentarios: string | null
          compania: string
          costo: number | null
          created_at: string
          endoso: string | null
          estado: Database["public"]["Enums"]["poliza_estado"]
          fecha_inicio: string | null
          fecha_vencimiento: string
          id: string
          numero_poliza: string
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          comentarios?: string | null
          compania: string
          costo?: number | null
          created_at?: string
          endoso?: string | null
          estado?: Database["public"]["Enums"]["poliza_estado"]
          fecha_inicio?: string | null
          fecha_vencimiento: string
          id?: string
          numero_poliza: string
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          comentarios?: string | null
          compania?: string
          costo?: number | null
          created_at?: string
          endoso?: string | null
          estado?: Database["public"]["Enums"]["poliza_estado"]
          fecha_inicio?: string | null
          fecha_vencimiento?: string
          id?: string
          numero_poliza?: string
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "polizas_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      revistas_vehiculares: {
        Row: {
          created_at: string
          fecha_practicada: string
          fecha_vencimiento: string | null
          ficha_pago: string | null
          id: string
          observaciones: string | null
          prorroga_hasta: string | null
          resultado: string | null
          tipo: Database["public"]["Enums"]["revista_tipo"]
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          created_at?: string
          fecha_practicada: string
          fecha_vencimiento?: string | null
          ficha_pago?: string | null
          id?: string
          observaciones?: string | null
          prorroga_hasta?: string | null
          resultado?: string | null
          tipo: Database["public"]["Enums"]["revista_tipo"]
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          created_at?: string
          fecha_practicada?: string
          fecha_vencimiento?: string | null
          ficha_pago?: string | null
          id?: string
          observaciones?: string | null
          prorroga_hasta?: string | null
          resultado?: string | null
          tipo?: Database["public"]["Enums"]["revista_tipo"]
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "revistas_vehiculares_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          codigo: string
          created_at: string
          descripcion: string | null
          modulos_acceso: Json
          nombre: string
          orden_jerarquia: number
          scope_tipo: Database["public"]["Enums"]["rol_scope_tipo"]
          solo_lectura: boolean
        }
        Insert: {
          codigo: string
          created_at?: string
          descripcion?: string | null
          modulos_acceso?: Json
          nombre: string
          orden_jerarquia?: number
          scope_tipo?: Database["public"]["Enums"]["rol_scope_tipo"]
          solo_lectura?: boolean
        }
        Update: {
          codigo?: string
          created_at?: string
          descripcion?: string | null
          modulos_acceso?: Json
          nombre?: string
          orden_jerarquia?: number
          scope_tipo?: Database["public"]["Enums"]["rol_scope_tipo"]
          solo_lectura?: boolean
        }
        Relationships: []
      }
      sanciones_sitio: {
        Row: {
          created_at: string
          cumplida: boolean
          delegado_socio_id: string
          dias_sancion: number
          fecha: string
          fecha_fin_castigo: string | null
          fecha_inconformidad: string | null
          fecha_inicio_castigo: string | null
          id: string
          inconforme: boolean
          motivo: string
          notas: string | null
          resuelta_por: string | null
          sitio_id: string
          socio_sancionado_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cumplida?: boolean
          delegado_socio_id: string
          dias_sancion: number
          fecha: string
          fecha_fin_castigo?: string | null
          fecha_inconformidad?: string | null
          fecha_inicio_castigo?: string | null
          id?: string
          inconforme?: boolean
          motivo: string
          notas?: string | null
          resuelta_por?: string | null
          sitio_id: string
          socio_sancionado_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cumplida?: boolean
          delegado_socio_id?: string
          dias_sancion?: number
          fecha?: string
          fecha_fin_castigo?: string | null
          fecha_inconformidad?: string | null
          fecha_inicio_castigo?: string | null
          id?: string
          inconforme?: boolean
          motivo?: string
          notas?: string | null
          resuelta_por?: string | null
          sitio_id?: string
          socio_sancionado_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sanciones_sitio_delegado_socio_id_fkey"
            columns: ["delegado_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanciones_sitio_sitio_id_fkey"
            columns: ["sitio_id"]
            isOneToOne: false
            referencedRelation: "sitios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sanciones_sitio_socio_sancionado_id_fkey"
            columns: ["socio_sancionado_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      sitios: {
        Row: {
          activo: boolean
          area_num: number | null
          created_at: string
          delegado_socio_id: string | null
          direccion: string | null
          id: string
          nombre: string
          notas: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          area_num?: number | null
          created_at?: string
          delegado_socio_id?: string | null
          direccion?: string | null
          id?: string
          nombre: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          area_num?: number | null
          created_at?: string
          delegado_socio_id?: string | null
          direccion?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sitios_delegado_socio_fk"
            columns: ["delegado_socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios: {
        Row: {
          antiguedad_anos: number | null
          apellido_materno: string | null
          apellido_paterno: string | null
          codigo_agremiado: string
          comentarios: string | null
          created_at: string
          created_by_user_id: string | null
          curp: string | null
          escalafon_numero: number | null
          escolaridad: string | null
          estado_civil: string | null
          estatus: Database["public"]["Enums"]["socio_estatus"]
          fecha_baja: string | null
          fecha_fallecimiento: string | null
          fecha_ingreso: string | null
          fecha_nacimiento: string | null
          firma_actual: boolean
          foto_url: string | null
          genero: Database["public"]["Enums"]["genero"] | null
          id: string
          lugar_nacimiento: string | null
          motivo_baja: string | null
          nombre: string | null
          nombre_completo: string
          ocupacion: string | null
          rfc: string | null
          soc_act: boolean
          soc_tran: boolean
          soc_veint: boolean
          tipo_escalafon: Database["public"]["Enums"]["tipo_escalafon"]
          tipo_padron: Database["public"]["Enums"]["tipo_padron"] | null
          tipo_socio: Database["public"]["Enums"]["tipo_socio"]
          turno: string | null
          updated_at: string
          updated_by_user_id: string | null
        }
        Insert: {
          antiguedad_anos?: number | null
          apellido_materno?: string | null
          apellido_paterno?: string | null
          codigo_agremiado?: string
          comentarios?: string | null
          created_at?: string
          created_by_user_id?: string | null
          curp?: string | null
          escalafon_numero?: number | null
          escolaridad?: string | null
          estado_civil?: string | null
          estatus?: Database["public"]["Enums"]["socio_estatus"]
          fecha_baja?: string | null
          fecha_fallecimiento?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          firma_actual?: boolean
          foto_url?: string | null
          genero?: Database["public"]["Enums"]["genero"] | null
          id?: string
          lugar_nacimiento?: string | null
          motivo_baja?: string | null
          nombre?: string | null
          nombre_completo: string
          ocupacion?: string | null
          rfc?: string | null
          soc_act?: boolean
          soc_tran?: boolean
          soc_veint?: boolean
          tipo_escalafon?: Database["public"]["Enums"]["tipo_escalafon"]
          tipo_padron?: Database["public"]["Enums"]["tipo_padron"] | null
          tipo_socio?: Database["public"]["Enums"]["tipo_socio"]
          turno?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Update: {
          antiguedad_anos?: number | null
          apellido_materno?: string | null
          apellido_paterno?: string | null
          codigo_agremiado?: string
          comentarios?: string | null
          created_at?: string
          created_by_user_id?: string | null
          curp?: string | null
          escalafon_numero?: number | null
          escolaridad?: string | null
          estado_civil?: string | null
          estatus?: Database["public"]["Enums"]["socio_estatus"]
          fecha_baja?: string | null
          fecha_fallecimiento?: string | null
          fecha_ingreso?: string | null
          fecha_nacimiento?: string | null
          firma_actual?: boolean
          foto_url?: string | null
          genero?: Database["public"]["Enums"]["genero"] | null
          id?: string
          lugar_nacimiento?: string | null
          motivo_baja?: string | null
          nombre?: string | null
          nombre_completo?: string
          ocupacion?: string | null
          rfc?: string | null
          soc_act?: boolean
          soc_tran?: boolean
          soc_veint?: boolean
          tipo_escalafon?: Database["public"]["Enums"]["tipo_escalafon"]
          tipo_padron?: Database["public"]["Enums"]["tipo_padron"] | null
          tipo_socio?: Database["public"]["Enums"]["tipo_socio"]
          turno?: string | null
          updated_at?: string
          updated_by_user_id?: string | null
        }
        Relationships: []
      }
      socios_beneficiarios: {
        Row: {
          created_at: string
          direccion: string | null
          es_designado: boolean
          id: string
          nombre: string
          notas: string | null
          parentesco: string | null
          porcentaje: number | null
          socio_id: string
          telefono: string | null
        }
        Insert: {
          created_at?: string
          direccion?: string | null
          es_designado?: boolean
          id?: string
          nombre: string
          notas?: string | null
          parentesco?: string | null
          porcentaje?: number | null
          socio_id: string
          telefono?: string | null
        }
        Update: {
          created_at?: string
          direccion?: string | null
          es_designado?: boolean
          id?: string
          nombre?: string
          notas?: string | null
          parentesco?: string | null
          porcentaje?: number | null
          socio_id?: string
          telefono?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socios_beneficiarios_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios_contactos: {
        Row: {
          created_at: string
          es_principal: boolean
          id: string
          notas: string | null
          socio_id: string
          tipo: string
          valor: string
        }
        Insert: {
          created_at?: string
          es_principal?: boolean
          id?: string
          notas?: string | null
          socio_id: string
          tipo: string
          valor: string
        }
        Update: {
          created_at?: string
          es_principal?: boolean
          id?: string
          notas?: string | null
          socio_id?: string
          tipo?: string
          valor?: string
        }
        Relationships: [
          {
            foreignKeyName: "socios_contactos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios_credencial_elector: {
        Row: {
          clave_elector: string | null
          created_at: string
          emision: string | null
          id: string
          seccion: string | null
          socio_id: string
          updated_at: string
          vigencia: string | null
        }
        Insert: {
          clave_elector?: string | null
          created_at?: string
          emision?: string | null
          id?: string
          seccion?: string | null
          socio_id: string
          updated_at?: string
          vigencia?: string | null
        }
        Update: {
          clave_elector?: string | null
          created_at?: string
          emision?: string | null
          id?: string
          seccion?: string | null
          socio_id?: string
          updated_at?: string
          vigencia?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socios_credencial_elector_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: true
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios_direcciones: {
        Row: {
          calle: string | null
          ciudad: string | null
          codigo_postal: string | null
          colonia: string | null
          created_at: string
          desde: string | null
          es_actual: boolean
          estado: string | null
          hasta: string | null
          id: string
          numero_ext: string | null
          numero_int: string | null
          referencias: string | null
          socio_id: string
          tipo: string
        }
        Insert: {
          calle?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          colonia?: string | null
          created_at?: string
          desde?: string | null
          es_actual?: boolean
          estado?: string | null
          hasta?: string | null
          id?: string
          numero_ext?: string | null
          numero_int?: string | null
          referencias?: string | null
          socio_id: string
          tipo?: string
        }
        Update: {
          calle?: string | null
          ciudad?: string | null
          codigo_postal?: string | null
          colonia?: string | null
          created_at?: string
          desde?: string | null
          es_actual?: boolean
          estado?: string | null
          hasta?: string | null
          id?: string
          numero_ext?: string | null
          numero_int?: string | null
          referencias?: string | null
          socio_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "socios_direcciones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      socios_licencia_conducir: {
        Row: {
          created_at: string
          es_actual: boolean
          fecha_emision: string | null
          fecha_vencimiento: string | null
          id: string
          numero_licencia: string | null
          observaciones: string | null
          socio_id: string
          tipo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          es_actual?: boolean
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          numero_licencia?: string | null
          observaciones?: string | null
          socio_id: string
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          es_actual?: boolean
          fecha_emision?: string | null
          fecha_vencimiento?: string | null
          id?: string
          numero_licencia?: string | null
          observaciones?: string | null
          socio_id?: string
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "socios_licencia_conducir_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      tesoreria_cortes_caja: {
        Row: {
          autorizado_at: string | null
          autorizado_por_user_id: string | null
          cerrado_at: string | null
          cerrado_por_user_id: string | null
          created_at: string
          id: string
          observaciones_hacienda: string | null
          periodo: string
          saldo_final: number | null
          saldo_inicial: number
          total_egresos: number
          total_ingresos: number
          updated_at: string
        }
        Insert: {
          autorizado_at?: string | null
          autorizado_por_user_id?: string | null
          cerrado_at?: string | null
          cerrado_por_user_id?: string | null
          created_at?: string
          id?: string
          observaciones_hacienda?: string | null
          periodo: string
          saldo_final?: number | null
          saldo_inicial?: number
          total_egresos?: number
          total_ingresos?: number
          updated_at?: string
        }
        Update: {
          autorizado_at?: string | null
          autorizado_por_user_id?: string | null
          cerrado_at?: string | null
          cerrado_por_user_id?: string | null
          created_at?: string
          id?: string
          observaciones_hacienda?: string | null
          periodo?: string
          saldo_final?: number | null
          saldo_inicial?: number
          total_egresos?: number
          total_ingresos?: number
          updated_at?: string
        }
        Relationships: []
      }
      tesoreria_movimientos: {
        Row: {
          comprobante_url: string | null
          concepto: string
          corte_caja_id: string | null
          created_at: string
          created_by_user_id: string | null
          cuenta: string | null
          fecha: string
          id: string
          monto: number
          notas: string | null
          referencia: string | null
          socio_id: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Insert: {
          comprobante_url?: string | null
          concepto: string
          corte_caja_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          cuenta?: string | null
          fecha: string
          id?: string
          monto: number
          notas?: string | null
          referencia?: string | null
          socio_id?: string | null
          tipo: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Update: {
          comprobante_url?: string | null
          concepto?: string
          corte_caja_id?: string | null
          created_at?: string
          created_by_user_id?: string | null
          cuenta?: string | null
          fecha?: string
          id?: string
          monto?: number
          notas?: string | null
          referencia?: string | null
          socio_id?: string | null
          tipo?: Database["public"]["Enums"]["movimiento_tipo"]
        }
        Relationships: [
          {
            foreignKeyName: "tesoreria_movimientos_corte_caja_id_fkey"
            columns: ["corte_caja_id"]
            isOneToOne: false
            referencedRelation: "tesoreria_cortes_caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tesoreria_movimientos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_perfil: {
        Row: {
          activo: boolean
          avatar_url: string | null
          created_at: string
          nombre_display: string
          preferencias: Json
          socio_id: string | null
          telefono: string | null
          ultimo_login_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          activo?: boolean
          avatar_url?: string | null
          created_at?: string
          nombre_display: string
          preferencias?: Json
          socio_id?: string | null
          telefono?: string | null
          ultimo_login_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          activo?: boolean
          avatar_url?: string | null
          created_at?: string
          nombre_display?: string
          preferencias?: Json
          socio_id?: string | null
          telefono?: string | null
          ultimo_login_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_perfil_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
      usuarios_roles: {
        Row: {
          activo: boolean
          created_at: string
          desde: string
          hasta: string | null
          id: string
          rol_codigo: string
          scope_area_num: number | null
          scope_sitio_id: string | null
          suplente: boolean
          user_id: string
        }
        Insert: {
          activo?: boolean
          created_at?: string
          desde?: string
          hasta?: string | null
          id?: string
          rol_codigo: string
          scope_area_num?: number | null
          scope_sitio_id?: string | null
          suplente?: boolean
          user_id: string
        }
        Update: {
          activo?: boolean
          created_at?: string
          desde?: string
          hasta?: string | null
          id?: string
          rol_codigo?: string
          scope_area_num?: number | null
          scope_sitio_id?: string | null
          suplente?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_roles_rol_codigo_fkey"
            columns: ["rol_codigo"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["codigo"]
          },
          {
            foreignKeyName: "usuarios_roles_scope_sitio_id_fkey"
            columns: ["scope_sitio_id"]
            isOneToOne: false
            referencedRelation: "sitios"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculo_asignaciones: {
        Row: {
          concesion_id: string
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string
          id: string
          motivo_cambio: string | null
          vehiculo_id: string
        }
        Insert: {
          concesion_id: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio: string
          id?: string
          motivo_cambio?: string | null
          vehiculo_id: string
        }
        Update: {
          concesion_id?: string
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: string
          motivo_cambio?: string | null
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculo_asignaciones_concesion_id_fkey"
            columns: ["concesion_id"]
            isOneToOne: false
            referencedRelation: "concesiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehiculo_asignaciones_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos: {
        Row: {
          anio: number | null
          color: string | null
          comentarios: string | null
          concesion_actual_id: string | null
          created_at: string
          engomado: string | null
          es_independiente: boolean
          estatus: Database["public"]["Enums"]["vehiculo_estatus"]
          fecha_alta: string | null
          fecha_baja: string | null
          id: string
          marca: string | null
          modelo: string | null
          motivo_baja: string | null
          numero_motor: string | null
          numero_serie: string | null
          placas: string | null
          updated_at: string
        }
        Insert: {
          anio?: number | null
          color?: string | null
          comentarios?: string | null
          concesion_actual_id?: string | null
          created_at?: string
          engomado?: string | null
          es_independiente?: boolean
          estatus?: Database["public"]["Enums"]["vehiculo_estatus"]
          fecha_alta?: string | null
          fecha_baja?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          motivo_baja?: string | null
          numero_motor?: string | null
          numero_serie?: string | null
          placas?: string | null
          updated_at?: string
        }
        Update: {
          anio?: number | null
          color?: string | null
          comentarios?: string | null
          concesion_actual_id?: string | null
          created_at?: string
          engomado?: string | null
          es_independiente?: boolean
          estatus?: Database["public"]["Enums"]["vehiculo_estatus"]
          fecha_alta?: string | null
          fecha_baja?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          motivo_baja?: string | null
          numero_motor?: string | null
          numero_serie?: string | null
          placas?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_concesion_actual_id_fkey"
            columns: ["concesion_actual_id"]
            isOneToOne: false
            referencedRelation: "concesiones"
            referencedColumns: ["id"]
          },
        ]
      }
      vehiculos_fuera_sindicato_notas: {
        Row: {
          created_at: string
          documentos_url: Json | null
          fecha_salida: string | null
          id: string
          motivo_salida: string | null
          ultima_observacion: string | null
          ultimo_titular: string | null
          updated_at: string
          vehiculo_id: string
        }
        Insert: {
          created_at?: string
          documentos_url?: Json | null
          fecha_salida?: string | null
          id?: string
          motivo_salida?: string | null
          ultima_observacion?: string | null
          ultimo_titular?: string | null
          updated_at?: string
          vehiculo_id: string
        }
        Update: {
          created_at?: string
          documentos_url?: Json | null
          fecha_salida?: string | null
          id?: string
          motivo_salida?: string | null
          ultima_observacion?: string | null
          ultimo_titular?: string | null
          updated_at?: string
          vehiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehiculos_fuera_sindicato_notas_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: true
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_polizas_actuales: {
        Row: {
          comentarios: string | null
          compania: string | null
          costo: number | null
          created_at: string | null
          dias_restantes: number | null
          endoso: string | null
          estado: Database["public"]["Enums"]["poliza_estado"] | null
          estado_calculado: string | null
          fecha_inicio: string | null
          fecha_vencimiento: string | null
          id: string | null
          numero_poliza: string | null
          updated_at: string | null
          vehiculo_id: string | null
        }
        Insert: {
          comentarios?: string | null
          compania?: string | null
          costo?: number | null
          created_at?: string | null
          dias_restantes?: never
          endoso?: string | null
          estado?: Database["public"]["Enums"]["poliza_estado"] | null
          estado_calculado?: never
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string | null
          numero_poliza?: string | null
          updated_at?: string | null
          vehiculo_id?: string | null
        }
        Update: {
          comentarios?: string | null
          compania?: string | null
          costo?: number | null
          created_at?: string | null
          dias_restantes?: never
          endoso?: string | null
          estado?: Database["public"]["Enums"]["poliza_estado"] | null
          estado_calculado?: never
          fecha_inicio?: string | null
          fecha_vencimiento?: string | null
          id?: string | null
          numero_poliza?: string | null
          updated_at?: string | null
          vehiculo_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polizas_vehiculo_id_fkey"
            columns: ["vehiculo_id"]
            isOneToOne: false
            referencedRelation: "vehiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      v_socios_direccion_principal: {
        Row: {
          calle: string | null
          ciudad: string | null
          codigo_postal: string | null
          colonia: string | null
          estado: string | null
          socio_id: string | null
          tipo: string | null
        }
        Relationships: [
          {
            foreignKeyName: "socios_direcciones_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      acuerdo_estado: "PENDIENTE" | "EN_PROCESO" | "CUMPLIDO" | "CANCELADO"
      asamblea_tipo: "ORDINARIA" | "EXTRAORDINARIA" | "COMITE_EJECUTIVO"
      caso_estado:
        | "RECIBIDO"
        | "EN_INSTRUCCION"
        | "DICTAMINADO"
        | "CERRADO"
        | "ARCHIVADO"
      concesion_estado:
        | "VIGENTE"
        | "BAJA"
        | "EN_TRAMITE"
        | "CESION_PENDIENTE"
        | "SUCESION_PENDIENTE"
      concesion_tipo: "CONCESION" | "PERMISO"
      firma_estatus: "RECABADA" | "PENDIENTE" | "NO_APLICA"
      genero: "M" | "F" | "X"
      gravedad: "BAJA" | "MEDIA" | "ALTA"
      movimiento_tipo: "INGRESO" | "EGRESO"
      pago_estatus: "PAGADO" | "PENDIENTE" | "PARCIAL" | "CONDONADO" | "VENCIDO"
      poliza_estado: "VIGENTE" | "POR_VENCER" | "VENCIDA" | "CANCELADA"
      revista_tipo: "DOCUMENTAL" | "MECANICA"
      rol_scope_tipo: "GLOBAL" | "AREA" | "SITIO"
      socio_estatus:
        | "ACTIVO"
        | "FALLECIDO"
        | "BAJA_DEFINITIVA"
        | "BAJA_TEMPORAL"
        | "NO_PERTENECE"
      tipo_escalafon: "CONCESIONARIO" | "ASPIRANTE" | "NINGUNO"
      tipo_padron: "CONCESIONARIO" | "TRANSITORIO" | "CUOTA_25"
      tipo_socio:
        | "CONCESIONARIO"
        | "AGENCIA"
        | "PERMISIONARIO"
        | "INDEPENDIENTE"
        | "HEREDERO"
        | "OTRO"
      vehiculo_estatus: "ACTIVO" | "FUERA_SINDICATO" | "BAJA" | "SINIESTRADO"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      acuerdo_estado: ["PENDIENTE", "EN_PROCESO", "CUMPLIDO", "CANCELADO"],
      asamblea_tipo: ["ORDINARIA", "EXTRAORDINARIA", "COMITE_EJECUTIVO"],
      caso_estado: [
        "RECIBIDO",
        "EN_INSTRUCCION",
        "DICTAMINADO",
        "CERRADO",
        "ARCHIVADO",
      ],
      concesion_estado: [
        "VIGENTE",
        "BAJA",
        "EN_TRAMITE",
        "CESION_PENDIENTE",
        "SUCESION_PENDIENTE",
      ],
      concesion_tipo: ["CONCESION", "PERMISO"],
      firma_estatus: ["RECABADA", "PENDIENTE", "NO_APLICA"],
      genero: ["M", "F", "X"],
      gravedad: ["BAJA", "MEDIA", "ALTA"],
      movimiento_tipo: ["INGRESO", "EGRESO"],
      pago_estatus: ["PAGADO", "PENDIENTE", "PARCIAL", "CONDONADO", "VENCIDO"],
      poliza_estado: ["VIGENTE", "POR_VENCER", "VENCIDA", "CANCELADA"],
      revista_tipo: ["DOCUMENTAL", "MECANICA"],
      rol_scope_tipo: ["GLOBAL", "AREA", "SITIO"],
      socio_estatus: [
        "ACTIVO",
        "FALLECIDO",
        "BAJA_DEFINITIVA",
        "BAJA_TEMPORAL",
        "NO_PERTENECE",
      ],
      tipo_escalafon: ["CONCESIONARIO", "ASPIRANTE", "NINGUNO"],
      tipo_padron: ["CONCESIONARIO", "TRANSITORIO", "CUOTA_25"],
      tipo_socio: [
        "CONCESIONARIO",
        "AGENCIA",
        "PERMISIONARIO",
        "INDEPENDIENTE",
        "HEREDERO",
        "OTRO",
      ],
      vehiculo_estatus: ["ACTIVO", "FUERA_SINDICATO", "BAJA", "SINIESTRADO"],
    },
  },
} as const
