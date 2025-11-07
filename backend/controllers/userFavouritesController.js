const User = require('../models/User');

/**
 * Get user's favourite teams
 */
exports.getFavouriteTeams = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.preferences.favoriteTeams || [],
      count: user.preferences.favoriteTeams?.length || 0,
      limit: user.plan === 'pro' ? 7 : 2,
      plan: user.plan
    });
  } catch (error) {
    console.error('Error getting favourite teams:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favourite teams',
      error: error.message
    });
  }
};

/**
 * Add a favourite team
 */
exports.addFavouriteTeam = async (req, res) => {
  try {
    const { sport, league, teamId, name, shortName, logo } = req.body;

    // Validate required fields
    if (!sport || !teamId || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sport, teamId, name'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check subscription limits
    const limit = user.plan === 'pro' ? 7 : 2;
    const currentCount = user.preferences.favoriteTeams?.length || 0;

    if (currentCount >= limit) {
      return res.status(403).json({
        success: false,
        message: `${user.plan.toUpperCase()} plan allows maximum ${limit} favourite teams`,
        limit,
        currentCount,
        upgradeRequired: user.plan === 'free'
      });
    }

    // Check if team already exists
    const existingTeam = user.preferences.favoriteTeams?.find(
      t => t.sport === sport && t.teamId === teamId
    );

    if (existingTeam) {
      return res.status(400).json({
        success: false,
        message: 'Team already in favourites'
      });
    }

    // Add the team
    const newTeam = {
      sport,
      league: league || '',
      teamId,
      name,
      shortName: shortName || name,
      logo: logo || '',
      addedAt: new Date()
    };

    if (!user.preferences.favoriteTeams) {
      user.preferences.favoriteTeams = [];
    }

    user.preferences.favoriteTeams.push(newTeam);
    await user.save();

    res.json({
      success: true,
      message: 'Team added to favourites',
      data: user.preferences.favoriteTeams,
      count: user.preferences.favoriteTeams.length,
      limit
    });
  } catch (error) {
    console.error('Error adding favourite team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favourite team',
      error: error.message
    });
  }
};

/**
 * Remove a favourite team
 */
exports.removeFavouriteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { sport } = req.query; // Optional: to be more specific

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const initialCount = user.preferences.favoriteTeams?.length || 0;

    // Remove the team
    if (sport) {
      user.preferences.favoriteTeams = user.preferences.favoriteTeams.filter(
        t => !(t.sport === sport && t.teamId === teamId)
      );
    } else {
      user.preferences.favoriteTeams = user.preferences.favoriteTeams.filter(
        t => t.teamId !== teamId
      );
    }

    const finalCount = user.preferences.favoriteTeams.length;

    if (initialCount === finalCount) {
      return res.status(404).json({
        success: false,
        message: 'Team not found in favourites'
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Team removed from favourites',
      data: user.preferences.favoriteTeams,
      count: finalCount
    });
  } catch (error) {
    console.error('Error removing favourite team:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favourite team',
      error: error.message
    });
  }
};

/**
 * Get user's favourite leagues
 */
exports.getFavouriteLeagues = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.preferences.favoriteLeagues || [],
      count: user.preferences.favoriteLeagues?.length || 0,
      limit: user.plan === 'pro' ? 1 : 0,
      plan: user.plan
    });
  } catch (error) {
    console.error('Error getting favourite leagues:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favourite leagues',
      error: error.message
    });
  }
};

/**
 * Add a favourite league (Pro feature)
 */
exports.addFavouriteLeague = async (req, res) => {
  try {
    const { sport, league, name, logo } = req.body;

    // Validate required fields
    if (!sport || !league || !name) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sport, league, name'
      });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Pro feature check
    if (user.plan !== 'pro') {
      return res.status(403).json({
        success: false,
        message: 'League auto-sync is a PRO feature',
        upgradeRequired: true,
        feature: 'League Auto-Sync'
      });
    }

    // Check subscription limits (Pro: 1 league)
    const limit = 1;
    const currentCount = user.preferences.favoriteLeagues?.length || 0;

    if (currentCount >= limit) {
      return res.status(403).json({
        success: false,
        message: 'PRO plan allows maximum 1 favourite league',
        limit,
        currentCount
      });
    }

    // Check if league already exists
    const existingLeague = user.preferences.favoriteLeagues?.find(
      l => l.sport === sport && l.league === league
    );

    if (existingLeague) {
      return res.status(400).json({
        success: false,
        message: 'League already in favourites'
      });
    }

    // Add the league
    const newLeague = {
      sport,
      league,
      name,
      logo: logo || '',
      addedAt: new Date()
    };

    if (!user.preferences.favoriteLeagues) {
      user.preferences.favoriteLeagues = [];
    }

    user.preferences.favoriteLeagues.push(newLeague);
    await user.save();

    res.json({
      success: true,
      message: 'League added to favourites',
      data: user.preferences.favoriteLeagues,
      count: user.preferences.favoriteLeagues.length,
      limit
    });
  } catch (error) {
    console.error('Error adding favourite league:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add favourite league',
      error: error.message
    });
  }
};

/**
 * Remove a favourite league
 */
exports.removeFavouriteLeague = async (req, res) => {
  try {
    const { league } = req.params;
    const { sport } = req.query; // Optional: to be more specific

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const initialCount = user.preferences.favoriteLeagues?.length || 0;

    // Remove the league
    if (sport) {
      user.preferences.favoriteLeagues = user.preferences.favoriteLeagues.filter(
        l => !(l.sport === sport && l.league === league)
      );
    } else {
      user.preferences.favoriteLeagues = user.preferences.favoriteLeagues.filter(
        l => l.league !== league
      );
    }

    const finalCount = user.preferences.favoriteLeagues.length;

    if (initialCount === finalCount) {
      return res.status(404).json({
        success: false,
        message: 'League not found in favourites'
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'League removed from favourites',
      data: user.preferences.favoriteLeagues,
      count: finalCount
    });
  } catch (error) {
    console.error('Error removing favourite league:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove favourite league',
      error: error.message
    });
  }
};

/**
 * Get all user favourites (teams + leagues)
 */
exports.getAllFavourites = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        teams: user.preferences.favoriteTeams || [],
        leagues: user.preferences.favoriteLeagues || []
      },
      limits: {
        teams: user.plan === 'pro' ? 7 : 2,
        leagues: user.plan === 'pro' ? 1 : 0
      },
      count: {
        teams: user.preferences.favoriteTeams?.length || 0,
        leagues: user.preferences.favoriteLeagues?.length || 0
      },
      plan: user.plan
    });
  } catch (error) {
    console.error('Error getting all favourites:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get favourites',
      error: error.message
    });
  }
};
