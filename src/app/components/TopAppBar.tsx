'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ChevronDown,
  UserCircle,
  LogIn,
  UserPlus,
  Sun,
  Moon,
  Globe,
  HelpCircle,
  Car,
  LogOut,
  User,
  Calendar,
  BarChart3,
  Bell,
  DollarSign,
  UserCog,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useChat } from '@/context/ChatContext';
import { useTheme } from 'next-themes';

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

interface ProfileMenuItem {
  icon: IconComponent;
  label: string;
  href?: string;
  onClick?: () => void;
  divider?: boolean;
}

const TopAppBar = () => {
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const { openChat } = useChat();
  
  // ✅ CORRECTION : On a retiré "theme" car on utilise uniquement "resolvedTheme"
  const { setTheme, resolvedTheme } = useTheme();
  
  const [mounted, setMounted] = useState(false);
  
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // ✅ NOUVEAU : État pour gérer l'affichage des notifications (nouvelles ou historique)
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  
  // ✅ NOUVEAU : État pour gérer le loading du bouton "Tout marquer comme lu"
  const [isLoadingMarkAll, setIsLoadingMarkAll] = useState(false);
  
  const [currentLanguage, setCurrentLanguage] = useState('fr');
  const [isScrolled, setIsScrolled] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);
  const notificationMenuRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'fr';
    setCurrentLanguage(savedLanguage);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        profileMenuRef.current && 
        profileButtonRef.current &&
        !profileMenuRef.current.contains(target) &&
        !profileButtonRef.current.contains(target)
      ) {
        setIsProfileMenuOpen(false);
      }

      if (
        notificationMenuRef.current && 
        notificationButtonRef.current &&
        !notificationMenuRef.current.contains(target) &&
        !notificationButtonRef.current.contains(target)
      ) {
        setIsNotificationMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'fr' ? 'en' : 'fr';
    setCurrentLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const handleThemeToggle = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setIsProfileMenuOpen(false);
  };

  // ✅ NOUVEAU : Fonction pour marquer TOUTES les notifications comme lues
  const handleMarkAllAsReadClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche la fermeture du menu
    setIsLoadingMarkAll(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('❌ Erreur lors du marquage de toutes les notifications:', error);
    } finally {
      setIsLoadingMarkAll(false);
    }
  };

  const handleProfileButtonClick = () => {
    setIsProfileMenuOpen(prev => !prev);
    setIsNotificationMenuOpen(false);
  };

  const handleNotificationButtonClick = () => {
    // ✅ CRITIQUE FIX : Marquer comme lues à la FERMETURE, pas à l'ouverture
    // Si le menu est actuellement OUVERT et on clique pour le FERMER
    if (isNotificationMenuOpen) {
      markAllAsRead();
      setShowAllNotifications(false); // Réinitialiser pour la prochaine ouverture
    }
    
    setIsNotificationMenuOpen(prev => !prev);
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleNotificationClick = async (notif: { id: number; link: string; read?: boolean; isRead?: boolean }) => {
    setIsNotificationMenuOpen(false);

    if (!notif.read && !notif.isRead) {
      await markAsRead(notif.id);
    }

    if (notif.link === '#refresh') {
      window.location.reload();
      return;
    }

    // ✅ Les anciennes notifications "nouvelle réservation" pointaient vers /vehicles/:id
    // On intercepte ce pattern pour rediriger le propriétaire vers son tableau de bord
    // Les nouvelles notifications ont déjà /dashboard/owner?highlight=<id> directement en base
    if (/^\/vehicles\/\d+$/.test(notif.link)) {
      router.push('/dashboard/owner');
      return;
    }

    try {
      const url = new URL(notif.link, window.location.origin);
      const chatBookingId = url.searchParams.get('open_chat_booking_id');

      if (chatBookingId) {
        const bookingIdNum = parseInt(chatBookingId, 10);
        if (!isNaN(bookingIdNum)) {
          openChat(bookingIdNum);
        }
      } else {
        router.push(notif.link);
      }
    } catch (error) {
      console.log("Lien de notification standard, navigation...", error);
      router.push(notif.link);
    }
  };

  // ✅ CRITICAL FIX : Créer la liste filtrée des notifications à afficher
  // On cherche les notifications NON LUES : read === false OU isRead === false
  const displayedNotifications = showAllNotifications 
    ? notifications // Si on veut tout voir, on prend toute la liste
    : notifications.filter(notif => notif.read === false || notif.isRead === false); // Sinon, on ne prend que celles non lues

  // ✅ CORRECTION : Ajout du fragment <> et du spacer h-16 pour éviter que la page "saute"
  // quand le composant passe de l'état de chargement à l'état chargé.
  if (!mounted || isLoading) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md h-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
            <div className="hidden md:block h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
          </div>
        </header>
        {/* ✅ Spacer identique à celui du bas du fichier — évite le saut de page */}
        <div className="h-16"></div>
      </>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const profileMenuItems: ProfileMenuItem[] = user ? [
    { icon: User, label: currentLanguage === 'fr' ? 'Mon Profil' : 'My Profile', href: '/profile' },
    { icon: Car, label: currentLanguage === 'fr' ? 'Mes véhicules' : 'My Vehicles', href: '/vehicles' },
    { icon: Calendar, label: currentLanguage === 'fr' ? 'Mes réservations' : 'My Bookings', href: '/bookings/my-bookings' },
    { icon: BarChart3, label: currentLanguage === 'fr' ? 'Dashboard Propriétaire' : 'Owner Dashboard', href: '/dashboard/owner' },
    { icon: DollarSign, label: currentLanguage === 'fr' ? 'Finances' : 'Finances', href: '/dashboard/financial' },
    ...(user.role === 'ADMIN' ? [{
      icon: UserCog,
      label: currentLanguage === 'fr' ? 'Panel Administrateur' : 'Admin Panel',
      href: '/admin'
    }] : []),
    { icon: LogOut, label: currentLanguage === 'fr' ? 'Déconnexion' : 'Sign Out', onClick: handleLogout, divider: true },
    { icon: isDark ? Sun : Moon, label: isDark ? (currentLanguage === 'fr' ? 'Mode clair' : 'Light mode') : (currentLanguage === 'fr' ? 'Mode sombre' : 'Dark mode'), onClick: handleThemeToggle },
    { icon: Globe, label: currentLanguage === 'fr' ? 'English' : 'Français', onClick: toggleLanguage },
    { icon: HelpCircle, label: currentLanguage === 'fr' ? 'Service Client' : 'Customer Service', href: '/faq' }
  ] : [
    { icon: LogIn, label: currentLanguage === 'fr' ? 'Connexion' : 'Sign In', href: '/login' },
    { icon: UserPlus, label: currentLanguage === 'fr' ? 'Inscription' : 'Sign Up', href: '/register', divider: true },
    { icon: isDark ? Sun : Moon, label: isDark ? (currentLanguage === 'fr' ? 'Mode clair' : 'Light mode') : (currentLanguage === 'fr' ? 'Mode sombre' : 'Dark mode'), onClick: handleThemeToggle },
    { icon: Globe, label: currentLanguage === 'fr' ? 'English' : 'Français', onClick: toggleLanguage },
    { icon: HelpCircle, label: currentLanguage === 'fr' ? 'Service Client' : 'Customer Service', href: '/faq' }
  ];

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-200 dark:border-gray-700' 
            : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo à gauche */}
            <div className="flex-shrink-0">
              <Link href="/" className="flex items-center space-x-2 group">
                <Image
                  src="/assets/icons/logo.svg"
                  alt="OurCarShare Logo"
                  width={150}
                  height={45}
                  className="group-hover:scale-105 transition-transform md:w-[192px] md:h-[58px]"
                />
              </Link>
            </div>

            {/* Bouton "Pourquoi OurCarShare" (Caché sur mobile, visible sur Desktop) */}
            <div className="hidden md:flex flex-1 justify-center">
              <Link
                href="/how-it-works"
                className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {currentLanguage === 'fr' ? 'Pourquoi OurCarShare' : 'Why OurCarShare'}
              </Link>
            </div>

            {/* Droite: Notifications + Menus */}
            <div className="flex-shrink-0 flex items-center space-x-2 md:space-x-4">
              
              {/* Notifications (Visible partout) */}
              {user && (
                <div className="relative">
                  <button
                    ref={notificationButtonRef}
                    onClick={handleNotificationButtonClick}
                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors relative"
                  >
                    <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                  
                  {isNotificationMenuOpen && (
                    <div ref={notificationMenuRef} className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                      {/* ✅ NOUVEAU : En-tête avec bouton "Tout marquer comme lu" */}
                      <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {currentLanguage === 'fr' ? 'Notifications' : 'Notifications'}
                        </div>
                        {/* Bouton visible seulement s'il y a des notifications non lues */}
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsReadClick}
                            disabled={isLoadingMarkAll}
                            className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                              isLoadingMarkAll
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {isLoadingMarkAll ? '⏳' : '✓'} {currentLanguage === 'fr' ? 'Tout marquer comme lu' : 'Mark all as read'}
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {displayedNotifications.length > 0 ? (
                          displayedNotifications.map(notif => (
                            <div
                              key={notif.id}
                              onClick={() => handleNotificationClick(notif)}
                              className="block cursor-pointer"
                            >
                              <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
                                {/* ✅ SÉCURITÉ : On s'assure d'afficher uniquement des strings */}
                                <p className="text-sm text-gray-900 dark:text-gray-100">
                                  {typeof notif.message === 'string' ? notif.message : JSON.stringify(notif.message)}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {notif.createdAt
                                    ? new Date(notif.createdAt).toLocaleString(currentLanguage === 'fr' ? 'fr-FR' : 'en-US')
                                    : ''}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 p-4 text-center">
                            {currentLanguage === 'fr' ? 'Aucune notification' : 'No notifications'}
                          </p>
                        )}
                      </div>
                      
                      {/* ✅ NOUVEAU : Bouton "Voir l'historique" qui s'affiche seulement si on ne voit pas déjà tout */}
                      {!showAllNotifications && notifications.length > 0 && (
                        <div className="border-t border-gray-100 dark:border-gray-600 p-2">
                          <button
                            onClick={() => setShowAllNotifications(true)}
                            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-gray-700"
                          >
                            {currentLanguage === 'fr' ? 'Voir l\'historique des notifications' : 'View notification history'}
                          </button>
                        </div>
                      )}
                      
                      {/* ✅ NOUVEAU : Bouton "Voir seulement les nouvelles" qui s'affiche si on regarde l'historique */}
                      {showAllNotifications && (
                        <div className="border-t border-gray-100 dark:border-gray-600 p-2">
                          <button
                            onClick={() => setShowAllNotifications(false)}
                            className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium py-2 rounded transition-colors hover:bg-blue-50 dark:hover:bg-gray-700"
                          >
                            {currentLanguage === 'fr' ? 'Voir seulement les nouvelles' : 'View only new notifications'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Menu profil (Caché sur Mobile, Visible Desktop) */}
              <div className="hidden md:block relative">
                <button
                  ref={profileButtonRef}
                  onClick={handleProfileButtonClick}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  {user ? (
                    user.profilePictureUrl ? (
                      <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                        <Image 
                          src={user.profilePictureUrl} 
                          alt="Profile" 
                          width={40} 
                          height={40} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user.sub.split('@')[0].charAt(0).toUpperCase()}
                      </div>
                    )
                  ) : (
                    <UserCircle className="h-10 w-10 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                  )}
                  <ChevronDown className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isProfileMenuOpen && (
                  <div ref={profileMenuRef} className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                    {user && (
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          {user.profilePictureUrl ? (
                            <div className="h-10 w-10 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                              <Image 
                                src={user.profilePictureUrl} 
                                alt="Profile" 
                                width={40} 
                                height={40} 
                                className="w-full h-full object-cover" 
                              />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {user.sub.split('@')[0].charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{user.firstName || user.sub.split('@')[0]}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.sub}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {profileMenuItems.map((item, index) => (
                      <div key={index}>
                        {item.divider && <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>}
                        {item.href ? (
                          <Link href={item.href} className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => setIsProfileMenuOpen(false)}>
                            <item.icon className="h-5 w-5" /><span>{item.label}</span>
                          </Link>
                        ) : (
                          <button onClick={item.onClick} className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-left">
                            <item.icon className="h-5 w-5" /><span>{item.label}</span>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* BOUTON MENU BURGER (Visible Uniquement sur Mobile) */}
              <div className="md:hidden flex items-center">
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(!isMobileMenuOpen);
                    setIsNotificationMenuOpen(false);
                  }}
                  className="p-2 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* --- MENU DÉROULANT COMPLET POUR MOBILE --- */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-900 shadow-2xl border-t border-gray-200 dark:border-gray-800 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <div className="px-4 py-4 space-y-1">
              
              <Link
                href="/how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg font-medium"
              >
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span>{currentLanguage === 'fr' ? 'Pourquoi OurCarShare' : 'Why OurCarShare'}</span>
              </Link>

              <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>

              {/* Infos de l'utilisateur */}
              {user && (
                <div className="px-4 py-4 flex items-center space-x-4 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  {user.profilePictureUrl ? (
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm flex-shrink-0">
                      <Image 
                        src={user.profilePictureUrl} 
                        alt="Profile" 
                        width={48} 
                        height={48} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                      {user.sub.split('@')[0].charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {user.firstName || user.sub.split('@')[0]}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {user.sub}
                    </p>
                  </div>
                </div>
              )}

              {/* Tous les autres liens (Mon Profil, Login, Langue, Thème...) injectés automatiquement */}
              {profileMenuItems.map((item, index) => (
                <div key={index}>
                  {item.divider && <div className="border-t border-gray-200 dark:border-gray-800 my-2"></div>}
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center space-x-3 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <button
                      onClick={() => {
                        if (item.onClick) item.onClick();
                        setIsMobileMenuOpen(false); 
                      }}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition-colors text-left font-medium"
                    >
                      <item.icon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      <span>{item.label}</span>
                    </button>
                  )}
                </div>
              ))}

            </div>
          </div>
        )}
      </header>

      {/* Spacer pour éviter que le contenu soit caché sous la barre fixe */}
      <div className="h-16"></div>
    </>
  );
};

export default TopAppBar;