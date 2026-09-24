// DoseMate Browser Notification Service
// Works with Service Worker registration and native Notifications API

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.registerServiceWorker();
  }

  // Register service worker if available
  public async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      this.swRegistration = reg;
      return reg;
    } catch (err) {
      console.warn('Service worker registration error (expected in some sandboxed environments):', err);
      return null;
    }
  }

  // Check current permission
  public getPermissionStatus(): NotificationPermissionStatus {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission as NotificationPermissionStatus;
  }

  // Request permission from user
  public async requestPermission(): Promise<NotificationPermissionStatus> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    try {
      const permission = await Notification.requestPermission();
      return permission as NotificationPermissionStatus;
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return 'denied';
    }
  }

  // Show scheduled medicine notification
  public async showMedicineNotification(params: {
    medicineName: string;
    dosage: string;
    time: string;
    instructions?: string;
    reminderId: string;
    medicineId: string;
  }): Promise<boolean> {
    const { medicineName, dosage, time, instructions, reminderId, medicineId } = params;
    const title = '💊 Take Your Medicine';
    
    let body = `Medicine: ${medicineName}\nDosage: ${dosage}\nTime: ${time}`;
    if (instructions && instructions !== 'None') {
      body += `\nInstruction: ${instructions}`;
    }

    const options: NotificationOptions & { renotify?: boolean; data?: unknown } = {
      body: body,
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: `dosemate-${reminderId}`,
      renotify: true,
      requireInteraction: true,
      data: {
        reminderId,
        medicineId,
        medicineName,
        time,
      },
    };

    // If permission is not granted, return false so in-app alert takes over
    if (this.getPermissionStatus() !== 'granted') {
      return false;
    }

    try {
      // Prefer Service Worker showNotification if active
      if (this.swRegistration && this.swRegistration.showNotification) {
        await this.swRegistration.showNotification(title, options);
        return true;
      }
      
      // Fallback to standard Notification object
      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return true;
    } catch (err) {
      console.warn('Native notification failed, falling back to in-app notification:', err);
      return false;
    }
  }
}

export const notificationService = new NotificationService();
