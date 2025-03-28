
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Film, Heart, LogIn, Menu, Search, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from '@/hooks/use-mobile';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  useEffect(() => {
    // Close mobile menu when route changes
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const menuItems = [
    { label: 'Descobrir', href: '/discover', icon: Film },
    { label: 'Assistidos', href: '/watched', icon: Heart },
    { label: 'Perfil', href: '/profile', icon: User },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link 
            to="/" 
            className="flex items-center gap-2 font-bold text-xl bg-gradient-to-r from-couple-purple to-couple-pink bg-clip-text text-transparent"
          >
            <Film className="w-6 h-6 text-couple-purple" />
            <span>CouplesFlix</span>
          </Link>
        </div>

        <div className={cn(
          "fixed inset-0 top-16 z-50 flex-col gap-2 bg-background md:static md:ml-auto md:flex md:flex-row md:items-center md:gap-4 md:bg-transparent",
          isMenuOpen ? 'flex' : 'hidden'
        )}>
          {!isMobile && session && (
            <div className="md:flex md:gap-4 px-4 md:px-0 py-6 md:py-0">
              {menuItems.map((item) => (
                <Button 
                  key={item.href}
                  variant="ghost" 
                  asChild
                >
                  <Link 
                    to={item.href} 
                    className="flex items-center gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                </Button>
              ))}
            </div>
          )}

          {isMobile && session && (
            <div className="flex flex-col px-4 py-4 gap-2">
              {menuItems.map((item) => (
                <Button 
                  key={item.href}
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => {
                    navigate(item.href);
                    toggleMenu();
                  }}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  <span>{item.label}</span>
                </Button>
              ))}
            </div>
          )}
          
          <div className="mt-auto md:mt-0 px-4 pb-4 md:p-0">
            {!session ? (
              <Button asChild className="w-full md:w-auto">
                <Link to="/auth">
                  <LogIn className="w-4 h-4 mr-2" />
                  <span>Entrar</span>
                </Link>
              </Button>
            ) : (
              <Button variant="outline" className="w-full md:w-auto">
                <Link to="/discover">
                  <Search className="w-4 h-4 mr-2" />
                  <span>Buscar</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMenu}
          className="md:hidden"
        >
          {isMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>
    </header>
  );
}
