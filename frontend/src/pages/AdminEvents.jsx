import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AdminAuthContext } from '../context/AdminAuthContext';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [sportFilter, setSportFilter] = useState('');
  const { token } = useContext(AdminAuthContext);

  useEffect(() => {
    fetchEvents();
  }, [page, rowsPerPage, sportFilter]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/events', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          sport: sportFilter
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setEvents(res.data.events);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSportColor = (sport) => {
    const colors = {
      cricket: '#ff6b6b',
      soccer: '#4facfe',
      nfl: '#fa709a',
      nba: '#764ba2'
    };
    return colors[sport?.toLowerCase()] || '#999';
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Event Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        View all synced events
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Sport</InputLabel>
          <Select
            value={sportFilter}
            label="Sport"
            onChange={(e) => setSportFilter(e.target.value)}
          >
            <MenuItem value="">All Sports</MenuItem>
            <MenuItem value="cricket">Cricket</MenuItem>
            <MenuItem value="soccer">Soccer</MenuItem>
            <MenuItem value="nfl">NFL</MenuItem>
            <MenuItem value="nba">NBA</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* Events Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Title</strong></TableCell>
                <TableCell><strong>Sport</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell><strong>User</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event._id} hover>
                    <TableCell>{event.title}</TableCell>
                    <TableCell>
                      <Chip 
                        label={event.sport?.toUpperCase() || 'N/A'} 
                        size="small"
                        sx={{ 
                          bgcolor: getSportColor(event.sport),
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(event.startTime).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {event.user?.name || 'Unknown'}
                      <Typography variant="caption" display="block" color="text.secondary">
                        {event.user?.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.status || 'Scheduled'} 
                        size="small"
                        color={event.status === 'completed' ? 'success' : 'default'}
                        icon={<ScheduleIcon />}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={event.autoSynced ? 'Auto' : 'Manual'} 
                        size="small"
                        color={event.autoSynced ? 'primary' : 'default'}
                        icon={event.autoSynced ? <CheckIcon /> : null}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
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
      </Paper>
    </Box>
  );
};

export default AdminEvents;
