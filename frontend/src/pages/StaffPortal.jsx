import { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { useAuth } from '../App';
import { apiFetch } from '../api';
import {
  HiCamera,
  HiUserGroup,
  HiChartBar,
  HiCalendarDays,
  HiCog6Tooth,
  HiMagnifyingGlass,
  HiStar,
  HiHome,
  HiUser,
  HiLockClosed,
  HiBell,
  HiPlus,
  HiTrash,
  HiChevronLeft,
  HiChevronRight,
  HiXMark,
  HiPencilSquare,
  HiCheck,
  HiArrowRightOnRectangle,
} from 'react-icons/hi2';
import { FaUserCircle } from 'react-icons/fa';

const TIER_BADGE = {
  Bronasta: 'bg-amber-100 text-amber-700',
  Srebrna:  'bg-slate-100 text-slate-600',
  Zlata:    'bg-yellow-100 text-yellow-700',
};


const MONTHS_SL = ['Januar', 'Februar', 'Marec', 'April', 'Maj', 'Junij',
  'Julij', 'Avgust', 'September', 'Oktober', 'November', 'December'];
const WEEKDAYS_SL = ['Pon', 'Tor', 'Sre', 'Čet', 'Pet', 'Sob', 'Ned'];

function getCalendarDays(year, month) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  let startDow = firstDay.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const days = [];
  for (let i = 0; i < startDow; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function toDateStr(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// "2026-03-14" → "14.3.2026"
function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)}.${parseInt(m)}.${y}`;
}

// Persisted across component mounts — lives until QR is successfully scanned
let _activeStream = null;

// ── QR Scanner ────────────────────────────────────────────────────────────────
function QRScanner({ onScan }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const onScanRef = useRef(onScan);
  const [overlay, setOverlay] = useState('button'); // 'button' | 'loading' | 'live' | 'error'
  const [errorMsg, setErrorMsg] = useState('');
  useEffect(() => { onScanRef.current = onScan; });

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line

  function attachStream(stream) {
    _activeStream = stream;
    const vid = videoRef.current;
    if (!vid) return;

    vid.srcObject = stream;

    // Wait for browser to confirm video is ready before showing live view
    // This is the fix for black screen on iOS/Android PWA standalone mode
    const onReady = () => {
      vid.removeEventListener('canplay', onReady);
      vid.play()
        .then(() => {
          setOverlay('live');
          tick();
        })
        .catch((err) => {
          console.error('play() failed:', err);
          setOverlay('error');
          setErrorMsg('Video se ni zagnal. Zaprite aplikacijo in poskusite znova.');
        });
    };

    vid.addEventListener('canplay', onReady);
  }

  function handleOpen() {
    setOverlay('loading');
    setErrorMsg('');

    const tryCamera = (constraints) =>
      navigator.mediaDevices.getUserMedia(constraints);

    tryCamera({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .catch(() => tryCamera({ video: { facingMode: 'environment' }, audio: false }))
      .catch(() => tryCamera({ video: true, audio: false }))
      .then(attachStream)
      .catch((err) => {
        const denied = /notallowed|denied|permission/i.test(err?.message || err?.name || '');
        setOverlay('error');
        setErrorMsg(
          denied
            ? 'Dostop do kamere je zavrnjen. Preverite dovoljenja v nastavitvah.'
            : 'Kamera ni dostopna. Zaprite aplikacijo in poskusite znova.'
        );
      });
  }

  function tick() {
    rafRef.current = requestAnimationFrame(() => {
      const vid = videoRef.current;
      const canvas = canvasRef.current;
      if (!vid || !canvas || !_activeStream) return;
      if (vid.readyState >= 2 && vid.videoWidth > 0) {
        canvas.width = vid.videoWidth;
        canvas.height = vid.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(vid, 0, 0);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(img.data, img.width, img.height);
        if (code) {
          // Scan done — stop stream so next session needs permission again
          _activeStream.getTracks().forEach((t) => t.stop());
          _activeStream = null;
          onScanRef.current(code.data);
          return;
        }
      }
      tick();
    });
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black" style={{ height: 300 }}>
      <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* QR viewfinder — shown while camera is live */}
      {overlay === 'live' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div style={{ width: 220, height: 220, position: 'relative' }}>
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTop: '3px solid white', borderLeft: '3px solid white' },
              { top: 0, right: 0, borderTop: '3px solid white', borderRight: '3px solid white' },
              { bottom: 0, left: 0, borderBottom: '3px solid white', borderLeft: '3px solid white' },
              { bottom: 0, right: 0, borderBottom: '3px solid white', borderRight: '3px solid white' },
            ].map((style, i) => (
              <div key={i} style={{ position: 'absolute', width: 24, height: 24, borderRadius: 3, ...style }} />
            ))}
          </div>
        </div>
      )}

      {overlay === 'button' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900">
          <HiCamera size={48} className="text-white opacity-50" />
          <button onClick={handleOpen} className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl px-6 py-3 text-sm">
            Odpri kamero
          </button>
        </div>
      )}

      {overlay === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <p className="text-white text-sm">Zaganjanje kamere…</p>
        </div>
      )}

      {overlay === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-gray-900">
          <HiCamera size={36} className="text-red-400" />
          <p className="text-white text-sm text-center">{errorMsg}</p>
          <button onClick={handleOpen} className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl px-5 py-2.5 text-sm">
            Poskusi znova
          </button>
        </div>
      )}
    </div>
  );
}

// ── Log Visit Form ─────────────────────────────────────────────────────────────
function LogVisitForm({ customer, token, onSuccess, onCancel, services }) {
  const [service, setService] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!service) return setError('Izberite storitev');
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch('/staff/visit', {
        method: 'POST',
        body: JSON.stringify({ customer_id: customer.id, service, amount: parseFloat(amount) || 0, notes }),
      }, token);
      onSuccess(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const pointsPreview = Math.round(parseFloat(amount) || 0);

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-5 pb-5 border-b border-rose-50">
        <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm">
          {customer.name[0].toUpperCase()}
        </div>
        <div>
          <p className="font-bold text-gray-800">{customer.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[customer.tier] || 'bg-gray-100 text-gray-600'}`}>
              {customer.tier}
            </span>
            <span className="text-xs text-gray-500">{customer.points} točk</span>
          </div>
        </div>
      </div>
      {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Storitev</label>
          <select value={service} onChange={(e) => setService(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white">
            <option value="">Izberite storitev...</option>
            {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Znesek (€)</label>
          <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            placeholder="0.00" />
          {amount && (
            <p className="text-xs text-rose-500 mt-1.5 font-medium">
              Stranki bo dodanih +{pointsPreview} točk
              {pointsPreview + customer.points >= 1000 && customer.tier !== 'Zlata' && (
                <span className="ml-1 text-yellow-600">— napreduje v višjo stopnjo!</span>
              )}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Opombe (neobvezno)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            rows={2} placeholder="Preference stranke, barva, dolžina..." />
        </div>
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onCancel}
            className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
            Prekliči
          </button>
          <button type="submit" disabled={loading}
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors">
            {loading ? 'Shranjevanje...' : 'Dodaj točke'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Customer Visits Modal ──────────────────────────────────────────────────────
function CustomerVisitsModal({ customer, token, onClose, onLogVisit, inline = false }) {
  const [profile, setProfile] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    Promise.all([
      apiFetch(`/staff/customer/${customer.id}`, {}, token),
      apiFetch(`/staff/customer/${customer.id}/visits`, {}, token),
    ]).then(([prof, vis]) => {
      setProfile(prof);
      setEditData({ name: prof.name, phone: prof.phone || '', birth_date: prof.birth_date || '' });
      setVisits(vis);
    }).catch(console.error).finally(() => setLoading(false));
  }, [customer.id, token]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const updated = await apiFetch(`/staff/customer/${customer.id}`, {
        method: 'PUT',
        body: JSON.stringify(editData),
      }, token);
      setProfile((p) => ({ ...p, ...updated }));
      setEditing(false);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({ name: profile.name, phone: profile.phone || '', birth_date: profile.birth_date || '' });
    setSaveError('');
    setEditing(false);
  };

  const displayProfile = editing ? null : profile;

  const inner = (
    <div className={inline
      ? 'flex flex-col h-full'
      : 'bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl'
    }>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">
              {customer.name[0]}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">{profile?.name || customer.name}</p>
              <p className="text-xs text-gray-500">{customer.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiXMark size={22} />
          </button>
        </div>

        {/* Stats row */}
        <div className="flex border-b border-gray-100">
          {[
            { label: 'Točke', value: profile?.points ?? customer.points },
            { label: 'Stopnja', value: profile?.tier ?? customer.tier },
            { label: 'Obiski', value: visits.length },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 py-3 text-center border-r last:border-0 border-gray-100">
              <p className="font-bold text-rose-600 text-sm">{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-center text-gray-400 py-8 text-sm">Nalaganje...</p>
          ) : (
            <>
              {/* Profile details */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Podatki stranke</p>
                  {!editing ? (
                    <button onClick={() => setEditing(true)}
                      className="flex items-center gap-1 text-xs text-rose-500 font-medium hover:text-rose-700 transition-colors">
                      <HiPencilSquare size={14} /> Uredi
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={handleCancelEdit}
                        className="text-xs text-gray-400 hover:text-gray-600 font-medium">
                        Prekliči
                      </button>
                      <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-1 text-xs bg-rose-500 text-white px-2.5 py-1 rounded-lg font-medium disabled:opacity-50">
                        <HiCheck size={13} /> {saving ? 'Shranjevanje...' : 'Shrani'}
                      </button>
                    </div>
                  )}
                </div>

                {saveError && (
                  <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-3">{saveError}</p>
                )}

                <div className="space-y-2.5">
                  {/* Name */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 w-28 shrink-0">Ime in priimek</span>
                    {editing ? (
                      <input value={editData.name} onChange={(e) => setEditData((d) => ({ ...d, name: e.target.value }))}
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-300" />
                    ) : (
                      <span className="text-sm font-medium text-gray-800 text-right">{displayProfile?.name || '—'}</span>
                    )}
                  </div>

                  {/* Email (not editable — used for login) */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 w-28 shrink-0">E-pošta</span>
                    <span className="text-sm font-medium text-gray-800 text-right">{customer.email || '—'}</span>
                  </div>

                  {/* Phone */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 w-28 shrink-0">Telefon</span>
                    {editing ? (
                      <input value={editData.phone} onChange={(e) => setEditData((d) => ({ ...d, phone: e.target.value }))}
                        placeholder="+386 41 123 456" type="tel"
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-300" />
                    ) : (
                      <span className="text-sm font-medium text-gray-800 text-right">{displayProfile?.phone || '—'}</span>
                    )}
                  </div>

                  {/* Birth date */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 w-28 shrink-0">Datum rojstva</span>
                    {editing ? (
                      <input value={editData.birth_date} onChange={(e) => setEditData((d) => ({ ...d, birth_date: e.target.value }))}
                        type="date"
                        className="flex-1 text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-300" />
                    ) : (
                      <span className="text-sm font-medium text-gray-800 text-right">
                        {displayProfile?.birth_date
                          ? new Date(displayProfile.birth_date + 'T00:00:00').toLocaleDateString('sl-SI')
                          : '—'}
                      </span>
                    )}
                  </div>

                  {/* Registered */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 w-28 shrink-0">Registriran</span>
                    <span className="text-sm font-medium text-gray-800 text-right">
                      {displayProfile?.created_at
                        ? new Date(displayProfile.created_at).toLocaleDateString('sl-SI')
                        : '—'}
                    </span>
                  </div>

                  {/* Last visit */}
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-gray-400 w-28 shrink-0">Zadnji obisk</span>
                    <span className="text-sm font-medium text-gray-800 text-right">
                      {displayProfile?.last_visit
                        ? new Date(displayProfile.last_visit).toLocaleDateString('sl-SI')
                        : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visit history */}
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Zgodovina obiskov
                </p>
                <div className="space-y-2">
                  {visits.length === 0 && (
                    <p className="text-center text-gray-400 py-4 text-sm">Ni zabeleženih obiskov</p>
                  )}
                  {visits.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{v.service}</p>
                        <p className="text-xs text-gray-400">{new Date(v.created_at).toLocaleDateString('sl-SI')}</p>
                        {v.notes && <p className="text-xs text-gray-400 italic mt-0.5">"{v.notes}"</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="bg-rose-100 text-rose-700 text-xs font-bold px-2 py-1 rounded-full">
                          +{v.points_awarded} pt
                        </span>
                        {v.amount > 0 && <p className="text-xs text-gray-400 mt-1">{v.amount.toFixed(2)} €</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => onLogVisit(profile || customer)}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors">
            + Zabeleži nov obisk
          </button>
        </div>
      </div>
  );

  if (inline) return inner;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {inner}
    </div>
  );
}

// ── Add Appointment Modal ──────────────────────────────────────────────────────
function AddAppointmentModal({ date, token, customers, onClose, onSaved, services }) {
  const [customerName, setCustomerName] = useState('');
  const [customerId, setCustomerId] = useState(null); // set only when picked from dropdown
  const [service, setService] = useState('');
  const [time, setTime] = useState('09:00');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = customerName.length > 0
    ? customers.filter((c) => c.name.toLowerCase().includes(customerName.toLowerCase())).slice(0, 5)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !service || !time) return setError('Vsa obvezna polja morajo biti izpolnjena');
    setLoading(true);
    setError('');
    try {
      await apiFetch('/staff/appointment', {
        method: 'POST',
        body: JSON.stringify({
          customer_name: customerName,
          customer_id: customerId || null,
          service, date, time, notes,
        }),
      }, token);
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Dodaj termin</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <HiXMark size={22} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <div className="bg-red-50 text-red-600 text-sm rounded-xl p-3">{error}</div>}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Stranka *</label>
            <input type="text" value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); setCustomerId(null); setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="Ime stranke..." required />
            {showSuggestions && filtered.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-10 overflow-hidden">
                {filtered.map((c) => (
                  <button key={c.id} type="button"
                    onMouseDown={() => { setCustomerName(c.name); setCustomerId(c.id); setShowSuggestions(false); }}
                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-50 flex items-center gap-2">
                    <span className="font-medium text-gray-800">{c.name}</span>
                    <span className="text-xs text-gray-400">{c.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Storitev *</label>
            <select value={service} onChange={(e) => setService(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white" required>
              <option value="">Izberite storitev...</option>
              {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Ura *</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Opombe</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
              rows={2} placeholder="Posebne želje, dolžina, barva..." />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 rounded-xl py-3 text-sm font-medium hover:bg-gray-50 transition-colors">
              Prekliči
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-50 transition-colors">
              {loading ? 'Shranjevanje...' : 'Shrani termin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Blocked Times Panel ────────────────────────────────────────────────────────
const WEEKDAY_LABELS = ['Ponedeljek','Torek','Sreda','Četrtek','Petek','Sobota','Nedelja'];
const TIME_SLOTS_ALL = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

function BlockedTimesPanel({ token, blockedTimes, onUpdate }) {
  const [mode, setMode] = useState(null); // null | 'weekday' | 'date' | 'hours'
  const [weekday, setWeekday] = useState('');
  const [date, setDate] = useState('');
  const [hourFrom, setHourFrom] = useState('');
  const [hourTo, setHourTo] = useState('');
  const [hoursScope, setHoursScope] = useState('weekday'); // 'weekday' | 'date'
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reset = () => { setMode(null); setWeekday(''); setDate(''); setHourFrom(''); setHourTo(''); setLabel(''); setError(''); };

  const handleSave = async () => {
    setError('');
    if (mode === 'weekday' && weekday === '') return setError('Izberite dan');
    if (mode === 'date' && !date) return setError('Vnesite datum');
    if (mode === 'hours') {
      if (!hourFrom || !hourTo) return setError('Izberite uro od in do');
      if (hourFrom >= hourTo) return setError('Ura "do" mora biti za uro "od"');
      if (hoursScope === 'weekday' && weekday === '') return setError('Izberite dan');
      if (hoursScope === 'date' && !date) return setError('Vnesite datum');
    }
    setSaving(true);
    try {
      const body = { type: mode, label };
      if (mode === 'weekday') body.weekday = parseInt(weekday);
      if (mode === 'date') body.date = date;
      if (mode === 'hours') {
        body.hour_from = hourFrom; body.hour_to = hourTo;
        if (hoursScope === 'weekday') body.weekday = parseInt(weekday);
        else body.date = date;
      }
      const created = await apiFetch('/staff/blocked-times', { method: 'POST', body: JSON.stringify(body) }, token);
      onUpdate([...blockedTimes, created]);
      reset();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/staff/blocked-times/${id}`, { method: 'DELETE' }, token);
      onUpdate(blockedTimes.filter((b) => b.id !== id));
    } catch (e) { console.error(e); }
  };

  const describeBlock = (b) => {
    if (b.type === 'weekday') return `${WEEKDAY_LABELS[b.weekday]} (vsak teden)`;
    if (b.type === 'date') return `${b.date}`;
    if (b.type === 'hours') {
      const scope = b.weekday != null ? WEEKDAY_LABELS[b.weekday] : b.date;
      return `${scope} · ${b.hour_from}–${b.hour_to}`;
    }
    return '—';
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">Nedostopnost</h3>
        {!mode && (
          <button onClick={() => setMode('weekday')}
            className="flex items-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
            <HiPlus size={14} /> Dodaj
          </button>
        )}
      </div>

      {/* Existing blocks */}
      {blockedTimes.length === 0 && !mode && (
        <p className="text-sm text-gray-400 text-center py-2">Ni nastavljenih omejitev</p>
      )}
      <div className="space-y-2">
        {blockedTimes.map((b) => (
          <div key={b.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{describeBlock(b)}</p>
              {b.label && <p className="text-xs text-gray-400">{b.label}</p>}
            </div>
            <button onClick={() => handleDelete(b.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
              <HiTrash size={15} />
            </button>
          </div>
        ))}
      </div>

      {/* Add form */}
      {mode && (
        <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
          {/* Mode selector */}
          <div className="flex gap-2">
            {[
              { id: 'weekday', label: 'Dan v tednu' },
              { id: 'date',    label: 'Določen dan' },
              { id: 'hours',   label: 'Določene ure' },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setMode(id)}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors ${
                  mode === id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Weekday picker */}
          {(mode === 'weekday' || (mode === 'hours' && hoursScope === 'weekday')) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Dan</label>
              <div className="grid grid-cols-4 gap-1.5">
                {WEEKDAY_LABELS.map((d, i) => (
                  <button key={i} type="button" onClick={() => setWeekday(String(i))}
                    className={`py-1.5 text-xs rounded-lg border font-medium transition-colors ${
                      weekday === String(i) ? 'bg-rose-500 text-white border-rose-500' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-rose-300'
                    }`}>
                    {d.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date picker */}
          {(mode === 'date' || (mode === 'hours' && hoursScope === 'date')) && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Datum</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
            </div>
          )}

          {/* Hours scope toggle */}
          {mode === 'hours' && (
            <>
              <div className="flex gap-2">
                {[{ id: 'weekday', label: 'Po dnevu' }, { id: 'date', label: 'Točen datum' }].map(({ id, label }) => (
                  <button key={id} onClick={() => setHoursScope(id)}
                    className={`flex-1 text-xs font-semibold py-1.5 rounded-xl border transition-colors ${
                      hoursScope === id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}>
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Od</label>
                  <select value={hourFrom} onChange={(e) => setHourFrom(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                    <option value="">—</option>
                    {TIME_SLOTS_ALL.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Do</label>
                  <select value={hourTo} onChange={(e) => setHourTo(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                    <option value="">—</option>
                    {TIME_SLOTS_ALL.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Optional label */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Opomba (neobvezno)</label>
            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              placeholder="npr. Dopust, sestanek..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button onClick={reset} className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm">
              Prekliči
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50">
              {saving ? 'Shranjevanje...' : 'Shrani'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Appointment Calendar ───────────────────────────────────────────────────────
function AppointmentCalendar({ token, initialDate, services }) {
  const today = new Date();
  const base = initialDate ? new Date(initialDate + 'T12:00:00') : new Date();
  const [year, setYear] = useState(base.getFullYear());
  const [month, setMonth] = useState(base.getMonth() + 1);
  const [appointments, setAppointments] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [selectedDay, setSelectedDay] = useState(base.getDate());
  const [showAddForm, setShowAddForm] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [allAppointments, setAllAppointments] = useState(null);
  const [blockedTimes, setBlockedTimes] = useState([]);

  const loadAppointments = useCallback(async () => {
    setLoadError('');
    try {
      const data = await apiFetch(`/staff/appointments?year=${year}&month=${month}`, {}, token);
      setAppointments(data);
    } catch (e) { setLoadError(e.message); }
  }, [token, year, month]);

  // Load ALL appointments once for search
  useEffect(() => {
    apiFetch('/staff/appointments', {}, token)
      .then(setAllAppointments)
      .catch(console.error);
  }, [token]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);
  useEffect(() => {
    apiFetch('/staff/customers', {}, token).then(setCustomers).catch(console.error);
    apiFetch('/staff/blocked-times', {}, token).then(setBlockedTimes).catch(console.error);
  }, [token]);

  const days = getCalendarDays(year, month);
  const aptByDay = {};
  appointments.forEach((a) => {
    const d = parseInt(a.date.split('-')[2]);
    if (!aptByDay[d]) aptByDay[d] = [];
    aptByDay[d].push(a);
  });

  const isDayBlocked = (day) => {
    const dateStr = toDateStr(year, month, day);
    const dow = new Date(year, month - 1, day).getDay();
    const mon = dow === 0 ? 6 : dow - 1; // convert to Mon=0..Sun=6
    return blockedTimes.some((b) =>
      (b.type === 'weekday' && b.weekday === mon) ||
      (b.type === 'date' && b.date === dateStr)
    );
  };

  const selectedDateStr = selectedDay ? toDateStr(year, month, selectedDay) : null;
  const selectedApts = selectedDay ? (aptByDay[selectedDay] || []) : [];

  const prevMonth = () => {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); } else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); } else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Inline add termin form
  const [aptName, setAptName] = useState('');
  const [aptId, setAptId] = useState(null);
  const [aptService, setAptService] = useState('');
  const [aptTime, setAptTime] = useState('09:00');
  const [aptNotes, setAptNotes] = useState('');
  const [aptLoading, setAptLoading] = useState(false);
  const [aptError, setAptError] = useState('');
  const [aptSuggestions, setAptSuggestions] = useState(false);

  const resetAptForm = () => { setShowAddForm(false); setAptName(''); setAptId(null); setAptService(''); setAptTime('09:00'); setAptNotes(''); setAptError(''); };

  const handleSaveApt = async () => {
    if (!aptName || !aptService || !aptTime) return setAptError('Vsa obvezna polja morajo biti izpolnjena');
    setAptLoading(true); setAptError('');
    try {
      await apiFetch('/staff/appointment', {
        method: 'POST',
        body: JSON.stringify({ customer_name: aptName, customer_id: aptId || null, service: aptService, date: selectedDateStr, time: aptTime, notes: aptNotes }),
      }, token);
      resetAptForm();
      loadAppointments();
    } catch (e) { setAptError(e.message); }
    finally { setAptLoading(false); }
  };

  // Nedostopnost inline form
  const [showBlockedForm, setShowBlockedForm] = useState(false);
  const [bType, setBType] = useState('date'); // 'date' | 'hours'
  const [bHourFrom, setBHourFrom] = useState('');
  const [bHourTo, setBHourTo] = useState('');
  const [bLabel, setBLabel] = useState('');
  const [bSaving, setBSaving] = useState(false);
  const [bError, setBError] = useState('');

  const resetBlockedForm = () => { setShowBlockedForm(false); setBType('date'); setBHourFrom(''); setBHourTo(''); setBLabel(''); setBError(''); };

  const handleSaveBlocked = async () => {
    setBError('');
    if (bType === 'hours' && (!bHourFrom || !bHourTo)) return setBError('Izberite uro od in do');
    if (bType === 'hours' && bHourFrom >= bHourTo) return setBError('Ura "do" mora biti za uro "od"');
    setBSaving(true);
    try {
      const body = { type: bType, label: bLabel };
      if (bType === 'date') body.date = selectedDateStr;
      if (bType === 'hours') { body.date = selectedDateStr; body.hour_from = bHourFrom; body.hour_to = bHourTo; }
      const created = await apiFetch('/staff/blocked-times', { method: 'POST', body: JSON.stringify(body) }, token);
      setBlockedTimes((prev) => [...prev, created]);
      resetBlockedForm();
    } catch (e) { setBError(e.message); }
    finally { setBSaving(false); }
  };

  const handleDeleteBlocked = async (id) => {
    try {
      await apiFetch(`/staff/blocked-times/${id}`, { method: 'DELETE' }, token);
      setBlockedTimes((prev) => prev.filter((b) => b.id !== id));
    } catch (e) { console.error(e); }
  };

  const deleteApt = async (id) => {
    try {
      await apiFetch(`/staff/appointment/${id}`, { method: 'DELETE' }, token);
      setConfirmDeleteId(null);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      setAllAppointments((prev) => prev ? prev.filter((a) => a.id !== id) : prev);
    } catch (e) { console.error(e); }
  };

  const q = search.trim().toLowerCase();
  const searchResults = q && allAppointments
    ? allAppointments.filter((a) =>
        (a.customer_name || '').toLowerCase().includes(q) ||
        (a.service || '').toLowerCase().includes(q) ||
        (a.notes || '').toLowerCase().includes(q)
      ).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))
    : null;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="relative">
        <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Iskanje po stranki ali storitvi..."
          className="w-full pl-11 pr-10 py-3 bg-white rounded-2xl shadow-sm border border-transparent focus:border-rose-300 focus:outline-none text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600">
            <HiXMark size={16} />
          </button>
        )}
      </div>

      {/* Search results */}
      {searchResults && (
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">
            {searchResults.length === 0 ? 'Ni rezultatov' : `${searchResults.length} termin${searchResults.length === 1 ? '' : 'ov'}`}
          </p>
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Ni terminov za "{search}"</p>
          ) : (
            <div className="space-y-2">
              {searchResults.map((apt) => (
                <div key={apt.id} className={`p-3 rounded-xl transition-colors ${confirmDeleteId === apt.id ? 'bg-red-50' : 'bg-rose-50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 text-center w-16">
                      <p className="text-xs text-gray-400">{formatDate(apt.date)}</p>
                      <p className="text-sm font-bold text-rose-600">{apt.time}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{apt.customer_name}</p>
                      <p className="text-xs text-gray-500">{apt.service}</p>
                      {apt.notes && <p className="text-xs text-gray-400 italic mt-0.5">"{apt.notes}"</p>}
                    </div>
                    <button onClick={() => setConfirmDeleteId(confirmDeleteId === apt.id ? null : apt.id)}
                      className="shrink-0 flex items-center justify-center w-9 h-9 hover:bg-red-100 rounded-lg transition-colors">
                      <HiTrash className="text-red-400" size={16} />
                    </button>
                  </div>
                  {confirmDeleteId === apt.id && (
                    <div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between gap-2">
                      <p className="text-xs text-red-600 font-medium">Res želite preklicati ta termin?</p>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setConfirmDeleteId(null)}
                          className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                          Ne
                        </button>
                        <button onClick={() => deleteApt(apt.id)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">
                          Da, prekliči
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Calendar (hidden while searching) */}
      {!searchResults && loadError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-2xl p-4 text-sm">
          <p className="font-semibold mb-1">Napaka pri nalaganju urnika</p>
          <p className="text-xs">{loadError}</p>
          {loadError.toLowerCase().includes('exist') && (
            <p className="text-xs mt-2 text-red-500">Miza "appointments" morda ne obstaja v Supabase. Ustvarite jo v SQL urejevalniku.</p>
          )}
        </div>
      )}
      {!searchResults && (
        <>
          {/* Top row: Calendar + Action panel */}
          <div className="md:grid md:grid-cols-[1fr_360px] md:gap-6 md:items-start space-y-4 md:space-y-0">
            {/* Calendar */}
            <div className="bg-white rounded-3xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <HiChevronLeft size={20} className="text-gray-600" />
                </button>
                <h3 className="font-bold text-gray-800">{MONTHS_SL[month - 1]} {year}</h3>
                <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <HiChevronRight size={20} className="text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS_SL.map((d) => (
                  <div key={d} className="text-center text-xs text-gray-400 font-medium py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, i) => {
                  if (!day) return <div key={`e${i}`} />;
                  const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
                  const isSelected = day === selectedDay;
                  const hasApts = aptByDay[day]?.length > 0;
                  const blocked = isDayBlocked(day);
                  return (
                    <button key={day} onClick={() => { setSelectedDay(day); resetAptForm(); resetBlockedForm(); }}
                      className={`relative flex flex-col items-center justify-center py-2 rounded-xl text-sm font-medium transition-colors ${
                        isSelected ? 'bg-rose-500 text-white' :
                        blocked ? 'bg-gray-100 text-gray-300' :
                        isToday ? 'bg-rose-50 text-rose-600 font-bold' :
                        'hover:bg-gray-50 text-gray-700'
                      }`}>
                      {day}
                      {hasApts && !blocked && (
                        <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-white opacity-70' : 'bg-rose-400'}`} />
                      )}
                      {blocked && !isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full mt-0.5 bg-gray-300" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action panel */}
            {selectedDay ? (
              <div className="bg-white rounded-3xl p-4 shadow-sm space-y-3">
                <h4 className="font-bold text-gray-800">
                  {selectedDay}. {MONTHS_SL[month - 1].toLowerCase()} {year}
                </h4>

                {/* Buttons — always visible unless a form is open */}
                {!showAddForm && !showBlockedForm && (
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowAddForm(true)}
                      className="flex items-center justify-center gap-1 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors">
                      <HiPlus size={15} /> Dodaj termin
                    </button>
                    <button onClick={() => setShowBlockedForm(true)}
                      className="flex items-center justify-center border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-500 text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors bg-white">
                      Nedostopnost
                    </button>
                  </div>
                )}

                {/* Inline: add termin */}
                {showAddForm && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Nov termin</p>
                    {aptError && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{aptError}</p>}
                    <div className="relative">
                      <label className="block text-xs font-medium text-gray-600 mb-1">Stranka *</label>
                      <input type="text" value={aptName}
                        onChange={(e) => { setAptName(e.target.value); setAptId(null); setAptSuggestions(true); }}
                        onBlur={() => setTimeout(() => setAptSuggestions(false), 150)}
                        placeholder="Ime stranke..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                      {aptSuggestions && aptName.length > 0 && (() => {
                        const sugg = customers.filter((c) => c.name.toLowerCase().includes(aptName.toLowerCase())).slice(0, 5);
                        return sugg.length > 0 ? (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl mt-1 shadow-lg z-10 overflow-hidden">
                            {sugg.map((c) => (
                              <button key={c.id} type="button"
                                onMouseDown={() => { setAptName(c.name); setAptId(c.id); setAptSuggestions(false); }}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-rose-50 flex items-center gap-2">
                                <span className="font-medium text-gray-800">{c.name}</span>
                                <span className="text-xs text-gray-400">{c.email}</span>
                              </button>
                            ))}
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Storitev *</label>
                      <select value={aptService} onChange={(e) => setAptService(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 bg-white">
                        <option value="">Izberite storitev...</option>
                        {services.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Ura *</label>
                      <input type="time" value={aptTime} onChange={(e) => setAptTime(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Opombe</label>
                      <textarea value={aptNotes} onChange={(e) => setAptNotes(e.target.value)}
                        rows={2} placeholder="Posebne želje, dolžina, barva..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={resetAptForm}
                        className="border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm">Prekliči</button>
                      <button onClick={handleSaveApt} disabled={aptLoading}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50">
                        {aptLoading ? 'Shranjevanje...' : 'Shrani termin'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline: add nedostopnost */}
                {showBlockedForm && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Dodaj nedostopnost</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ id: 'date', label: 'Cel dan' }, { id: 'hours', label: 'Določene ure' }].map(({ id, label }) => (
                        <button key={id} onClick={() => setBType(id)}
                          className={`text-sm font-semibold py-2.5 rounded-xl border transition-colors ${
                            bType === id ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-gray-600 border-gray-200 hover:border-rose-300'
                          }`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    {bType === 'hours' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Od</label>
                          <select value={bHourFrom} onChange={(e) => setBHourFrom(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                            <option value="">—</option>
                            {TIME_SLOTS_ALL.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Do</label>
                          <select value={bHourTo} onChange={(e) => setBHourTo(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300">
                            <option value="">—</option>
                            {TIME_SLOTS_ALL.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Opomba (neobvezno)</label>
                      <input type="text" value={bLabel} onChange={(e) => setBLabel(e.target.value)}
                        placeholder="npr. Dopust, sestanek..."
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
                    </div>
                    {bError && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{bError}</p>}
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={resetBlockedForm}
                        className="border border-gray-200 text-gray-600 font-semibold rounded-xl py-2.5 text-sm">Prekliči</button>
                      <button onClick={handleSaveBlocked} disabled={bSaving}
                        className="bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-2.5 text-sm disabled:opacity-50">
                        {bSaving ? 'Shranjevanje...' : 'Shrani'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex bg-white rounded-3xl shadow-sm p-8 items-center justify-center min-h-52">
                <div className="text-center text-gray-300">
                  <HiCalendarDays size={40} className="mx-auto mb-2" />
                  <p className="text-sm">Izberite dan za prikaz terminov</p>
                </div>
              </div>
            )}
          </div>

          {/* Activities for selected day — full width below */}
          {selectedDay && (() => {
            const dow = new Date(year, month - 1, selectedDay).getDay();
            const mon = dow === 0 ? 6 : dow - 1;
            const dayBlocks = blockedTimes.filter((b) =>
              (b.type === 'date' && b.date === selectedDateStr) ||
              (b.type === 'hours' && b.date === selectedDateStr) ||
              (b.type === 'weekday' && b.weekday === mon)
            );
            if (selectedApts.length === 0 && dayBlocks.length === 0) return null;
            return (
              <div className="bg-white rounded-3xl p-4 shadow-sm space-y-3">
                <h4 className="font-semibold text-gray-700 text-sm">
                  {selectedDay}. {MONTHS_SL[month - 1].toLowerCase()} {year} — aktivnosti
                </h4>
                {/* Termini */}
                {selectedApts.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Termini</p>
                    {[...selectedApts].sort((a, b) => a.time.localeCompare(b.time)).map((apt) => (
                      <div key={apt.id} className={`p-3 rounded-xl transition-colors ${confirmDeleteId === apt.id ? 'bg-red-50' : 'bg-rose-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-center shrink-0 w-12">
                            <p className="text-sm font-bold text-rose-600">{apt.time}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{apt.customer_name}</p>
                            <p className="text-xs text-gray-500">{apt.service}</p>
                            {apt.notes && <p className="text-xs text-gray-400 italic mt-0.5">"{apt.notes}"</p>}
                          </div>
                          <button onClick={() => setConfirmDeleteId(confirmDeleteId === apt.id ? null : apt.id)}
                            className="shrink-0 flex items-center justify-center w-9 h-9 hover:bg-red-100 rounded-lg transition-colors">
                            <HiTrash className="text-red-400" size={16} />
                          </button>
                        </div>
                        {confirmDeleteId === apt.id && (
                          <div className="mt-2 pt-2 border-t border-red-100 flex items-center justify-between gap-2">
                            <p className="text-xs text-red-600 font-medium">Res želite preklicati ta termin?</p>
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">Ne</button>
                              <button onClick={() => deleteApt(apt.id)}
                                className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600">Da, prekliči</button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {/* Nedostopnosti */}
                {dayBlocks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">Nedostopnosti</p>
                    {dayBlocks.map((b) => {
                      const desc = b.type === 'weekday' ? `${WEEKDAY_LABELS[b.weekday]} (vsak teden)`
                        : b.type === 'hours' ? `${b.hour_from}–${b.hour_to}` : 'Cel dan';
                      return (
                        <div key={b.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-700">{desc}</p>
                            {b.label && <p className="text-xs text-gray-400">{b.label}</p>}
                          </div>
                          <button onClick={() => handleDeleteBlocked(b.id)} className="p-1.5 text-gray-300 hover:text-red-400 transition-colors">
                            <HiTrash size={15} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}

// ── Push Notification Settings ────────────────────────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;
}

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function PushNotificationSettings({ token }) {
  const [status, setStatus] = useState('loading'); // loading | unsupported | notInstalled | denied | subscribed | unsubscribed
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('success'); // success | error
  const [testing, setTesting] = useState(false);

  const standalone = isStandalone();

  useEffect(() => {
    if (!('PushManager' in window) || !('serviceWorker' in navigator)) {
      setStatus('unsupported');
      return;
    }
    const perm = Notification.permission;
    if (perm === 'denied') { setStatus('denied'); return; }
    navigator.serviceWorker.ready.then((reg) =>
      reg.pushManager.getSubscription().then((sub) => setStatus(sub ? 'subscribed' : 'unsubscribed'))
    );
  }, []);

  const showMsg = (text, type = 'success') => { setMsg(text); setMsgType(type); };

  const handleSubscribe = async () => {
    setSaving(true);
    setMsg('');
    try {
      const { publicKey } = await apiFetch('/push/vapid-public-key', {}, token);
      if (!publicKey) throw new Error('VAPID ključ ni nastavljen na strežniku. Dodajte env var VAPID_PUBLIC_KEY v Netlify.');
      const reg = await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await apiFetch('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription: sub }) }, token);
      setStatus('subscribed');
      showMsg('Obvestila so vklopljena!');
    } catch (e) {
      showMsg('Napaka: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribe = async () => {
    setSaving(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await apiFetch('/push/subscribe', { method: 'DELETE' }, token);
      setStatus('unsubscribed');
      showMsg('Obvestila so izklopljena.');
    } catch (e) {
      showMsg('Napaka: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMsg('');
    try {
      await apiFetch('/push/test', { method: 'POST' }, token);
      showMsg('Testno obvestilo poslano! Preverite telefon.');
    } catch (e) {
      showMsg('Napaka pri pošiljanju: ' + e.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <HiBell className="text-rose-500" size={20} />
        <h3 className="font-bold text-gray-800">Potisna obvestila</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">Prejmite obvestilo na telefon, ko stranka rezervira termin.</p>
      {msg && (
        <div className={`text-xs rounded-xl p-3 mb-3 ${msgType === 'error' ? 'text-red-700 bg-red-50' : 'text-green-700 bg-green-50'}`}>
          {msg}
        </div>
      )}
      {!standalone && status !== 'subscribed' && status !== 'loading' && status !== 'unsupported' && (
        <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 mb-3">
          <p className="font-semibold mb-1">Za boljše delovanje odprite app z ikone na začetnem zaslonu.</p>
          {isIOS()
            ? <p>Safari → Skupna raba → "Dodaj na začetni zaslon"</p>
            : <p>Chrome → ⋮ → "Namesti aplikacijo"</p>}
        </div>
      )}

      {status === 'loading' && <p className="text-sm text-gray-400">Nalaganje...</p>}
      {status === 'unsupported' && <p className="text-sm text-gray-400">Vaš brskalnik ne podpira push obvestil.</p>}
      {status === 'denied' && (
        <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700 space-y-1">
          <p className="font-semibold">Obvestila so blokirana.</p>
          {isIOS()
            ? <p>Nastavitve → GlowLoyalty → Obvestila → vklopite</p>
            : <p>Nastavitve → Aplikacije → Chrome → Dovoljenja → Obvestila → Dovoli</p>}
        </div>
      )}
      {status === 'unsubscribed' && (
        <button onClick={handleSubscribe} disabled={saving}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
          {saving ? 'Vklaplanje...' : 'Vklopi obvestila'}
        </button>
      )}
      {status === 'subscribed' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 rounded-xl p-3">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            Obvestila so aktivna
          </div>
          <button onClick={handleTest} disabled={testing || saving}
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm transition-colors disabled:opacity-50">
            {testing ? 'Pošiljanje...' : 'Pošlji testno obvestilo'}
          </button>
          <button onClick={handleUnsubscribe} disabled={saving}
            className="w-full bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl py-3 text-sm hover:border-rose-200 transition-colors disabled:opacity-50">
            {saving ? 'Izklapljanje...' : 'Izklopi obvestila'}
          </button>
        </div>
      )}
    </div>
  );
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
      const updated = await apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify({ ...form, name: capitalizeName(form.name) }) }, token);
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
          <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+386 41 123 456"
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

// ── Services Settings ─────────────────────────────────────────────────────────
function ServicesSettings({ token, services, onUpdate }) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const svc = await apiFetch('/staff/service', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), price, duration }),
      }, token);
      onUpdate((prev) => [...prev, svc].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
      setPrice('');
      setDuration('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiFetch(`/staff/service/${id}`, { method: 'DELETE' }, token);
      onUpdate((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <HiStar className="text-rose-500" size={20} />
        <h3 className="font-bold text-gray-800">Storitve</h3>
      </div>
      <p className="text-xs text-gray-400 mb-4">Dodajte ali odstranite storitve iz ponudbe salona.</p>

      <form onSubmit={handleAdd} className="space-y-2 mb-5">
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Ime storitve *" required
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        <input value={price} onChange={(e) => setPrice(e.target.value)}
          placeholder="Cena (€)" type="number" min="0" step="0.5"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        <input value={duration} onChange={(e) => setDuration(e.target.value)}
          placeholder="Trajanje (npr. 45 min)"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300" />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button type="submit" disabled={saving}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold rounded-xl py-3 text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
          <HiPlus size={16} />
          {saving ? 'Dodajanje...' : 'Dodaj storitev'}
        </button>
      </form>

      <div className="space-y-2">
        {services.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-3">Še ni dodanih storitev</p>
        )}
        {services.map((svc) => (
          <div key={svc.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
            <div>
              <p className="text-sm font-medium text-gray-800">{svc.name}</p>
              <p className="text-xs text-gray-400">
                {svc.price > 0 ? `${svc.price} €` : ''}
                {svc.price > 0 && svc.duration ? ' · ' : ''}
                {svc.duration}
              </p>
            </div>
            <button onClick={() => handleDelete(svc.id)}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
              <HiTrash size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Staff Portal ─────────────────────────────────────────────────────────
export default function StaffPortal() {
  const { token, logout, updateUser } = useAuth();

  // Support deep-link from push notification: /staff?tab=calendar&date=2024-01-15
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get('tab') || 'calendar';
  const initialDate = urlParams.get('date') || null;

  const [activeTab, setActiveTab] = useState(initialTab);

  const [scannerKey, setScannerKey] = useState(0);
  const [scannedCustomer, setScannedCustomer] = useState(null);
  const [scanSuccess, setScanSuccess] = useState('');
  const [scanError, setScanError] = useState('');

  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [logForCustomer, setLogForCustomer] = useState(null);

  const [analytics, setAnalytics] = useState(null);
  const [staffProfile, setStaffProfile] = useState(null);
  const [services, setServices] = useState([]);

  const handleScan = useCallback(async (qrToken) => {
    setScanError('');
    try {
      const customer = await apiFetch(`/staff/scan/${qrToken}`, {}, token);
      setScannedCustomer(customer);
    } catch (e) {
      setScanError(e.message || 'QR koda ni veljavna');
      setTimeout(() => { setScanError(''); setScannerKey((k) => k + 1); }, 2500);
    }
  }, [token]);

  const handleVisitSuccess = (result) => {
    setScanSuccess(`Dodano ${result.points_awarded} točk za ${result.customer.name}!`);
    setScannedCustomer(null);
    setLogForCustomer(null);
    setSelectedCustomer(null);
    setTimeout(() => { setScanSuccess(''); setScannerKey((k) => k + 1); }, 3000);
  };

  const cancelScan = () => { setScannedCustomer(null); setScannerKey((k) => k + 1); };

  const loadCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      setCustomers(await apiFetch(`/staff/customers${q}`, {}, token));
    } catch (e) { console.error(e); }
    finally { setLoadingCustomers(false); }
  }, [token, search]);

  useEffect(() => {
    apiFetch('/services', {}, token).then(setServices).catch(console.error);
    apiFetch('/auth/profile', {}, token).then(setStaffProfile).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (activeTab === 'customers') loadCustomers();
    if (activeTab === 'analytics') apiFetch('/staff/analytics', {}, token).then(setAnalytics).catch(console.error);
    if (activeTab === 'settings') apiFetch('/auth/profile', {}, token).then(setStaffProfile).catch(console.error);
  }, [activeTab, loadCustomers, token, staffProfile]);

  useEffect(() => {
    if (activeTab !== 'customers') return;
    const t = setTimeout(loadCustomers, 300);
    return () => clearTimeout(t);
  }, [search, activeTab, loadCustomers]);

  const tabs = [
    { id: 'calendar',  label: 'Urnik',      Icon: HiCalendarDays },
    { id: 'scanner',   label: 'Skeniraj',   Icon: HiCamera },
    { id: 'customers', label: 'Stranke',    Icon: HiUserGroup },
    { id: 'analytics', label: 'Analitika',  Icon: HiChartBar },
    { id: 'settings',  label: 'Nastavitve', Icon: HiCog6Tooth },
  ];

  const PAGE_TITLES = {
    calendar:  'Urnik',
    scanner:   'Skeniraj',
    customers: 'Stranke',
    analytics: 'Analitika',
    settings:  'Nastavitve',
  };

  const staffInitials = (staffProfile?.name || 'O').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="cust-shell">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="cust-sidebar">
        <div className="cust-sidebar-brand">
          <img src="/icons/logo.svg" alt="" className="w-9 h-9" />
          <div>
            <div className="cust-brand-name">GlowLoyalty</div>
            <div className="cust-brand-sub">Osebje</div>
          </div>
        </div>
        <nav className="cust-nav">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`cust-nav-item${activeTab === id ? ' active' : ''}`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className="cust-sidebar-footer">
          <div className="cust-user-info">
            <div className="cust-avatar">{staffInitials}</div>
            <div className="cust-user-meta">
              <div className="cust-user-name">{staffProfile?.name || 'Osebje'}</div>
              <div className="cust-user-email">{staffProfile?.email || ''}</div>
            </div>
          </div>
          <button onClick={logout} className="cust-logout">
            <HiArrowRightOnRectangle size={16} />
            Odjava
          </button>
        </div>
      </aside>

      {/* ── Right side ──────────────────────────────────────────────────────── */}
      <div className="cust-main">

        {/* Topbar */}
        <header className="cust-topbar">
          {/* Logo — mobile only */}
          <img src="/icons/logo.svg" alt="GlowLoyalty" className="w-8 h-8 block lg:hidden flex-shrink-0" />
          <h1 className="cust-topbar-title">{PAGE_TITLES[activeTab]}</h1>
        </header>

        {/* Mobile tab bar */}
        <div className="cust-mobile-tabs">
          {tabs.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`cust-mobile-tab${activeTab === id ? ' active' : ''}`}>
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <div className="cust-content space-y-4">

          {/* Scanner */}
          {activeTab === 'scanner' && (
            <>
              {scanSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl p-4 text-center font-semibold">
                  {scanSuccess}
                </div>
              )}
              {!scannedCustomer && !logForCustomer && !scanSuccess && (
                <div className="bg-white rounded-3xl p-5 shadow-sm md:max-w-lg">
                  <h3 className="font-bold text-gray-800 mb-1 md:text-xl">Skeniraj stranko</h3>
                  <p className="text-sm text-gray-500 mb-4">Usmerite kamero na QR kodo na strankinemu telefonu</p>
                  {scanError && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 mb-4 text-sm text-center">{scanError}</div>}
                  {!scanError && <QRScanner key={scannerKey} onScan={handleScan} />}
                  <p className="text-xs text-gray-400 text-center mt-3">Kamera samodejno prepozna QR kodo</p>
                </div>
              )}
              {(scannedCustomer || logForCustomer) && !scanSuccess && (
                <div className="md:max-w-lg">
                  <LogVisitForm customer={scannedCustomer || logForCustomer} token={token}
                    onSuccess={handleVisitSuccess} onCancel={cancelScan} services={services} />
                </div>
              )}
            </>
          )}

          {/* Calendar */}
          {activeTab === 'calendar' && <AppointmentCalendar token={token} initialDate={initialDate} services={services} />}

          {/* Customers */}
          {activeTab === 'customers' && (
            <>
              {logForCustomer ? (
                <div className="space-y-3 md:max-w-lg">
                  <button onClick={() => setLogForCustomer(null)} className="flex items-center gap-1 text-rose-500 text-sm font-medium">
                    ← Nazaj na stranke
                  </button>
                  <LogVisitForm customer={logForCustomer} token={token}
                    onSuccess={(result) => { handleVisitSuccess(result); setActiveTab('customers'); setTimeout(loadCustomers, 500); }}
                    onCancel={() => setLogForCustomer(null)} services={services} />
                </div>
              ) : (
                <div className="customers-layout">

                  {/* Customer list */}
                  <div className="customers-list">
                    <div className="relative">
                      <HiMagnifyingGlass className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 shadow-sm"
                        placeholder="Iskanje po imenu, e-pošti ali telefonu..." />
                    </div>
                    <div className="space-y-2">
                      {loadingCustomers && <p className="text-center text-gray-400 py-6 text-sm">Nalaganje...</p>}
                      {!loadingCustomers && customers.length === 0 && (
                        <div className="bg-white rounded-3xl p-10 text-center shadow-sm md:shadow-none md:p-6">
                          <div className="flex justify-center mb-3"><HiUserGroup className="text-gray-300" size={48} /></div>
                          <p className="text-gray-500 text-sm">{search ? 'Ni rezultatov za iskanje' : 'Še ni registriranih strank'}</p>
                        </div>
                      )}
                      {customers.map((c) => (
                        <button key={c.id} onClick={() => setSelectedCustomer(c)}
                          className={`w-full bg-white rounded-2xl px-4 py-3.5 shadow-sm flex items-center gap-3 transition-colors text-left md:rounded-xl md:shadow-none md:border ${
                            selectedCustomer?.id === c.id
                              ? 'md:border-rose-300 md:bg-rose-50'
                              : 'hover:bg-rose-50 md:border-gray-100 md:hover:border-rose-200'
                          }`}>
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center font-bold text-white shrink-0">
                            {c.name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm">{c.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{c.email}</p>
                            {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_BADGE[c.tier] || 'bg-gray-100 text-gray-600'}`}>
                              {c.tier}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{c.points} pt</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Customer detail — desktop inline panel */}
                  <div className="customers-detail">
                    {selectedCustomer ? (
                      <CustomerVisitsModal customer={selectedCustomer} token={token} inline={true}
                        onClose={() => setSelectedCustomer(null)}
                        onLogVisit={(c) => { setLogForCustomer(c); setSelectedCustomer(null); }} />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <div className="text-center text-gray-300">
                          <HiUserGroup size={52} className="mx-auto mb-3" />
                          <p className="text-sm">Izberite stranko za prikaz podrobnosti</p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            analytics ? (
              <div className="space-y-5">
                <div className="analytics-stats-grid grid grid-cols-2 gap-4">
                  {[
                    { label: 'Skupaj strank',  value: analytics.totalCustomers,                 Icon: HiUserGroup,    color: 'text-rose-600' },
                    { label: 'Obiski danes',   value: analytics.todayVisits,                   Icon: HiCalendarDays, color: 'text-pink-600' },
                    { label: 'Skupaj točk',    value: analytics.totalPoints?.toLocaleString(),  Icon: HiStar,         color: 'text-amber-600' },
                    { label: 'Skupaj obiskov', value: analytics.totalVisits,                   Icon: HiHome,         color: 'text-fuchsia-600' },
                  ].map(({ label, value, Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl p-5 shadow-sm text-center">
                      <div className="flex justify-center mb-2"><Icon size={28} className={color} /></div>
                      <div className={`text-3xl font-bold ${color}`}>{value}</div>
                      <div className="text-xs text-gray-500 mt-1">{label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">Zadnji obiski</h3>
                  {analytics.recentVisits.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-4">Ni zabeleženih obiskov</p>
                  ) : (
                    <div className="divide-y divide-gray-50">
                      {analytics.recentVisits.map((v) => (
                        <div key={v.id} className="flex items-center gap-3 py-3">
                          <div className="w-9 h-9 bg-rose-100 rounded-full flex items-center justify-center shrink-0">
                            {v.customer_name?.[0]
                              ? <span className="text-sm font-bold text-rose-600">{v.customer_name[0].toUpperCase()}</span>
                              : <FaUserCircle className="text-rose-300" size={20} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{v.customer_name}</p>
                            <p className="text-xs text-gray-400">{v.service}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-bold text-rose-600">+{v.points_awarded}</span>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(v.created_at).toLocaleDateString('sl-SI')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : <div className="text-center py-10 text-gray-400">Nalaganje analitike...</div>
          )}

          {/* Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4 md:space-y-0">
              <div className="px-1 mb-6">
                <h2 className="font-bold text-gray-800 text-lg md:text-2xl">Nastavitve profila</h2>
                <p className="text-xs text-gray-400 mt-0.5">Upravljajte svoje podatke in varnost računa</p>
              </div>
              <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">
                <div className="space-y-4">
                  {staffProfile
                    ? <ProfileSettings profile={staffProfile} token={token}
                        onUpdate={(u) => { setStaffProfile((p) => ({ ...p, ...u })); updateUser(u); }} />
                    : <div className="text-center py-6 text-gray-400 text-sm">Nalaganje...</div>}
                  <PasswordSettings token={token} />
                </div>
                <div className="space-y-4">
                  <PushNotificationSettings token={token} />
                  <ServicesSettings token={token} services={services} onUpdate={setServices} />
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={logout}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-rose-100 bg-rose-50 text-rose-500 font-semibold text-sm hover:bg-rose-100 transition-colors"
                >
                  <HiArrowRightOnRectangle size={18} />
                  Odjava
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
