import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, TrashIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { FiDownload, FiCheck, FiX } from 'react-icons/fi';
import { getAllDocuments, approveDocument, deleteDocument, rejectDocument } from '../../../../services/api';

const PRIMARY_COLOR = "#4F46E5";
const SUCCESS_COLOR = "#10B981";
const DANGER_COLOR = "#EF4444";

export default function VerifyDocumentsTab() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDocs() {
      try {
        const res = await getAllDocuments();
        setDocuments(res.data);
      } catch (err) {
        console.error('Error loading docs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDocs();
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveDocument(id);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, approved: true, rejected: false } : d))
      );
      alert('Provider verified successfully!');
    } catch (err) {
      console.error(err);
      alert('Approval failed');
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await rejectDocument(id, reason);
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, approved: false, rejected: true, rejectionReason: reason } : d))
      );
      alert('Document rejected successfully!');
    } catch (err) {
      console.error(err);
      alert('Rejection failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete');
    }
  };

  if (loading)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center p-12"
      >
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin mb-3" />
        <p className="text-slate-600 font-medium">Loading documents...</p>
      </motion.div>
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Provider Document Verification
        </h2>
        <p className="text-slate-600">
          Review and approve provider documents • {documents.length} total documents
        </p>
      </div>

      {documents.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-12 px-6 text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200"
        >
          <div className="flex flex-col items-center gap-3">
            <CheckCircleIcon className="w-12 h-12 text-slate-300" />
            <p className="text-slate-600 font-medium">No documents uploaded yet</p>
            <p className="text-slate-500 text-sm">
              Providers will submit their documents for verification here
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc, idx) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="group"
            >
              <div
                className={`relative h-full rounded-2xl border shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  doc.approved
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200'
                    : doc.rejected
                    ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-200'
                    : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200'
                }
                `}
              >
                {/* Background accent */}
                <div
                  className="absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-20"
                  style={{
                    backgroundColor: doc.approved
                      ? SUCCESS_COLOR
                      : doc.rejected
                      ? DANGER_COLOR
                      : '#F59E0B',
                  }}
                />

                {/* Content */}
                <div className="p-6 relative z-10 h-full flex flex-col justify-between">
                  {/* Status Badge */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-slate-900 text-lg line-clamp-2 flex-1">
                      {doc.fileName}
                    </h3>
                    {doc.approved && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 ml-2"
                      >
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                          <FiCheck className="w-5 h-5 text-emerald-600" />
                        </div>
                      </motion.div>
                    )}
                    {doc.rejected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 ml-2"
                      >
                        <div className="p-2 bg-red-500/20 rounded-lg">
                          <FiX className="w-5 h-5 text-red-600" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Document Info */}
                  <div className="space-y-2 mb-4">
                    <div>
                      <p className="text-xs text-slate-600 mb-0.5">Provider</p>
                      <p className="font-semibold text-slate-900">
                        {doc.providerName || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-600 mb-0.5">Uploaded</p>
                      <p className="text-sm text-slate-700">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status Info */}
                  {(doc.approved || doc.rejected) && (
                    <div className="mb-4 p-3 rounded-lg bg-white/50 border border-white/70">
                      <p className="text-xs font-semibold text-slate-700">
                        {doc.approved ? '✓ Approved' : '✕ Rejected'}
                      </p>
                      {doc.rejected && doc.rejectionReason && (
                        <p className="text-xs text-slate-600 mt-1">
                          Reason: {doc.rejectionReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* View & Actions */}
                  <div className="space-y-3 pt-4 border-t border-white/50">
                    <a
                      href={`http://localhost:8081/${doc.fileUrl.replace(/\\/g, '/')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/50 hover:bg-indigo-500 text-slate-700 hover:text-white rounded-lg font-medium transition-all duration-300"
                    >
                      <FiDownload className="w-4 h-4" /> View Document
                    </a>

                    {!doc.approved && !doc.rejected && (
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleApprove(doc.id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow duration-300 flex items-center justify-center gap-1"
                        >
                          <FiCheck className="w-4 h-4" /> Approve
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleReject(doc.id)}
                          className="flex-1 px-3 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-medium hover:shadow-lg transition-shadow duration-300 flex items-center justify-center gap-1"
                        >
                          <FiX className="w-4 h-4" /> Reject
                        </motion.button>
                      </div>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDelete(doc.id)}
                      className="w-full px-3 py-2 bg-red-500/20 text-red-600 hover:bg-red-500 hover:text-white rounded-lg font-medium transition-all duration-300"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}


