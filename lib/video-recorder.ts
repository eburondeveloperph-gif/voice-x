import EventEmitter from 'eventemitter3';

export class VideoRecorder {
  private emitter = new EventEmitter();
  public on = this.emitter.on.bind(this.emitter);
  public off = this.emitter.off.bind(this.emitter);

  private stream: MediaStream | null = null;
  private video: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private intervalId: number | null = null;
  private active = false;
  private facingMode: 'user' | 'environment' = 'user';

  constructor() {
    this.video = document.createElement('video');
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  public async start(facingMode: 'user' | 'environment' = 'user'): Promise<MediaStream> {
    this.facingMode = facingMode;
    if (this.stream) {
      this.stop();
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: this.facingMode,
        width: { ideal: 640 },
        height: { ideal: 480 },
      },
    });

    if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();

        this.active = true;
        this.intervalId = window.setInterval(() => {
          this.captureFrame();
        }, 1000); // Send 1 frame per second
    }

    return this.stream;
  }

  public stop() {
    this.active = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  public async toggleCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    if (this.active) {
      await this.start(this.facingMode);
    }
  }

  private captureFrame() {
    if (!this.active || !this.video || !this.canvas || !this.ctx) return;

    const { videoWidth, videoHeight } = this.video;
    this.canvas.width = videoWidth;
    this.canvas.height = videoHeight;
    this.ctx.drawImage(this.video, 0, 0, videoWidth, videoHeight);

    // Convert to jpeg to reduce size
    const base64 = this.canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
    this.emitter.emit('data', base64);
  }

  public getStream(): MediaStream | null {
    return this.stream;
  }

  public getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }
}
