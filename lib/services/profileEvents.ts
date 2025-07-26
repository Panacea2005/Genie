// Simple event system for profile updates
class ProfileEventEmitter {
  private listeners: (() => void)[] = []

  // Subscribe to profile updates
  subscribe(callback: () => void) {
    this.listeners.push(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback)
    }
  }

  // Emit profile update event
  emit() {
    this.listeners.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.warn('Error in profile update listener:', error)
      }
    })
  }
}

// Global instance
export const profileEvents = new ProfileEventEmitter()

// Helper function to trigger profile refresh across components
export const triggerProfileRefresh = () => {
  profileEvents.emit()
} 