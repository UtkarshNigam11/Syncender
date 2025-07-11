import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';

// Sport images (in a real app, you'd have proper images)
const sportImages = {
  football: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=500&q=80',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=500&q=80',
  tennis: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=500&q=80',
  cricket: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=500&q=80'
};

const Sports = () => {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSports = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/sports/sports');
        setSports(res.data);
      } catch (err) {
        console.error('Error fetching sports:', err);
        setError('Failed to load sports');
      } finally {
        setLoading(false);
      }
    };

    fetchSports();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Select a Sport
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        {sports.map((sport) => (
          <Grid item xs={12} sm={6} md={3} key={sport.id}>
            <Card sx={{ height: '100%' }}>
              <CardActionArea 
                component={Link} 
                to={`/teams/${sport.id}`}
                sx={{ height: '100%' }}
              >
                <CardMedia
                  component="img"
                  height="140"
                  image={sportImages[sport.id] || 'https://via.placeholder.com/500x280?text=Sport'}
                  alt={sport.name}
                />
                <CardContent>
                  <Typography gutterBottom variant="h5" component="div">
                    {sport.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    View teams and upcoming matches
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

export default Sports;