import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Color Conversion Utilities ---
const hexToRgb = (hex: string) => {
    hex = hex.replace(/^#/, '');
    if (!/^(?:[0-9a-fA-F]{3}){1,2}$/.test(hex)) {
        return { r: 0, g: 0, b: 0 };
    }
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    const bigint = parseInt(hex, 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255,
    };
};

const rgbToHex = (r: number, g: number, b: number) => {
    return '#' + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1).toUpperCase();
};

const rgbToHsv = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, v = max;
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max !== min) {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h * 360, s: s * 100, v: v * 100 };
};

const hsvToRgb = (h: number, s: number, v: number) => {
    s /= 100; v /= 100;
    let r = 0, g = 0, b = 0;
    const i = Math.floor(h / 60);
    const f = h / 60 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
};
// --- End Color Utilities ---

interface DraggableProps {
    onDrag: (pos: { x: number; y: number }) => void;
    children: React.ReactNode;
}

const Draggable: React.FC<DraggableProps> = ({ onDrag, children }) => {
    const ref = useRef<HTMLDivElement>(null);

    const handleInteraction = useCallback((e: React.MouseEvent | React.TouchEvent) => {
        if (!ref.current) return;
        
        const move = (moveEvent: MouseEvent | TouchEvent) => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const clientX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const clientY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
            
            const x = (clientX - rect.left) / rect.width;
            const y = (clientY - rect.top) / rect.height;
            onDrag({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
        }

        const handleMouseMove = (moveEvent: MouseEvent) => move(moveEvent);
        const handleTouchMove = (moveEvent: TouchEvent) => {
            moveEvent.preventDefault();
            move(moveEvent);
        };

        const stopInteraction = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', stopInteraction);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', stopInteraction);
        };
        
        if (e.nativeEvent.type.startsWith('mouse')) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', stopInteraction);
        } else {
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', stopInteraction);
        }

        move('touches' in e.nativeEvent ? e.nativeEvent : e.nativeEvent as MouseEvent);
    }, [onDrag]);


    return <div ref={ref} onMouseDown={handleInteraction} onTouchStart={handleInteraction}>{children}</div>
}

interface ColorPickerProps {
  color: string;
  onChange: (newColor: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [hsv, setHsv] = useState({ h: 0, s: 0, v: 100 });
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        try {
            const { r, g, b } = hexToRgb(color);
            setHsv(rgbToHsv(r, g, b));
        } catch(e) { /* ignore invalid colors */ }
    }, [color]);

    const handleHsvChange = useCallback((newHsv: Partial<typeof hsv>) => {
        const updatedHsv = { ...hsv, ...newHsv };
        setHsv(updatedHsv);
        const { r, g, b } = hsvToRgb(updatedHsv.h, updatedHsv.s, updatedHsv.v);
        onChange(rgbToHex(r, g, b));
    }, [hsv, onChange]);

    const handleSaturationValueChange = useCallback((pos: { x: number; y: number }) => {
        handleHsvChange({ s: pos.x * 100, v: (1 - pos.y) * 100 });
    }, [handleHsvChange]);

    const handleHueChange = useCallback((pos: { x: number; y: number }) => {
        handleHsvChange({ h: pos.y * 360 });
    }, [handleHsvChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative" ref={pickerRef}>
            <button
                type="button"
                className="w-8 h-8 rounded-md border border-brand-border-soft shadow-inner"
                style={{ backgroundColor: color }}
                onClick={() => setIsOpen(p => !p)}
                aria-label="Open color picker"
            />
            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-60 bg-brand-surface border border-brand-border rounded-xl shadow-soft-lg z-30 p-3 animate-scale-in backdrop-blur-md">
                    <Draggable onDrag={handleSaturationValueChange}>
                        <div
                            className="relative w-full h-36 rounded-md cursor-pointer"
                            style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent rounded-md" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent rounded-md" />
                            <div
                                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-md pointer-events-none"
                                style={{
                                    left: `${hsv.s}%`,
                                    top: `${100 - hsv.v}%`,
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                    </Draggable>

                    <div className="flex gap-3 mt-3">
                        <Draggable onDrag={handleHueChange}>
                            <div
                                className="relative w-5 h-36 rounded-full cursor-pointer"
                                style={{ background: 'linear-gradient(to bottom, hsl(0,100%,50%), hsl(60,100%,50%), hsl(120,100%,50%), hsl(180,100%,50%), hsl(240,100%,50%), hsl(300,100%,50%), hsl(360,100%,50%))' }}
                            >
                                <div
                                    className="absolute w-7 h-1 -translate-y-1/2 -left-1 rounded-sm border-2 border-white shadow-md pointer-events-none bg-transparent"
                                    style={{ top: `${hsv.h / 3.6}%` }}
                                />
                            </div>
                        </Draggable>
                        <div className="flex-1 flex flex-col justify-end">
                             <input
                                type="text"
                                value={color.toUpperCase()}
                                onChange={e => onChange(e.target.value)}
                                className="w-full bg-brand-surface-light border border-brand-border-soft rounded-md px-2 py-1 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-accent/50 text-center"
                                maxLength={7}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(ColorPicker);