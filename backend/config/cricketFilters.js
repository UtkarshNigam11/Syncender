/**
 * Cricket Match Filtering Configuration
 * Filters out minor/regional tournaments and shows only major cricket
 */

/**
 * List of major international cricket teams
 * Matches must have at least one team from this list
 */
const MAJOR_CRICKET_TEAMS = [
  // Full ICC Members (Test Nations)
  'India', 'Australia', 'England', 'Pakistan', 'South Africa',
  'New Zealand', 'Sri Lanka', 'West Indies', 'Bangladesh', 'Afghanistan',
  'Ireland', 'Zimbabwe',
  
  // Major Associate Members (ODI Status)
  'Netherlands', 'Scotland', 'United Arab Emirates', 'Oman',
  'Namibia', 'Nepal', 'Papua New Guinea',
  
  // Women's Teams (Major)
  'India Women', 'Australia Women', 'England Women', 'South Africa Women',
  'New Zealand Women', 'Pakistan Women', 'West Indies Women', 'Sri Lanka Women',
  'Bangladesh Women', 'Ireland Women',
  
  // Domestic Teams (Major Leagues)
  // IPL Teams
  'Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore',
  'Kolkata Knight Riders', 'Delhi Capitals', 'Punjab Kings',
  'Rajasthan Royals', 'Sunrisers Hyderabad', 'Gujarat Titans',
  'Lucknow Super Giants',
  
  // BBL Teams
  'Melbourne Stars', 'Sydney Sixers', 'Perth Scorchers', 'Adelaide Strikers',
  'Brisbane Heat', 'Hobart Hurricanes', 'Melbourne Renegades', 'Sydney Thunder',
  
  // PSL Teams
  'Karachi Kings', 'Lahore Qalandars', 'Islamabad United', 'Peshawar Zalmi',
  'Quetta Gladiators', 'Multan Sultans',
  
  // CPL Teams
  'Trinbago Knight Riders', 'Barbados Royals', 'Guyana Amazon Warriors',
  'Jamaica Tallawahs', 'St Lucia Kings', 'St Kitts and Nevis Patriots',
  
  // International A Teams
  'India A', 'Australia A', 'England Lions', 'Pakistan A', 'South Africa A',
  'New Zealand A', 'Sri Lanka A',
  
  // First-Class Teams (Major)
  'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
  'South Australia', 'Tasmania',
  'Mumbai', 'Karnataka', 'Tamil Nadu', 'Delhi',
];

/**
 * Keywords that indicate major tournaments/series
 * Series names containing these keywords are considered major
 */
const MAJOR_SERIES_KEYWORDS = [
  // International Tours
  'tour of', 'vs', 'v',
  
  // Major Tournaments
  'World Cup', 'T20 World Cup', 'Champions Trophy', 'Asia Cup',
  'World Test Championship', 'WTC',
  
  // Bilateral Series (automatically included if between major teams)
  'Test Series', 'ODI Series', 'T20I Series', 'T20 Series',
  
  // Major Leagues
  'Indian Premier League', 'IPL', 'Big Bash League', 'BBL',
  'Pakistan Super League', 'PSL', 'Caribbean Premier League', 'CPL',
  'The Hundred', 'Vitality Blast', 'County Championship',
  'Sheffield Shield', 'Ranji Trophy', 'Duleep Trophy',
  
  // Women's Cricket
  'Women', 'WBBL', 'WPL', 'Womens Premier League',
  
  // ICC Events
  'ICC', 'International Cricket Council',
];

/**
 * Keywords/patterns that indicate MINOR tournaments to exclude
 * Series containing ONLY these keywords (without major keywords) are filtered out
 */
const MINOR_SERIES_INDICATORS = [
  // Regional/Continental Tournaments (lower tier)
  'European Cricket', 'ECC', 'European Championship',
  'South American', 'South America', 'Latin America',
  'African', 'Central African', 'East African',
  
  // Qualifiers (unless ICC qualifier)
  'Regional Qualifier', 'Sub-Regional',
  
  // Minor Associate Matches (very small nations)
  'Serbia', 'Bulgaria', 'Cyprus', 'Malta', 'Luxembourg',
  'Austria', 'Belgium', 'Croatia', 'Czech Republic',
  'Estonia', 'Finland', 'France', 'Germany', 'Greece',
  'Hungary', 'Isle of Man', 'Italy', 'Norway', 'Portugal',
  'Romania', 'Spain', 'Sweden', 'Switzerland',
  
  // Development/Youth (unless major teams)
  'Under-19', 'U19', 'Under-16', 'U16', 'Youth',
  'Emerging', 'Academy',
  
  // Lower-tier domestic
  'Division 2', 'Division 3', 'Third Division', 'Fourth Division',
];

/**
 * Minimum thresholds for match importance
 */
const MATCH_IMPORTANCE_CRITERIA = {
  // Require fantasy/BBB enabled for lower-tier matches
  requireFantasyForMinor: true,
  
  // Minimum squad size indicator
  requireSquadData: false, // Some major matches don't have squad data yet
  
  // Match types priority (higher = more important)
  matchTypePriority: {
    'test': 10,      // Test cricket is highest priority
    'odi': 8,        // ODIs are high priority
    't20': 6,        // T20s are medium priority
    'other': 2,      // Other formats are low priority
  },
};

/**
 * Check if a team is considered major/international
 */
const isMajorTeam = (teamName) => {
  if (!teamName) return false;
  
  const normalized = teamName.trim();
  
  // Exact match
  if (MAJOR_CRICKET_TEAMS.includes(normalized)) {
    return true;
  }
  
  // Partial match (for team name variations)
  return MAJOR_CRICKET_TEAMS.some(majorTeam => 
    normalized.includes(majorTeam) || majorTeam.includes(normalized)
  );
};

/**
 * Check if a series is considered major based on keywords
 */
const isMajorSeriesByName = (seriesName) => {
  if (!seriesName) return false;
  
  const normalized = seriesName.toLowerCase();
  
  // Check if it contains major keywords
  const hasMajorKeyword = MAJOR_SERIES_KEYWORDS.some(keyword =>
    normalized.includes(keyword.toLowerCase())
  );
  
  // Check if it contains ONLY minor indicators
  const hasOnlyMinorKeywords = MINOR_SERIES_INDICATORS.some(keyword =>
    normalized.includes(keyword.toLowerCase())
  ) && !hasMajorKeyword;
  
  return hasMajorKeyword && !hasOnlyMinorKeywords;
};

/**
 * Main filtering function
 * Returns true if match should be SHOWN, false if it should be FILTERED OUT
 */
const shouldShowMatch = (match, seriesInfo = null) => {
  // Get match data
  const teams = match.teams || [];
  const matchType = match.matchType || 'other';
  const seriesName = seriesInfo?.name || '';
  
  // Priority 1: Match type - Test/ODI matches are almost always shown
  if (matchType === 'test' || matchType === 'odi') {
    // Show if at least one major team
    return teams.some(team => isMajorTeam(team));
  }
  
  // Priority 2: Check if both teams are major
  const majorTeamsCount = teams.filter(team => isMajorTeam(team)).length;
  
  if (majorTeamsCount >= 2) {
    // Both teams are major - always show
    return true;
  }
  
  if (majorTeamsCount === 1) {
    // One major team - show if series is major OR match has fantasy enabled
    if (seriesName && isMajorSeriesByName(seriesName)) {
      return true;
    }
    
    if (match.fantasyEnabled || match.bbbEnabled) {
      return true;
    }
  }
  
  // Priority 3: No major teams - check series importance
  if (majorTeamsCount === 0) {
    // Check if it's a recognized major league (domestic)
    if (seriesName && isMajorSeriesByName(seriesName)) {
      // Even if teams aren't in our list, show if series is major (e.g., new IPL teams)
      return true;
    }
    
    // Filter out completely minor matches
    return false;
  }
  
  // Default: filter out
  return false;
};

/**
 * Get match priority score (for sorting)
 * Higher score = more important match
 */
const getMatchPriority = (match, seriesInfo = null) => {
  let score = 0;
  
  const teams = match.teams || [];
  const matchType = match.matchType || 'other';
  
  // Match type priority
  score += MATCH_IMPORTANCE_CRITERIA.matchTypePriority[matchType] || 0;
  
  // Major teams bonus
  const majorTeamsCount = teams.filter(team => isMajorTeam(team)).length;
  score += majorTeamsCount * 5;
  
  // Live match bonus
  if (match.matchStarted && !match.matchEnded) {
    score += 10;
  }
  
  // Fantasy enabled bonus (indicates official coverage)
  if (match.fantasyEnabled) {
    score += 3;
  }
  
  if (match.bbbEnabled) {
    score += 3;
  }
  
  return score;
};

module.exports = {
  MAJOR_CRICKET_TEAMS,
  MAJOR_SERIES_KEYWORDS,
  MINOR_SERIES_INDICATORS,
  MATCH_IMPORTANCE_CRITERIA,
  isMajorTeam,
  isMajorSeriesByName,
  shouldShowMatch,
  getMatchPriority,
};
