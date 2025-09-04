import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import yoomoneyLogo from "../assets/yoomoney.svg";
import mastercardLogo from "../assets/mastercard.svg";
import visaLogo from "../assets/visa-blue.svg";
import payeerLogo from "../assets/payeer.svg";

const Footer = () => {
  const { t } = useTranslation();

  return (
    <footer className="py-16 px-6 border-t border-border/50">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent mb-4">
              Super Mock
            </div>
            <p className="text-muted-foreground mb-4 max-w-md">
              {t('footer.description')}
            </p>
            <div className="text-sm text-muted-foreground">
              <p>Email: info@supermock.ru</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div><Link to="/features" className="hover:text-primary transition-colors">{t('footer.features')}</Link></div>
              <div><Link to="/professions" className="hover:text-primary transition-colors">{t('footer.professions')}</Link></div>
              <div><Link to="/languages" className="hover:text-primary transition-colors">{t('footer.languages')}</Link></div>
              <div><Link to="/pricing" className="hover:text-primary transition-colors">{t('footer.pricing')}</Link></div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.support')}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div><Link to="/instructions" className="hover:text-primary transition-colors">{t('footer.help')}</Link></div>
              <div><Link to="/documentation" className="hover:text-primary transition-colors">{t('footer.documentation')}</Link></div>
              <div><Link to="/support" className="hover:text-primary transition-colors">{t('footer.supportLink')}</Link></div>
              <div><Link to="/faq" className="hover:text-primary transition-colors">{t('footer.faq')}</Link></div>
              <div><Link to="/about" className="hover:text-primary transition-colors">{t('footer.about')}</Link></div>
              <div><Link to="/privacy-policy" className="hover:text-primary transition-colors">{t('footer.privacyPolicy')}</Link></div>
              <div><Link to="/terms-of-service" className="hover:text-primary transition-colors">{t('footer.termsOfService')}</Link></div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">{t('footer.payment')}</h4>
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <img 
                  src={yoomoneyLogo} 
                  alt="ЮMoney" 
                  className="h-6 w-auto"
                />
              </div>
              <div className="flex items-center">
                <img 
                  src={mastercardLogo} 
                  alt="Mastercard" 
                  className="h-5 w-auto"
                />
              </div>
              <div className="flex items-center">
                <img 
                  src={visaLogo} 
                  alt="Visa" 
                  className="h-5 w-auto"
                />
              </div>
              <div className="flex items-center">
                <img 
                  src={payeerLogo} 
                  alt="Payeer" 
                  className="h-5 w-auto"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-border/50 mt-8 pt-8 text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <a 
              href="https://github.com/korobprog" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('footer.github')}
            </a>

            <a 
              href="https://www.linkedin.com/in/korobprog/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {t('footer.linkedin')}
            </a>
          </div>
          <p className="text-sm text-muted-foreground">
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
