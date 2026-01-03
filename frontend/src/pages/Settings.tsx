import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchButton } from '@/components/ui/TouchButton';
import { Languages, Moon, Sun, Monitor } from 'lucide-react';

const Settings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex flex-col gap-6 animate-slide-up">
      <div className="page-header">
        <h1 className="text-xl lg:text-2xl font-bold">{t('nav.settings')}</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="w-5 h-5" />
              Language / اللغة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TouchButton
              variant={language === 'en' ? 'primary' : 'outline'}
              onClick={() => setLanguage('en')}
              className="w-full"
            >
              English
            </TouchButton>
            <TouchButton
              variant={language === 'ar' ? 'primary' : 'outline'}
              onClick={() => setLanguage('ar')}
              className="w-full"
            >
              العربية
            </TouchButton>
          </CardContent>
        </Card>

        <Card className="industrial-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Theme / السمة
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <TouchButton
              variant={theme === 'dark' ? 'primary' : 'outline'}
              onClick={() => setTheme('dark')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Moon className="w-5 h-5" />
              {language === 'ar' ? 'داكن' : 'Dark'}
            </TouchButton>
            <TouchButton
              variant={theme === 'light' ? 'primary' : 'outline'}
              onClick={() => setTheme('light')}
              className="w-full flex items-center justify-center gap-2"
            >
              <Sun className="w-5 h-5" />
              {language === 'ar' ? 'فاتح' : 'Light'}
            </TouchButton>
          </CardContent>
        </Card>

        <Card className="industrial-card">
          <CardHeader>
            <CardTitle>System Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Version</span>
              <span className="font-mono">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Standard</span>
              <span className="font-mono">ISO 9969</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Machine</span>
              <span className="font-mono">GRP Ring Stiffness</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
