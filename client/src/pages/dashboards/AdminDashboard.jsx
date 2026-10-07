import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { DataTable } from '../../components/ui/DataTable';
import { Shield, Building, Users, Server, CheckCircle2 } from 'lucide-react';
import { useCountUp } from '../../hooks/useCountUp';
import api from '../../utils/api';

export const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [uRes, oRes] = await Promise.all([
        api.get('/users'),
        api.get('/organizations')
      ]);
      setUsers(uRes.data);
      setOrgs(oRes.data);
    } catch (err) {
      console.error('Admin data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRole = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/users/${userId}/role`, { globalRole: nextRole });
      fetchAdminData();
    } catch (err) {
      console.error('Role update failed:', err);
    }
  };

  const animatedUsers = useCountUp(users.length);

  const columns = [
    {
      header: 'User',
      accessor: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt={row.fullName}
            className="w-8 h-8 rounded-full object-cover border border-line"
          />
          <div>
            <p className="font-semibold text-ink text-xs">{row.fullName}</p>
            <p className="text-[10px] text-ink-muted">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Company / Title',
      accessor: (row) => <span className="text-xs text-ink-muted">{row.company || 'N/A'} ({row.title || 'User'})</span>
    },
    {
      header: 'Global Access',
      accessor: (row) => (
        <Badge variant={row.globalRole === 'admin' ? 'warning' : 'accent'}>
          {row.globalRole.toUpperCase()}
        </Badge>
      )
    },
    {
      header: 'Action',
      accessor: (row) => (
        <button
          onClick={() => handleToggleRole(row._id, row.globalRole)}
          className="text-xs font-semibold text-accent hover:underline"
        >
          Toggle {row.globalRole === 'admin' ? 'to Standard User' : 'to Admin'}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <Badge variant="warning">PLATFORM ADMIN SHELL</Badge>
        <h1 className="font-display text-h2 uppercase text-ink mt-2">Platform Administration</h1>
        <p className="text-body-sm text-ink-muted">Global organizations, subscriptions, user authorizations, and platform policies</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-accent" />
            <Badge variant="accent">TOTAL</Badge>
          </div>
          <p className="font-display text-h2 text-outline text-ink tabular-nums mt-4">{Math.round(animatedUsers).toLocaleString()}</p>
          <p className="text-body-sm text-ink-muted mt-1">Platform Users</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Building className="w-8 h-8 text-accent" />
            <Badge variant="success">ACTIVE</Badge>
          </div>
          <p className="text-h2 font-semibold text-ink tabular-nums mt-4">{orgs.length.toLocaleString()}</p>
          <p className="text-body-sm text-ink-muted mt-1">Registered Organizations</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <Server className="w-8 h-8 text-warning" />
            <Badge variant="warning">ENTERPRISE</Badge>
          </div>
          <p className="text-h2 font-semibold text-ink tabular-nums mt-4">100% SLA</p>
          <p className="text-body-sm text-ink-muted mt-1">System Health Status</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-h3 font-semibold text-ink mb-4">Global User Directory & Access Delegation</h2>
        <DataTable columns={columns} data={users} />
      </Card>
    </div>
  );
};
