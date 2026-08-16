-- Dubai brokerage document types used in uploads (staff BRN, Trakheesi permit, contracts).

alter type public.doc_category add value if not exists 'permit';
alter type public.doc_category add value if not exists 'contract';
alter type public.doc_category add value if not exists 'brn';
