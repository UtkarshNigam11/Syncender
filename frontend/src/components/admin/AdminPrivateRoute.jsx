import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Box, CircularProgress } from '@mui/material';

function AdminPrivateRoute({ children }) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return admin ? children : <Navigate to="/admin/login" replace />;
}

export default AdminPrivateRoute;
