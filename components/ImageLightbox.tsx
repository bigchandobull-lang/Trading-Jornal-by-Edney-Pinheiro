import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download } from 'lucide-react';

interface ImageLightboxProps {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ isOpen, imageUrl, onClose }) => {
  const { t } = useTranslation();
  if (!isOpen || !imageUrl) {
    return null;
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent the lightbox from closing when the download button is clicked.
    if (!imageUrl) return;

    const link = document.createElement('a');
    link.href = imageUrl;

    // Extract file extension from MIME type, default to 'png'
    const mimeType = imageUrl.split(';')[0].split(':')[1];
    const fileExtension = mimeType ? mimeType.split('/')[1] : 'png';
    link.download = `trade-photo-${new Date().getTime()}.${fileExtension}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute top-4 right-4 flex items-center gap-4 z-[70]">
        <button
          onClick={handleDownload}
          className="text-white hover:text-brand-text-secondary transition-colors active:scale-95"
          aria-label={t('tooltips.downloadImage')}
        >
          <Download size={28} />
        </button>
        <button
          onClick={onClose}
          className="text-white hover:text-brand-text-secondary transition-colors active:scale-95"
          aria-label={t('tooltips.closeViewer')}
        >
          <X size={32} />
        </button>
      </div>


      <div
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking on the image itself
      >
        <img
          src={imageUrl}
          alt="Trade screenshot"
          className="block max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-soft-lg"
        />
      </div>
    </div>
  );
};

export default ImageLightbox;