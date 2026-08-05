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
          source: LeadSource;
          interest: LeadInterest;
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
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          email?: string | null;
          source?: LeadSource;
          interest?: LeadInterest;
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
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
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
          category: DocCategory;
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
          category?: DocCategory;
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
      doc_category: DocCategory;
      approval_kind: ApprovalKind;
      approval_status: ApprovalStatus;
    };
  };
};
