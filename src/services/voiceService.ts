// DoseMate Web Speech API (SpeechSynthesis) Service

class VoiceService {
  private isSpeaking = false;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  // Format dosage for natural speech
  private naturalDosage(dosage: string): string {
    return dosage
      .replace(/mg/gi, ' milligrams')
      .replace(/ml/gi, ' milliliters')
      .replace(/mcg/gi, ' micrograms')
      .replace(/tab\b|tabs\b/gi, ' tablet')
      .replace(/cap\b|caps\b/gi, ' capsule');
  }

  // Construct announcement text based on language and details
  public getAnnouncementText(
    medicineName?: string,
    dosage?: string,
    language: 'en' | 'hi' = 'en'
  ): string {
    const formattedDosage = dosage ? this.naturalDosage(dosage) : '';

    if (language === 'hi') {
      if (medicineName) {
        return `${medicineName} ${formattedDosage} lene ka time ho gaya hai. Please apni medicine le lijiye.`;
      }
      return 'Medicine lene ka time ho gaya hai. Please apni medicine le lijiye.';
    }

    // Default English
    if (medicineName) {
      return `It is time to take ${medicineName}, ${formattedDosage || ''}. Please take your scheduled medicine.`;
    }
    return 'It is time to take your medicine. Please take your scheduled medicine.';
  }

  // Speak announcement
  public speak(
    text: string,
    language: 'en' | 'hi' = 'en',
    volume: number = 100
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.isSupported()) {
        console.warn('SpeechSynthesis is not supported in this browser.');
        resolve();
        return;
      }

      try {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.volume = Math.max(0, Math.min(1, volume / 100));
        utterance.rate = 0.95; // slightly slower for elderly accessibility and clarity
        utterance.pitch = 1.0;

        // Choose appropriate voice
        const voices = window.speechSynthesis.getVoices();
        if (language === 'hi') {
          utterance.lang = 'hi-IN';
          const hindiVoice = voices.find(
            (v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi') || v.name.toLowerCase().includes('india')
          );
          if (hindiVoice) utterance.voice = hindiVoice;
        } else {
          utterance.lang = 'en-US';
          const englishVoice = voices.find(
            (v) => (v.lang === 'en-US' || v.lang === 'en-GB' || v.lang === 'en-IN') && v.name.includes('Natural')
          ) || voices.find((v) => v.lang.startsWith('en'));
          if (englishVoice) utterance.voice = englishVoice;
        }

        utterance.onstart = () => {
          this.isSpeaking = true;
        };

        utterance.onend = () => {
          this.isSpeaking = false;
          resolve();
        };

        utterance.onerror = (e) => {
          console.warn('Speech synthesis utterance error:', e);
          this.isSpeaking = false;
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Failed to trigger speech synthesis:', err);
        this.isSpeaking = false;
        resolve();
      }
    });
  }

  // Stop voice announcement immediately
  public stop(): void {
    if (this.isSupported()) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeaking = false;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceService = new VoiceService();
