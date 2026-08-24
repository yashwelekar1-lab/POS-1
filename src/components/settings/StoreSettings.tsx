import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Settings as SettingsIcon,
  Store,
  Printer,
  MessageSquare,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  QrCode,
  Users,
  UserPlus,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';
import { StoreSettings as IStoreSettings, User, UserRole } from '../../types/pos';
import { api } from '../../services/api';

export const StoreSettings: React.FC = () => {
  const { settings, refreshSettings, refreshUsers, users, addToast, currentUser } = usePOS();
  const [formData, setFormData] = useState<IStoreSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Employee Modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('cashier');
  const [userPin, setUserPin] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({ ...settings });
    }
  }, [settings]);

  if (!formData) return null;

  const handleChange = (field: keyof IStoreSettings, value: any) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    if (currentUser.role === 'cashier') {
      addToast('error', 'Permission Denied', 'Admin or Manager role required to update store settings.');
      return;
    }

    setIsSaving(true);
    try {
      await api.updateSettings(formData, currentUser.name);
      await refreshSettings();
      addToast('success', 'Settings Saved', 'Store and POS configuration updated.');
    } catch (err: any) {
      addToast('error', 'Save Failed', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserRole('cashier');
    setUserPin('');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserName(u.name);
    setUserRole(u.role);
    setUserPin(u.pin || '');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPin.trim()) {
      addToast('error', 'Name and PIN are required');
      return;
    }

    setIsSubmittingUser(true);
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          name: userName.trim(),
          role: userRole,
          pin: userPin.trim(),
          actorName: currentUser.name,
        });
        addToast('success', 'Employee Updated', `${userName} updated successfully.`);
      } else {
        await api.createUser({
          name: userName.trim(),
          role: userRole,
          pin: userPin.trim(),
          actorName: currentUser.name,
        });
        addToast('success', 'Employee Created', `${userName} added to store.`);
      }
      await refreshUsers();
      setIsUserModalOpen(false);
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message);
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (users.length <= 1) {
      addToast('error', 'Cannot delete', 'At least one user account must remain active.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove employee ${name}?`)) {
      try {
        await api.deleteUser(id, currentUser.name);
        await refreshUsers();
        addToast('success', 'Employee Removed', `${name} removed from store.`);
      } catch (err: any) {
        addToast('error', 'Failed to remove user', err.message);
      }
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-5xl mx-auto w-full space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Store & POS System Configuration</h2>
            <p className="text-xs text-slate-500">Manage business profile, GSTIN, employees, printer layout, and SMS gateway</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Section 1: Store & Business Details */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-4 h-4 text-indigo-600" />
            <span>Store Profile & Tax Identity</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Store / Business Name *</label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Store Tagline / Slogan</label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange('tagline', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">Store Street Address *</label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">State & PIN Code</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  placeholder="State"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => handleChange('pincode', e.target.value)}
                  placeholder="Pincode"
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Business Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Store Support Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">GSTIN (15-Digit GST Identification Number) *</label>
              <input
                type="text"
                required
                maxLength={15}
                value={formData.gstin}
                onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-indigo-700 font-mono uppercase font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">UPI VPA (for Dynamic QR Payment) *</label>
              <div className="relative">
                <QrCode className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={formData.upiId}
                  onChange={(e) => handleChange('upiId', e.target.value)}
                  placeholder="e.g. metromart@icici"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Employees & Access Control */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Employees & Terminal Accounts ({users.length})</span>
            </h3>
            <button
              type="button"
              onClick={handleOpenAddUser}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{u.name}</p>
                    <p className="text-[10px] text-indigo-600 uppercase font-semibold tracking-wider font-mono">
                      {u.role}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditUser(u)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-200 rounded transition"
                    title="Edit Employee"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  {users.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      title="Remove Employee"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Invoice & Receipt Printing Layout */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Invoice & Thermal Printer Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Default Invoice Print Format</label>
              <select
                value={formData.printerType}
                onChange={(e) => handleChange('printerType', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="thermal">80mm Thermal Receipt (POS Roll)</option>
                <option value="a4">A4 Full Page Standard GST Invoice</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Invoice Prefix</label>
              <input
                type="text"
                value={formData.invoicePrefix}
                onChange={(e) => handleChange('invoicePrefix', e.target.value.toUpperCase())}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">Currency Symbol</label>
              <input
                type="text"
                value={formData.currencySymbol}
                onChange={(e) => handleChange('currencySymbol', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-slate-700 font-bold mb-1">Receipt Footer Terms & Conditions</label>
              <textarea
                rows={2}
                value={formData.termsAndConditions}
                onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Automated SMS Bill Delivery Gateway */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <MessageSquare className="w-4 h-4 text-indigo-600" />
            <span>Automated SMS Bill Delivery Gateway</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1">SMS Provider</label>
              <select
                value={formData.smsProvider}
                onChange={(e) => handleChange('smsProvider', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              >
                <option value="simulator">Simulator (High-speed local dispatch with live logs)</option>
                <option value="fast2sms">Fast2SMS (India Quick SMS API)</option>
                <option value="twilio">Twilio Programmable SMS</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1">API Key / Token</label>
              <input
                type="password"
                value={formData.smsApiKey || ''}
                onChange={(e) => handleChange('smsApiKey', e.target.value)}
                placeholder="Optional API Key for Fast2SMS / Twilio"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-bold mb-1">SMS Message Template</label>
              <textarea
                rows={3}
                value={formData.smsTemplate}
                onChange={(e) => handleChange('smsTemplate', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono text-[11px] focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Available template variables: <span className="font-mono text-indigo-600 font-semibold">[STORE NAME]</span>, <span className="font-mono text-indigo-600 font-semibold">[INVOICE NO]</span>, <span className="font-mono text-indigo-600 font-semibold">[TOTAL]</span>, <span className="font-mono text-indigo-600 font-semibold">[INVOICE LINK]</span>
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Security & Manager PIN */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Manager Authorization PIN</span>
          </h3>

          <div className="max-w-xs text-xs">
            <label className="block text-slate-700 font-bold mb-1">Refund & Cancellation PIN *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                maxLength={6}
                value={formData.managerPin}
                onChange={(e) => handleChange('managerPin', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono tracking-widest text-sm focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Required when a cashier performs a bill refund or deactivates products.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-98 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>

      {/* Add / Edit Employee Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-slate-900">
                  {editingUser ? 'Edit Employee Account' : 'Add New Employee Account'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Employee Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Terminal Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as UserRole)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="cashier">Cashier (POS Billing Only)</option>
                  <option value="manager">Manager (Billing, Stock In & Refunds)</option>
                  <option value="admin">Admin (Full Control & Settings)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Security / Login PIN (4-6 digits) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="e.g. 4567"
                  value={userPin}
                  onChange={(e) => setUserPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono tracking-widest focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition disabled:opacity-50"
                >
                  {isSubmittingUser ? 'Saving...' : editingUser ? 'Update Employee' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
