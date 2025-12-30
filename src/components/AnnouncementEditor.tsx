'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Youtube } from '@/extensions/youtube';
import { uploadImage } from '@/utils/uploadImage';
import { useRef, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Heading2,
  List,
  Loader2,
} from 'lucide-react';

interface AnnouncementEditorProps {
  content?: object;
  onChange: (content: object) => void;
}

export function AnnouncementEditor({ content, onChange }: AnnouncementEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'announcement-image',
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: '공지 내용을 작성하세요...',
      }),
      Youtube,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[250px]',
      },
    },
  });

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [editor]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = '';
  }, [handleImageUpload]);

  const addLink = useCallback(() => {
    if (!editor) return;

    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('링크 URL을 입력하세요:', previousUrl);

    if (url === null) return;

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const addYoutube = useCallback(() => {
    if (!editor) return;

    const url = window.prompt('YouTube URL을 입력하세요:');

    if (url) {
      editor.chain().focus().setYoutube({ src: url }).run();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="announcement-editor border border-gray-300 rounded-lg">
        <div className="p-4 flex items-center justify-center min-h-[300px]">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="announcement-editor">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Toolbar */}
      <div className="toolbar">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'active' : ''}
          title="굵게 (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'active' : ''}
          title="기울임 (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive('underline') ? 'active' : ''}
          title="밑줄 (Ctrl+U)"
        >
          <UnderlineIcon size={16} />
        </button>

        <div className="toolbar-divider" />

        <button
          type="button"
          onClick={addLink}
          className={editor.isActive('link') ? 'active' : ''}
          title="링크 추가"
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="이미지 추가"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ImageIcon size={16} />
          )}
        </button>
        <button
          type="button"
          onClick={addYoutube}
          title="YouTube 영상 추가"
        >
          <YoutubeIcon size={16} />
        </button>

        <div className="toolbar-divider" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          title="제목 (H2)"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive('bulletList') ? 'active' : ''}
          title="목록"
        >
          <List size={16} />
        </button>
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} className="editor-content" />

      {/* 안내 문구 */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
        이미지: 최대 5MB (JPEG, PNG, GIF, WebP)
      </div>
    </div>
  );
}

export default AnnouncementEditor;
