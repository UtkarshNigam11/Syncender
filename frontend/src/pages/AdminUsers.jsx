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
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckIcon,
  Block as BlockIcon
} from '@mui/icons-material';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState('');
  const { token } = useContext(AdminAuthContext);

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search, planFilter, statusFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/admin/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search,
          plan: planFilter,
          status: statusFilter
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
      setTotal(res.data.pagination.total);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    try {
      const res = await axios.get(`/api/admin/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedUser(res.data.user);
      setViewDialog(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      plan: user.plan,
      planStatus: user.planStatus,
      isActive: user.isActive
    });
    setEditDialog(true);
  };

  const handleUpdateUser = async () => {
    try {
      await axios.put(`/api/admin/users/${selectedUser._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`/api/admin/users/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage all registered users
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flex: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Plan</InputLabel>
            <Select
              value={planFilter}
              label="Plan"
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Email</strong></TableCell>
                <TableCell><strong>Plan</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Events</strong></TableCell>
                <TableCell><strong>Joined</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user._id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.plan.toUpperCase()} 
                        size="small"
                        color={user.plan === 'pro' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isActive ? 'Active' : 'Inactive'} 
                        size="small"
                        color={user.isActive ? 'success' : 'error'}
                        icon={user.isActive ? <CheckIcon /> : <BlockIcon />}
                      />
                    </TableCell>
                    <TableCell>{user.eventCount || 0}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell align="right">
                      <IconButton 
                        size="small" 
                        color="primary"
                        onClick={() => handleViewUser(user)}
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="info"
                        onClick={() => handleEditUser(user)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error"
                        onClick={() => {
                          setSelectedUser(user);
                          setDeleteDialog(true);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
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

      {/* View User Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">Name</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedUser.name}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Email</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>{selectedUser.email}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Plan</Typography>
              <Chip label={selectedUser.plan.toUpperCase()} size="small" sx={{ mb: 2 }} />
              
              <Typography variant="subtitle2" color="text.secondary">Status</Typography>
              <Chip 
                label={selectedUser.isActive ? 'Active' : 'Inactive'} 
                size="small" 
                color={selectedUser.isActive ? 'success' : 'error'}
                sx={{ mb: 2 }}
              />
              
              <Typography variant="subtitle2" color="text.secondary">Statistics</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Total Events: {selectedUser.eventCount}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Auto-synced Events: {selectedUser.autoSyncedCount}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>Favorite Teams: {selectedUser.preferences?.favoriteTeams?.length || 0}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>Joined</Typography>
              <Typography variant="body1">{new Date(selectedUser.createdAt).toLocaleString()}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name"
              value={editForm.name || ''}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Plan</InputLabel>
              <Select
                value={editForm.plan || 'free'}
                label="Plan"
                onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Plan Status</InputLabel>
              <Select
                value={editForm.planStatus || 'active'}
                label="Plan Status"
                onChange={(e) => setEditForm({ ...editForm, planStatus: e.target.value })}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="canceled">Canceled</MenuItem>
                <MenuItem value="expired">Expired</MenuItem>
              </Select>
            </FormControl>
            <FormControlLabel
              control={
                <Switch
                  checked={editForm.isActive || false}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                />
              }
              label="Account Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? 
            This will also delete all their events and cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers;
