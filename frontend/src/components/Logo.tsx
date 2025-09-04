import { Link } from "react-router-dom";
import logoImage from "@/assets/logo_main.png";

interface LogoProps {
  className?: string;
  variant?: 'default' | 'enhanced' | 'bright-blue' | 'white-letters' | 'white-blue-glow';
}

const Logo = ({ className = "", variant = 'white-blue-glow' }: LogoProps) => {
  return (
    <Link 
      to="/" 
      className={`flex items-center transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background rounded-lg ${className}`}
    >
      <img 
        src={logoImage} 
        alt="Super Mock Logo" 
        className={`h-10 w-auto object-contain ${
          variant === 'enhanced' ? 'logo-enhanced' : 
          variant === 'bright-blue' ? 'logo-bright-blue' : 
          variant === 'white-letters' ? 'logo-white-letters' :
          variant === 'white-blue-glow' ? 'logo-white-blue-glow' :
          ''
        }`}
      />
    </Link>
  );
};

export default Logo;
