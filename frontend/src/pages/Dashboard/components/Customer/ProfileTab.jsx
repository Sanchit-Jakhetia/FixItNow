import React from "react";
import { FiEdit2, FiSave, FiX } from "react-icons/fi";

export default function ProfileTab({
  customer,
  isEditingProfile,
  setIsEditingProfile,
  editProfileData,
  setEditProfileData,
  handleSaveProfile,
  handleCancelProfile,
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-slate-900">Profile</h2>
        <p className="mt-1 text-sm text-slate-500">Update the public details providers and support can see.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.5rem] bg-[linear-gradient(135deg,_#1d4ed8,_#0f766e)] p-6 text-white">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/15 text-3xl font-semibold">
            {customer?.name?.charAt(0) || "C"}
          </div>
          <h3 className="mt-4 text-2xl font-semibold">{customer?.name || "Customer"}</h3>
          <p className="mt-2 text-white/80">{customer?.email || "No email set"}</p>
          <p className="mt-2 text-white/80">{customer?.location || "No location set"}</p>
          <div className="mt-4 inline-flex rounded-full bg-white/15 px-3 py-1 text-sm">Customer account</div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Basic Details</h3>
              <p className="text-sm text-slate-500">Keep your contact and location details current.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isEditingProfile) {
                  setEditProfileData({ ...customer });
                }
                setIsEditingProfile((current) => !current);
              }}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <FiEdit2 /> {isEditingProfile ? "Stop Editing" : "Edit Profile"}
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name">
              <input
                disabled={!isEditingProfile}
                value={editProfileData.name || ""}
                onChange={(event) => setEditProfileData((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-50"
              />
            </Field>
            <Field label="Email">
              <input
                disabled={!isEditingProfile}
                value={editProfileData.email || ""}
                onChange={(event) => setEditProfileData((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-50"
              />
            </Field>
            <Field label="Location" className="sm:col-span-2">
              <input
                disabled={!isEditingProfile}
                value={editProfileData.location || ""}
                onChange={(event) => setEditProfileData((current) => ({ ...current, location: event.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 disabled:bg-slate-50"
              />
            </Field>
          </div>

          {isEditingProfile && (
            <div className="flex gap-3">
              <button type="button" onClick={() => handleSaveProfile(editProfileData)} className="inline-flex items-center gap-2 rounded-2xl bg-[#1d4ed8] px-4 py-3 font-semibold text-white transition hover:bg-[#1740b8]">
                <FiSave /> Save Changes
              </button>
              <button type="button" onClick={handleCancelProfile} className="rounded-2xl border border-slate-200 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                <FiX /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
