export class SamplePlayer {
  private audioContext: AudioContext;
  private audioBuffer: AudioBuffer | null = null;
  private isLooping: boolean = false;
  private sourceNodes: AudioBufferSourceNode[] = [];
  private volume: number;

  constructor(
    private mp3Url: string,
    volume: number = 1.0,
  ) {
    this.audioContext = new AudioContext();
    this.volume = volume;
  }

  async load(): Promise<void> {
    const response = await fetch(this.mp3Url);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
  }

  play(): void {
    if (!this.audioBuffer) {
      console.warn("Audio not loaded yet. Call load() first.");
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.audioBuffer;
    source.loop = this.isLooping;
    source.loopEnd = this.audioBuffer.duration - 0.01; // Slightly before the end to avoid clicks
    source.loopStart = 0.01;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    // source.connect(this.audioContext.destination);
    source.start(0);

    // Track the source to stop it later if needed
    this.sourceNodes.push(source);

    // Remove it when done (if not looping)
    source.onended = () => {
      this.sourceNodes = this.sourceNodes.filter((s) => s !== source);
    };
  }

  toggleLooping(): void {
    this.isLooping = !this.isLooping;
    console.log(`Looping is now ${this.isLooping ? "enabled" : "disabled"}`);
  }

  stopAll(): void {
    this.sourceNodes.forEach((source) => source.stop());
    this.sourceNodes = [];
  }

  isLoopEnabled(): boolean {
    return this.isLooping;
  }

  async resumeContextIfNeeded(): Promise<void> {
    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }
  }
}
