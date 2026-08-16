export type UserRole = "admin" | "manager" | "agent" | "accountant";

export type LeadSource =
  | "website"
  | "bayut"
  | "property_finder"
  | "dubizzle"
  | "referral"
  | "walk_in"
  | "social"
  | "other";

export type LeadInterest = "buy" | "rent" | "sell" | "off_plan" | "commercial";

export type LeadStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "unqualified"
  | "converted";

export type StageKind = "open" | "won" | "lost" | "junk";

export type CustomerType = "individual" | "company";

export type DealType = "sale" | "rental" | "off_plan";

export type DealStage =
  | "inquiry"
  | "viewing"
  | "negotiation"
  | "offer"
  | "contract"
  | "won"
  | "lost";

export type PropertyPurpose = "sale" | "rent";

export type PropertyCategory =
  | "apartment"
  | "villa"
  | "townhouse"
  | "office"
  | "retail"
  | "warehouse"
  | "land"
  | "off_plan";

export type PropertyStatus =
  | "available"
  | "reserved"
  | "sold"
  | "rented"
  | "off_market";

export type QuotationStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired";

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "void";

export type PaymentMethod = "cash" | "bank_transfer" | "cheque" | "card";

export type ChequeDirection = "incoming" | "outgoing";

export type ChequeStatus =
  | "pending"
  | "deposited"
  | "cleared"
  | "bounced"
  | "replaced"
  | "cancelled";

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

export type ApprovalKind =
  | "quotation_discount"
  | "expense"
  | "deal_commission"
  | "other";

export type ApprovalStatus = "pending" | "approved" | "rejected";

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
          score_reason: string | null;
          assigned_to: string | null;
          next_follow_up_at: string | null;
          converted_customer_id: string | null;
          converted_deal_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          stage_id: string | null;
          custom: Record<string, unknown>;
          campaign_id: string | null;
          external_ref: string | null;
          phone_norm: string | null;
          email_norm: string | null;
          language: string | null;
          nationality: string | null;
          financing: string | null;
          timeframe: string | null;
          purpose: string | null;
          bedrooms: string | null;
          category: string | null;
          no_show_count: number;
          first_response_due_at: string | null;
          first_responded_at: string | null;
          last_activity_at: string | null;
          last_inquiry_at: string | null;
          stage_entered_at: string;
          import_batch_id: string | null;
          merged_into_id: string | null;
          tags: string[];
          pipeline_id: string | null;
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
          score_reason?: string | null;
          assigned_to?: string | null;
          next_follow_up_at?: string | null;
          converted_customer_id?: string | null;
          converted_deal_id?: string | null;
          created_by?: string | null;
          stage_id?: string | null;
          custom?: Record<string, unknown>;
          campaign_id?: string | null;
          external_ref?: string | null;
          language?: string | null;
          nationality?: string | null;
          financing?: string | null;
          timeframe?: string | null;
          purpose?: string | null;
          bedrooms?: string | null;
          category?: string | null;
          no_show_count?: number;
          first_response_due_at?: string | null;
          first_responded_at?: string | null;
          last_activity_at?: string | null;
          last_inquiry_at?: string | null;
          stage_entered_at?: string;
          import_batch_id?: string | null;
          merged_into_id?: string | null;
          tags?: string[];
          pipeline_id?: string | null;
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
          lead_id: string;
          property_id: string | null;
          scheduled_at: string;
          agent_id: string | null;
          note: string | null;
          outcome: string | null;
          outcome_note: string | null;
          reminded_at: string | null;
          created_at: string;
        };
        Insert: {
          lead_id: string;
          property_id?: string | null;
          scheduled_at: string;
          agent_id?: string | null;
          note?: string | null;
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
      campaigns: {
        Row: {
          id: string;
          name: string;
          channel: string;
          tracking_code: string;
          budget: number | null;
          spend: number | null;
          starts_on: string | null;
          ends_on: string | null;
          target: Record<string, unknown>;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          channel: string;
          tracking_code: string;
          budget?: number | null;
          spend?: number | null;
          starts_on?: string | null;
          ends_on?: string | null;
          target?: Record<string, unknown>;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["campaigns"]["Insert"]>;
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
      lost_reasons: {
        Row: {
          id: string;
          kind: string;
          label: string;
          sort: number;
          is_active: boolean;
        };
        Insert: {
          kind: string;
          label: string;
          sort?: number;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["lost_reasons"]["Insert"]>;
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
        Row: { id: string; name: string; rr_cursor: number; created_at: string };
        Insert: { name: string; rr_cursor?: number };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
      };
      team_members: {
        Row: { team_id: string; user_id: string; daily_cap: number };
        Insert: { team_id: string; user_id: string; daily_cap?: number };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
      };
      routing_rules: {
        Row: {
          id: string;
          sort: number;
          conditions: Record<string, unknown>;
          action: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          sort?: number;
          conditions?: Record<string, unknown>;
          action?: Record<string, unknown>;
          is_active?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["routing_rules"]["Insert"]>;
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
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
      };
      deals: {
        Row: {
          id: string;
          title: string;
          customer_id: string;
          property_id: string | null;
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
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          customer_id: string;
          property_id?: string | null;
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
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["deals"]["Insert"]>;
      };
      properties: {
        Row: {
          id: string;
          ref_no: string;
          title: string;
          description: string | null;
          purpose: PropertyPurpose;
          category: PropertyCategory;
          status: PropertyStatus;
          community: string | null;
          building: string | null;
          unit_no: string | null;
          city: string;
          bedrooms: number | null;
          bathrooms: number | null;
          size_sqft: number | null;
          parking: number | null;
          price: number;
          service_charge: number | null;
          owner_id: string | null;
          trakheesi_permit_no: string | null;
          dtcm_permit_no: string | null;
          furnishing: string | null;
          amenities: string[] | null;
          assigned_to: string | null;
          featured: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          ref_no?: string;
          title: string;
          description?: string | null;
          purpose?: PropertyPurpose;
          category?: PropertyCategory;
          status?: PropertyStatus;
          community?: string | null;
          building?: string | null;
          unit_no?: string | null;
          city?: string;
          bedrooms?: number | null;
          bathrooms?: number | null;
          size_sqft?: number | null;
          parking?: number | null;
          price?: number;
          service_charge?: number | null;
          owner_id?: string | null;
          trakheesi_permit_no?: string | null;
          dtcm_permit_no?: string | null;
          furnishing?: string | null;
          amenities?: string[] | null;
          assigned_to?: string | null;
          featured?: boolean;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["properties"]["Insert"]>;
      };
      property_owners: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          email: string | null;
          emirates_id: string | null;
          passport_no: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          emirates_id?: string | null;
          passport_no?: string | null;
          notes?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["property_owners"]["Insert"]>;
      };
      property_media: {
        Row: {
          id: string;
          property_id: string;
          storage_path: string;
          kind: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          property_id: string;
          storage_path: string;
          kind?: string;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["property_media"]["Insert"]>;
      };
      quotations: {
        Row: {
          id: string;
          quote_no: string;
          customer_id: string;
          deal_id: string | null;
          status: QuotationStatus;
          issue_date: string;
          valid_until: string | null;
          subtotal: number;
          discount: number;
          vat_amount: number;
          total: number;
          notes: string | null;
          terms: string | null;
          approval_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          quote_no?: string;
          customer_id: string;
          deal_id?: string | null;
          status?: QuotationStatus;
          issue_date?: string;
          valid_until?: string | null;
          subtotal?: number;
          discount?: number;
          vat_amount?: number;
          total?: number;
          notes?: string | null;
          terms?: string | null;
          approval_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["quotations"]["Insert"]>;
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          sort_order: number;
          description: string;
          qty: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          sort_order?: number;
          description: string;
          qty?: number;
          unit_price?: number;
          line_total?: number;
        };
        Update: Partial<Database["public"]["Tables"]["quotation_items"]["Insert"]>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_no: string;
          customer_id: string;
          deal_id: string | null;
          quotation_id: string | null;
          status: InvoiceStatus;
          issue_date: string;
          due_date: string;
          subtotal: number;
          discount: number;
          vat_amount: number;
          total: number;
          amount_paid: number;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_no?: string;
          customer_id: string;
          deal_id?: string | null;
          quotation_id?: string | null;
          status?: InvoiceStatus;
          issue_date?: string;
          due_date?: string;
          subtotal?: number;
          discount?: number;
          vat_amount?: number;
          total?: number;
          amount_paid?: number;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          sort_order: number;
          description: string;
          qty: number;
          unit_price: number;
          line_total: number;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          sort_order?: number;
          description: string;
          qty?: number;
          unit_price?: number;
          line_total?: number;
        };
        Update: Partial<Database["public"]["Tables"]["invoice_items"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          invoice_id: string | null;
          customer_id: string;
          method: PaymentMethod;
          amount: number;
          received_date: string;
          reference: string | null;
          notes: string | null;
          cheque_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          invoice_id?: string | null;
          customer_id: string;
          method?: PaymentMethod;
          amount?: number;
          received_date?: string;
          reference?: string | null;
          notes?: string | null;
          cheque_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      cheques: {
        Row: {
          id: string;
          direction: ChequeDirection;
          customer_id: string | null;
          payee: string | null;
          bank_name: string;
          cheque_no: string;
          amount: number;
          due_date: string;
          status: ChequeStatus;
          invoice_id: string | null;
          deal_id: string | null;
          property_id: string | null;
          bounce_reason: string | null;
          replaced_by_cheque_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          direction?: ChequeDirection;
          customer_id?: string | null;
          payee?: string | null;
          bank_name?: string;
          cheque_no?: string;
          amount?: number;
          due_date?: string;
          status?: ChequeStatus;
          invoice_id?: string | null;
          deal_id?: string | null;
          property_id?: string | null;
          bounce_reason?: string | null;
          replaced_by_cheque_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["cheques"]["Insert"]>;
      };
      expenses: {
        Row: {
          id: string;
          category: string;
          description: string;
          amount: number;
          expense_date: string;
          vendor: string | null;
          payment_method: PaymentMethod;
          receipt_document_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          category?: string;
          description: string;
          amount?: number;
          expense_date?: string;
          vendor?: string | null;
          payment_method?: PaymentMethod;
          receipt_document_id?: string | null;
          created_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["expenses"]["Insert"]>;
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
          ai_extracted?: Record<string, unknown> | null;
          uploaded_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Insert"]>;
      };
      approvals: {
        Row: {
          id: string;
          kind: ApprovalKind;
          entity_type: string;
          entity_id: string;
          requested_by: string;
          status: ApprovalStatus;
          amount: number | null;
          reason: string | null;
          decided_by: string | null;
          decided_at: string | null;
          decision_note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          kind?: ApprovalKind;
          entity_type: string;
          entity_id: string;
          requested_by: string;
          status?: ApprovalStatus;
          amount?: number | null;
          reason?: string | null;
          decided_by?: string | null;
          decided_at?: string | null;
          decision_note?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["approvals"]["Insert"]>;
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
      automation_rules: {
        Row: {
          id: string;
          name: string;
          is_active: boolean;
          trigger: string;
          conditions: Record<string, unknown> | null;
          actions: Record<string, unknown>[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          is_active?: boolean;
          trigger?: string;
          conditions?: Record<string, unknown> | null;
          actions?: Record<string, unknown>[] | null;
        };
        Update: Partial<Database["public"]["Tables"]["automation_rules"]["Insert"]>;
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
    };
    Enums: {
      user_role: UserRole;
      lead_source: LeadSource;
      lead_interest: LeadInterest;
      lead_status: LeadStatus;
      customer_type: CustomerType;
      deal_type: DealType;
      deal_stage: DealStage;
      property_purpose: PropertyPurpose;
      property_category: PropertyCategory;
      property_status: PropertyStatus;
      quotation_status: QuotationStatus;
      invoice_status: InvoiceStatus;
      payment_method: PaymentMethod;
      cheque_direction: ChequeDirection;
      cheque_status: ChequeStatus;
      approval_kind: ApprovalKind;
      approval_status: ApprovalStatus;
      stage_kind: StageKind;
    };
  };
};
