declare module '*.png' {
  const value: string;
  export = value;
}

declare module '*.webp' {
  const value: string;
  export = value;
}

declare module '*?raw' {
  const value: string;
  export = value;
}

declare module '*?arraybuffer' {
  const value: ArrayBuffer;
  export = value;
}

declare module '@videojs/http-streaming';

declare module 'view-transitions-polyfill';
