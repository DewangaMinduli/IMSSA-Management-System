import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Shield, Edit3, Save, X, ArrowLeft, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MemberProfile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [skills, setSkills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ full_name: '', phone_number: '' });
    const [saveMsg, setSaveMsg] = useState('');

    const isStudent = user?.user_type === 'Student';

    useEffect(() => {
        if (!user?.id) return;
        const fetchAll = async () => {
            try {
                const [profileRes, analyticsRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/users/profile?user_id=${user.id}`),
                    isStudent ? fetch(`http://localhost:5000/api/users/${user.id}/analytics`) : Promise.resolve(null)
                ]);
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    setProfile(data);
                    setForm({ full_name: data.full_name || '', phone_number: data.phone_number || '' });
                }
                if (analyticsRes && analyticsRes.ok) {
                    const analyticsData = await analyticsRes.json();
                    setSkills(analyticsData.skills || []);
                }
            } catch (err) {
                console.error('Profile fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [user?.id]);

    const handleSave = async () => {
        setSaving(true);
        setSaveMsg('');
        try {
            const res = await fetch(`http://localhost:5000/api/users/profile?user_id=${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
            if (res.ok) {
                setProfile(prev => ({ ...prev, ...form }));
                setSaveMsg('Profile updated successfully!');
                setEditing(false);
            } else {
                setSaveMsg('Failed to save. Please try again.');
            }
        } catch {
            setSaveMsg('Network error. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setForm({ full_name: profile?.full_name || '', phone_number: profile?.phone_number || '' });
        setEditing(false);
        setSaveMsg('');
    };

    if (loading) return (
        <div className="p-8 max-w-5xl mx-auto">
            <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="h-64 bg-gray-200 rounded-xl"></div>
                    <div className="col-span-2 h-64 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-8 max-w-5xl mx-auto mb-10 font-sans">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => window.history.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
                        <p className="text-sm text-gray-500">Manage your personal information</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {editing ? (
                        <>
                            <button onClick={handleCancel} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                                <X size={15} /> Cancel
                            </button>
                            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm disabled:opacity-60">
                                <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </>
                    ) : (
                        <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-all">
                            <Edit3 size={15} /> Edit Profile
                        </button>
                    )}
                </div>
            </div>

            {saveMsg && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${saveMsg.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {saveMsg}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                {/* LEFT: Identity Card */}
                <div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                        <div className="w-28 h-28 mx-auto bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mb-4 border-4 border-white shadow-sm">
                            <span className="text-4xl font-bold">{profile?.full_name?.charAt(0) || '?'}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{profile?.full_name}</h3>
                        <p className="text-sm text-teal-600 font-medium mt-1">{profile?.role_name}</p>
                        <p className="text-xs text-gray-400 mt-1">{profile?.email}</p>

                        {/* Student Number badge for Student user type */}
                        {isStudent && profile?.student_number && (
                            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold border border-blue-100">
                                <Hash size={12} /> {profile.student_number}
                            </div>
                        )}

                        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold ${profile?.account_status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                            <div className={`w-2 h-2 rounded-full ${profile?.account_status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            {profile?.account_status || 'Active'}
                        </div>
                    </div>
                </div>

                {/* RIGHT: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h4 className="font-bold text-gray-800 mb-6 border-b border-gray-100 pb-3">Personal Information</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
                                {editing ? (
                                    <input
                                        className="w-full p-3 rounded-lg border border-teal-300 text-sm outline-none focus:ring-2 focus:ring-teal-200 text-gray-700"
                                        value={form.full_name}
                                        onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                        <User size={16} className="text-gray-400" /> {profile?.full_name}
                                    </div>
                                )}
                            </div>

                            {/* Email (read-only) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">University Email</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                    <Mail size={16} className="text-gray-400" /> {profile?.email}
                                </div>
                            </div>

                            {/* Contact */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contact Number</label>
                                {editing ? (
                                    <input
                                        className="w-full p-3 rounded-lg border border-teal-300 text-sm outline-none focus:ring-2 focus:ring-teal-200 text-gray-700"
                                        value={form.phone_number}
                                        onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                                        placeholder="+94 XX XXX XXXX"
                                    />
                                ) : (
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                        <Phone size={16} className="text-gray-400" /> {profile?.phone_number || '—'}
                                    </div>
                                )}
                            </div>

                            {/* Student Number — only for Student user type */}
                            {isStudent && (
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Student Number</label>
                                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                        <Hash size={16} className="text-gray-400" /> {profile?.student_number || '—'}
                                    </div>
                                </div>
                            )}

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">System Role</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                    <Shield size={16} className="text-gray-400" /> {profile?.role_name}
                                </div>
                            </div>

                            {/* Member Since */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Member Since</label>
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-gray-700 text-sm">
                                    <Calendar size={16} className="text-gray-400" />
                                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Account Status Banner */}
                    <div className={`p-5 rounded-xl border flex justify-between items-center ${profile?.account_status === 'Active' ? 'bg-teal-50/60 border-teal-100' : 'bg-red-50/60 border-red-100'}`}>
                        <div>
                            <h4 className={`font-bold text-sm ${profile?.account_status === 'Active' ? 'text-teal-800' : 'text-red-800'}`}>
                                Account Status: {profile?.account_status || 'Active'}
                            </h4>
                            <p className={`text-xs mt-1 ${profile?.account_status === 'Active' ? 'text-teal-600' : 'text-red-600'}`}>
                                {profile?.account_status === 'Active' ? 'Your account is in good standing.' : 'Your account has restricted access. Contact admin.'}
                            </p>
                        </div>
                        <div className={`h-3 w-3 rounded-full shadow-[0_0_0_4px_rgba(0,0,0,0.08)] ${profile?.account_status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                </div>
            </div>

            {/* SKILLS SECTION — shown for Student user type */}
            {isStudent && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold text-gray-800 mb-4 border-b border-gray-100 pb-3">Acquired Skills</h4>
                    {skills.length === 0 ? (
                        <p className="text-sm text-gray-400 italic">No skills acquired yet. Skills are earned when assigned tasks are completed and approved by the organizing committee.</p>
                    ) : (
                        <div className="flex flex-wrap gap-3">
                            {skills.map((skill, idx) => (
                                <div key={idx} className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-2 rounded-full shadow-sm">
                                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                    <span className="text-sm font-semibold text-gray-800">{skill.skill_name}</span>
                                    <span className="text-[10px] font-bold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-md">{skill.points} pts</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemberProfile;