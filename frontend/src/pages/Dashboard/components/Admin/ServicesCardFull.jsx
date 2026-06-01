import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { GiHammerNails, GiElectric, GiBroom } from 'react-icons/gi';
import { updateService, deleteService } from '../../../../services/api';

const PRIMARY_COLOR = "#4F46E5";
const SECONDARY_COLOR = "#7C3AED";

export default function ServicesCardFull({ services, setServices }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Manage Services</h2>
        <p className="text-slate-600">
          {services.length} services currently available
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service, idx) => (
          <ServiceCard
            key={service.id}
            service={service}
            setServices={setServices}
            services={services}
            index={idx}
          />
        ))}
      </div>
    </motion.div>
  );
}

function ServiceCard({ service, services, setServices, index }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ ...service });

  const categoryConfig = {
    carpentry: {
      icon: GiHammerNails,
      bg: 'from-orange-500 to-red-500',
      light: 'from-orange-50 to-red-50',
    },
    electrical: {
      icon: GiElectric,
      bg: 'from-yellow-500 to-amber-500',
      light: 'from-yellow-50 to-amber-50',
    },
    cleaning: {
      icon: GiBroom,
      bg: 'from-teal-500 to-blue-500',
      light: 'from-teal-50 to-blue-50',
    },
  };

  const category = (service.category || 'carpentry').toLowerCase();
  const config = categoryConfig[category] || categoryConfig.carpentry;
  const CategoryIcon = config.icon;

  const handleSave = async () => {
    try {
      await updateService(service.id, editData);
      setServices(services.map((s) => (s.id === service.id ? editData : s)));
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update service.');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this service?'))
      return;
    try {
      await deleteService(service.id);
      setServices(services.filter((s) => s.id !== service.id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete service.');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08 }}
        whileHover={{ y: -8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)' }}
        className={`relative bg-gradient-to-br ${config.light} border border-slate-200 rounded-2xl shadow-lg hover:shadow-xl p-6 overflow-hidden group`}
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
          {/* Header with Icon */}
          <div className="flex items-start justify-between mb-4">
            <motion.div
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${config.bg} flex items-center justify-center text-white shadow-lg flex-shrink-0`}
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <CategoryIcon className="text-lg" />
            </motion.div>
          </div>

          {/* Service Info */}
          <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-1">
            {service.category} - {service.subcategory}
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            Provider: <span className="font-semibold">{service.providerName}</span>
          </p>
          <p className="text-sm text-slate-700 mb-4 line-clamp-2">
            {service.description}
          </p>

          {/* Price Section */}
          <div className="flex items-center justify-between pt-4 border-t border-white/50 mb-4">
            <div>
              <p className="text-xs text-slate-600 mb-1">Price</p>
              <p className="text-2xl font-bold text-slate-900">₹{service.price}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-600 mb-1">Availability</p>
              <span className="inline-block px-3 py-1 bg-white/50 text-slate-700 text-xs font-semibold rounded-full">
                {service.availability || 'Available'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/50 hover:bg-indigo-500 text-slate-700 hover:text-white font-medium transition-all duration-300"
            >
              <FiEdit2 className="text-sm" /> Edit
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
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

              <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Service</h2>

              {/* Form Fields */}
              <div className="space-y-4 mb-6">
                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editData.description}
                    onChange={(e) =>
                      setEditData({ ...editData, description: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors resize-none"
                    placeholder="Enter service description"
                    rows="3"
                  />
                </motion.div>

                {/* Price */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editData.price}
                    onChange={(e) =>
                      setEditData({
                        ...editData,
                        price: parseFloat(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                    placeholder="0.00"
                  />
                </motion.div>

                {/* Availability */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Availability
                  </label>
                  <input
                    type="text"
                    value={editData.availability}
                    onChange={(e) =>
                      setEditData({ ...editData, availability: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                    placeholder="e.g., Mon-Fri 9AM-6PM"
                  />
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
