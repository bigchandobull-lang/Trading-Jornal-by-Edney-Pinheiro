import React, { useState, useEffect, useRef } from 'react';

declare global {
  interface Window { Quill: any; }
}

const QUILL_TOOLBAR_OPTIONS = [['bold', 'italic'], [{ 'list': 'ordered'}, { 'list': 'bullet' }]];
const MAX_NOTE_CHARS = 450;

/**
 * A custom hook to manage a Quill.js editor instance.
 * It handles initialization, content changes, and character counting.
 * @param editorRef A ref to the div element that will host the editor.
 * @param initialContent The initial HTML content for the editor.
 * @param onContentChange A callback function that fires when the user changes the content.
 * @param placeholder The placeholder text for the editor.
 * @returns The current character count of the editor's text.
 */
export const useQuillEditor = (
    editorRef: React.RefObject<HTMLDivElement>, 
    initialContent: string | undefined, 
    onContentChange: (html: string) => void, 
    placeholder: string
) => {
    const quillRef = useRef<any>(null);
    const [charCount, setCharCount] = useState(0);

    const onContentChangeRef = useRef(onContentChange);
    useEffect(() => {
        onContentChangeRef.current = onContentChange;
    }, [onContentChange]);

    useEffect(() => {
        if (!editorRef.current || quillRef.current || !window.Quill) {
            return;
        }

        const quill = new window.Quill(editorRef.current, { 
            modules: { toolbar: QUILL_TOOLBAR_OPTIONS }, 
            theme: 'snow', 
            placeholder 
        });
        quillRef.current = quill;

        const handleChange = (_: any, __: any, source: string) => {
            const text = quill.getText();
            let currentLength = text.length - 1; // Quill adds a newline at the end

            // Enforce character limit
            if (currentLength > MAX_NOTE_CHARS) {
                quill.deleteText(MAX_NOTE_CHARS, currentLength - MAX_NOTE_CHARS);
                currentLength = MAX_NOTE_CHARS;
            }
            setCharCount(currentLength);

            // Propagate change if it's from the user
            if (source === 'user') {
                const html = quill.root.innerHTML;
                // Treat an empty editor as an empty string
                onContentChangeRef.current(html === '<p><br></p>' ? '' : html);
            }
        };

        quill.on('text-change', handleChange);
        
        // Set initial content if provided
        if (initialContent) {
            quill.root.innerHTML = initialContent;
        }

        return () => {
            quill.off('text-change', handleChange);
        };
    }, [placeholder, editorRef]);
    
    // Effect to programmatically update content from props
    useEffect(() => {
        const quill = quillRef.current;
        if (quill && !quill.hasFocus()) {
            const currentHTML = quill.root.innerHTML === '<p><br></p>' ? '' : quill.root.innerHTML;
            if (currentHTML !== (initialContent || '')) {
                quill.root.innerHTML = initialContent || '';
                setCharCount(quill.getText().length - 1);
            }
        }
    }, [initialContent]);

    return { charCount, maxChars: MAX_NOTE_CHARS };
};