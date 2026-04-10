import { Node, mergeAttributes } from '@tiptap/core';

export interface VideoOptions {
 HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
 interface Commands<ReturnType> {
  video: {
   setVideo: (options: { src: string }) => ReturnType;
  };
 }
}

export const Video = Node.create<VideoOptions>({
 name: 'video',

 group: 'block',

 atom: true,

 addOptions() {
  return {
   HTMLAttributes: {},
  };
 },

 addAttributes() {
  return {
   src: {
    default: null,
   },
  };
 },

 parseHTML() {
  return [
   {
    tag: 'video',
    getAttrs: (node) => {
     const el = node as HTMLElement;
     const source = el.querySelector('source');
     const src = source?.getAttribute('src') || el.getAttribute('src');
     return src ? { src } : false;
    },
   },
  ];
 },

 renderHTML({ HTMLAttributes }) {
  return [
   'video',
   mergeAttributes(this.options.HTMLAttributes, {
    controls: 'true',
    playsinline: 'true',
    class: 'max-w-full rounded-lg my-4',
   }),
   [
    'source',
    {
     src: HTMLAttributes.src,
     type: 'video/mp4',
    },
   ],
  ];
 },

 addCommands() {
  return {
   setVideo:
    (options: { src: string }) =>
    ({ commands }) => {
     return commands.insertContent({
      type: this.name,
      attrs: options,
     });
    },
  };
 },

 addNodeView() {
  return ({ node }) => {
   const container = document.createElement('div');
   container.className = 'my-4';

   const video = document.createElement('video');
   video.controls = true;
   video.playsInline = true;
   video.className = 'max-w-full rounded-lg';
   video.style.maxHeight = '400px';

   const source = document.createElement('source');
   source.src = node.attrs.src;
   source.type = 'video/mp4';
   video.appendChild(source);
   container.appendChild(video);

   return {
    dom: container,
   };
  };
 },
});

export default Video;
