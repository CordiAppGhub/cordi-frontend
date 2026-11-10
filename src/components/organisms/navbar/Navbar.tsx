// src/components/organisms/navbar/Navbar.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  Bell,
  AlertTriangle,
  Clock3,
  X,
} from 'lucide-react';
import { showToast } from '@/utils/alerts';
import { dashboardService, OperationAlert } from '@/services/dashboard.service';
import { operationService } from '@/services/operation.service';
import { notificationsService } from '@/services/notifications.service';
import { socket } from '@/lib/socket';
import { SuperModal } from '@/components/organisms/modal/modal';
import styles from './navbar.module.css';

type NavItem = {
  path: string;
  label: string;
  icon: React.ReactNode;
};

interface OperationAlertGroup {
  operationId: number;
  operationLabel: string;
  operationStatus: string;
  containerStatus: string;
  analystName: string | null;
  driverName: string | null;
  alerts: OperationAlert[];
}

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const { user, logout, isAuthenticated } = useAuthStore();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] =
    useState<OperationAlertGroup | null>(null);
  const userRole = user?.role;
  const canViewOperationAlerts =
    isAuthenticated && userRole !== undefined;
  const canViewFleetRequests =
    isAuthenticated && (userRole === 'ADMIN' || userRole === 'JEFE_DE_FLOTA');
  const alertsQuery = useQuery({
    queryKey: ['dashboard', 'operation-alerts'],
    queryFn: dashboardService.getOperationAlerts,
    enabled: canViewOperationAlerts,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
  const pendingCountQuery = useQuery({
    queryKey: ['operations', 'pending-count'],
    queryFn: operationService.getPendingCount,
    enabled: canViewFleetRequests,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const pendingCount = pendingCountQuery.data ?? 0;
  const notificationsQuery = useQuery({
    queryKey: ['notifications', 'mine'],
    queryFn: notificationsService.getMine,
    enabled: canViewOperationAlerts,
    refetchInterval: 30_000,
  });
  const unreadNotifications = notificationsQuery.data?.unreadCount ?? 0;

  const markNotificationAsRead = async (notificationId: number) => {
    try {
      await notificationsService.markAsRead(notificationId);
      await queryClient.invalidateQueries({
        queryKey: ['notifications', 'mine'],
      });
    } catch (error: unknown) {
      showToast.error(error, 'No se pudo actualizar la notificación.');
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
      await queryClient.invalidateQueries({
        queryKey: ['notifications', 'mine'],
      });
    } catch (error: unknown) {
      showToast.error(error, 'No se pudieron marcar las notificaciones como leídas.');
    }
  };

  useEffect(() => {
    const refreshNavbarAlerts = () => {
      void queryClient.invalidateQueries({
        queryKey: ['operations', 'pending-count'],
      });
      void queryClient.invalidateQueries({
        queryKey: ['dashboard', 'operation-alerts'],
      });
    };

    socket.on('global_operations_updated', refreshNavbarAlerts);
    return () => {
      socket.off('global_operations_updated', refreshNavbarAlerts);
    };
  }, [queryClient]);

  const groupedAlerts = useMemo(() => {
    const groups = new Map<number, OperationAlertGroup>();

    for (const alert of alertsQuery.data ?? []) {
      const group = groups.get(alert.operationId);
      if (group) {
        group.alerts.push(alert);
      } else {
        groups.set(alert.operationId, {
          operationId: alert.operationId,
          operationLabel: alert.operationLabel,
          operationStatus: alert.operationStatus,
          containerStatus: alert.containerStatus,
          analystName: alert.analystName ?? null,
          driverName: alert.driverName ?? null,
          alerts: [alert],
        });
      }
    }

    return [...groups.values()].map((group) => ({
      ...group,
      alerts: [...group.alerts].sort(
        (left, right) =>
          (left.severity === 'HIGH' ? 0 : 1) -
            (right.severity === 'HIGH' ? 0 : 1) ||
          new Date(right.occurredAt).getTime() -
            new Date(left.occurredAt).getTime(),
      ),
    }));
  }, [alertsQuery.data]);
  const totalAlerts = groupedAlerts.length + unreadNotifications;

  const rawTabs: NavItem[] = [
    { path: '/dashboard', label: 'Inicio', icon: <LayoutDashboard size={16} /> },
    { path: '/profiles', label: 'Perfiles', icon: <ContactRound size={16} /> },
    { path: '/operations', label: 'Viajes / Op.', icon: <ClipboardList size={16} /> },
    { path: '/programacion', label: 'Solicitudes de flota', icon: <Truck size={16} /> },
    { path: '/fleet', label: 'Flota', icon: <Truck size={16} /> },
    { path: '/locations', label: 'Ubicaciones', icon: <MapPin size={16} /> },
    { path: '/tariff', label: 'Tarifas', icon: <BarChart3 size={16} /> },
    { path: '/novedades', label: 'Novedades', icon: <BarChart3 size={16} /> },
    { path: '/user', label: 'Usuarios', icon: <UsersRound size={16} /> },
  ];

  const tabs = rawTabs.filter((item) => {
    if (item.path === '/user') {
      return userRole === 'ADMIN' || userRole === 'JEFE_DE_FLOTA';
    }
    if (userRole === 'ANALISTA') {
      return !['/fleet', '/locations', '/programacion'].includes(item.path);
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

          {canViewOperationAlerts && (
            <div className={styles.alertsContainer}>
              <button
                type="button"
                className={styles.alertsButton}
                onClick={() => setAlertsOpen((open) => !open)}
                aria-label={`Alertas y notificaciones: ${totalAlerts}`}
                aria-expanded={alertsOpen}
                aria-controls="alerts-panel"
              >
                <Bell size={17} aria-hidden="true" />
                {totalAlerts > 0 && (
                  <span className={styles.alertsCount}>
                    {totalAlerts > 99 ? '99+' : totalAlerts}
                  </span>
                )}
              </button>
              {alertsOpen && (
                <div
                  className={styles.alertsPanel}
                  id="alerts-panel"
                  role="region"
                  aria-label="Alertas y notificaciones"
                >
                  <div className={styles.alertsPanelHeader}>
                    <strong>Alertas y notificaciones</strong>
                    <span>{totalAlerts} pendientes</span>
                  </div>
                  <section className={styles.alertsSection}>
                    <h2 className={styles.alertsSectionHeading}>
                      Alertas operativas
                      <span>{groupedAlerts.length}</span>
                    </h2>
                    {alertsQuery.isError ? (
                      <div className={styles.alertsMessage} role="alert">
                        <span>No se pudieron cargar las alertas.</span>
                        <button
                          type="button"
                          onClick={() => void alertsQuery.refetch()}
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : alertsQuery.isPending ? (
                      <p className={styles.alertsMessage}>Cargando alertas...</p>
                    ) : groupedAlerts.length === 0 ? (
                      <p className={styles.alertsMessage}>
                        No hay alertas operativas pendientes.
                      </p>
                    ) : (
                      <ul className={styles.alertsList}>
                        {groupedAlerts.map((group) => {
                          const mainAlert = group.alerts[0];
                          const additionalAlerts = group.alerts.length - 1;

                          return (
                            <li key={group.operationId}>
                              <button
                                type="button"
                                className={styles.alertItem}
                                onClick={() => {
                                  setSelectedOperation(group);
                                  setAlertsOpen(false);
                                }}
                              >
                                {mainAlert.type === 'NO_MOVEMENT' ? (
                                  <Clock3
                                    size={17}
                                    className={styles.alertIcon}
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <AlertTriangle
                                    size={17}
                                    className={styles.alertIcon}
                                    aria-hidden="true"
                                  />
                                )}
                                <span className={styles.alertContent}>
                                  <strong>{group.operationLabel}</strong>
                                  <span>
                                    {group.alerts.length === 1
                                      ? mainAlert.title
                                      : `${group.alerts.length} alertas operativas`}
                                    {additionalAlerts > 0 && (
                                      <span className={styles.additionalAlertsBadge}>
                                        +{additionalAlerts}
                                      </span>
                                    )}
                                  </span>
                                  <span>{mainAlert.message}</span>
                                  <time dateTime={mainAlert.occurredAt}>
                                    {new Intl.DateTimeFormat('es-CO', {
                                      dateStyle: 'short',
                                      timeStyle: 'short',
                                    }).format(new Date(mainAlert.occurredAt))}
                                  </time>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <Link
                      href="/operations"
                      className={styles.alertsFooter}
                      onClick={() => setAlertsOpen(false)}
                    >
                      Ver operaciones
                    </Link>
                  </section>

                  <section className={styles.alertsSection}>
                    <h2 className={styles.alertsSectionHeading}>
                      Notificaciones
                      <span>{unreadNotifications} sin leer</span>
                    </h2>
                    {notificationsQuery.isError ? (
                      <div className={styles.alertsMessage} role="alert">
                        <span>No se pudieron cargar las notificaciones.</span>
                        <button
                          type="button"
                          onClick={() => void notificationsQuery.refetch()}
                        >
                          Reintentar
                        </button>
                      </div>
                    ) : notificationsQuery.isPending ? (
                      <p className={styles.alertsMessage}>
                        Cargando notificaciones...
                      </p>
                    ) : notificationsQuery.data.notifications.length === 0 ? (
                      <p className={styles.alertsMessage}>
                        No tienes notificaciones.
                      </p>
                    ) : (
                      <ul className={styles.alertsList}>
                        {notificationsQuery.data.notifications.map((notification) => (
                          <li key={notification.id}>
                            <div
                              className={`${styles.notificationItem} ${
                                notification.isRead ? '' : styles.notificationUnread
                              }`}
                            >
                              <strong>{notification.title}</strong>
                              <span>{notification.message}</span>
                              <time dateTime={notification.createdAt}>
                                {new Intl.DateTimeFormat('es-CO', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                }).format(new Date(notification.createdAt))}
                              </time>
                            </div>
                            {notification.title ===
                              'Falló el envío del código de acceso' && (
                              <Link
                                href="/fleet"
                                className={styles.alertsFooter}
                                onClick={() => {
                                  setAlertsOpen(false);
                                  if (!notification.isRead) {
                                    void markNotificationAsRead(notification.id);
                                  }
                                }}
                              >
                                Ir a Flota y gestionar el acceso
                              </Link>
                            )}
                            {!notification.isRead && (
                              <button
                                type="button"
                                className={styles.notificationReadButton}
                                onClick={() =>
                                  void markNotificationAsRead(notification.id)
                                }
                              >
                                Marcar como leída
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {unreadNotifications > 0 && (
                      <button
                        type="button"
                        className={styles.alertsFooter}
                        onClick={() => void markAllNotificationsAsRead()}
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </section>
                </div>
              )}
            </div>
          )}

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
            const hasActiveChild = tabs.some(
              (item) =>
                item.path !== tab.path &&
                item.path.startsWith(`${tab.path}/`) &&
                pathname.startsWith(item.path),
            );
            const isActive =
              pathname === tab.path ||
              (tab.path !== '/dashboard' &&
                pathname.startsWith(tab.path) &&
                !hasActiveChild);
            return (
              <Link 
                key={tab.path} 
                href={tab.path} 
                className={`${styles.tabItem} ${isActive ? styles.tabActive : ''}`}
                aria-label={
                  tab.path === '/programacion' && pendingCount > 0
                    ? `${tab.label}: ${pendingCount} operaciones requieren acción`
                    : undefined
                }
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.path === '/programacion' && pendingCount > 0 && (
                  <span className={styles.tabBadge} aria-hidden="true">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <SuperModal
        isOpen={selectedOperation !== null}
        onClose={() => setSelectedOperation(null)}
        title={
          selectedOperation
            ? `Alertas de ${selectedOperation.operationLabel}`
            : undefined
        }
        width="620px"
      >
        {selectedOperation && (
          <section className={styles.operationAlertDetails}>
            <div className={styles.operationAlertSummary}>
              <span>
                Estado de la operación: <strong>{selectedOperation.operationStatus}</strong>
              </span>
              <span>
                Estado del contenedor: <strong>{selectedOperation.containerStatus}</strong>
              </span>
              {(userRole === 'ADMIN' || userRole === 'JEFE_DE_FLOTA') && (
                <span>
                  Analista responsable:{' '}
                  <strong>{selectedOperation.analystName || 'Sin asignar'}</strong>
                </span>
              )}
              <span>
                Conductor responsable:{' '}
                <strong>{selectedOperation.driverName || 'Sin asignar'}</strong>
              </span>
              <span>
                {selectedOperation.alerts.length}{' '}
                {selectedOperation.alerts.length === 1
                  ? 'alerta pendiente'
                  : 'alertas pendientes'}
              </span>
            </div>

            <ul className={styles.operationAlertList}>
              {selectedOperation.alerts.map((alert) => (
                <li className={styles.operationAlertDetail} key={alert.id}>
                  <div className={styles.operationAlertDetailHeading}>
                    {alert.type === 'NO_MOVEMENT' ? (
                      <Clock3 size={17} aria-hidden="true" />
                    ) : (
                      <AlertTriangle size={17} aria-hidden="true" />
                    )}
                    <strong>{alert.title}</strong>
                    <span
                      className={
                        alert.severity === 'HIGH'
                          ? styles.highSeverity
                          : styles.mediumSeverity
                      }
                    >
                      {alert.severity === 'HIGH' ? 'Alta' : 'Media'}
                    </span>
                  </div>
                  <p>{alert.message}</p>
                  <time dateTime={alert.occurredAt}>
                    {new Intl.DateTimeFormat('es-CO', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(alert.occurredAt))}
                  </time>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={styles.closeAlertModal}
              onClick={() => setSelectedOperation(null)}
            >
              <X size={16} aria-hidden="true" />
              Cerrar
            </button>
          </section>
        )}
      </SuperModal>

    </header>
  );
};