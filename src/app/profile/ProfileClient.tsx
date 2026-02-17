'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Division {
    id: number;
    nameEn: string;
}

interface District {
    id: number;
    nameEn: string;
}

export default function ProfileClient({ user }: { user: any }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    // Form State
    const [name, setName] = useState(user.name || '');
    const [anonymousName, setAnonymousName] = useState('');
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [districts, setDistricts] = useState<District[]>([]);

    const [selectedDivision, setSelectedDivision] = useState<string>('');
    const [selectedDistrict, setSelectedDistrict] = useState<string>('');

    // Fetch initial data
    useEffect(() => {
        const init = async () => {
            try {
                // Fetch User Profile (to get current location)
                const profileRes = await fetch('/api/user/profile');
                const profileData = await profileRes.json();

                if (profileData.success) {
                    const u = profileData.data;
                    setName(u.name);
                    setAnonymousName(u.anonymousName || '');
                    if (u.divisionId) setSelectedDivision(u.divisionId.toString());
                    if (u.districtId) setSelectedDistrict(u.districtId.toString());
                }

                // Fetch Divisions (Bangladesh ID is likely 1, or just fetch all for now)
                // Assuming we default to Bangladesh for now as per requirements
                const divRes = await fetch('/api/locations/divisions?countryId=1');
                const divData = await divRes.json();
                setDivisions(divData.data || []);

            } catch (error) {
                console.error('Error initializing profile:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    // Fetch districts when division changes
    useEffect(() => {
        if (!selectedDivision) {
            setDistricts([]);
            return;
        }

        const fetchDistricts = async () => {
            try {
                const res = await fetch(`/api/locations/districts?divisionId=${selectedDivision}`);
                const data = await res.json();
                setDistricts(data.data || []);
            } catch (error) {
                console.error('Error fetching districts:', error);
            }
        };
        fetchDistricts();
    }, [selectedDivision]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const response = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    divisionId: selectedDivision,
                    districtId: selectedDistrict,
                    countryId: 1 // Default to Bangladesh
                }),
            });

            const data = await response.json();
            if (data.success) {
                setMessage('Profile updated successfully! ✅');
                setTimeout(() => setMessage(''), 3000);
                router.refresh();
            } else {
                setMessage('Failed to update profile. ❌');
            }
        } catch (error) {
            setMessage('An error occurred. ❌');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white text-center py-20">Loading profile...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/"
                    className="p-2 bg-white/10 rounded-xl text-white hover:bg-white/20 transition"
                >
                    ← Back
                </Link>
                <h1 className="text-3xl font-bold text-white">My Profile 👤</h1>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8">
                {message && (
                    <div className={`mb-6 p-4 rounded-xl text-center ${message.includes('✅') ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Name */}
                    <div>
                        <label className="block text-primary-200 mb-2 font-semibold">Display Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent"
                            placeholder="Your Name"
                        />
                        <p className="text-primary-300 text-sm mt-2">
                            🔒 Others will see you as: <span className="text-accent font-semibold">{anonymousName}</span> in the leaderboard.
                        </p>
                    </div>

                    {/* Location Section */}
                    <div className="border-t border-white/10 pt-6">
                        <h3 className="text-xl font-bold text-white mb-4">📍 Location Settings</h3>
                        <p className="text-primary-300 text-sm mb-6">Set your location to see accurate prayer times and join local leaderboards.</p>

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Division */}
                            <div>
                                <label className="block text-primary-200 mb-2">Division</label>
                                <select
                                    value={selectedDivision}
                                    onChange={(e) => {
                                        setSelectedDivision(e.target.value);
                                        setSelectedDistrict(''); // Reset district
                                    }}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent [&>option]:bg-primary-900"
                                >
                                    <option value="">Select Division</option>
                                    {divisions.map((div) => (
                                        <option key={div.id} value={div.id}>{div.nameEn}</option>
                                    ))}
                                </select>
                            </div>

                            {/* District */}
                            <div>
                                <label className="block text-primary-200 mb-2">District</label>
                                <select
                                    value={selectedDistrict}
                                    onChange={(e) => setSelectedDistrict(e.target.value)}
                                    disabled={!selectedDivision}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-accent disabled:opacity-50 [&>option]:bg-primary-900"
                                >
                                    <option value="">Select District</option>
                                    {districts.map((dist) => (
                                        <option key={dist.id} value={dist.id}>{dist.nameEn}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-accent text-white py-4 rounded-xl font-bold text-lg hover:bg-accent/80 transition disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
