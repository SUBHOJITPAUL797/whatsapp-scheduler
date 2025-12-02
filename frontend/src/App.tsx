import React, { useEffect, useState } from 'react';
import { Plus, Trash2, RefreshCw, Send, Users, Clock, MessageSquare } from 'lucide-react';
import { getGroups, createGroup, deleteGroup, getCampaigns, createCampaign, updateCampaign, deleteCampaign, getDeliveries, Group, Campaign, Delivery } from './services/api';

function App() {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'groups' | 'deliveries'>('campaigns');
    const [groups, setGroups] = useState<Group[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [loading, setLoading] = useState(false);

    // Form States
    const [newGroup, setNewGroup] = useState({ jid: '', name: '' });
    const [newCampaign, setNewCampaign] = useState({ name: '', messageText: '', startTime: '09:00', endTime: '21:00', groupId: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [g, c, d] = await Promise.all([getGroups(), getCampaigns(), getDeliveries()]);
            setGroups(g);
            setCampaigns(c);
            setDeliveries(d);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        await createGroup(newGroup);
        setNewGroup({ jid: '', name: '' });
        fetchData();
    };

    const handleDeleteGroup = async (id: string) => {
        if (confirm('Delete this group?')) {
            await deleteGroup(id);
            fetchData();
        }
    };

    const handleCreateCampaign = async (e: React.FormEvent) => {
        e.preventDefault();
        await createCampaign(newCampaign);
        setNewCampaign({ name: '', messageText: '', startTime: '09:00', endTime: '21:00', groupId: '' });
        fetchData();
    };

    const toggleCampaign = async (c: Campaign) => {
        await updateCampaign(c.id, { isActive: !c.isActive });
        fetchData();
    };

    const handleDeleteCampaign = async (id: string) => {
        if (confirm('Delete this campaign?')) {
            await deleteCampaign(id);
            fetchData();
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-800">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-500 text-white p-2 rounded-lg">
                            <Send size={20} />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">WhatsApp Scheduler</h1>
                    </div>
                    <button onClick={fetchData} className="p-2 hover:bg-gray-100 rounded-full transition-colors" title="Refresh">
                        <RefreshCw size={20} className={loading ? 'animate-spin text-green-600' : 'text-gray-500'} />
                    </button>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b border-gray-200">
                    <button
                        onClick={() => setActiveTab('campaigns')}
                        className={`pb-3 px-1 flex items-center gap-2 font-medium transition-colors ${activeTab === 'campaigns' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Clock size={18} /> Campaigns
                    </button>
                    <button
                        onClick={() => setActiveTab('groups')}
                        className={`pb-3 px-1 flex items-center gap-2 font-medium transition-colors ${activeTab === 'groups' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={18} /> Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('deliveries')}
                        className={`pb-3 px-1 flex items-center gap-2 font-medium transition-colors ${activeTab === 'deliveries' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <MessageSquare size={18} /> Deliveries
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">

                    {/* CAMPAIGNS TAB */}
                    {activeTab === 'campaigns' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* List */}
                            <div className="md:col-span-2 space-y-4">
                                {campaigns.map(c => (
                                    <div key={c.id} className={`bg-white p-5 rounded-xl shadow-sm border-l-4 ${c.isActive ? 'border-green-500' : 'border-gray-300'} flex justify-between items-start`}>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-semibold text-lg">{c.name}</h3>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {c.isActive ? 'Active' : 'Paused'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-3">
                                                Window: {c.startTime} - {c.endTime} | Last offset: {c.lastMinute}m
                                            </p>
                                            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 whitespace-pre-wrap font-mono">
                                                {c.messageText}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button onClick={() => toggleCampaign(c)} className={`p-2 rounded-lg transition-colors ${c.isActive ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>
                                                {c.isActive ? 'Pause' : 'Resume'}
                                            </button>
                                            <button onClick={() => handleDeleteCampaign(c.id)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {campaigns.length === 0 && <div className="text-center py-10 text-gray-400">No campaigns yet. Create one!</div>}
                            </div>

                            {/* Create Form */}
                            <div className="bg-white p-6 rounded-xl shadow-sm h-fit sticky top-24">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} /> New Campaign</h2>
                                <form onSubmit={handleCreateCampaign} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Campaign Name</label>
                                        <input
                                            required
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            value={newCampaign.name}
                                            onChange={e => setNewCampaign({ ...newCampaign, name: e.target.value })}
                                            placeholder="e.g. Daily Promo"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                                            <input
                                                type="time"
                                                required
                                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                value={newCampaign.startTime}
                                                onChange={e => setNewCampaign({ ...newCampaign, startTime: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">End Time (Exclusive)</label>
                                            <input
                                                type="time"
                                                required
                                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                                value={newCampaign.endTime}
                                                onChange={e => setNewCampaign({ ...newCampaign, endTime: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Target Group (Optional)</label>
                                        <select
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            value={newCampaign.groupId}
                                            onChange={e => setNewCampaign({ ...newCampaign, groupId: e.target.value })}
                                        >
                                            <option value="">All Groups</option>
                                            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Message Text</label>
                                        <textarea
                                            required
                                            rows={4}
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none resize-none"
                                            value={newCampaign.messageText}
                                            onChange={e => setNewCampaign({ ...newCampaign, messageText: e.target.value })}
                                            placeholder="Hello! Check out our offers..."
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                                        Create Campaign
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* GROUPS TAB */}
                    {activeTab === 'groups' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-2 space-y-3">
                                {groups.map(g => (
                                    <div key={g.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
                                        <div>
                                            <h3 className="font-semibold">{g.name}</h3>
                                            <p className="text-sm text-gray-500 font-mono">{g.jid}</p>
                                        </div>
                                        <button onClick={() => handleDeleteGroup(g.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {groups.length === 0 && <div className="text-center py-10 text-gray-400">No groups added.</div>}
                            </div>

                            <div className="bg-white p-6 rounded-xl shadow-sm h-fit">
                                <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus size={20} /> Add Group</h2>
                                <form onSubmit={handleCreateGroup} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Group Name</label>
                                        <input
                                            required
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                                            value={newGroup.name}
                                            onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
                                            placeholder="My Customer Group"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Group JID</label>
                                        <input
                                            required
                                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm"
                                            value={newGroup.jid}
                                            onChange={e => setNewGroup({ ...newGroup, jid: e.target.value })}
                                            placeholder="123456789@g.us"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Found in WhatsApp Web console or invite link info.</p>
                                    </div>
                                    <button type="submit" className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors">
                                        Add Group
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* DELIVERIES TAB */}
                    {activeTab === 'deliveries' && (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-4 font-medium text-gray-500 text-sm">Time</th>
                                        <th className="p-4 font-medium text-gray-500 text-sm">Campaign</th>
                                        <th className="p-4 font-medium text-gray-500 text-sm">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {deliveries.map(d => (
                                        <tr key={d.id} className="hover:bg-gray-50">
                                            <td className="p-4 text-sm text-gray-600">{new Date(d.sentAt).toLocaleString()}</td>
                                            <td className="p-4 font-medium">{d.campaign?.name || 'Unknown'}</td>
                                            <td className="p-4">
                                                <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                                                    {d.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {deliveries.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-gray-400">No deliveries yet.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}

export default App;
