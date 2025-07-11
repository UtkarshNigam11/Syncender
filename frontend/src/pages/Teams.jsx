import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Box,
  CircularProgress,
  Alert,
  Breadcrumbs
} from '@mui/material';

const Teams = () => {
  const { sportId } = useParams();
  const [teams, setTeams] = useState([]);
  const [sportName, setSportName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        // Get sport name
        const sportsRes = await axios.get('http://localhost:5000/api/sports/sports');
        const sport = sportsRes.data.find(s => s.id === sportId);
        if (sport) {
          setSportName(sport.name);
        }
        
        // Get teams for this sport
        const teamsRes = await axios.get(`http://localhost:5000/api/sports/teams/${sportId}`);
        setTeams(teamsRes.data);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError('Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [sportId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link to="/sports" style={{ textDecoration: 'none', color: 'inherit' }}>
          Sports
        </Link>
        <Typography color="text.primary">{sportName}</Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" gutterBottom>
        {sportName} Teams
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        {teams.map((team) => (
          <Grid item xs={12} sm={6} md={4} key={team.id}>
            <Card>
              <CardActionArea 
                component={Link} 
                to={`/matches/${team.id}`}
              >
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {team.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View upcoming matches and add to calendar
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Teams;