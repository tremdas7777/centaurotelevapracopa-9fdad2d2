import centauroBanner from "@/assets/centauro-banner.jpg";

export default function CentauroHeader() {
  return (
    <header className="relative overflow-hidden">
      <div
        className="w-full h-56 md:h-72 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${centauroBanner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-foreground/30 to-foreground/60" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-10 bg-centauro-gold rounded-full" />
            <span className="text-primary-foreground text-sm font-bold tracking-[0.3em] uppercase">
              Promoção Exclusiva
            </span>
            <div className="h-1 w-10 bg-centauro-gold rounded-full" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-primary-foreground tracking-tight text-center">
            QUIZ COPA 2026
          </h1>
          <p className="text-primary-foreground/90 font-semibold mt-2 text-lg">
            Responda e Ganhe Prêmios!
          </p>
        </div>
      </div>
      <div className="h-1 bg-primary" />
    </header>
  );
}
