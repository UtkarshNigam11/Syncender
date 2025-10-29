import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Delete, Event as EventIcon } from '@mui/icons-material';
import axios from 'axios';

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [sportFilter, setSportFilter] = useState('');

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage, sportFilter]);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/events', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          sport: sportFilter,
        },
      });
      setEvents(response.data.events);
      setTotal(response.data.pagination.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch events');
      console.error(err);
      setLoading(false);
    }
  };

  const getSportColor = (sport) => {
    const colors = {
      cricket: '#FF6B6B',
      soccer: '#4ECDC4',
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
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Events Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        View and manage all calendar events
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Sport</InputLabel>
          <Select
            value={sportFilter}
            label="Filter by Sport"
            onChange={(e) => setSportFilter(e.target.value)}
          >
            <MenuItem value="">All Sports</MenuItem>
            <MenuItem value="cricket">Cricket</MenuItem>
            <MenuItem value="soccer">Soccer</MenuItem>
            <MenuItem value="nfl">NFL</MenuItem>
            <MenuItem value="nba">NBA</MenuItem>
          </Select>
        </FormControl>
      </Card>

      {/* Events Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Event</TableCell>
                <TableCell>Sport</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Start Time</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event._id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {event.title}
                      </Typography>
                      {event.teams && event.teams.length > 0 && (
                        <Typography variant="caption" color="text.secondary">
                          {event.teams.join(' vs ')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.sport}
                      size="small"
                      sx={{
                        bgcolor: getSportColor(event.sport),
                        color: 'white',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {event.user?.name || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {event.user?.email || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {new Date(event.startTime).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.autoSynced ? 'Auto' : 'Manual'}
                      size="small"
                      color={event.autoSynced ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={event.status || 'Scheduled'}
                      size="small"
                      color={event.status === 'live' ? 'success' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>
    </Box>
  );
}

export default AdminEvents;
