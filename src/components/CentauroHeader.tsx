import centauroLogo from "@/assets/centauro-logo.png";
import centauroBanner from "@/assets/centauro-copa-banner.jpg";

export default function CentauroHeader() {
  return (
    <header className="relative overflow-hidden">
      {/* Top bar with logo */}
      <div className="bg-primary py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-center">
          <img src={centauroLogo} alt="Centauro Esportes" className="h-12 md:h-16 object-contain brightness-0 invert" />
        </div>
      </div>

      {/* Banner */}
      <div
        className="w-full h-48 md:h-64 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${centauroBanner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6">
          <p className="text-primary-foreground text-sm font-bold tracking-[0.25em] uppercase opacity-90">
            Promoção Exclusiva Centauro
          </p>
        </div>
      </div>
    </header>
  );
}
