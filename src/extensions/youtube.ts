import { Node, mergeAttributes } from '@tiptap/core';

export interface YoutubeOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    youtube: {
      setYoutube: (options: { src: string }) => ReturnType;
    };
  }
}

// YouTube URL에서 비디오 ID 추출
function extractVideoId(url: string): string | null {
  if (!url) return null;

  const regex =
    /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export const Youtube = Node.create<YoutubeOptions>({
  name: 'youtube',

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
        tag: 'div[data-youtube-video]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const videoId = extractVideoId(HTMLAttributes.src as string);

    if (!videoId) {
      return ['div', { class: 'youtube-error' }, 'Invalid YouTube URL'];
    }

    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-youtube-video': '',
        class: 'youtube-wrapper',
      }),
      [
        'iframe',
        {
          src: `https://www.youtube.com/embed/${videoId}`,
          frameborder: '0',
          allowfullscreen: 'true',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
          width: '100%',
          height: '315',
        },
      ],
    ];
  },

  addCommands() {
    return {
      setYoutube:
        (options: { src: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default Youtube;
