/**
 * Utilidad de compresión y redimensionamiento de imágenes en cliente para agilizar
 * la subida de evidencias, evitar timeouts (ECONNABORTED) y sortear límites de tamaño en red móvil.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1920,
  quality = 0.82,
): Promise<File> {
  // Solo procesar archivos de tipo imagen
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Si la imagen ya es pequeña (< 400KB), no es necesario recomprimir
  if (file.size < 400 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Si la compresión no redujo el peso, devolver el original
              resolve(file);
              return;
            }

            const cleanFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
            const compressedFile = new File([blob], cleanFileName, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          'image/jpeg',
          quality,
        );
      };

      img.onerror = () => {
        // En caso de error al decodificar la imagen, fallback al archivo original
        resolve(file);
      };

      if (typeof readerEvent.target?.result === 'string') {
        img.src = readerEvent.target.result;
      } else {
        resolve(file);
      }
    };

    reader.onerror = () => {
      resolve(file);
    };

    reader.readAsDataURL(file);
  });
}

export async function compressFiles(
  files: File[],
  maxDimension = 1920,
  quality = 0.82,
): Promise<File[]> {
  return Promise.all(
    files.map((file) => compressImageFile(file, maxDimension, quality)),
  );
}

