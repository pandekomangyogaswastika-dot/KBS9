import { useState } from 'react';
import { Calendar, Clock, User, Mail, Phone, MessageSquare, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, apiError } from '@/lib/apiClient';
import { toast } from 'sonner';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

const SERVICE_TYPES = [
  { value: 'general', label: 'Konsultasi Umum' },
  { value: 'custom-software', label: 'Custom Software & ERP' },
  { value: 'web-mobile', label: 'Web & Mobile Development' },
  { value: 'cloud-devops', label: 'Cloud & DevOps' },
  { value: 'ai-data', label: 'AI & Data Science' },
];

export function BookingWidget({ isOpen, onClose, serviceType = 'general' }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    service: serviceType,
    date: '',
    time: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep) => {
    if (currentStep === 1) {
      return formData.name && formData.email && formData.phone;
    }
    if (currentStep === 2) {
      return formData.service && formData.date && formData.time;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1);
    } else {
      toast.error('Mohon lengkapi semua field yang wajib diisi');
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(2)) {
      toast.error('Mohon lengkapi semua data yang diperlukan');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/consultation/book', formData);
      setIsSuccess(true);
      toast.success('Booking berhasil! Kami akan menghubungi Anda segera.');
    } catch (error) {
      toast.error(apiError(error, 'Gagal melakukan booking'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      company: '',
      service: serviceType,
      date: '',
      time: '',
      message: '',
    });
    setStep(1);
    setIsSuccess(false);
    onClose();
  };

  // Get min date (today) and max date (30 days from now)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            style={{ zIndex: 9997 }}
            data-testid="booking-overlay"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 w-[95vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(11,13,23,0.98)',
              border: '1px solid rgba(124,104,225,0.3)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
              zIndex: 9998,
            }}
            data-testid="booking-widget"
          >
            {/* Header */}
            <div
              className="relative p-6 pb-8"
              style={{
                background: 'linear-gradient(135deg, rgba(124,104,225,0.2) 0%, rgba(115,209,173,0.15) 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
                data-testid="booking-close-button"
              >
                <X className="w-5 h-5 text-white" />
              </button>

              {!isSuccess ? (
                <>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">
                    Jadwalkan Konsultasi
                  </h2>
                  <p className="text-sm" style={{ color: 'rgba(232,234,242,0.6)' }}>
                    Gratis 30 menit dengan expert kami
                  </p>

                  {/* Progress Steps */}
                  <div className="flex items-center gap-2 mt-6">
                    {[1, 2, 3].map((num) => (
                      <div key={num} className="flex items-center flex-1">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                            step >= num
                              ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                              : 'bg-white/10 text-white/40'
                          }`}
                        >
                          {num}
                        </div>
                        {num < 3 && (
                          <div
                            className="h-0.5 flex-1 mx-2 transition-all"
                            style={{
                              background: step > num
                                ? 'linear-gradient(90deg, #7C68E1, #73D1AD)'
                                : 'rgba(255,255,255,0.1)',
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white mb-2">
                    Booking Berhasil!
                  </h2>
                  <p className="text-sm" style={{ color: 'rgba(232,234,242,0.6)' }}>
                    Kami akan menghubungi Anda segera
                  </p>
                </div>
              )}
            </div>

            {/* Content */}
            {!isSuccess ? (
              <div className="p-6">
                {/* Step 1: Contact Info */}
                {step === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="John Doe"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                        data-testid="booking-name-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        placeholder="john@company.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                        data-testid="booking-email-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        Nomor Telepon *
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+62 812 3456 7890"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                        data-testid="booking-phone-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Nama Perusahaan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => handleChange('company', e.target.value)}
                        placeholder="PT. Example Indonesia"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                        data-testid="booking-company-input"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Service & Schedule */}
                {step === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Jenis Layanan *
                      </label>
                      <select
                        value={formData.service}
                        onChange={(e) => handleChange('service', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        data-testid="booking-service-select"
                      >
                        {SERVICE_TYPES.map((service) => (
                          <option key={service.value} value={service.value} className="bg-[#0B0D17]">
                            {service.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Tanggal *
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                        data-testid="booking-date-input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <Clock className="w-4 h-4 inline mr-2" />
                        Waktu *
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            onClick={() => handleChange('time', time)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              formData.time === time
                                ? 'bg-gradient-to-br from-purple-600 to-indigo-600 text-white'
                                : 'bg-white/5 text-white/70 hover:bg-white/10'
                            }`}
                            data-testid={`booking-time-${time}`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Message */}
                {step === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        Pesan / Pertanyaan (Opsional)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        placeholder="Ceritakan lebih detail tentang kebutuhan Anda..."
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors resize-none"
                        data-testid="booking-message-input"
                      />
                    </div>

                    {/* Summary */}
                    <div className="rounded-xl p-4" style={{ background: 'rgba(124,104,225,0.1)', border: '1px solid rgba(124,104,225,0.2)' }}>
                      <h4 className="text-sm font-semibold text-white mb-3">Ringkasan Booking:</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(232,234,242,0.5)' }}>Nama:</span>
                          <span className="text-white font-medium">{formData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(232,234,242,0.5)' }}>Layanan:</span>
                          <span className="text-white font-medium">
                            {SERVICE_TYPES.find(s => s.value === formData.service)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'rgba(232,234,242,0.5)' }}>Tanggal & Waktu:</span>
                          <span className="text-white font-medium">
                            {formData.date} | {formData.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  {step > 1 && (
                    <button
                      onClick={() => setStep(prev => prev - 1)}
                      className="px-6 py-3 rounded-xl font-medium transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: 'rgba(232,234,242,0.7)',
                      }}
                      data-testid="booking-back-button"
                    >
                      Kembali
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      onClick={handleNext}
                      className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                      style={{
                        background: 'linear-gradient(135deg, #7C68E1 0%, #73D1AD 100%)',
                      }}
                      data-testid="booking-next-button"
                    >
                      Lanjut
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: 'linear-gradient(135deg, #7C68E1 0%, #73D1AD 100%)',
                      }}
                      data-testid="booking-submit-button"
                    >
                      {isSubmitting ? 'Mengirim...' : 'Konfirmasi Booking'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center">
                <p className="text-white/70 mb-6">
                  Kami telah mengirimkan konfirmasi ke <strong className="text-white">{formData.email}</strong>
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(135deg, #7C68E1 0%, #73D1AD 100%)',
                  }}
                  data-testid="booking-done-button"
                >
                  Selesai
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
