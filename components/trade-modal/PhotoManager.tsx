
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, ImagePlus } from 'lucide-react';
import { fileToBase64 } from '../../utils/fileUtils';

const MAX_PHOTOS = 5;
const MAX_SIZE_MB = 3;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface PhotoManagerProps {
  photos: string[];
  onUpdate: (photos: string[]) => void;
  onImageClick: (url: string) => void;
  uploaderId: string;
}

const PhotoManager: React.FC<PhotoManagerProps> = ({ photos, onUpdate, onImageClick, uploaderId }) => {
    const { t } = useTranslation();
    const [error, setError] = useState<string | null>(null);
    const [toDeleteIndex, setToDeleteIndex] = useState<number | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setError(null);
        const files: File[] = Array.from(e.target.files || []);
        if (!files.length) return;
        if (photos.length + files.length > MAX_PHOTOS) {
            return setError(t('errors.maxPhotos'));
        }

        const oversized = files.filter(f => f.size > MAX_SIZE_BYTES);
        if (oversized.length > 0) {
            return setError(`Images must be < ${MAX_SIZE_MB}MB. Oversized: ${oversized.map(f => f.name).join(', ')}`);
        }

        try {
            const base64Photos = await Promise.all(files.map(fileToBase64));
            onUpdate([...photos, ...base64Photos]);
        } catch {
            setError(t('errors.photoProcess'));
        }
    };

    const confirmDelete = () => {
        if (toDeleteIndex !== null) {
            onUpdate(photos.filter((_, i) => i !== toDeleteIndex));
            setToDeleteIndex(null);
        }
    };
    
    return (
        <div className="relative">
            <label className="block text-sm font-medium text-brand-text-secondary mb-2">
                {t('common.photos')} ({photos.length}/{MAX_PHOTOS})
            </label>
            <div className="grid grid-cols-3 gap-2">
                {photos.map((photo, index) => (
                    <div key={index} className="relative group">
                        <button type="button" onClick={() => onImageClick(photo)} className="w-full h-24 block rounded-md overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/50">
                            <img src={photo} alt={`${t('common.photos')} ${index + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        </button>
                        <button
                            onClick={() => setToDeleteIndex(index)}
                            className="photo-delete-button absolute top-1 right-1 bg-black/50 hover:bg-brand-loss text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                            aria-label={`Delete photo ${index + 1}`}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {photos.length < MAX_PHOTOS && (
                     <label htmlFor={uploaderId} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-brand-border-soft rounded-md cursor-pointer hover:bg-brand-surface-light transition-colors">
                        <ImagePlus size={24} className="text-brand-text-secondary" />
                        <span className="text-xs text-brand-text-secondary mt-1">{t('tradeModal.addPhoto')}</span>
                        <input id={uploaderId} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
                    </label>
                )}
            </div>
            {error && <p className="text-xs text-brand-loss mt-2">{error}</p>}
            
            {/* Confirmation Modal for Deletion */}
            {toDeleteIndex !== null && (
                <div className="absolute inset-0 bg-brand-surface/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg p-4">
                    <div className="bg-brand-surface border border-brand-border rounded-xl shadow-soft-lg p-6 max-w-xs text-center animate-scale-in">
                        <h3 className="text-lg font-bold">{t('tradeModal.deletePhoto')}</h3>
                        <p className="text-brand-text-secondary my-3 text-sm">{t('tradeModal.deletePhotoMsg')}</p>
                        <div className="flex justify-center gap-4 mt-5">
                            <button onClick={() => setToDeleteIndex(null)} className="bg-brand-surface-light hover:bg-brand-border font-bold py-2 px-6 rounded-md">{t('actions.cancel')}</button>
                            <button onClick={confirmDelete} className="bg-brand-loss hover:bg-red-500 text-white font-bold py-2 px-6 rounded-md">{t('actions.delete')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(PhotoManager);
