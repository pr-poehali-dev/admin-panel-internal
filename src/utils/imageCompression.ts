export async function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.9): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Cannot get canvas context'));
          return;
        }
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        // Scale down if needed
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to PNG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            
            // Create new file with PNG format
            const newFileName = file.name.replace(/\.(jpg|jpeg|JPG|JPEG|webp|WEBP|gif|GIF)$/i, '.png');
            const compressedFile = new File(
              [blob], 
              newFileName, 
              { type: 'image/png', lastModified: Date.now() }
            );
            
            // Only use compressed if it's smaller
            if (compressedFile.size < file.size) {
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/png'
        );
      };
      
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

export async function processImages(files: File[]): Promise<File[]> {
  const MAX_SIZE_MB = 1; // 1MB threshold for compression
  const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
  
  const processedFiles = await Promise.all(
    files.map(async (file) => {
      // Skip if not an image
      if (!file.type.startsWith('image/')) {
        return file;
      }
      
      // Skip if already small enough
      if (file.size <= MAX_SIZE_BYTES) {
        return file;
      }
      
      try {
        console.log(`Compressing ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        const compressed = await compressImage(file);
        console.log(`Compressed to: ${(compressed.size / 1024 / 1024).toFixed(2)}MB`);
        return compressed;
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        return file; // Return original if compression fails
      }
    })
  );
  
  return processedFiles;
}