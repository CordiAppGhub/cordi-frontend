This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Aplicación PWA

En producción, ejecuta `pnpm build` y luego `pnpm start`. El build usa Webpack
para que `next-pwa` genere el service worker y los recursos de caché; estos
archivos se regeneran y no se editan manualmente. La aplicación debe servirse
por HTTPS (excepto en localhost).

El botón **Instalar Cordibot** solicita primero el perfil de uso:

- **Conductor** abre el portal `/driver`.
- **Jefe de flota**, **Analista** y **Administrador** abren el acceso
  administrativo y, después de iniciar sesión, el panel `/dashboard`.

La selección solo determina la ruta de inicio; los permisos siguen dependiendo
del rol autenticado. En navegadores que no muestran el diálogo de instalación,
la preferencia queda guardada y se muestran las instrucciones para agregar la
aplicación desde el menú del navegador.
