import centauroLogo from "@/assets/centauro-logo.png";
import quizBanner from "@/assets/quiz-banner.png";

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
      <div className="w-full relative">
        <img src={quizBanner} alt="Quiz Copa 2026" className="w-full h-auto object-contain" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
      </div>
    </header>
  );
}
