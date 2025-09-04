interface HeroSectionProps {
  title: string;
  titleAccent: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
}

const HeroSection = ({ 
  title, 
  titleAccent, 
  description, 
  children,
  className = "" 
}: HeroSectionProps) => {
  return (
    <section className={`pt-24 pb-16 px-6 ${className}`}>
      <div className="container mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
          {title} <span className="gradient-primary bg-clip-text text-transparent">{titleAccent}</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          {description}
        </p>
        {children}
      </div>
    </section>
  );
};

export default HeroSection;
