import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { MdAdminPanelSettings } from 'react-icons/md';
import { FaUserTie } from 'react-icons/fa';
import { updateUser, deleteUser } from '../../../../services/api';

const PRIMARY_COLOR = "#4F46E5";
const SECONDARY_COLOR = "#7C3AED";

export default function UsersCardFull({ users, loading, setUsers }) {
  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xl"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Loading users...</p>
        </div>
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-2">
          <div
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${PRIMARY_COLOR}15` }}
          >
            <FiUsers className="text-2xl" style={{ color: PRIMARY_COLOR }} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Manage Users</h2>
            <p className="text-slate-600 text-sm mt-1">
              {users.length} total users in the system
            </p>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u, idx) => (
          <UserCard
            key={u.id}
            user={u}
            setUsers={setUsers}
            users={users}
            index={idx}
          />
        ))}
      </div>
    </motion.div>
  );
}

function UserCard({ user, users, setUsers, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...user });

  const roleConfig = {
    admin: {
      icon: MdAdminPanelSettings,
      bg: 'from-purple-500 to-pink-500',
      light: 'from-purple-50 to-pink-50',
      label: 'Admin',
    },
    provider: {
      icon: FaUserTie,
      bg: 'from-blue-500 to-cyan-500',
      light: 'from-blue-50 to-cyan-50',
      label: 'Provider',
    },
    customer: {
      icon: FiUsers,
      bg: 'from-green-500 to-emerald-500',
      light: 'from-green-50 to-emerald-50',
      label: 'Customer',
    },
  };

  const role = (user.role || 'customer').toLowerCase();
  const config = roleConfig[role] || roleConfig.customer;
  const RoleIcon = config.icon;

  const handleSave = async () => {
    try {
      await updateUser(user.id, editData);
      setUsers(users.map((u) => (u.id === user.id ? editData : u)));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update user.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this user?'))
      return;
    try {
      await deleteUser(user.id);
      setUsers(users.filter((u) => u.id !== user.id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete user.');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
        className={`relative bg-gradient-to-br ${config.light} border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl p-6 overflow-hidden group transition-all`}
      >
        {/* Background gradient accent */}
        <div
          className="absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-20"
          style={{
            background: `linear-gradient(135deg, ${PRIMARY_COLOR}, ${SECONDARY_COLOR})`,
          }}
        />

        {/* Content */}
        <div className="relative z-10">
          {/* Header with Role Badge */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.div
                className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config.bg} flex items-center justify-center text-white shadow-lg`}
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <RoleIcon className="text-lg" />
              </motion.div>
              <div>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {config.label}
                </p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <h3 className="text-xl font-bold text-slate-900 mb-1 line-clamp-2">
            {user.name}
          </h3>
          <p className="text-sm text-slate-600 mb-4 truncate">{user.email}</p>

          {/* Footer - Action Buttons */}
          <div className="flex items-center gap-2 pt-4 border-t border-white/50">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/50 hover:bg-indigo-500 text-slate-700 hover:text-white font-medium transition-all duration-300"
            >
              <FiEdit2 className="text-sm" /> Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/50 hover:bg-red-500 text-slate-700 hover:text-white font-medium transition-all duration-300"
            >
              <FiTrash2 className="text-sm" /> Delete
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setIsEditing(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setIsEditing(false)}
                className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <FiX className="w-5 h-5 text-slate-600" />
              </button>

              <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit User</h2>

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                {/* Name */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                    placeholder="Enter full name"
                  />
                </motion.div>

                {/* Email */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) =>
                      setEditData({ ...editData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                    placeholder="Enter email address"
                  />
                </motion.div>

                {/* Role */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Role
                  </label>
                  <select
                    value={editData.role}
                    onChange={(e) =>
                      setEditData({ ...editData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors bg-white"
                  >
                    <option value="ADMIN">Admin</option>
                    <option value="PROVIDER">Provider</option>
                    <option value="CUSTOMER">Customer</option>
                  </select>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-lg transition-shadow duration-300"
                >
                  Save Changes
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors duration-300"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
