'use client';

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from 'react';
import { Download, X } from 'lucide-react';
import styles from './pwa-install-prompt.module.css';

type InstallRole = 'DRIVER' | 'JEFE_DE_FLOTA' | 'ANALISTA' | 'ADMIN';
type AdministrativeRole = Exclude<InstallRole, 'DRIVER'>;

const administrativeRoles: { value: AdministrativeRole; label: string }[] = [
  { value: 'JEFE_DE_FLOTA', label: 'Jefe de flota' },
  { value: 'ANALISTA', label: 'Analista' },
  { value: 'ADMIN', label: 'Administrador' },
];

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

function subscribeToStandalone(callback: () => void) {
  const mediaQuery = window.matchMedia('(display-mode: standalone)');
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
}

function getStandaloneSnapshot() {
  return window.matchMedia('(display-mode: standalone)').matches;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const isStandalone = useSyncExternalStore(
    subscribeToStandalone,
    getStandaloneSnapshot,
    () => false,
  );
  const [appInstalled, setAppInstalled] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InstallRole | null>(null);
  const [showManualInstructions, setShowManualInstructions] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const isInstalled = isStandalone || appInstalled;

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => {
      setAppInstalled(true);
      setIsDialogOpen(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedRole) return;

    const secureCookie =
      window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `cordibot_pwa_entry=${selectedRole}; Path=/; Max-Age=31536000; SameSite=Lax${secureCookie}`;

    if (!installPrompt) {
      setShowManualInstructions(true);
      return;
    }

    const prompt = installPrompt;
    setInstallPrompt(null);
    setInstallError(null);

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') setAppInstalled(true);
      setIsDialogOpen(false);
    } catch (error: unknown) {
      console.error('No se pudo abrir la instalación de Corditrans TMS.', error);
      setInstallError(
        'No fue posible abrir la instalación. Intenta instalar Corditrans TMS desde el menú de tu navegador.',
      );
    }
  };

  if (isInstalled) return null;

  return (
    <>
      {/* <button
        className={styles.installButton}
        type="button"
        onClick={() => {
          setShowManualInstructions(false);
          setInstallError(null);
          setIsDialogOpen(true);
        }}
      >
        <Download aria-hidden="true" size={18} />
        Instalar Corditrans TMS
      </button> */}

      {isDialogOpen && (
        <div
          className={styles.backdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsDialogOpen(false);
          }}
        >
          <section
            aria-labelledby="pwa-install-title"
            aria-modal="true"
            className={styles.dialog}
            role="dialog"
          >
            <button
              aria-label="Cerrar"
              className={styles.closeButton}
              onClick={() => setIsDialogOpen(false)}
              type="button"
            >
              <X aria-hidden="true" size={20} />
            </button>

            {showManualInstructions ? (
              <>
                <h2 id="pwa-install-title">Preferencia guardada</h2>
                <p>
                  Para terminar, abre el menú de tu navegador y selecciona
                  “Instalar aplicación” o “Agregar a pantalla de inicio”.
                  Corditrans TMS abrirá el portal correspondiente a tu perfil.
                </p>
                <button
                  className={styles.primaryButton}
                  onClick={() => setIsDialogOpen(false)}
                  type="button"
                >
                  Entendido
                </button>
              </>
            ) : (
              <>
                <h2 id="pwa-install-title">¿Quién usará esta aplicación?</h2>
                <p>
                  Selecciona el perfil para que Corditrans TMS abra el portal adecuado
                  al iniciar.
                </p>

                <form onSubmit={handleInstall}>
                  <fieldset className={styles.roleOptions}>
                    <legend>Conductor</legend>
                    <label className={styles.roleOption}>
                      <input
                        checked={selectedRole === 'DRIVER'}
                        name="pwa-role"
                        onChange={() => setSelectedRole('DRIVER')}
                        type="radio"
                        value="DRIVER"
                      />
                      <span>Portal del conductor</span>
                    </label>
                  </fieldset>

                  <fieldset className={styles.roleOptions}>
                    <legend>Administrativo</legend>
                    {administrativeRoles.map(({ value, label }) => (
                      <label className={styles.roleOption} key={value}>
                        <input
                          checked={selectedRole === value}
                          name="pwa-role"
                          onChange={() => setSelectedRole(value)}
                          type="radio"
                          value={value}
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </fieldset>

                  {installError && (
                    <p className={styles.errorMessage} role="alert">
                      {installError}
                    </p>
                  )}

                  <div className={styles.actions}>
                    <button
                      className={styles.secondaryButton}
                      onClick={() => setIsDialogOpen(false)}
                      type="button"
                    >
                      Cancelar
                    </button>
                    <button
                      className={styles.primaryButton}
                      disabled={!selectedRole}
                      type="submit"
                    >
                      Continuar e instalar
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
