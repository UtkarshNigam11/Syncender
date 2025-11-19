import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  ExpandMore,
  Edit,
  Visibility,
  VisibilityOff,
  Add,
  Delete,
  Sports,
  EmojiEvents,
  Group,
} from '@mui/icons-material';
import axios from 'axios';

function AdminSportsManagement() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sportsData, setSportsData] = useState([]);
  const [selectedSport, setSelectedSport] = useState(null);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [editDialog, setEditDialog] = useState(false);
  const [teamsDialog, setTeamsDialog] = useState(false);
  const [teams, setTeams] = useState([]);
  const [editFormData, setEditFormData] = useState({
    name: '',
    enabled: true,
    displayOrder: 0,
  });

  useEffect(() => {
    fetchSportsData();
  }, []);

  const fetchSportsData = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('/api/admin/sports', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSportsData(response.data.sports);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch sports data');
      console.error(err);
      setLoading(false);
    }
  };

  const fetchTeamsForLeague = async (sport, league) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(
        `/api/admin/sports/${sport}/leagues/${league}/teams`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTeams(response.data.teams);
      setTeamsDialog(true);
    } catch (err) {
      setError('Failed to fetch teams');
    }
  };

  const handleToggleSport = async (sportId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `/api/admin/sports/${sportId}`,
        { enabled: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state immediately for better UX
      setSportsData(prevData =>
        prevData.map(sport =>
          sport._id === sportId ? { ...sport, enabled: !currentStatus } : sport
        )
      );
    } catch (err) {
      setError('Failed to update sport status');
      console.error(err);
    }
  };

  const handleToggleLeague = async (sportId, leagueId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `/api/admin/sports/${sportId}/leagues/${leagueId}`,
        { enabled: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state immediately
      setSportsData(prevData =>
        prevData.map(sport => {
          if (sport._id === sportId) {
            return {
              ...sport,
              leagues: sport.leagues.map(league =>
                league.leagueId === leagueId ? { ...league, enabled: !currentStatus } : league
              ),
            };
          }
          return sport;
        })
      );
    } catch (err) {
      setError('Failed to update league status');
      console.error(err);
    }
  };

  const handleToggleTeam = async (sportId, leagueId, teamId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `/api/admin/sports/${sportId}/leagues/${leagueId}/teams/${teamId}`,
        { enabled: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchTeamsForLeague(sportId, leagueId);
    } catch (err) {
      setError('Failed to update team status');
    }
  };

  const getSportIcon = (sport) => {
    const icons = {
      cricket: '🏏',
      soccer: '⚽',
      football: '🏈',
      basketball: '🏀',
      nfl: '🏈',
      nba: '🏀',
    };
    return icons[sport?.toLowerCase()] || '🏆';
  };

  const getSportColor = (sport) => {
    const colors = {
      cricket: '#FF6B6B',
      soccer: '#4ECDC4',
      football: '#95E1D3',
      basketball: '#F38181',
      nfl: '#95E1D3',
      nba: '#F38181',
    };
    return colors[sport?.toLowerCase()] || '#667eea';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Sports & Leagues Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control what sports, leagues, and teams are visible to users
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Sports Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {sportsData.map((sport) => (
          <Grid item xs={12} sm={6} md={3} key={sport._id}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${getSportColor(sport.name)} 0%, ${getSportColor(sport.name)}dd 100%)`,
                color: 'white',
                position: 'relative',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h3">{getSportIcon(sport.name)}</Typography>
                  <Switch
                    checked={sport.enabled}
                    onChange={() => handleToggleSport(sport._id, sport.enabled)}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: 'white',
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: 'rgba(255,255,255,0.5)',
                      },
                    }}
                  />
                </Box>
                <Typography variant="h6" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                  {sport.name}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9 }}>
                  {sport.leagues?.length || 0} Leagues
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Detailed Sports & Leagues */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Sports & Leagues Details
          </Typography>
          <Divider sx={{ my: 2 }} />

          {sportsData.map((sport) => (
            <Accordion key={sport._id} sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  <Typography variant="h4">{getSportIcon(sport.name)}</Typography>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body1" fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                      {sport.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sport.leagues?.length || 0} leagues • {sport.totalTeams || 0} teams
                    </Typography>
                  </Box>
                  <Chip
                    label={sport.enabled ? 'Enabled' : 'Disabled'}
                    color={sport.enabled ? 'success' : 'error'}
                    size="small"
                    icon={sport.enabled ? <Visibility /> : <VisibilityOff />}
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>League Name</TableCell>
                        <TableCell>League ID</TableCell>
                        <TableCell>Teams</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sport.leagues?.map((league, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold">
                              {league.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" color="text.secondary">
                              {league.leagueId}
                            </Typography>
                          </TableCell>
                          <TableCell>{league.teamCount || 0}</TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={league.enabled !== false}
                                  onChange={() =>
                                    handleToggleLeague(sport._id, league.leagueId, league.enabled !== false)
                                  }
                                  size="small"
                                />
                              }
                              label={league.enabled !== false ? 'Enabled' : 'Disabled'}
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Group />}
                              onClick={() => fetchTeamsForLeague(sport.name, league.leagueId)}
                            >
                              View Teams
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Teams Dialog */}
      <Dialog open={teamsDialog} onClose={() => setTeamsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          League Teams
          <Typography variant="caption" display="block" color="text.secondary">
            Manage team visibility
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TableContainer sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Team Name</TableCell>
                  <TableCell>Team ID</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teams.map((team, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">
                        {team.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {team.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={team.enabled !== false}
                            onChange={() =>
                              handleToggleTeam(
                                selectedSport,
                                selectedLeague,
                                team.id,
                                team.enabled !== false
                              )
                            }
                            size="small"
                          />
                        }
                        label={team.enabled !== false ? 'Visible' : 'Hidden'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminSportsManagement;
