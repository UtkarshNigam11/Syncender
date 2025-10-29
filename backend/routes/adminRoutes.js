const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Event = require('../models/Event');
const ActivityLog = require('../models/ActivityLog');
const { adminProtect } = require('../middleware/adminAuth');

// Admin login (separate from regular user login)
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is admin
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is inactive' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard stats
router.get('/dashboard/stats', adminProtect, async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      freeUsers,
      proUsers,
      totalEvents,
      autoSyncedEvents,
      newUsersThisMonth
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ plan: 'free' }),
      User.countDocuments({ plan: 'pro' }),
      Event.countDocuments(),
      Event.countDocuments({ autoSynced: true }),
      User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      })
    ]);

    // Get new signups today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const newSignupsToday = await User.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    // Get users with Google Calendar connected
    const usersWithCalendar = await User.countDocuments({
      $or: [
        { 'googleCalendarToken.refreshToken': { $exists: true, $ne: null } },
        { 'googleCalendarToken.accessToken': { $exists: true, $ne: null } }
      ]
    });

    // Calculate revenue in rupees (assuming pro plan is ₹799/month)
    const revenue = proUsers * 799;
    
    // Get subscriptions this month
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const subscriptionsThisMonth = await User.countDocuments({
      plan: 'pro',
      planStartedAt: { $gte: startOfMonth }
    });

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        freeUsers,
        proUsers,
        totalEvents,
        autoSyncedEvents,
        manualEvents: totalEvents - autoSyncedEvents,
        newUsersThisMonth,
        newSignupsToday,
        usersWithCalendar,
        revenue: revenue.toFixed(2),
        subscriptionsThisMonth,
        avgEventsPerUser: totalUsers > 0 ? (totalEvents / totalUsers).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination and filters
router.get('/users', adminProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const plan = req.query.plan || '';
    const status = req.query.status || '';

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (plan) {
      query.plan = plan;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    // Get event count for each user
    const usersWithEventCount = await Promise.all(
      users.map(async (user) => {
        const eventCount = await Event.countDocuments({ user: user._id });
        return {
          ...user.toObject(),
          eventCount
        };
      })
    );

    res.json({
      success: true,
      users: usersWithEventCount,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user details
router.get('/users/:id', adminProtect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's events
    const events = await Event.find({ user: user._id })
      .sort({ startTime: -1 })
      .limit(50);

    const eventCount = await Event.countDocuments({ user: user._id });
    const autoSyncedCount = await Event.countDocuments({ 
      user: user._id, 
      autoSynced: true 
    });

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        eventCount,
        autoSyncedCount,
        recentEvents: events
      }
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user
router.put('/users/:id', adminProtect, async (req, res) => {
  try {
    const { name, email, plan, planStatus, isActive } = req.body;

    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating admin accounts
    if (user.role === 'admin' && typeof isActive === 'boolean' && !isActive) {
      return res.status(403).json({ 
        message: 'Cannot deactivate admin accounts. Admin accounts must remain active.' 
      });
    }

    // Prevent changing admin role
    if (user.role === 'admin' && req.body.role && req.body.role !== 'admin') {
      return res.status(403).json({ 
        message: 'Cannot change admin role.' 
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (plan) user.plan = plan;
    if (planStatus) user.planStatus = planStatus;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminProtect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin accounts
    if (user.role === 'admin') {
      return res.status(403).json({ 
        message: 'Cannot delete admin accounts.' 
      });
    }

    // Delete user's events
    await Event.deleteMany({ user: user._id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User and associated events deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user growth data for charts
router.get('/analytics/user-growth', adminProtect, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Admin user growth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subscription distribution
router.get('/analytics/subscription-distribution', adminProtect, async (req, res) => {
  try {
    const distribution = await User.aggregate([
      {
        $group: {
          _id: '$plan',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('Admin subscription distribution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular sports
router.get('/analytics/popular-sports', adminProtect, async (req, res) => {
  try {
    const sports = await Event.aggregate([
      {
        $group: {
          _id: '$sport',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    res.json({
      success: true,
      data: sports
    });
  } catch (error) {
    console.error('Admin popular sports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get subscription metrics
router.get('/analytics/subscription-metrics', adminProtect, async (req, res) => {
  try {
    // Total subscriptions (pro users)
    const totalSubscriptions = await User.countDocuments({ plan: 'pro' });

    // Monthly renewals (pro users created in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyRenewals = await User.countDocuments({
      plan: 'pro',
      createdAt: { $gte: thirtyDaysAgo }
    });

    // MRR calculation (assuming pro plan is ₹499/month)
    const mrr = totalSubscriptions * 499;

    res.json({
      success: true,
      data: {
        totalSubscriptions,
        monthlyRenewals,
        mrr
      }
    });
  } catch (error) {
    console.error('Admin subscription metrics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all events with pagination
router.get('/events', adminProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const sport = req.query.sport || '';

    let query = {};
    if (sport) {
      query.sport = sport;
    }

    const [events, total] = await Promise.all([
      Event.find(query)
        .populate('user', 'name email')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(limit),
      Event.countDocuments(query)
    ]);

    res.json({
      success: true,
      events,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Admin get events error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get system health
router.get('/system/health', adminProtect, async (req, res) => {
  try {
    const dbStatus = await User.db.db.admin().ping();
    
    res.json({
      success: true,
      health: {
        database: dbStatus.ok === 1 ? 'healthy' : 'unhealthy',
        server: 'healthy',
        timestamp: new Date()
      }
    });
  } catch (error) {
    console.error('Admin health check error:', error);
    res.status(500).json({ 
      success: false,
      health: {
        database: 'unhealthy',
        server: 'degraded',
        timestamp: new Date()
      }
    });
  }
});

// Get API health status
router.get('/system/api-health', adminProtect, async (req, res) => {
  try {
    const axios = require('axios');
    
    const checkAPI = async (name, url) => {
      const start = Date.now();
      try {
        await axios.get(url, { timeout: 5000 });
        return {
          name,
          status: 'online',
          responseTime: Date.now() - start,
        };
      } catch (error) {
        return {
          name,
          status: 'offline',
          responseTime: Date.now() - start,
        };
      }
    };

    const apis = await Promise.all([
      checkAPI('ESPN API', 'https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard'),
      checkAPI('TheSportsDB', 'https://www.thesportsdb.com/api/v1/json/3/eventsnext.php?id=133602'),
      checkAPI('MongoDB', 'http://localhost:27017'), // This will likely fail, but we check it differently
    ]);

    // Check MongoDB differently
    const dbPing = await User.db.db.admin().ping();
    apis[2] = {
      name: 'MongoDB',
      status: dbPing.ok === 1 ? 'online' : 'offline',
      responseTime: 0,
    };

    res.json({
      success: true,
      apis,
    });
  } catch (error) {
    console.error('API health check error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cron job status
router.get('/system/cron-status', adminProtect, async (req, res) => {
  try {
    // This would require tracking cron job execution
    // For now, return mock data
    const cronJobs = [
      {
        name: 'Auto-Sync Favorite Teams',
        schedule: '0 0 * * *', // Daily at midnight
        status: 'healthy',
        lastRun: new Date(Date.now() - 86400000), // 24 hours ago
        nextRun: new Date(Date.now() + 86400000), // Next 24 hours
      },
      {
        name: 'Clean Old Events',
        schedule: '0 2 * * *', // Daily at 2 AM
        status: 'healthy',
        lastRun: new Date(Date.now() - 82800000),
        nextRun: new Date(Date.now() + 90000000),
      },
    ];

    res.json({
      success: true,
      cronJobs,
    });
  } catch (error) {
    console.error('Cron status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get activity logs
router.get('/logs', adminProtect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find()
        .populate('user', 'name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments()
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to log activity
async function logActivity(userId, action, resource, details, req) {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      resource,
      details,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent')
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}

// Get all sports with leagues
router.get('/sports', adminProtect, async (req, res) => {
  try {
    const sportsApiService = require('../services/sportsApiService');
    
    // Define available sports and leagues
    const sportsConfig = [
      {
        _id: 'cricket',
        name: 'Cricket',
        enabled: true,
        leagues: [
          { name: 'IPL', leagueId: '4344', enabled: true },
          { name: 'BBL', leagueId: '4424', enabled: true },
          { name: 'PSL', leagueId: '4334', enabled: true },
          { name: 'CPL', leagueId: '4420', enabled: true },
          { name: 'SA20', leagueId: '4470', enabled: true },
          { name: 'ICC', leagueId: 'international', enabled: true },
        ],
      },
      {
        _id: 'soccer',
        name: 'Soccer',
        enabled: true,
        leagues: [
          { name: 'Premier League', leagueId: 'eng.1', enabled: true },
          { name: 'Champions League', leagueId: 'uefa.champions', enabled: true },
          { name: 'La Liga', leagueId: 'esp.1', enabled: true },
          { name: 'Bundesliga', leagueId: 'ger.1', enabled: true },
          { name: 'Serie A', leagueId: 'ita.1', enabled: true },
          { name: 'Ligue 1', leagueId: 'fra.1', enabled: true },
        ],
      },
      {
        _id: 'nfl',
        name: 'NFL',
        enabled: true,
        leagues: [
          { name: 'NFL', leagueId: 'nfl', enabled: true },
        ],
      },
      {
        _id: 'nba',
        name: 'NBA',
        enabled: true,
        leagues: [
          { name: 'NBA', leagueId: 'nba', enabled: true },
        ],
      },
    ];

    res.json({
      success: true,
      sports: sportsConfig,
    });
  } catch (error) {
    console.error('Get sports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update sport status
router.put('/sports/:sportId', adminProtect, async (req, res) => {
  try {
    const { enabled } = req.body;
    // In a real implementation, you'd save this to a database
    // For now, we'll just acknowledge the request
    
    await logActivity(
      req.user.userId,
      'update',
      'sport',
      `${enabled ? 'Enabled' : 'Disabled'} sport: ${req.params.sportId}`,
      req
    );

    res.json({
      success: true,
      message: `Sport ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    console.error('Update sport error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update league status
router.put('/sports/:sportId/leagues/:leagueId', adminProtect, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    await logActivity(
      req.user.userId,
      'update',
      'league',
      `${enabled ? 'Enabled' : 'Disabled'} league: ${req.params.leagueId} in sport: ${req.params.sportId}`,
      req
    );

    res.json({
      success: true,
      message: `League ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    console.error('Update league error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get teams for a specific league
router.get('/sports/:sportId/leagues/:leagueId/teams', adminProtect, async (req, res) => {
  try {
    const { sportId, leagueId } = req.params;
    const sportsApiService = require('../services/sportsApiService');
    
    let teams = [];
    
    // Fetch teams based on sport and league
    if (sportId === 'cricket' || sportId === 'soccer') {
      teams = await sportsApiService.getTeams(sportId, { league: leagueId });
    } else if (sportId === 'nfl') {
      teams = await sportsApiService.getNFLTeams();
    } else if (sportId === 'nba') {
      teams = await sportsApiService.getNBATeams();
    }

    res.json({
      success: true,
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        enabled: true, // Default to enabled
      })),
    });
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update team status
router.put('/sports/:sportId/leagues/:leagueId/teams/:teamId', adminProtect, async (req, res) => {
  try {
    const { enabled } = req.body;
    
    await logActivity(
      req.user.userId,
      'update',
      'team',
      `${enabled ? 'Enabled' : 'Disabled'} team: ${req.params.teamId}`,
      req
    );

    res.json({
      success: true,
      message: `Team ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    console.error('Update team error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
