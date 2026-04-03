import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../App';
import { apiFetch } from '../api';
import {
  HiQrCode,
  HiClipboardDocumentList,
  HiCog6Tooth,
  HiCheck,
  HiStar,
  HiTrophy,
  HiUser,
  HiLockClosed,
  HiCalendarDays,
  HiTrash,
  HiChevronRight,
  HiBell,
  HiHome,

  HiArrowRightOnRectangle,
} from 'react-icons/hi2';
import { FaMedal, FaSpa } from 'react-icons/fa';
import { Calendar } from '../components/ui/calendar-rac';
import { today as getToday, getLocalTimeZone } from '@internationalized/date';


const TIME_SLOTS = [
  '08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00',
];

// ── 24h booking helpers ────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)}.${parseInt(m)}.${y}`;
}

function isBookingAllowed(calDate, timeSlot) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const bookingDateTime = new Date(calDate.year, calDate.month - 1, calDate.day, hours, minutes, 0, 0);
  const minAllowedTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return bookingDateTime >= minAllowedTime;
}

function isSlotBlocked(calDate, timeSlot, blockedTimes) {
  if (!blockedTimes?.length) return false;
  const dateStr = `${calDate.year}-${String(calDate.month).padStart(2,'0')}-${String(calDate.day).padStart(2,'0')}`;
  const dow = new Date(calDate.year, calDate.month - 1, calDate.day).getDay();
  const mon = dow === 0 ? 6 : dow - 1;
  return blockedTimes.some((b) => {
    if (b.type === 'weekday' && b.weekday === mon) return true;
    if (b.type === 'date' && b.date === dateStr) return true;
    if (b.type === 'hours') {
      const matchesScope = (b.weekday != null && b.weekday === mon) || (b.date === dateStr);
      if (!matchesScope) return false;
      return timeSlot >= b.hour_from && timeSlot < b.hour_to;
    }
    return false;
  });
}

function isDateFullyUnavailable(calDate, blockedTimes) {
  if (!isBookingAllowed(calDate, '18:00')) return true;
  return TIME_SLOTS.every((t) => isSlotBlocked(calDate, t, blockedTimes));
}

// ── Booking Tab ────────────────────────────────────────────────────────────────
function BookingTab({ token, setAppointments, services }) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [show24hMsg, setShow24hMsg] = useState(false);
  const [blockedTimes, setBlockedTimes] = useState([]);

  useEffect(() => {
    apiFetch('/blocked-times', {}).then(setBlockedTimes).catch(() => {});
  }, []);

  const minDate = getToday(getLocalTimeZone());

  const handleBook = async () => {
    if (!isBookingAllowed(date, time)) {
      setError('Naročanje je možno najmanj 24 ur vnaprej.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const apt = await apiFetch('/customer/appointment', {
        method: 'POST',
        body: JSON.stringify({ service: selectedService.name, date: date.toString(), time, notes }),
      }, token);
      setAppointments((prev) => [...prev, apt].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
      setSuccess(`Termin za "${selectedService.name}" je uspešno rezerviran!`);
      setStep(1);
      setSelectedService(null);
      setDate(null);
      setTime('');
      setNotes('');
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {success && (
        <div className="bg-green-50 border border-green-100 text-green-700 text-sm rounded-2xl p-4 flex items-center gap-2">
          <HiCheck size={18} /> {success}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <div className="px-1">
            <h2 className="font-bold text-gray-800 text-lg">Rezervirajte termin</h2>
            <p className="text-xs text-gray-400 mt-0.5">Izberite storitev</p>
          </div>
          {services.map((svc) => (
            <button key={svc.id} onClick={() => { setSelectedService(svc); setStep(2); }}
              className="w-full bg-white rounded-2xl p-4 shadow-sm text-left flex items-center justify-between hover:border-rose-200 hover:shadow-md transition-all border border-transparent">
              <div>
                <p className="font-semibold text-gray-800">{svc.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{svc.duration}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-600 font-bold">{svc.price} €</span>
                <HiChevronRight className="text-gray-300" size={18} />
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 2 && selectedService && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <HiCalendarDays className="text-rose-500" size={20} />
              <h3 className="font-bold text-gray-800">Izberite datum in uro</h3>
            </div>
            <p className="text-sm text-rose-500 font-medium mb-5">{selectedService.name} · {selectedService.price} €</p>
            {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Datum</label>
                <Calendar
                  value={date}
                  onChange={(newDate) => {
                    setDate(newDate);
                    if (time && (!isBookingAllowed(newDate, time) || isSlotBlocked(newDate, time, blockedTimes))) setTime('');
                    setShow24hMsg(false);
                  }}
                  minValue={minDate}
                  isDateUnavailable={(d) => isDateFullyUnavailable(d, blockedTimes)}
                  className="rounded-xl border border-gray-200 p-2 mx-auto"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ura</label>
                <div className="grid grid-cols-4 gap-2">
                  {TIME_SLOTS.map((t) => {
                    const allowed = !date || isBookingAllowed(date, t);
                    const blocked = date && isSlotBlocked(date, t, blockedTimes);
                    const disabled = !allowed || blocked;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          if (!allowed) { setShow24hMsg(true); setTimeout(() => setShow24hMsg(false), 3500); return; }
                          if (blocked) return;
                          setTime(t);
                          setShow24hMsg(false);
                        }}
                        className={`py-2 rounded-xl text-sm font-medium border transition-colors ${
                          time === t ? 'bg-rose-500 text-white border-rose-500'
                          : disabled ? 'bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300'
                        }`}>
                        {t}
                      </button>
                    );
                  })}
                </div>
                {show24hMsg && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-2">
                    Naročanje je možno najmanj 24 ur vnaprej.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Opombe (neobvezno)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                  placeholder="Posebne želje ali napotki..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setStep(1); setDate(null); setTime(''); setError(''); }}
              className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 text-sm">
              Nazaj
            </button>
            <button
              onClick={handleBook}
              disabled={!date || !time || loading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
              {loading ? 'Rezervacija...' : 'Rezerviraj termin'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tiers ──────────────────────────────────────────────────────────────────────
const TIERS = {
  Bronasta: {
    Icon: () => <FaMedal className="text-amber-500" size={20} />,
    next: 'Srebrna', nextAt: 500, prevAt: 0,
    badge: 'bg-amber-100 text-amber-700',
    perk: '5% popust na vse storitve',
  },
  Srebrna: {
    Icon: () => <FaMedal className="text-slate-400" size={20} />,
    next: 'Zlata', nextAt: 1000, prevAt: 500,
    badge: 'bg-slate-100 text-slate-600',
    perk: '10% popust + brezplačna nega las',
  },
  Zlata: {
    Icon: () => <HiTrophy className="text-yellow-500" size={20} />,
    next: null, nextAt: null, prevAt: 1000,
    badge: 'bg-yellow-100 text-yellow-700',
    perk: '20% popust + VIP obravnava',
  },
};

function getProgress(points, tier) {
  const { prevAt, nextAt } = TIERS[tier] || TIERS.Bronasta;
  if (!nextAt) return 100;
  return Math.min(100, ((points - prevAt) / (nextAt - prevAt)) * 100);
}

// ── Profile Settings ──────────────────────────────────────────────────────────
function ProfileSettings({ profile, token, onUpdate }) {
  const [form, setForm] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const capitalizeName = (s) => s.trim().toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const updated = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({ ...form, name: capitalizeName(form.name) }),
      }, token);
      onUpdate(updated);
      setSuccess('Profil je bil uspešno posodobljen!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <HiUser className="text-rose-500" size={20} />
        <h3 className="font-bold text-gray-800">Osebni podatki</h3>
      </div>
      {success && <div className="bg-green-50 text-green-700 text-sm rounded-xl p-3 mb-4">{success}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ime in priimek</label>
          <input type="text" value={form.name} onChange={set('name')}
            onBlur={(e) => setForm(f => ({ ...f, name: capitalizeName(e.target.value) }))}
            required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">E-pošta</label>
          <input type="email" value={form.email} onChange={set('email')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
          <input type="tel" value={form.phone} onChange={set('phone')}
            placeholder="+386 41 123 456"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
          {loading ? 'Shranjevanje...' : 'Shrani spremembe'}
        </button>
      </form>
    </div>
  );
}

// ── Password Settings ─────────────────────────────────────────────────────────
function PasswordSettings({ token }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) return setError('Novi gesli se ne ujemata');
    if (form.newPassword.length < 6) return setError('Novo geslo mora imeti vsaj 6 znakov');
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      }, token);
      setSuccess('Geslo je bilo uspešno spremenjeno!');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <HiLockClosed className="text-rose-500" size={20} />
        <h3 className="font-bold text-gray-800">Sprememba gesla</h3>
      </div>
      {success && <div className="bg-green-50 text-green-700 text-sm rounded-xl p-3 mb-4">{success}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Trenutno geslo</label>
          <input type="password" value={form.currentPassword} onChange={set('currentPassword')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Novo geslo</label>
          <input type="password" value={form.newPassword} onChange={set('newPassword')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Potrdite novo geslo</label>
          <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        </div>
        <button type="submit" disabled={loading}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
          {loading ? 'Shranjevanje...' : 'Spremeni geslo'}
        </button>
      </form>
    </div>
  );
}

// ── Push helpers ──────────────────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function silentCustomerPushSubscribe(token) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const { publicKey } = await apiFetch('/push/vapid-public-key', {}, token);
    if (!publicKey) return;
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    const sub = existing || await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
    await apiFetch('/push/customer-subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }) }, token);
  } catch (e) { console.error('Customer push subscribe:', e); }
}

// ── Customer Push Settings ────────────────────────────────────────────────────
function CustomerPushSettings({ token }) {
  const [status, setStatus] = useState('loading');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!('PushManager' in window)) { setStatus('unsupported'); return; }
    const perm = Notification.permission;
    if (perm === 'denied') { setStatus('denied'); return; }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setStatus(sub ? 'subscribed' : 'unsubscribed'))
    );
  }, []);

  const handleSubscribe = async () => {
    setSaving(true);
    setMsg('');
    try {
      const { publicKey } = await apiFetch('/push/vapid-public-key', {}, token);
      if (!publicKey) throw new Error('Push obvestila niso nastavljeni na strežniku.');
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await apiFetch('/push/customer-subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }) }, token);
      setStatus('subscribed');
      setMsg('Obvestila so vklopljena!');
    } catch (e) { setMsg('Napaka: ' + e.message); }
    finally { setSaving(false); }
  };

  const handleUnsubscribe = async () => {
    setSaving(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await apiFetch('/push/customer-subscribe', { method: 'DELETE' }, token);
      setStatus('unsubscribed');
    } catch (e) { setMsg('Napaka: ' + e.message); }
    finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <HiBell className="text-rose-500" size={20} />
        <h3 className="font-bold text-gray-800">Obvestila o terminih</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">Prejmite obvestilo, ko salon potrdi ali doda vaš termin.</p>
      {msg && <p className="text-xs text-rose-600 bg-rose-50 rounded-xl px-3 py-2 mb-3">{msg}</p>}
      {status === 'unsupported' && <p className="text-sm text-gray-400">Vaš brskalnik ne podpira push obvestil.</p>}
      {status === 'denied' && <p className="text-xs text-amber-700 bg-amber-50 rounded-xl p-3">Obvestila so blokirana. Omogočite jih v nastavitvah telefona.</p>}
      {status === 'unsubscribed' && (
        <button onClick={handleSubscribe} disabled={saving}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
          {saving ? 'Vklaplanje...' : 'Vklopi obvestila o terminih'}
        </button>
      )}
      {status === 'subscribed' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl p-3">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Obvestila so aktivna
          </div>
          <button onClick={handleUnsubscribe} disabled={saving}
            className="w-full bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 text-sm hover:border-rose-200 transition-colors disabled:opacity-50">
            {saving ? 'Izklapljanje...' : 'Izklopi obvestila'}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────
function MiniCalendar({ appointments }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDow = new Date(year, month, 1).getDay();
  firstDow = firstDow === 0 ? 6 : firstDow - 1; // Monday-start

  const apptDays = new Set(
    appointments
      .filter((a) => {
        const [ay, am] = a.date.split('-').map(Number);
        return ay === year && am === month + 1;
      })
      .map((a) => parseInt(a.date.split('-')[2]))
  );

  const MONTHS = ['Januar','Februar','Marec','April','Maj','Junij','Julij','Avgust','September','Oktober','November','December'];
  const DAYS   = ['Po','To','Sr','Če','Pe','So','Ne'];

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="cust-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-semibold text-gray-800 text-sm">{MONTHS[month]} {year}</span>
        <HiCalendarDays className="text-rose-400" size={16} />
      </div>
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <div key={d} className="text-xs text-gray-400 font-medium py-1">{d}</div>
        ))}
        {cells.map((day, i) => (
          <div key={i} className={`relative text-xs py-1.5 rounded-lg font-medium ${
            !day ? '' :
            day === today ? 'bg-rose-500 text-white' :
            apptDays.has(day) ? 'text-rose-600 font-semibold' :
            'text-gray-600'
          }`}>
            {day}
            {day && apptDays.has(day) && day !== today && (
              <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-rose-400 rounded-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
function Sidebar({ active, onChange, profile, onLogout }) {
  const tabs = [
    { id: 'dashboard', label: 'Domov',       Icon: HiHome },
    { id: 'booking',   label: 'Rezervacija', Icon: HiCalendarDays },
    { id: 'qr',        label: 'Moja QR',     Icon: HiQrCode },
    { id: 'history',   label: 'Obiski',      Icon: HiClipboardDocumentList },
    { id: 'settings',  label: 'Nastavitve',  Icon: HiCog6Tooth },
  ];
  const initials = (profile?.name || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <aside className="cust-sidebar">
      <div className="cust-sidebar-brand">
        <img src="/icons/logo.svg" alt="GlowLoyalty" className="w-9 h-9" />
        <div>
          <div className="cust-brand-name">GlowLoyalty</div>
          <div className="cust-brand-sub">Moj račun</div>
        </div>
      </div>

      <nav className="cust-nav">
        {tabs.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => onChange(id)}
            className={`cust-nav-item${active === id ? ' active' : ''}`}>
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      <div className="cust-sidebar-footer">
        <div className="cust-user-info">
          <div className="cust-avatar">{initials}</div>
          <div className="cust-user-meta">
            <div className="cust-user-name">{profile?.name || '—'}</div>
            <div className="cust-user-email">{profile?.email || ''}</div>
          </div>
        </div>
        <button onClick={onLogout} className="cust-logout">
          <HiArrowRightOnRectangle size={16} />
          Odjava
        </button>
      </div>
    </aside>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
function Topbar({ title }) {
  return (
    <header className="cust-topbar">
      {/* Logo — visible on mobile only (sidebar hidden); hidden on desktop where sidebar shows it */}
      <img src="/icons/logo.svg" alt="GlowLoyalty" className="w-8 h-8 block lg:hidden flex-shrink-0" />
      <h1 className="cust-topbar-title">{title}</h1>
    </header>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function CustomerPortal() {
  const { token, logout, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [visits, setVisits] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmCancelId, setConfirmCancelId] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(urlParams.get('tab') || 'dashboard');

  useEffect(() => {
    Promise.all([
      apiFetch('/customer/profile', {}, token),
      apiFetch('/customer/visits', {}, token),
      apiFetch('/customer/appointments', {}, token),
      apiFetch('/services', {}),
    ])
      .then(([prof, vis, apts, svcs]) => { setProfile(prof); setVisits(vis); setAppointments(apts); setServices(svcs); })
      .catch(console.error)
      .finally(() => setLoading(false));
    silentCustomerPushSubscribe(token);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex items-center justify-center">
        <div className="text-rose-400 font-medium">Nalaganje...</div>
      </div>
    );
  }

  const tier     = profile?.tier || 'Bronasta';
  const tierInfo = TIERS[tier] || TIERS.Bronasta;
  const points   = profile?.points || 0;
  const progress = getProgress(points, tier);

  const handleProfileUpdate = (updated) => {
    setProfile((p) => ({ ...p, ...updated }));
    updateUser(updated);
  };

  const PAGE_TITLES = {
    dashboard: 'Domov',
    booking:   'Rezervacija',
    qr:        'Moja QR koda',
    history:   'Obiski',
    settings:  'Nastavitve',
  };

  const NAV_TABS = [
    { id: 'dashboard', label: 'Domov',       Icon: HiHome },
    { id: 'booking',   label: 'Rezervacija', Icon: HiCalendarDays },
    { id: 'qr',        label: 'QR',          Icon: HiQrCode },
    { id: 'history',   label: 'Obiski',      Icon: HiClipboardDocumentList },
    { id: 'settings',  label: 'Nastavitve',  Icon: HiCog6Tooth },
  ];

  const todayStr  = new Date().toISOString().split('T')[0];
  const upcoming  = appointments.filter((a) => a.date >= todayStr);
  const pastApts  = appointments.filter((a) => a.date < todayStr);

  return (
    <div className="cust-shell">
      {/* Sidebar — desktop only */}
      <Sidebar active={activeTab} onChange={setActiveTab} profile={profile} onLogout={logout} />

      <div className="cust-main">
        {/* Topbar */}
        <Topbar title={PAGE_TITLES[activeTab]} />

        {/* Mobile tab bar — hidden on desktop */}
        <div className="cust-mobile-tabs">
          {NAV_TABS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`cust-mobile-tab${activeTab === id ? ' active' : ''}`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        <main className="cust-content">

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div className="cust-dashboard-grid">

              {/* Left column */}
              <div className="cust-left-col">

                {/* Points card */}
                <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-[20px] p-6 text-white">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <p className="text-rose-200 text-xs font-medium uppercase tracking-wider mb-1">Vaše točke</p>
                      <p className="text-6xl font-bold leading-none">{points.toLocaleString()}</p>
                    </div>
                    <span className={`${tierInfo.badge} px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1`}>
                      <tierInfo.Icon /> {tier}
                    </span>
                  </div>
                  {tierInfo.next ? (
                    <div>
                      <div className="flex justify-between text-xs text-rose-200 mb-2">
                        <span>Napredek do {tierInfo.next}</span>
                        <span>{Math.max(0, tierInfo.nextAt - points)} točk do naslednje stopnje</span>
                      </div>
                      <div className="bg-white bg-opacity-25 rounded-full h-2.5">
                        <div className="bg-white rounded-full h-2.5 transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white bg-opacity-20 rounded-2xl px-4 py-2 text-center text-sm">
                      Čestitamo! Dosegli ste najvišjo stopnjo!
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'booking',  label: 'Nova rezervacija', sub: 'Naroči se',        icon: <HiCalendarDays size={22} />, color: 'bg-rose-50 text-rose-500' },
                    { id: 'qr',       label: 'Moja QR koda',     sub: 'Prikaži kartico',  icon: <HiQrCode size={22} />,       color: 'bg-pink-50 text-pink-500' },
                    { id: 'history',  label: 'Moje točke',        sub: `${points} točk`,  icon: <HiStar size={22} />,         color: 'bg-amber-50 text-amber-500' },
                    { id: 'settings', label: 'Profil',            sub: 'Nastavitve',       icon: <HiUser size={22} />,         color: 'bg-purple-50 text-purple-500' },
                  ].map(({ id, label, sub, icon, color }) => (
                    <button key={id} onClick={() => setActiveTab(id)}
                      className="cust-card p-4 text-left hover:border-rose-300 hover:-translate-y-0.5 transition-all">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>{icon}</div>
                      <div className="text-sm font-semibold text-gray-800">{label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
                    </button>
                  ))}
                </div>

                {/* Activity history table */}
                <div className="cust-card overflow-hidden">
                  <div className="flex items-center justify-between px-5 pt-5 pb-3">
                    <h3 className="font-semibold text-gray-800">Zadnji obiski</h3>
                    <button onClick={() => setActiveTab('history')}
                      className="text-xs text-rose-500 font-semibold hover:underline">
                      Vsi obiski →
                    </button>
                  </div>
                  {visits.length === 0 ? (
                    <p className="px-5 pb-6 text-sm text-gray-400 text-center pt-2">Še ni zabeleženih obiskov.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-50">
                          <th className="px-5 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Storitev</th>
                          <th className="px-5 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Datum</th>
                          <th className="px-5 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Točke</th>
                          <th className="px-5 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden lg:table-cell">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits.slice(0, 6).map((v) => (
                          <tr key={v.id} className="border-b border-gray-50 hover:bg-rose-50 transition-colors">
                            <td className="px-5 py-3 font-medium text-gray-800">{v.service}</td>
                            <td className="px-5 py-3 text-gray-500 text-xs">
                              {new Date(v.created_at).toLocaleDateString('sl-SI', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-5 py-3">
                              <span className="bg-rose-100 text-rose-600 text-xs font-bold px-2 py-0.5 rounded-full">+{v.points_awarded}</span>
                            </td>
                            <td className="px-5 py-3 hidden lg:table-cell">
                              <span className="bg-green-100 text-green-600 text-xs font-medium px-2 py-0.5 rounded-full">Zaključeno</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Right column */}
              <div className="cust-right-col">
                <MiniCalendar appointments={appointments} />

                {/* Appointments panel */}
                <div className="cust-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 text-sm">Moji termini</h3>
                    <button onClick={() => setActiveTab('booking')} className="text-xs text-rose-500 font-semibold">+ Nov</button>
                  </div>
                  {upcoming.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">Nimate prihajajočih terminov.</p>
                  ) : (
                    <div className="space-y-2">
                      {upcoming.map((apt) => (
                        <div key={apt.id} className={`p-3 rounded-xl transition-colors ${confirmCancelId === apt.id ? 'bg-red-50' : 'bg-rose-50'}`}>
                          <div className="flex items-center gap-2">
                            <HiCalendarDays className={`shrink-0 ${confirmCancelId === apt.id ? 'text-red-400' : 'text-rose-400'}`} size={16} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">{apt.service}</p>
                              <p className="text-xs text-gray-500">{formatDate(apt.date)} · {apt.time}</p>
                            </div>
                            <button onClick={() => setConfirmCancelId(confirmCancelId === apt.id ? null : apt.id)}
                              className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0">
                              <HiTrash size={14} />
                            </button>
                          </div>
                          {confirmCancelId === apt.id && (
                            <div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between gap-2">
                              <p className="text-xs text-red-600 font-medium">Res prekličete?</p>
                              <div className="flex gap-1.5 shrink-0">
                                <button onClick={() => setConfirmCancelId(null)}
                                  className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-lg text-gray-600">Ne</button>
                                <button onClick={async () => {
                                  await apiFetch(`/customer/appointment/${apt.id}`, { method: 'DELETE' }, token);
                                  setAppointments((prev) => prev.filter((a) => a.id !== apt.id));
                                  setConfirmCancelId(null);
                                }} className="px-2 py-1 text-xs bg-red-500 text-white rounded-lg">Da</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {pastApts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-50">
                      <p className="text-xs text-gray-400 font-medium mb-2">Pretekli</p>
                      {pastApts.slice(-2).reverse().map((apt) => (
                        <div key={apt.id} className="flex items-center gap-2 py-1.5 opacity-50">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 truncate">{apt.service}</p>
                            <p className="text-xs text-gray-400">{formatDate(apt.date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Loyalty tiers */}
                <div className="cust-card p-5">
                  <h3 className="font-semibold text-gray-800 text-sm mb-4">Stopnje zvestobe</h3>
                  <div className="space-y-2">
                    {Object.entries(TIERS).map(([name, info]) => {
                      const isActive = Object.keys(TIERS).indexOf(name) <= Object.keys(TIERS).indexOf(tier);
                      const isCurrent = name === tier;
                      return (
                        <div key={name} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                          isCurrent ? 'bg-rose-50 border border-rose-100' : isActive ? 'bg-gray-50' : 'opacity-40 bg-gray-50'
                        }`}>
                          <info.Icon />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{name}</p>
                            <p className="text-xs text-gray-500">{info.perk}</p>
                            <p className="text-xs text-gray-400">{info.prevAt}–{info.nextAt ?? '∞'} točk</p>
                          </div>
                          {isActive && (isCurrent
                            ? <HiStar className="text-rose-400 shrink-0" size={16} />
                            : <HiCheck className="text-green-500 shrink-0" size={16} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── QR TAB ── */}
          {activeTab === 'qr' && (
            <div className="max-w-sm">
              <div className="cust-card p-6 text-center">
                <h3 className="font-bold text-gray-800 mb-1">Vaša digitalna kartica</h3>
                <p className="text-sm text-gray-500 mb-6">Pokažite to kodo osebju pri blagajni za zbiranje točk</p>
                <div className="inline-flex p-5 bg-white border-2 border-rose-100 rounded-3xl shadow-md mb-6">
                  <QRCodeSVG value={profile?.qr_token || 'none'} size={200} fgColor="#be123c" bgColor="#ffffff" level="H" includeMargin={false} />
                </div>
                <div className="bg-rose-50 rounded-2xl p-4 mb-4">
                  <p className="text-xs text-rose-300 mb-1 font-medium">ID stranke</p>
                  <p className="text-xs text-rose-400 font-mono break-all">{profile?.qr_token}</p>
                </div>
                <div className={`inline-flex items-center gap-2 ${tierInfo.badge} px-4 py-2 rounded-full text-sm font-semibold`}>
                  <tierInfo.Icon /> {tier} &nbsp;·&nbsp; {points} točk
                </div>
                <p className="text-xs text-gray-400 mt-4">Koda je edinstvena in varna. Nikoli je ne delite z drugimi.</p>
              </div>
            </div>
          )}

          {/* ── BOOKING TAB ── */}
          {activeTab === 'booking' && (
            <div className="max-w-lg">
              <BookingTab token={token} setAppointments={setAppointments} services={services} />
            </div>
          )}

          {/* ── HISTORY TAB ── */}
          {activeTab === 'history' && (
            <div className="max-w-3xl space-y-3">
              <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wider">
                Zgodovina obiskov ({visits.length})
              </h3>
              {visits.length === 0 ? (
                <div className="cust-card p-10 text-center">
                  <div className="flex justify-center mb-4"><FaSpa className="text-rose-300" size={48} /></div>
                  <p className="font-semibold text-gray-700">Še ni zabeleženih obiskov</p>
                  <p className="text-sm text-gray-400 mt-2">Ob naslednjem obisku bo osebje zabeležilo vašo storitev in dodalo točke</p>
                </div>
              ) : (
                <div className="cust-card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Storitev</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Datum</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide">Točke</th>
                        <th className="px-5 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wide hidden md:table-cell">Znesek</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visits.map((v) => (
                        <tr key={v.id} className="border-b border-gray-50 hover:bg-rose-50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="font-medium text-gray-800">{v.service}</div>
                            {v.notes && <div className="text-xs text-gray-400 italic mt-0.5">"{v.notes}"</div>}
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">
                            {new Date(v.created_at).toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </td>
                          <td className="px-5 py-3">
                            <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-0.5 rounded-full">+{v.points_awarded} pt</span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs hidden md:table-cell">
                            {v.amount > 0 ? `${v.amount.toFixed(2)} €` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS TAB ── */}
          {activeTab === 'settings' && (
            <div className="max-w-lg space-y-4">
              {profile && <ProfileSettings profile={profile} token={token} onUpdate={handleProfileUpdate} />}
              <PasswordSettings token={token} />
              <CustomerPushSettings token={token} />
              <button
                onClick={logout}
                className="flex items-center gap-2 w-full px-4 py-3 rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 font-semibold text-sm hover:bg-rose-100 transition-colors"
              >
                <HiArrowRightOnRectangle size={18} />
                Odjava
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
