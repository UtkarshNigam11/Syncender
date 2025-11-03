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
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Visibility,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import axios from 'axios';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    plan: '',
    isActive: true,
  });

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, search, planFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search,
          plan: planFilter,
          status: statusFilter,
        },
      });
      setUsers(response.data.users);
      setTotal(response.data.pagination.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch users');
      console.error(err);
      setLoading(false);
    }
  };

  const handleViewUser = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedUser(response.data.user);
      setViewDialog(true);
    } catch (err) {
      setError('Failed to fetch user details');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      plan: user.plan,
      isActive: user.isActive,
    });
    setEditDialog(true);
  };

  const handleUpdateUser = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/admin/users/${selectedUser._id}`,
        editFormData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`http://localhost:5000/api/admin/users/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      setError('Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (err) {
      setError('Failed to update user status');
    }
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
        User Management
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Manage all registered users
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, minWidth: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Plan</InputLabel>
            <Select
              value={planFilter}
              label="Plan"
              onChange={(e) => setPlanFilter(e.target.value)}
            >
              <MenuItem value="">All Plans</MenuItem>
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Events</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.plan}
                      size="small"
                      color={user.plan === 'pro' ? 'primary' : 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      size="small"
                      color={user.isActive ? 'success' : 'error'}
                      icon={user.isActive ? <CheckCircle /> : <Cancel />}
                    />
                  </TableCell>
                  <TableCell>{user.eventCount || 0}</TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('en-GB')}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleViewUser(user._id)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="warning"
                      onClick={() => handleEditUser(user)}
                      title="Edit User"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color={user.isActive ? 'error' : 'success'}
                      onClick={() => handleToggleStatus(user._id, user.isActive)}
                      title={user.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {user.isActive ? <Cancel /> : <CheckCircle />}
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteDialog(true);
                      }}
                      title="Delete User"
                    >
                      <Delete />
                    </IconButton>
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

      {/* View User Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Name
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedUser.name}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedUser.email}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Plan
              </Typography>
              <Chip label={selectedUser.plan} color={selectedUser.plan === 'pro' ? 'primary' : 'default'} sx={{ mb: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Favorite Teams
              </Typography>
              <Box sx={{ mb: 2 }}>
                {selectedUser.favoriteTeams?.length > 0 ? (
                  selectedUser.favoriteTeams.map((team, idx) => (
                    <Chip key={idx} label={team.name} sx={{ mr: 1, mb: 1 }} />
                  ))
                ) : (
                  <Typography variant="body2">No favorite teams</Typography>
                )}
              </Box>

              <Typography variant="subtitle2" color="text.secondary">
                Total Events
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {selectedUser.eventCount || 0} ({selectedUser.autoSyncedCount || 0} auto-synced)
              </Typography>

              <Typography variant="subtitle2" color="text.secondary">
                Joined
              </Typography>
              <Typography variant="body1">
                {new Date(selectedUser.createdAt).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This will also delete all their events.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialog} onClose={() => setEditDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              value={editFormData.email}
              onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Plan</InputLabel>
              <Select
                value={editFormData.plan}
                label="Plan"
                onChange={(e) => setEditFormData({ ...editFormData, plan: e.target.value })}
              >
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editFormData.isActive}
                label="Status"
                onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.value })}
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(false)}>Cancel</Button>
          <Button onClick={handleUpdateUser} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminUsers;
