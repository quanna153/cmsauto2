import { Metadata } from "next";
import { ImageLibraryFeature } from "@/features/admin/image-library";

export const metadata: Metadata = {
  title: "Kho ảnh | CMS Auto"
};

export default function ImageLibraryPage() {
  return <ImageLibraryFeature />;
}
