const Event = require('../models/Event');
const User = require('../models/User');
const googleCalendarService = require('./googleCalendarService');

/**
 * Event Cleanup Service
 * Handles automatic deletion of old events from database and Google Calendar
 */

class EventCleanupService {
  /**
   * Delete events that ended more than 24 hours ago
   */
  async cleanupOldEvents() {
    try {
      console.log('🧹 Starting event cleanup...');
      
      const now = new Date();
      const cutoffTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago
      
      // Find all events that ended before cutoff time
      const oldEvents = await Event.find({
        endTime: { $lt: cutoffTime }
      }).populate('user');
      
      console.log(`📊 Found ${oldEvents.length} old events to clean up`);
      
      let deletedCount = 0;
      let failedCount = 0;
      
      for (const event of oldEvents) {
        try {
          // Delete from Google Calendar if it exists there
          const googleEventId = event.externalIds?.googleCalendar || event.googleCalendarEventId;
          
          if (googleEventId && event.user && event.user.googleCalendarToken) {
            try {
              await googleCalendarService.deleteGoogleCalendarEvent(
                event.user,
                googleEventId
              );
              console.log(`✅ Deleted from Google Calendar: ${event.title}`);
            } catch (gcError) {
              // Event might already be deleted from Google Calendar, continue
              console.log(`⚠️ Could not delete from Google Calendar (might already be deleted): ${event.title}`);
            }
          }
          
          // Delete from our database
          await Event.findByIdAndDelete(event._id);
          deletedCount++;
          console.log(`🗑️ Deleted event: ${event.title} (ended at ${event.endTime})`);
          
        } catch (error) {
          failedCount++;
          console.error(`❌ Failed to delete event ${event.title}:`, error.message);
        }
      }
      
      console.log(`✅ Cleanup complete: ${deletedCount} deleted, ${failedCount} failed`);
      
      return {
        success: true,
        deleted: deletedCount,
        failed: failedCount,
        total: oldEvents.length
      };
      
    } catch (error) {
      console.error('❌ Error in cleanup service:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get completed matches from the last 3 days
   */
  async getRecentCompletedMatches() {
    try {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
      
      // Find events that ended in the last 3 days
      const completedEvents = await Event.find({
        endTime: { 
          $gte: threeDaysAgo,
          $lt: now 
        }
      }).sort({ endTime: -1 }); // Most recent first
      
      return completedEvents;
      
    } catch (error) {
      console.error('Error fetching recent completed matches:', error);
      return [];
    }
  }
  
  /**
   * Start automatic cleanup that runs every 6 hours
   */
  startAutomaticCleanup() {
    console.log('🚀 Starting automatic event cleanup service...');
    
    // Run immediately on startup
    this.cleanupOldEvents();
    
    // Then run every 6 hours
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    setInterval(() => {
      this.cleanupOldEvents();
    }, SIX_HOURS);
    
    console.log('✅ Automatic cleanup scheduled (runs every 6 hours)');
  }
}

module.exports = new EventCleanupService();
