import { MessageCircle } from "lucide-react";
import { waLink } from "@/lib/web/site";

export function WhatsAppDock() {
  return (
    <a
      href={waLink("Hello UrbanLuxe — I would like to enquire about a residence.")}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#2dd4bf] text-[#14110e] shadow-[0_12px_40px_rgba(20,17,14,0.28)] transition-transform duration-200 hover:scale-105"
      aria-label="WhatsApp UrbanLuxe"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
