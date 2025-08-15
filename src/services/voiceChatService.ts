import DailyIframe from "@daily-co/daily-js";

class VoiceChatService {
  private daily: any = null;
  private isInitialized: boolean = false;

  // Initialize Daily.co
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create a simple iframe without complex theming to avoid TypeScript errors
      this.daily = DailyIframe.createFrame();

      this.isInitialized = true;
      console.log("Voice chat initialized");
    } catch (error) {
      console.error("Failed to initialize voice chat:", error);
      throw error;
    }
  }

  // Create a voice room
  async createRoom(): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // In a real implementation, you'd call your backend to create a Daily room
      // For now, we'll use a mock room URL
      const roomUrl = `https://example.daily.co/room-${Date.now()}`;
      return roomUrl;
    } catch (error) {
      console.error("Failed to create voice room:", error);
      throw error;
    }
  }

  // Join a voice room
  async joinRoom(roomUrl: string): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.daily.join({
        url: roomUrl,
        startAudioOff: true, // Start muted by default
        startVideoOff: true, // No video for voice-only chat
      });

      console.log("Joined voice room:", roomUrl);
    } catch (error) {
      console.error("Failed to join voice room:", error);
      throw error;
    }
  }

  // Leave the current voice room
  async leaveRoom(): Promise<void> {
    if (this.daily) {
      await this.daily.leave();
      console.log("Left voice room");
    }
  }

  // Toggle microphone
  toggleMicrophone(): boolean {
    if (!this.daily) return false;

    const isAudioEnabled = this.daily.localAudio();
    this.daily.setLocalAudio(!isAudioEnabled);
    return !isAudioEnabled;
  }

  // Check if microphone is enabled
  isMicrophoneEnabled(): boolean {
    return this.daily?.localAudio() || false;
  }

  // Get participant count
  getParticipantCount(): number {
    if (!this.daily) return 0;
    return Object.keys(this.daily.participants()).length;
  }

  // Event listeners
  onParticipantJoined(callback: (participant: any) => void): void {
    this.daily?.on("participant-joined", callback);
  }

  onParticipantLeft(callback: (participant: any) => void): void {
    this.daily?.on("participant-left", callback);
  }

  onAudioLevelChanged(callback: (event: any) => void): void {
    this.daily?.on("participant-audio-level-changed", callback);
  }

  onError(callback: (error: any) => void): void {
    this.daily?.on("error", callback);
  }

  // Clean up
  destroy(): void {
    if (this.daily) {
      this.daily.destroy();
      this.daily = null;
      this.isInitialized = false;
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.daily?.meetingState() === "joined";
  }
}

export const voiceChatService = new VoiceChatService();
