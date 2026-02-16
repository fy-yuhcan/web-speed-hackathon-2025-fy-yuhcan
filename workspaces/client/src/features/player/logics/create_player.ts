import { PlayerType } from '@wsh-2025/client/src/features/player/constants/player_type';
import { PlayerWrapper } from '@wsh-2025/client/src/features/player/interfaces/player_wrapper';

interface VhsConfig {
  GOAL_BUFFER_LENGTH: number;
  MAX_GOAL_BUFFER_LENGTH: number;
}

function createVideoElement(): HTMLVideoElement {
  const video = document.createElement('video');
  video.autoplay = true;
  video.controls = false;
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.volume = 0.25;
  video.style.display = 'block';
  video.style.height = '100%';
  video.style.objectFit = 'contain';
  video.style.width = '100%';
  return video;
}

let shakaModulePromise: Promise<typeof import('shaka-player')> | null = null;
let hlsModulePromise: Promise<typeof import('hls.js')> | null = null;
let videoJsModulePromise: Promise<typeof import('video.js')> | null = null;

function loadShakaModule(): Promise<typeof import('shaka-player')> {
  shakaModulePromise ??= import('shaka-player');
  return shakaModulePromise;
}

function loadHlsModule(): Promise<typeof import('hls.js')> {
  hlsModulePromise ??= import('hls.js');
  return hlsModulePromise;
}

function loadVideoJsModule(): Promise<typeof import('video.js')> {
  videoJsModulePromise ??= (async () => {
    await import('@videojs/http-streaming');
    return await import('video.js');
  })();
  return videoJsModulePromise;
}

async function createShakaPlayer(playerType: PlayerType.ShakaPlayer): Promise<PlayerWrapper> {
  const { default: shaka } = await loadShakaModule();

  class ShakaPlayerWrapper implements PlayerWrapper {
    readonly videoElement = createVideoElement();
    private _player = new shaka.Player();
    readonly playerType: PlayerType.ShakaPlayer;

    constructor(playerType: PlayerType.ShakaPlayer) {
      this.playerType = playerType;
      this._player.configure({
        streaming: {
          bufferingGoal: 10,
        },
      });
    }

    get currentTime(): number {
      const currentTime = this.videoElement.currentTime;
      return Number.isNaN(currentTime) ? 0 : currentTime;
    }
    get paused(): boolean {
      return this.videoElement.paused;
    }
    get duration(): number {
      const duration = this.videoElement.duration;
      return Number.isNaN(duration) ? 0 : duration;
    }
    get muted(): boolean {
      return this.videoElement.muted;
    }

    load(playlistUrl: string, options: { loop: boolean }): void {
      void (async () => {
        await this._player.attach(this.videoElement);
        this.videoElement.loop = options.loop;
        await this._player.load(playlistUrl);
      })();
    }
    play(): void {
      void this.videoElement.play();
    }
    pause(): void {
      this.videoElement.pause();
    }
    seekTo(second: number): void {
      this.videoElement.currentTime = second;
    }
    setMuted(muted: boolean): void {
      this.videoElement.muted = muted;
    }
    destory(): void {
      void this._player.destroy();
    }
  }

  return new ShakaPlayerWrapper(playerType);
}

async function createHlsJsPlayer(playerType: PlayerType.HlsJS): Promise<PlayerWrapper> {
  const { default: HlsJs } = await loadHlsModule();

  class HlsJSPlayerWrapper implements PlayerWrapper {
    readonly videoElement = createVideoElement();
    private _player = new HlsJs({
      enableWorker: false,
      maxBufferLength: 10,
    });
    readonly playerType: PlayerType.HlsJS;

    constructor(playerType: PlayerType.HlsJS) {
      this.playerType = playerType;
    }

    get currentTime(): number {
      const currentTime = this.videoElement.currentTime;
      return Number.isNaN(currentTime) ? 0 : currentTime;
    }
    get paused(): boolean {
      return this.videoElement.paused;
    }
    get duration(): number {
      const duration = this._player.media?.duration ?? 0;
      return Number.isNaN(duration) ? 0 : duration;
    }
    get muted(): boolean {
      return this.videoElement.muted;
    }

    load(playlistUrl: string, options: { loop: boolean }): void {
      this._player.attachMedia(this.videoElement);
      this.videoElement.loop = options.loop;
      this._player.loadSource(playlistUrl);
    }
    play(): void {
      void this.videoElement.play();
    }
    pause(): void {
      this.videoElement.pause();
    }
    seekTo(second: number): void {
      this.videoElement.currentTime = second;
    }
    setMuted(muted: boolean): void {
      this.videoElement.muted = muted;
    }
    destory(): void {
      this._player.destroy();
    }
  }

  return new HlsJSPlayerWrapper(playerType);
}

async function createVideoJsPlayer(playerType: PlayerType.VideoJS): Promise<PlayerWrapper> {
  const { default: videojs } = await loadVideoJsModule();

  class VideoJSPlayerWrapper implements PlayerWrapper {
    readonly videoElement = createVideoElement();
    private _player = videojs(this.videoElement);
    readonly playerType: PlayerType.VideoJS;

    constructor(playerType: PlayerType.VideoJS) {
      const vhsConfig = (videojs as unknown as { Vhs?: VhsConfig }).Vhs;
      if (vhsConfig != null) {
        vhsConfig.GOAL_BUFFER_LENGTH = 10;
        vhsConfig.MAX_GOAL_BUFFER_LENGTH = 10;
      }
      this.playerType = playerType;
    }

    get currentTime(): number {
      return this._player.currentTime() ?? 0;
    }
    get paused(): boolean {
      return this._player.paused();
    }
    get duration(): number {
      return this._player.duration() ?? 0;
    }
    get muted(): boolean {
      return this._player.muted() ?? true;
    }

    load(playlistUrl: string, options: { loop: boolean }): void {
      this.videoElement.loop = options.loop;
      this._player.src({
        src: playlistUrl,
        type: 'application/x-mpegURL',
      });
    }
    play(): void {
      void this.videoElement.play();
    }
    pause(): void {
      this.videoElement.pause();
    }
    seekTo(second: number): void {
      this.videoElement.currentTime = second;
    }
    setMuted(muted: boolean): void {
      this._player.muted(muted);
    }
    destory(): void {
      this._player.dispose();
    }
  }

  return new VideoJSPlayerWrapper(playerType);
}

export const preloadPlayerLibrary = (playerType: PlayerType): void => {
  switch (playerType) {
    case PlayerType.ShakaPlayer: {
      void loadShakaModule();
      return;
    }
    case PlayerType.HlsJS: {
      void loadHlsModule();
      return;
    }
    case PlayerType.VideoJS: {
      void loadVideoJsModule();
      return;
    }
    default: {
      playerType satisfies never;
    }
  }
};

export const createPlayer = async (playerType: PlayerType): Promise<PlayerWrapper> => {
  switch (playerType) {
    case PlayerType.ShakaPlayer: {
      return await createShakaPlayer(playerType);
    }
    case PlayerType.HlsJS: {
      return await createHlsJsPlayer(playerType);
    }
    case PlayerType.VideoJS: {
      return await createVideoJsPlayer(playerType);
    }
    default: {
      playerType satisfies never;
      throw new Error('Invalid player type.');
    }
  }
};
