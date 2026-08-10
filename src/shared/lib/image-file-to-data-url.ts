const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.82;

export function imageFileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("請選擇圖片檔案"));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("讀取圖片失敗，請再試一次"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("無法解析這個圖片檔案"));
      img.onload = () => {
        const scale = Math.min(
          1,
          MAX_DIMENSION / Math.max(img.width, img.height),
        );
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("瀏覽器不支援圖片壓縮"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}