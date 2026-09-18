'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/use-auth.store'; // 👈 Importamos el store para leer el rol
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Settings, 
  MapPin,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Fuel,
  Bell,
  BarChart3,
  Menu,
  X
} from 'lucide-react';
import styles from './sidebar.module.css';

type NavItem = {
  path?: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  subItems?: { path: string; label: string; icon?: React.ReactNode }[];
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuthStore(); // 👈 Obtenemos el usuario autenticado
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  const userRole = user?.role;

  const rawNavItems: NavItem[] = [
    { path: '/dashboard', label: 'Inicio', icon: <LayoutDashboard size={20} /> },
    { path: '/operations', label: 'Viajes / Op.', icon: <ClipboardList size={20} /> },
    { 
      label: 'Gestión de Flota', 
      icon: <Truck size={20} />,
      subItems: [
        { path: '/fleet/vehiculos', label: 'Vehículos', icon: <Truck size={16} /> },
        { path: '/fleet/conductores', label: 'Conductores', icon: <Users size={16} /> },
        { path: '/fleet/asignaciones', label: 'Asignaciones', icon: <ClipboardList size={16} /> },
      ]
    },
    { path: '/locations', label: 'Ubicaciones', icon: <MapPin size={20} /> },
    { path: '/cliente', label: 'Clientes', icon: <Users size={20} /> },
    { path: '/novedades', label: 'Novedades', icon: <BarChart3 size={20} /> },

    // { path: '/map', label: 'Mapa', icon: <MapPin size={20} /> },
    // { path: '/fuel', label: 'Combustible', icon: <Fuel size={20} />, badge: 6 },
    // { path: '/alerts', label: 'Alertas', icon: <Bell size={20} />, badge: 12 },
    // { path: '/settings', label: 'Configuración', icon: <Settings size={20} /> },
  ];

  // 🛡️ Filtramos los elementos del menú si el rol es ANALISTA
  const navItems = rawNavItems.filter((item) => {
    if (userRole === 'ANALISTA' && item.label === 'Gestión de Flota') {
      return false; // Oculta por completo la sección de flota al analista
    }
    return true;
  });

  useEffect(() => {
    navItems.forEach((item) => {
      if (item.subItems) {
        const isChildActive = item.subItems.some(subItem => pathname.includes(subItem.path));
        if (isChildActive) {
          setOpenMenus(prev => ({ ...prev, [item.label]: true }));
        }
      }
    });
  }, [pathname]);

  const toggleMenu = (label: string) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    // ... (El resto del JSX se mantiene exactamente igual que lo tenías)
    <>
      <button 
        type="button" 
        onClick={toggleSidebar} 
        className={`${styles.hamburgerBtn} ${isOpen ? styles.hamburgerHidden : ''}`}
        aria-label="Abrir menú de navegación"
      >
        <Menu size={24} />
      </button>

      {isOpen && (
        <div className={styles.backdrop} onClick={closeSidebar} />
      )}

      <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.logo}>
          <span>🚛 Corditrans Panel</span>
          <button 
            type="button" 
            onClick={closeSidebar} 
            className={styles.closeBtn}
            aria-label="Cerrar menú"
          >
            <X size={24} />
          </button>
        </div>

        <ul className={styles.menu}>
          {navItems.map((item) => {
            const hasSubItems = !!item.subItems;
            const isActive = item.path ? pathname === item.path : false;
            const menuOpen = openMenus[item.label];

            return (
              <React.Fragment key={item.label}>
                {hasSubItems ? (
                  <li 
                    className={`${styles.menuItem} ${menuOpen ? styles['menuItem--open'] : ''} ${styles.parentItem}`}
                    onClick={() => toggleMenu(item.label)}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                      {item.icon} 
                      <span>{item.label}</span>
                      <span style={{ marginLeft: 'auto' }}>
                        {menuOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    </div>
                  </li>
                ) : (
                  <Link href={item.path!} className={styles.linkItem} onClick={closeSidebar}>
                    <li className={`${styles.menuItem} ${isActive ? styles['menuItem--active'] : ''}`}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                        {item.icon} 
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className={styles.badgeCount}>{item.badge}</span>
                        )}
                      </div>
                    </li>
                  </Link>
                )}

                {hasSubItems && menuOpen && (
                  <ul className={styles.submenu}>
                    {item.subItems!.map((sub) => {
                      const isSubActive = pathname === sub.path;
                      return (
                        <Link key={sub.path} href={sub.path} className={styles.linkItem} onClick={closeSidebar}>
                          <li className={`${styles.menuItem} ${styles.subMenuItem} ${isSubActive ? styles['menuItem--active'] : ''}`}>
                            {sub.icon} <span>{sub.label}</span>
                          </li>
                        </Link>
                      );
                    })}
                  </ul>
                )}
              </React.Fragment>
            );
          })}
        </ul>
      </aside>
    </>
  );
};