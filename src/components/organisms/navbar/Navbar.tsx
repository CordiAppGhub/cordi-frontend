// src/components/organisms/navbar/Navbar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth.store';
import { 
  LayoutDashboard, 
  Truck, 
  MapPin,
  ClipboardList,
  BarChart3,
  ContactRound,
  LogOut,
  UsersRound,
} from 'lucide-react';
import { showToast } from '@/utils/alerts';
import styles from './navbar.module.css';

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const userRole = user?.role;

  const rawTabs: NavItem[] = [
    { path: '/dashboard', label: 'Inicio', icon: <LayoutDashboard size={16} /> },
    { path: '/profiles', label: 'Perfiles', icon: <ContactRound size={16} /> },
    { path: '/operations', label: 'Viajes / Op.', icon: <ClipboardList size={16} /> },
    { path: '/fleet', label: 'Flota', icon: <Truck size={16} /> },
    { path: '/locations', label: 'Ubicaciones', icon: <MapPin size={16} /> },
    { path: '/tariff', label: 'Tarifas', icon: <BarChart3 size={16} /> },
    { path: '/novedades', label: 'Novedades', icon: <BarChart3 size={16} /> },
    { path: '/user', label: 'Usuarios', icon: <UsersRound size={16} /> },
  ];

  const tabs = rawTabs.filter((item) => {
    if (item.path === '/user') {
      return userRole === 'ADMIN';
    }
    if (userRole === 'ANALISTA') {
      return !['/fleet', '/locations'].includes(item.path);
    }
    if (userRole === 'CONDUCTOR') {
      return item.path === '/profiles';
    }
    return true;
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      showToast.error('No se pudo notificar el cierre de sesión al servidor.');
    }
  };

  return (
    <header className={styles.headerContainer}>
      
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <div className={styles.logoBadge}>
            {user?.name ? user.name.substring(0, 2).toUpperCase() : 'CT'}
          </div>
          <div>
            <h1 className={styles.appTitle}>Torre de Control</h1>
            <p className={styles.appSubtitle}>Corditrans • Comercio exterior & transporte de contenedores</p>
          </div>
        </div>

        <div className={styles.topRight}>
          <div className={styles.syncStatus}>
            <span className={styles.syncDot} />
            Sincronizado
          </div>

          <div className={styles.userBadge}>
            <span>{user?.name || 'Usuario'}</span>
          </div>
          <span className={styles.userRoleText}>{userRole || 'OPERADOR'}</span>
          <button
            type="button"
            className={styles.logoutButton}
            onClick={() => void handleLogout()}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut size={15} aria-hidden="true" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </div>

      <div className={styles.subNav}>
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => {
            const isActive = pathname === tab.path || (tab.path !== '/dashboard' && pathname.startsWith(tab.path));
            return (
              <Link 
                key={tab.path} 
                href={tab.path} 
                className={`${styles.tabItem} ${isActive ? styles.tabActive : ''}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

    </header>
  );
};