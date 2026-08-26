export type UserRole = "admin" | "manager" | "reception" | "agent" | "accountant";

export type LeadStatus = string;

export type StageKind = "open" | "won" | "lost" | "junk";

export type CustomerType = "individual" | "company";

export type DealType = "sale" | "rental" | "off_plan";

export type DealStage =
  | "new"
  | "negotiations"
  | "contract"
  | "closed"
  | "lost"
  | "inquiry"
  | "viewing"
  | "negotiation"
  | "offer"
  | "won";

export type LeadContextJson = {
  lead_id: string;
  captured_at: string;
  name: string;
  source: string;
  interest: string;
  score: number | null;
  budget_min: number | null;
  budget_max: number | null;
  preferred_areas: string[] | null;
  nationality: string | null;
  financing: string | null;
  timeframe: string | null;
  purpose: string | null;
  bedrooms: string | null;
  category: string | null;
  tags: string[];
  notes: string | null;
};

export type DocCategory =
  | "emirates_id"
  | "passport"
  | "visa"
  | "title_deed"
  | "mou"
  | "tenancy_contract"
  | "noc"
  | "cheque_copy"
  | "permit"
  | "contract"
  | "brn"
  | "invoice"
  | "receipt"
  | "marketing"
  | "other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          role: UserRole;
          avatar_url: string | null;
          commission_rate: number | null;
          brn: string | null;
          is_active: boolean;
          team_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          email?: string | null;
          phone?: string | null;
          role?: UserRole;
          avatar_url?: string | null;
          commission_rate?: number | null;
          brn?: string | null;
          is_active?: boolean;
          team_id?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      company_settings: {
        Row: {
          id: number;
          company_name: string | null;
          trn: string | null;
          rera_orn: string | null;
          address: string | null;
          phone: string | null;
          email: string | null;
          logo_url: string | null;
          logo_dark_url: string | null;
          whatsapp: string | null;
          tagline: string | null;
          linkedin_url: string | null;
          instagram_url: string | null;
          vat_rate: number;
          quotation_prefix: string;
          invoice_prefix: string;
          quotation_approval_threshold: number;
          default_currency: string;
        };
        Insert: Partial<Database["public"]["Tables"]["company_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["company_settings"]["Row"]>;
      };
      activity_log: {
        Row: {
          id: number;
          actor_id: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          diff: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          actor_id?: string | null;
          entity_type: string;
          entity_id: string;
          action: string;
          diff?: Record<string, unknown> | null;
        };
        Update: Partial<Database["public"]["Tables"]["activity_log"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          source: string;
          interest: string;
          budget_min: number | null;
          budget_max: number | null;
          preferred_areas: string[] | null;
          notes: string | null;
          status: LeadStatus;
          score: number | null;
          assigned_to: string | null;
          next_follow_up_at: string | null;
          customer_id: string | null;
          converted_customer_id: string | null;
          converted_deal_id: string | null;
          created_by: string | null;
          team_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          stage_id: string | null;
          phone_norm: string | null;
          email_norm: string | null;
          nationality: string | null;
          financing: string | null;
          timeframe: string | null;
          purpose: string | null;
          bedrooms: string | null;
          category: string | null;
          last_activity_at: string | null;
          stage_entered_at: string;
          tags: string[];
          lost_reason: string | null;
          junk_reason: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          source?: string;
          interest?: string;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_areas?: string[] | null;
          notes?: string | null;
          status?: LeadStatus;
          score?: number | null;
          assigned_to?: string | null;
          next_follow_up_at?: string | null;
          customer_id?: string | null;
          converted_customer_id?: string | null;
          converted_deal_id?: string | null;
          created_by?: string | null;
          team_id?: string | null;
          stage_id?: string | null;
          nationality?: string | null;
          financing?: string | null;
          timeframe?: string | null;
          purpose?: string | null;
          bedrooms?: string | null;
          category?: string | null;
          last_activity_at?: string | null;
          stage_entered_at?: string;
          tags?: string[];
          lost_reason?: string | null;
          junk_reason?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      lead_stages: {
        Row: {
          id: string;
          name: string;
          color: string;
          kind: StageKind;
          sort: number;
          stale_after_days: number | null;
          required_fields: unknown[];
          helper_text: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color?: string;
          kind?: StageKind;
          sort?: number;
          stale_after_days?: number | null;
          required_fields?: unknown[];
          helper_text?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["lead_stages"]["Insert"]>;
      };
      communities: {
        Row: { id: string; name: string; area_group: string; created_at: string };
        Insert: { id?: string; name: string; area_group?: string };
        Update: Partial<Database["public"]["Tables"]["communities"]["Insert"]>;
      };
      lead_events: {
        Row: {
          id: number;
          lead_id: string;
          kind: string;
          actor_id: string | null;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          kind: string;
          actor_id?: string | null;
          payload?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["lead_events"]["Insert"]>;
      };
      lead_assignments: {
        Row: {
          id: string;
          lead_id: string;
          from_user: string | null;
          to_user: string | null;
          reason: string;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          from_user?: string | null;
          to_user?: string | null;
          reason?: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_assignments"]["Insert"]>;
      };
      lead_viewings: {
        Row: {
          id: string;
          lead_id: string | null;
          deal_id: string | null;
          property_id: string | null;
          listing_id: string | null;
          scheduled_at: string;
          agent_id: string | null;
          note: string | null;
          status: string;
          outcome: string | null;
          outcome_note: string | null;
          reminded_at: string | null;
          created_at: string;
        };
        Insert: {
          lead_id?: string | null;
          deal_id?: string | null;
          property_id?: string | null;
          listing_id?: string | null;
          scheduled_at: string;
          agent_id?: string | null;
          note?: string | null;
          status?: string;
          outcome?: string | null;
          outcome_note?: string | null;
          reminded_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lead_viewings"]["Insert"]>;
      };
      lead_tasks: {
        Row: {
          id: string;
          lead_id: string;
          title: string;
          due_at: string | null;
          assignee_id: string | null;
          done_at: string | null;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          title: string;
          due_at?: string | null;
          assignee_id?: string | null;
          done_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lead_tasks"]["Insert"]>;
      };
      lead_areas: {
        Row: {
          id: string;
          name: string;
          name_norm: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_areas"]["Insert"]>;
      };
      lead_nationalities: {
        Row: {
          id: string;
          name: string;
          name_norm: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["lead_nationalities"]["Insert"]>;
      };
      lead_field_options: {
        Row: {
          id: string;
          field_key: string;
          value: string;
          label: string;
          sort: number;
          extra: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          field_key: string;
          value: string;
          label: string;
          sort?: number;
          extra?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["lead_field_options"]["Insert"]>;
      };
      lead_follow_ups: {
        Row: {
          id: string;
          lead_id: string;
          scheduled_at: string;
          completed_at: string | null;
          status: "scheduled" | "done" | "snoozed" | "skipped";
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lead_id: string;
          scheduled_at: string;
          completed_at?: string | null;
          status?: "scheduled" | "done" | "snoozed" | "skipped";
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lead_follow_ups"]["Insert"]>;
      };
      saved_filters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          params: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          params?: Record<string, unknown>;
        };
        Update: Partial<Database["public"]["Tables"]["saved_filters"]["Insert"]>;
      };
      teams: {
        Row: {
          id: string;
          name: string;
          rr_cursor: number;
          created_at: string;
          lead_id: string | null;
          is_active: boolean;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          name: string;
          rr_cursor?: number;
          lead_id?: string | null;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]> & {
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      team_members: {
        Row: { team_id: string; user_id: string; daily_cap: number };
        Insert: { team_id: string; user_id: string; daily_cap?: number };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string;
          type: string;
          summary: string | null;
          occurred_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          lead_id: string;
          type?: string;
          summary?: string | null;
          occurred_at?: string;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["lead_activities"]["Insert"]>;
      };
      customers: {
        Row: {
          id: string;
          type: CustomerType;
          name: string;
          phone: string | null;
          email: string | null;
          nationality: string | null;
          emirates_id: string | null;
          passport_no: string | null;
          trn: string | null;
          address: string | null;
          tags: string[] | null;
          notes: string | null;
          assigned_to: string | null;
          created_by: string | null;
          lead_id: string | null;
          status: string;
          client_since: string | null;
          lead_context: LeadContextJson | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          type?: CustomerType;
          name: string;
          phone?: string | null;
          email?: string | null;
          nationality?: string | null;
          emirates_id?: string | null;
          passport_no?: string | null;
          trn?: string | null;
          address?: string | null;
          tags?: string[] | null;
          notes?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          lead_id?: string | null;
          status?: string;
          client_since?: string | null;
          lead_context?: LeadContextJson | null;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      deals: {
        Row: {
          id: string;
          title: string;
          customer_id: string | null;
          deal_type: DealType;
          stage: DealStage;
          value: number;
          commission_amount: number | null;
          commission_rate: number | null;
          assigned_to: string | null;
          expected_close_date: string | null;
          lost_reason: string | null;
          stage_changed_at: string | null;
          ejari_no: string | null;
          lead_id: string | null;
          lead_context: LeadContextJson | null;
          finalized_at: string | null;
          property_title: string | null;
          property_community: string | null;
          property_building: string | null;
          property_unit: string | null;
          property_ref: string | null;
          property_snapshot: Record<string, unknown> | null;
          payment_method: string | null;
          payment_deposit: number | null;
          payment_balance: number | null;
          payment_schedule: Record<string, unknown> | null;
          payment_notes: string | null;
          kyc_nationality: string | null;
          kyc_emirates_id: string | null;
          kyc_passport_no: string | null;
          kyc_trn: string | null;
          buyer_name: string | null;
          buyer_phone: string | null;
          buyer_email: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          customer_id?: string | null;
          deal_type?: DealType;
          stage?: DealStage;
          value?: number;
          commission_amount?: number | null;
          commission_rate?: number | null;
          assigned_to?: string | null;
          expected_close_date?: string | null;
          lost_reason?: string | null;
          stage_changed_at?: string | null;
          ejari_no?: string | null;
          lead_id?: string | null;
          lead_context?: LeadContextJson | null;
          finalized_at?: string | null;
          property_title?: string | null;
          property_community?: string | null;
          property_building?: string | null;
          property_unit?: string | null;
          property_ref?: string | null;
          property_snapshot?: Record<string, unknown> | null;
          payment_method?: string | null;
          payment_deposit?: number | null;
          payment_balance?: number | null;
          payment_schedule?: Record<string, unknown> | null;
          payment_notes?: string | null;
          kyc_nationality?: string | null;
          kyc_emirates_id?: string | null;
          kyc_passport_no?: string | null;
          kyc_trn?: string | null;
          buyer_name?: string | null;
          buyer_phone?: string | null;
          buyer_email?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      customer_properties: {
        Row: {
          id: string;
          customer_id: string;
          deal_id: string | null;
          deal_type: string;
          property_title: string;
          property_community: string | null;
          property_building: string | null;
          property_unit: string | null;
          property_ref: string | null;
          property_snapshot: Record<string, unknown> | null;
          value: number;
          payment_method: string | null;
          payment_snapshot: Record<string, unknown> | null;
          assigned_to: string | null;
          agent_name: string | null;
          agent_commission_amount: number | null;
          agent_commission_rate: number | null;
          acquired_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          deal_id?: string | null;
          deal_type?: string;
          property_title: string;
          property_community?: string | null;
          property_building?: string | null;
          property_unit?: string | null;
          property_ref?: string | null;
          property_snapshot?: Record<string, unknown> | null;
          value?: number;
          payment_method?: string | null;
          payment_snapshot?: Record<string, unknown> | null;
          assigned_to?: string | null;
          agent_name?: string | null;
          agent_commission_amount?: number | null;
          agent_commission_rate?: number | null;
          acquired_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customer_properties"]["Insert"]>;
      };
      documents: {
        Row: {
          id: string;
          name: string;
          storage_path: string;
          mime_type: string;
          size_bytes: number;
          category: string;
          entity_type: string | null;
          entity_id: string | null;
          expiry_date: string | null;
          notes: string | null;
          ai_extracted: Record<string, unknown> | null;
          uploaded_by: string | null;
          created_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          storage_path: string;
          mime_type?: string;
          size_bytes?: number;
          category?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          expiry_date?: string | null;
          notes?: string | null;
          ai_extracted?: Record<string, unknown> | null;
          uploaded_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          kind: string;
          entity_type: string | null;
          entity_id: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          kind?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          read_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      email_templates: {
        Row: {
          id: string;
          key: string;
          subject: string;
          body_html: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          subject?: string;
          body_html?: string;
        };
        Update: Partial<Database["public"]["Tables"]["email_templates"]["Insert"]>;
      };
      counters: {
        Row: {
          id: number;
          prefix: string;
          year: number;
          seq: number;
        };
        Insert: {
          id?: number;
          prefix: string;
          year: number;
          seq?: number;
        };
        Update: Partial<Database["public"]["Tables"]["counters"]["Insert"]>;
      };
      developers: {
        Row: {
          id: string;
          name: string;
          contact_person: string | null;
          phone: string | null;
          email: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          name: string;
          contact_person?: string | null;
          phone?: string | null;
          email?: string | null;
          is_active?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["developers"]["Insert"]>;
      };
      projects: {
        Row: {
          id: string;
          developer_id: string | null;
          name: string;
          community: string | null;
          location: string | null;
          project_type: string;
          handover_date: string | null;
          description: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          developer_id?: string | null;
          name: string;
          community?: string | null;
          location?: string | null;
          project_type?: string;
          handover_date?: string | null;
          description?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
      };
      properties: {
        Row: {
          id: string;
          property_code: string;
          project_id: string | null;
          developer_id: string | null;
          community: string | null;
          building_name: string | null;
          unit_number: string | null;
          property_type: string;
          bedrooms: number | null;
          bathrooms: number | null;
          maid_room: boolean;
          floor: string | null;
          view: string | null;
          bua_sqft: number | null;
          plot_sqft: number | null;
          parking: number | null;
          status: string;
          title_deed_number: string | null;
          oqood_number: string | null;
          dld_property_number: string | null;
          assigned_to: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          property_code?: string;
          project_id?: string | null;
          developer_id?: string | null;
          community?: string | null;
          building_name?: string | null;
          unit_number?: string | null;
          property_type?: string;
          bedrooms?: number | null;
          bathrooms?: number | null;
          maid_room?: boolean;
          floor?: string | null;
          view?: string | null;
          bua_sqft?: number | null;
          plot_sqft?: number | null;
          parking?: number | null;
          status?: string;
          title_deed_number?: string | null;
          oqood_number?: string | null;
          dld_property_number?: string | null;
          assigned_to?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      listings: {
        Row: {
          id: string;
          property_id: string;
          listing_type: string;
          asking_price: number;
          listing_status: string;
          assigned_agent_id: string | null;
          trakheesi_permit_no: string | null;
          available_from: string | null;
          furnishing: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          property_id: string;
          listing_type?: string;
          asking_price?: number;
          listing_status?: string;
          assigned_agent_id?: string | null;
          trakheesi_permit_no?: string | null;
          available_from?: string | null;
          furnishing?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      deal_properties: {
        Row: {
          id: string;
          deal_id: string;
          property_id: string;
          listing_id: string | null;
          role: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          deal_id: string;
          property_id: string;
          listing_id?: string | null;
          role?: string;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["deal_properties"]["Insert"]>;
      };
    };
    Functions: {
      next_doc_number: {
        Args: { prefix: string };
        Returns: string;
      };
      lead_table_columns: {
        Args: Record<string, never>;
        Returns: {
          column_name: string;
          data_type: string;
          udt_name: string;
          ordinal_position: number;
        }[];
      };
      crm_my_profile: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      crm_staff_roster: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"][];
      };
      crm_staff_profile: {
        Args: { p_id: string };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
    };
    Enums: {
      user_role: UserRole;
      lead_status: LeadStatus;
      customer_type: CustomerType;
      deal_type: DealType;
      deal_stage: DealStage;
      stage_kind: StageKind;
    };
  };
};
