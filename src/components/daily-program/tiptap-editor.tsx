'use client';

import React, { useCallback, useState, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Video } from './tiptap-video-extension';
import { validateVideo } from '@/utils/validateVideo';
import { uploadVideo } from '@/utils/uploadVideo';
import type { TiptapDocument } from '@/types/daily-program';

interface TiptapEditorProps {
 content: TiptapDocument | null;
 onChange: (doc: TiptapDocument | null) => void;
 cardId?: string;
}

export function TiptapEditor({ content, onChange, cardId }: TiptapEditorProps) {
 const [uploading, setUploading] = useState(false);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [uploadError, setUploadError] = useState<string | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 // 업로드 실패 시 재시도용 파일 참조 (페이지 이탈 시 소멸)
 const pendingFileRef = useRef<File | null>(null);

 const editor = useEditor({
  immediatelyRender: false,
  extensions: [
   StarterKit.configure({
    link: false,
    underline: false,
   }),
   Underline,
   Link.configure({
    openOnClick: false,
    HTMLAttributes: { class: 'text-blue-600 underline' },
   }),
   Image.configure({
    HTMLAttributes: { class: 'max-w-full rounded-lg' },
   }),
   Youtube.configure({
    width: 480,
    height: 320,
   }),
   Video,
   Placeholder.configure({
    placeholder: '카드 본문을 입력하세요...',
   }),
  ],
  content: content || { type: 'doc', content: [{ type: 'paragraph' }] },
  onUpdate: ({ editor: ed }) => {
   const json = ed.getJSON();
   onChange(json as TiptapDocument);
  },
  editorProps: {
   attributes: {
    class: 'text-body dark:text-white max-w-none px-3 py-2 min-h-[200px] sm:min-h-[120px] focus:outline-none',
   },
  },
 });

 const addLink = useCallback(() => {
  if (!editor) return;
  const input = window.prompt('URL을 입력하세요:');
  if (input) {
   const href = /^https?:\/\//.test(input) ? input : `https://${input}`;
   editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
  }
 }, [editor]);

 const addImage = useCallback(() => {
  if (!editor) return;
  const url = window.prompt('이미지 URL을 입력하세요:');
  if (url) {
   editor.chain().focus().setImage({ src: url }).run();
  }
 }, [editor]);

 const addYoutube = useCallback(() => {
  if (!editor) return;
  const url = window.prompt('YouTube URL을 입력하세요:');
  if (url) {
   editor.chain().focus().setYoutube({ src: url }).run();
  }
 }, [editor]);

 const doUpload = useCallback(async (file: File) => {
  if (!editor || !cardId) return;

  setUploadError(null);
  setUploading(true);
  setUploadProgress(0);

  try {
   const publicUrl = await uploadVideo(file, cardId, (percent) => {
    setUploadProgress(percent);
   });
   pendingFileRef.current = null;
   editor.chain().focus().setVideo({ src: publicUrl }).run();
  } catch (err) {
   pendingFileRef.current = file;
   setUploadError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
  } finally {
   setUploading(false);
  }
 }, [editor, cardId]);

 const addVideo = useCallback(() => {
  if (!editor) return;
  if (!cardId) {
   alert('먼저 카드를 저장해주세요. 영상은 카드 저장 후 추가할 수 있습니다.');
   return;
  }
  fileInputRef.current?.click();
 }, [editor, cardId]);

 const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !editor || !cardId) return;
  e.target.value = '';

  try {
   await validateVideo(file);
  } catch (err) {
   setUploadError(err instanceof Error ? err.message : '영상 검증에 실패했습니다.');
   return;
  }

  await doUpload(file);
 }, [editor, cardId, doUpload]);

 const retryUpload = useCallback(() => {
  if (pendingFileRef.current) {
   doUpload(pendingFileRef.current);
  }
 }, [doUpload]);

 if (!editor) return null;

 const isCardSaved = !!cardId;

 return (
  <div className="border border-line rounded-md overflow-hidden">
   {/* 영상 안내 텍스트 (카드 미저장 시) */}
   {!isCardSaved && (
    <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-caption border-b border-line">
     영상은 카드 저장 후 추가할 수 있어요
    </div>
   )}

   {/* Toolbar */}
   <div className="bg-surface-raised px-2 py-1 border-b border-line flex flex-wrap items-center gap-0.5">
    <ToolbarButton
     onClick={() => editor.chain().focus().toggleBold().run()}
     active={editor.isActive('bold')}
     title="굵게"
     disabled={uploading}
    >
     <strong>B</strong>
    </ToolbarButton>
    <ToolbarButton
     onClick={() => editor.chain().focus().toggleItalic().run()}
     active={editor.isActive('italic')}
     title="기울임"
     disabled={uploading}
    >
     <em>I</em>
    </ToolbarButton>
    <ToolbarButton
     onClick={() => editor.chain().focus().toggleUnderline().run()}
     active={editor.isActive('underline')}
     title="밑줄"
     disabled={uploading}
    >
     <span className="underline">U</span>
    </ToolbarButton>
    <Divider />
    <ToolbarButton
     onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
     active={editor.isActive('heading', { level: 2 })}
     title="제목"
     disabled={uploading}
    >
     H2
    </ToolbarButton>
    <ToolbarButton
     onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
     active={editor.isActive('heading', { level: 3 })}
     title="소제목"
     disabled={uploading}
    >
     H3
    </ToolbarButton>
    <Divider />
    <ToolbarButton
     onClick={() => editor.chain().focus().toggleBulletList().run()}
     active={editor.isActive('bulletList')}
     title="목록"
     disabled={uploading}
    >
     &bull;
    </ToolbarButton>
    <ToolbarButton
     onClick={() => editor.chain().focus().toggleOrderedList().run()}
     active={editor.isActive('orderedList')}
     title="번호 목록"
     disabled={uploading}
    >
     1.
    </ToolbarButton>
    <Divider />
    <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="링크" disabled={uploading}>
     <LinkIcon />
    </ToolbarButton>
    <ToolbarButton onClick={addImage} title="이미지" disabled={uploading}>
     <ImageIcon />
    </ToolbarButton>
    <ToolbarButton onClick={addYoutube} title="YouTube" disabled={uploading}>
     <PlayIcon />
    </ToolbarButton>
    <ToolbarButton onClick={addVideo} title="영상 업로드" disabled={uploading || !isCardSaved}>
     <VideoUploadIcon />
    </ToolbarButton>
   </div>

   {/* 프로그레스 바 / 에러 */}
   {(uploading || uploadError) && (
    <div className="px-3 py-2 bg-surface-sunken border-b border-line">
     {uploading && (
      <div className="flex items-center gap-2">
       <div className="flex-1">
        <div className="flex items-center justify-between text-caption text-content-secondary mb-1">
         <span>업로드 중... {uploadProgress}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-raised rounded-full overflow-hidden">
         <div
          className="h-full bg-accent rounded-full transition-all duration-300"
          style={{ width: `${uploadProgress}%` }}
         />
        </div>
       </div>
      </div>
     )}
     {uploadError && !uploading && (
      <div className="flex items-center gap-2 text-caption">
       <span className="text-red-500 dark:text-red-400 flex-1">{uploadError}</span>
       {pendingFileRef.current && (
        <button
         type="button"
         onClick={retryUpload}
         className="px-2 py-0.5 text-caption bg-accent text-white rounded hover:bg-accent-hover transition-colors"
        >
         재시도
        </button>
       )}
      </div>
     )}
    </div>
   )}

   {/* Hidden file input */}
   <input
    ref={fileInputRef}
    type="file"
    accept="video/mp4,video/quicktime,video/webm"
    onChange={handleFileSelect}
    className="hidden"
   />

   {/* Editor */}
   <EditorContent editor={editor} />
  </div>
 );
}

function Divider() {
 return <div className="w-px h-4 bg-line mx-1" />;
}

function ToolbarButton({
 onClick,
 active,
 title,
 disabled,
 children,
}: {
 onClick: () => void;
 active?: boolean;
 title?: string;
 disabled?: boolean;
 children: React.ReactNode;
}) {
 return (
  <button
   type="button"
   onClick={onClick}
   title={title}
   disabled={disabled}
   className={`px-1.5 py-0.5 text-label rounded transition-colors ${
    disabled
     ? 'text-content-disabled cursor-not-allowed opacity-50'
     : active
      ? 'bg-accent-subtle text-accent'
      : 'text-content-secondary hover:bg-surface-sunken'
   }`}
  >
   {children}
  </button>
 );
}

function LinkIcon() {
 return (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
 );
}

function ImageIcon() {
 return (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
 );
}

function PlayIcon() {
 return (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
 );
}

function VideoUploadIcon() {
 return (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
 );
}
