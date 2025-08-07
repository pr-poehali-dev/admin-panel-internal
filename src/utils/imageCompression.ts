export async function compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        const maxDimension = 1920; // Maximum width or height
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // If compressed image is still too large, reduce quality
            if (blob.size > maxSizeMB * 1024 * 1024) {
              canvas.toBlob(
                (smallerBlob) => {
                  if (!smallerBlob) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  
                  const compressedFile = new File(
                    [smallerBlob], 
                    file.name, 
                    { type: 'image/jpeg' }
                  );
                  resolve(compressedFile);
                },
                'image/jpeg',
                0.7 // Lower quality for smaller size
              );
            } else {
              const compressedFile = new File(
                [blob], 
                file.name, 
                { type: blob.type }
              );
              resolve(compressedFile);
            }
          },
          file.type === 'image/png' ? 'image/png' : 'image/jpeg',
          0.85 // 85% quality
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}