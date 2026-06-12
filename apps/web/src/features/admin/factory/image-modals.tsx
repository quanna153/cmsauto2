import { useState, useEffect } from "react";
import { X, Wand2, Loader2, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getJson, postJson, publicApiUrl } from "@/lib/api";
import type { GeneratedArticleImage, ArticleImageKind } from "@/features/admin/types";

type ImageLibraryItem = {
  id: string;
  createdAt: string;
  provider: string;
  prompt: string;
  url: string;
  metadataJson: string;
};

export function ImagePickerModal({
  isOpen,
  onClose,
  onPick,
  kind
}: {
  isOpen: boolean;
  onClose: () => void;
  onPick: (img: GeneratedArticleImage) => void;
  kind: ArticleImageKind;
}) {
  const [images, setImages] = useState<ImageLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      setUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Data = event.target?.result as string;
        try {
          const newItem = await postJson<ImageLibraryItem>("/admin/images/generate", {
            provider: "upload",
            prompt: file.name,
            base64Data,
            filename: file.name
          });
          
          const md = JSON.parse(newItem.metadataJson || "{}");
          onPick({
            id: newItem.id,
            kind,
            provider: "upload",
            model: md.model || "unknown",
            status: "generated",
            prompt: newItem.prompt,
            url: publicApiUrl(newItem.url),
            aspectRatio: "16:9",
            altText: file.name,
            createdAt: newItem.createdAt
          });
          onClose();
        } catch (error) {
          console.error("Upload failed:", error);
          alert("Lỗi khi tải ảnh lên");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getJson<ImageLibraryItem[]>("/admin/images")
        .then((data) => setImages(Array.isArray(data) ? data : []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex h-[80vh] w-full max-w-4xl flex-col rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="text-lg font-semibold">Chọn ảnh từ thư viện</h3>
          <div className="flex items-center gap-2">
            <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleUpload} />
            <Button onClick={() => fileInputRef.current?.click()} size="sm" variant="secondary" disabled={uploading}>
              {uploading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Upload size={16} className="mr-2" />}
              Tải lên
            </Button>
            <Button onClick={onClose} size="sm" variant="ghost" disabled={uploading}><X size={16} /></Button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center text-[#687386]"><Loader2 className="mr-2 animate-spin" /> Đang tải...</div>
          ) : images.length === 0 ? (
            <div className="flex h-full items-center justify-center text-[#687386]">Không có ảnh nào trong thư viện.</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {images.map((img) => (
                <button
                  key={img.id}
                  className="group relative flex aspect-square cursor-pointer flex-col overflow-hidden rounded-lg border bg-gray-50 text-left transition hover:border-[#d6bc61]"
                  onClick={() => {
                    const md = JSON.parse(img.metadataJson || "{}");
                    onPick({
                      id: img.id,
                      kind,
                      provider: img.provider,
                      model: md.model || "unknown",
                      status: "generated",
                      prompt: img.prompt,
                      url: publicApiUrl(img.url),
                      aspectRatio: "16:9", // Default, actually should derive from dimensions if possible
                      altText: img.prompt.slice(0, 50),
                      createdAt: img.createdAt
                    });
                    onClose();
                  }}
                >
                  <img src={publicApiUrl(img.url)} alt={img.prompt} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="line-clamp-4 text-xs text-white">{img.prompt}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ImageGeneratorModal({
  isOpen,
  onClose,
  onGenerate,
  kind,
  initialPrompt
}: {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (img: GeneratedArticleImage) => void;
  kind: ArticleImageKind;
  initialPrompt?: string;
}) {
  const [provider, setProvider] = useState("modelslab");
  const [prompt, setPrompt] = useState(initialPrompt ?? "");
  const [sizePreset, setSizePreset] = useState("1200x630");
  const [width, setWidth] = useState("1200");
  const [height, setHeight] = useState("630");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (kind === "hero") {
      setSizePreset("1200x630");
      setWidth("1200");
      setHeight("630");
    } else {
      setSizePreset("900x600");
      setWidth("900");
      setHeight("600");
    }
  }, [kind, isOpen]);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setError("");
    try {
      const newItem = await postJson<ImageLibraryItem>("/admin/images/generate", {
        provider,
        prompt,
        negativePrompt: "",
        width: parseInt(width, 10) || 1024,
        height: parseInt(height, 10) || 1024,
        filename: ""
      });
      const md = JSON.parse(newItem.metadataJson || "{}");
      onGenerate({
        id: newItem.id,
        kind,
        provider: newItem.provider,
        model: md.model || "unknown",
        status: "generated",
        prompt: newItem.prompt,
        url: publicApiUrl(newItem.url),
        aspectRatio: "16:9",
        altText: newItem.prompt.slice(0, 50),
        createdAt: newItem.createdAt
      });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between border-b pb-3">
          <h3 className="text-lg font-semibold">Tạo {kind === "hero" ? "ảnh bìa" : "ảnh trong bài"} mới</h3>
          <Button onClick={onClose} size="sm" variant="ghost" disabled={busy}><X size={16} /></Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Prompt</label>
            <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} disabled={busy} placeholder="Mô tả ảnh cần tạo..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Công cụ AI</label>
              <select 
                className="w-full rounded-md border p-2 text-sm"
                value={provider}
                onChange={(e) => {
                  const newProvider = e.target.value;
                  setProvider(newProvider);
                  if (newProvider === "magiceraser") {
                    const magicSizes = ["1024x1024", "1280x720", "720x1280", "1280x960", "960x1280", "1920x1080", "1080x1920"];
                    if (!magicSizes.includes(sizePreset)) {
                      setSizePreset("1024x1024");
                      setWidth("1024");
                      setHeight("1024");
                    }
                  } else if (newProvider === "cloud_run") {
                    setSizePreset("1024x1024");
                    setWidth("1024");
                    setHeight("1024");
                  } else if (sizePreset && !["1200x630", "1024x1024", "900x600", "800x800", "600x900", "custom"].includes(sizePreset)) {
                    setSizePreset("900x600");
                    setWidth("900");
                    setHeight("600");
                  }
                }}
                disabled={busy}
              >
                <option value="modelslab">ModelsLab</option>
                <option value="cloud_run">Cloud Run V2</option>
                <option value="magiceraser">MagicEraser (Flux)</option>
                <option value="imagen-4-generate">Gemini Imagen 4 Generate</option>
                <option value="imagen-4-ultra">Gemini Imagen 4 Ultra</option>
                <option value="imagen-4-fast">Gemini Imagen 4 Fast</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Kích thước</label>
              <select 
                className="w-full rounded-md border p-2 text-sm"
                value={sizePreset}
                onChange={(e) => {
                  const val = e.target.value;
                  setSizePreset(val);
                  if (val !== "custom") {
                    const [w, h] = val.split("x");
                    setWidth(w);
                    setHeight(h);
                  }
                }}
                disabled={busy || provider === "cloud_run"}
              >
                {provider === "cloud_run" ? (
                  <option value="1024x1024">1024x1024 (Mặc định bắt buộc)</option>
                ) : provider === "magiceraser" ? (
                  <>
                    <option value="1024x1024">1024x1024 (Ảnh vuông)</option>
                    <option value="1280x720">1280x720 (Ngang HD)</option>
                    <option value="720x1280">720x1280 (Dọc HD)</option>
                    <option value="1280x960">1280x960 (Ngang)</option>
                    <option value="960x1280">960x1280 (Dọc)</option>
                    <option value="1920x1080">1920x1080 (Ngang Full HD)</option>
                    <option value="1080x1920">1080x1920 (Dọc Full HD)</option>
                  </>
                ) : (
                  <>
                    <option value="900x600">900x600 (Ảnh ngang trong bài)</option>
                    <option value="1200x630">1200x630 (Ảnh bìa bài viết, chuẩn SEO)</option>
                    <option value="1024x1024">1024x1024 (Ảnh vuông)</option>
                    <option value="800x800">800x800 (Ảnh vuông nhỏ)</option>
                    <option value="600x900">600x900 (Ảnh dọc)</option>
                    <option value="custom">Tùy chỉnh...</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {sizePreset === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium">Rộng (px)</label>
                <Input type="number" value={width} onChange={(e) => setWidth(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Cao (px)</label>
                <Input type="number" value={height} onChange={(e) => setHeight(e.target.value)} disabled={busy} />
              </div>
            </div>
          )}

          {error && <div className="rounded bg-red-50 p-2 text-sm text-red-600">{error}</div>}

          <div className="mt-4 flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={onClose} disabled={busy}>Hủy</Button>
            <Button onClick={handleSubmit} disabled={busy || !prompt.trim()}>
              {busy ? <><Loader2 size={16} className="mr-2 animate-spin" />Đang tạo...</> : <><Wand2 size={16} className="mr-2" />Tạo ảnh</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
