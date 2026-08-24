import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { api } from '../../services/api';
import {
  Store,
  ShieldCheck,
  Building2,
  Receipt,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  CreditCard,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';

interface StoreSetupModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const StoreSetupModal: React.FC<StoreSetupModalProps> = ({ isOpen, onClose }) => {
  const { settings, refreshSettings, refreshUsers, setCurrentUser, addToast } = usePOS();

  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Form states
  const [storeName, setStoreName] = useState<string>('');
  const [tagline, setTagline] = useState<string>('');
  const [gstin, setGstin] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [state, setState] = useState<string>('');
  const [pincode, setPincode] = useState<string>('');
  const [invoicePrefix, setInvoicePrefix] = useState<string>('INV-2026-');
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState<number>(1001);
  const [upiId, setUpiId] = useState<string>('');

  // Admin & Cashier creation
  const [adminName, setAdminName] = useState<string>('');
  const [adminPin, setAdminPin] = useState<string>('1234');
  const [cashierName, setCashierName] = useState<string>('Counter 1 (Cashier)');
  const [cashierPin, setCashierPin] = useState<string>('0000');

  if (!isOpen) return null;

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      addToast('error', 'Store name is required');
      return;
    }
    setStep(2);
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim() || !adminPin.trim()) {
      addToast('error', 'Admin name and PIN are required');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Update store settings with real configured parameters
      await api.updateSettings(
        {
          isConfigured: true,
          storeName: storeName.trim(),
          tagline: tagline.trim(),
          gstin: gstin.trim().toUpperCase(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
          invoicePrefix: invoicePrefix.trim(),
          nextInvoiceNumber: Number(nextInvoiceNumber) || 1001,
          managerPin: adminPin.trim(),
          upiId: upiId.trim(),
        },
        adminName.trim()
      );

      // 2. Create the real Admin employee account
      const adminUser = await api.createUser({
        name: adminName.trim(),
        role: 'admin',
        pin: adminPin.trim(),
        actorName: 'System Setup',
      });

      // 3. Create the initial Cashier employee account if specified
      if (cashierName.trim() && cashierPin.trim() && cashierPin.trim() !== adminPin.trim()) {
        await api.createUser({
          name: cashierName.trim(),
          role: 'cashier',
          pin: cashierPin.trim(),
          actorName: adminName.trim(),
        });
      }

      await refreshSettings();
      await refreshUsers();

      // Set logged-in active user to the created Admin
      setCurrentUser(adminUser);

      addToast('success', 'Store Initialized!', `${storeName} is ready for live billing and inventory.`);
      if (onClose) onClose();
    } catch (err: any) {
      addToast('error', 'Setup failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Production Store Setup
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Step {step} of 2
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {step === 1 ? 'Configure your business details and GST tax parameters' : 'Create store owner and terminal cashier accounts'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="bg-indigo-600 h-1 transition-all duration-300"
            style={{ width: step === 1 ? '50%' : '100%' }}
          />
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {step === 1 ? (
            <form id="step1-form" onSubmit={handleStep1Submit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store / Business Name <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g., Apex Supermarket, Prime Retail, City Mart"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Tagline / Business Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Fresh Groceries & Daily Needs"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store GSTIN (Tax Identification)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 27AABCT3518Q1Z4"
                    maxLength={15}
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Contact Phone
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Store Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      placeholder="billing@yourstore.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Physical Store Address
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Shop No. 12, Commercial Plaza, Main Street"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City & State
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City (e.g. Mumbai)"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      placeholder="State (e.g. MH)"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Invoice Series Configuration
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Prefix (INV-)"
                      value={invoicePrefix}
                      onChange={(e) => setInvoicePrefix(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Start (1001)"
                      value={nextInvoiceNumber}
                      onChange={(e) => setNextInvoiceNumber(Number(e.target.value))}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    UPI ID (For Instant Dynamic QR Payments)
                  </label>
                  <div className="relative">
                    <CreditCard className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="e.g., storename@icici, 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <form id="step2-form" onSubmit={handleCompleteSetup} className="space-y-5">
              <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/20 rounded-lg text-xs text-indigo-200 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Security & Employee Access</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">
                    Set up the owner Admin account (for discounts, refunds, reports, and catalog) and your first cashier account. You can create additional staff anytime in Settings.
                  </p>
                </div>
              </div>

              {/* Admin Section */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Primary Admin / Store Owner</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Admin Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patel (Owner)"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Authorization / Manager PIN (4-digit) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      required
                      placeholder="e.g. 1234"
                      value={adminPin}
                      onChange={(e) => setAdminPin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono tracking-widest placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cashier Section */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/80 rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Default Cashier Counter</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Cashier / Terminal Name
                    </label>
                    <input
                      type="text"
                      placeholder="Counter 1 (Cashier)"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Cashier Fast-Login PIN
                    </label>
                    <input
                      type="password"
                      maxLength={6}
                      placeholder="e.g. 0000"
                      value={cashierPin}
                      onChange={(e) => setCashierPin(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono tracking-widest placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          {step === 2 ? (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold transition"
            >
              Back to Store Info
            </button>
          ) : (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Production mode: No hardcoded demo values.</span>
            </div>
          )}

          {step === 1 ? (
            <button
              type="submit"
              form="step1-form"
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-sm"
            >
              <span>Continue to User Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              form="step2-form"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Initializing Store...' : 'Launch Production Store'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
