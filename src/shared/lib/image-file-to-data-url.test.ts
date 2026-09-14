import { imageFileToDataUrl } from "./image-file-to-data-url";

/**
 * jsdom does not implement real image decoding or canvas rendering, so this
 * suite replaces FileReader / Image / canvas with controllable fakes and
 * drives their callbacks manually to exercise the resize + sanitize logic.
 */

let imageShouldError = false;
let imageDimensions = { width: 200, height: 100 };

class FakeFileReader {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL(_file: File) {
    this.result = "data:image/png;base64,input";
    // Simulate the async nature of FileReader.
    queueMicrotask(() => this.onload?.());
  }
}

class FakeFileReaderError {
  result: string | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL(_file: File) {
    queueMicrotask(() => this.onerror?.());
  }
}

function installFakeImage() {
  (global as unknown as { Image: unknown }).Image = class {
    width = imageDimensions.width;
    height = imageDimensions.height;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    private _src = "";

    get src() {
      return this._src;
    }

    set src(value: string) {
      this._src = value;
      queueMicrotask(() => {
        if (imageShouldError) {
          this.onerror?.();
        } else {
          this.onload?.();
        }
      });
    }
  };
}

function installFakeCanvas(result = "data:image/jpeg;base64,output") {
  const fillRect = jest.fn();
  const drawImage = jest.fn();
  const getContext = jest.fn().mockReturnValue({
    fillStyle: "",
    fillRect,
    drawImage,
  });
  const toDataURL = jest.fn().mockReturnValue(result);

  HTMLCanvasElement.prototype.getContext =
    getContext as unknown as typeof HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.toDataURL = toDataURL;

  return { fillRect, drawImage, getContext, toDataURL };
}

function makeFile(type = "image/png") {
  return new File(["fake"], "image.png", { type });
}

describe("imageFileToDataUrl", () => {
  beforeEach(() => {
    imageShouldError = false;
    imageDimensions = { width: 200, height: 100 };
    installFakeImage();
    installFakeCanvas();
    (global as unknown as { FileReader: unknown }).FileReader = FakeFileReader;
  });

  it("rejects a non-image file", async () => {
    await expect(imageFileToDataUrl(makeFile("text/plain"))).rejects.toThrow(
      "請選擇圖片檔案",
    );
  });

  it("rejects SVG", async () => {
    await expect(imageFileToDataUrl(makeFile("image/svg+xml"))).rejects.toThrow(
      "不支援 SVG",
    );
  });

  it("returns compressed JPEG data URL", async () => {
    const result = await imageFileToDataUrl(makeFile());
    expect(result).toBe("data:image/jpeg;base64,output");
  });

  it("keeps original dimensions when image is already small enough", async () => {
    imageDimensions = { width: 500, height: 400 };
    const { drawImage } = installFakeCanvas();
    await imageFileToDataUrl(makeFile());
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 500, 400);
  });

  it("downscales while preserving aspect ratio", async () => {
    imageDimensions = { width: 2000, height: 1000 };
    const { drawImage } = installFakeCanvas();
    await imageFileToDataUrl(makeFile());
    // MAX_DIMENSION is 1000, so a 2000x1000 image should scale to 1000x500.
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1000, 500);
  });

  it("never produces a zero-size canvas for extreme aspect ratio", async () => {
    imageDimensions = { width: 10000, height: 1 };
    const { drawImage } = installFakeCanvas();
    await imageFileToDataUrl(makeFile());
    const [, , , width, height] = drawImage.mock.calls[0] as [
      unknown,
      number,
      number,
      number,
      number,
    ];
    expect(width).toBeGreaterThanOrEqual(1);
    expect(height).toBeGreaterThanOrEqual(1);
  });

  it("fills the output background before drawing the image", async () => {
    const { fillRect } = installFakeCanvas();
    await imageFileToDataUrl(makeFile());
    expect(fillRect).toHaveBeenCalledWith(0, 0, 200, 100);
  });

  it("exports JPEG using the configured quality", async () => {
    const { toDataURL } = installFakeCanvas();
    await imageFileToDataUrl(makeFile());
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.82);
  });

  it("rejects when image loading fails", async () => {
    imageShouldError = true;
    await expect(imageFileToDataUrl(makeFile())).rejects.toThrow(
      "無法解析這個圖片檔案",
    );
  });

  it("rejects zero width or height", async () => {
    imageDimensions = { width: 0, height: 100 };
    await expect(imageFileToDataUrl(makeFile())).rejects.toThrow(
      "無法取得圖片尺寸",
    );
  });

  it("rejects when FileReader fails", async () => {
    (global as unknown as { FileReader: unknown }).FileReader =
      FakeFileReaderError;
    await expect(imageFileToDataUrl(makeFile())).rejects.toThrow(
      "讀取圖片失敗，請再試一次",
    );
  });

  it("rejects when canvas context is unavailable", async () => {
    HTMLCanvasElement.prototype.getContext = jest
      .fn()
      .mockReturnValue(
        null,
      ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    await expect(imageFileToDataUrl(makeFile())).rejects.toThrow(
      "瀏覽器不支援圖片壓縮",
    );
  });
});
