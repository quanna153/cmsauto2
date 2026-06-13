"use client";

import { useEffect, useState } from "react";
import { Copy, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Textarea } from "@/components/ui/textarea";
import { deleteJson, getJson, postJson, publicApiUrl } from "@/lib/api";

type ImageLibraryItem = {
  id: string;
  createdAt: string;
  provider: string;
  prompt: string;
  url: string;
  metadataJson: string;
};

export function ImageLibraryFeature() {
  const [images, setImages] = useState<ImageLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [provider, setProvider] = useState("modelslab");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [sizePreset, setSizePreset] = useState("900x600");
  const [width, setWidth] = useState("900");
  const [height, setHeight] = useState("600");
  const [filename, setFilename] = useState("");
  const [previewImage, setPreviewImage] = useState<ImageLibraryItem | null>(null);
  const [error, setError] = useState("");

  const fetchImages = async () => {
    try {
      const data = await getJson<ImageLibraryItem[]>("/admin/images");
      if (Array.isArray(data)) {
        setImages(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");

    try {
      const newItem = await postJson<ImageLibraryItem>("/admin/images/generate", {
        provider,
        prompt,
        negativePrompt,
        width: Number(width),
        height: Number(height),
        filename
      });

      setPrompt("");
      setNegativePrompt("");
      setFilename("");
      setPreviewImage(newItem);
      setImages(prev => [newItem, ...prev]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa ảnh này?")) return;
    
    try {
      await deleteJson(`/admin/images/${id}`);
      setImages((prev) => prev.filter((img) => img.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6">
      <PageHeader
        eyebrow="Quản lý Media"
        title="Kho ảnh"
        description="Tạo ảnh bằng AI và quản lý thư viện hình ảnh của bạn."
      />

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-[#172033]">Tạo ảnh mới</h2>
          
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4b5563]">Công cụ AI (Provider)</label>
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
              <label className="mb-1 block text-sm font-medium text-[#4b5563]">Câu lệnh (Prompt)</label>
              <Textarea
                rows={3}
                placeholder="A futuristic cyberpunk city at night..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4b5563]">Loại trừ (Negative Prompt)</label>
              <Input
                placeholder="bad quality, blurry, distorted..."
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4b5563]">Tên file SEO (tùy chọn)</label>
              <Input
                placeholder="vidu: cach-lam-banh-trang"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4b5563]">Kích thước ảnh</label>
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
                disabled={provider === "cloud_run"}
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

            {sizePreset === "custom" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4b5563]">Chiều rộng (px)</label>
                  <Input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#4b5563]">Chiều cao (px)</label>
                  <Input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
              </div>
            )}

            {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

            <Button 
              className="w-full" 
              onClick={handleGenerate} 
              disabled={generating || !prompt.trim()}
            >
              {generating ? <><Loader2 className="mr-2 animate-spin" size={16} /> Đang tạo ảnh...</> : "Tạo ảnh ngay"}
            </Button>
          </div>
        </div>

        <div className="rounded-xl border bg-[#f8f9fa] p-5 shadow-sm flex flex-col justify-center items-center text-center overflow-hidden">
          {previewImage ? (
            <div className="w-full h-full flex flex-col items-center">
              <img src={previewImage.url.startsWith('http') ? previewImage.url : publicApiUrl(previewImage.url)} alt="Preview" className="max-h-[300px] object-contain rounded-md shadow-sm mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">{previewImage.url.split('/').pop()}</p>
              <div className="flex gap-2 mt-2">
                <Button variant="secondary" size="sm" onClick={() => copyToClipboard(previewImage.url.startsWith('http') ? previewImage.url : publicApiUrl(previewImage.url))}>
                  <Copy size={14} className="mr-1" /> Copy Link
                </Button>
              </div>
            </div>
          ) : (
            <>
              <ImageIcon className="mb-3 text-[#cbd5e1]" size={48} />
              <h3 className="text-lg font-medium text-[#4b5563]">Khu vực Preview</h3>
              <p className="text-sm text-[#94a3b8] mt-2 max-w-sm">Ảnh sau khi được AI tạo xong sẽ xuất hiện ở đây.</p>
            </>
          )}
        </div>
      </div>

      <h2 className="mb-4 text-xl font-bold text-[#172033]">Thư viện của bạn</h2>
      
      {loading ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin text-[#cbd5e1]" /></div>
      ) : images.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-[#94a3b8]">
          Chưa có ảnh nào trong kho.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md">
              <div className="aspect-square bg-gray-100">
                <img src={img.url.startsWith('http') ? img.url : publicApiUrl(img.url)} alt={img.prompt} className="h-full w-full object-cover" />
              </div>
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/80 p-3 text-white transition-transform group-hover:translate-y-0">
                <p className="line-clamp-2 text-xs" title={img.prompt}>{img.prompt}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => copyToClipboard(img.url.startsWith('http') ? img.url : publicApiUrl(img.url))} className="flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-[10px] hover:bg-white/30">
                    <Copy size={12} /> Copy URL
                  </button>
                  <button onClick={() => handleDelete(img.id)} className="flex items-center gap-1 rounded bg-red-500/80 px-2 py-1 text-[10px] hover:bg-red-500">
                    <Trash2 size={12} /> Xóa
                  </button>
                </div>
              </div>
              <div className="absolute left-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                {img.provider}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
