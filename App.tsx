
import React, { useState, useEffect, useMemo } from 'react';
import { Navigation } from './components/Navigation';
import { Scanner } from './components/Scanner';
import { UserRole, DonationStatus, MedicineData, Donation, Claim, NGO, WishlistItem } from './types';
import { ICONS } from './constants';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning';
}

const ActiveDelivery: React.FC<{ 
  onComplete: () => void; 
  medicineName: string; 
  ngoName: string;
  isDarkMode: boolean;
}> = ({ onComplete, medicineName, ngoName, isDarkMode }) => {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('Assigning Courier...');

  useEffect(() => {
    const startTime = Date.now();
    const duration = 8000; // 8 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);

      if (newProgress < 25) setStage('Assigning Courier...');
      else if (newProgress < 50) setStage('Medicine Picked Up...');
      else if (newProgress < 85) setStage('In Transit to Clinic...');
      else setStage('Finalizing Delivery...');

      if (elapsed >= duration) {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  const themeCard = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200';
  const themeSubText = isDarkMode ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-6">
      <div className={`w-full max-w-xl rounded-3xl p-10 border shadow-2xl overflow-hidden relative ${themeCard}`}>
        {/* Animated background pulse */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-cyan-500 rounded-full animate-ping duration-[3000ms]" />
        </div>

        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-cyan-600/20 animate-bounce">
            <ICONS.Box className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Live Fulfillment Tracking</h2>
          <p className={`${themeSubText} mb-10`}>
            Monitoring <span className="text-cyan-500 font-bold">{medicineName}</span> delivery to <span className="text-cyan-500 font-bold">{ngoName}</span>
          </p>

          <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden mb-4 border border-slate-700">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-bold text-cyan-500 animate-pulse">{stage}</span>
            <span className="text-sm font-mono font-bold text-slate-500">{Math.round(progress)}%</span>
          </div>

          <div className="mt-12 grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((mark, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-colors duration-500 ${progress >= mark ? 'bg-cyan-500' : 'bg-slate-800'}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>(UserRole.DONOR);
  const [currentView, setCurrentView] = useState<string>('home');
  const [showScanner, setShowScanner] = useState(false);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [activeMedicine, setActiveMedicine] = useState<MedicineData | null>(null);
  const [claimingDonation, setClaimingDonation] = useState<any | null>(null);
  const [trackingClaim, setTrackingClaim] = useState<Claim | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeDeliveryInfo, setActiveDeliveryInfo] = useState<{ medicineName: string; ngoName: string; claimId: string } | null>(null);
  
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('medi_give_theme');
    return saved === null ? true : saved === 'dark';
  });
  
  // State for direct donation targeting
  const [targetNGO, setTargetNGO] = useState<NGO | null>(null);
  const [targetWishlistItem, setTargetWishlistItem] = useState<WishlistItem | null>(null);
  
  // State for managing wishlist addition
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);

  // Mock NGOs state with local persistence
  const [ngos, setNgos] = useState<NGO[]>(() => {
    const saved = localStorage.getItem('medi_give_ngos');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'ngo1',
        name: 'St. Mary Community Clinic',
        location: 'Downtown District',
        verified: true,
        impactScore: 98,
        logo: 'https://images.unsplash.com/photo-1538108197017-c1a966bd3912?w=100&h=100&fit=crop',
        wishlist: [
          { id: 'w1', medicineName: 'Metformin', quantityNeeded: 10, quantityFulfilled: 3, urgency: 'Critical' },
          { id: 'w2', medicineName: 'Amoxicillin', quantityNeeded: 5, quantityFulfilled: 0, urgency: 'High' }
        ]
      },
      {
        id: 'ngo2',
        name: 'Hope Wellness Foundation',
        location: 'East Side',
        verified: true,
        impactScore: 85,
        logo: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=100&h=100&fit=crop',
        wishlist: [
          { id: 'w3', medicineName: 'Paracetamol', quantityNeeded: 20, quantityFulfilled: 12, urgency: 'Standard' }
        ]
      }
    ];
  });

  const initialAvailableMeds = [
    { id: 'm1', name: "Metformin", dosage: "500mg", qty: "3 Strips", distance: "2.4 km", donor: "Alex P.", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
    { id: 'm2', name: "Amoxicillin", dosage: "250mg", qty: "1 Box", distance: "5.1 km", donor: "Sarah M.", color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" }
  ];

  useEffect(() => {
    const savedDonations = localStorage.getItem('medi_give_donations');
    if (savedDonations) setDonations(JSON.parse(savedDonations));
    const savedClaims = localStorage.getItem('medi_give_claims');
    if (savedClaims) setClaims(JSON.parse(savedClaims));
  }, []);

  useEffect(() => localStorage.setItem('medi_give_donations', JSON.stringify(donations)), [donations]);
  useEffect(() => localStorage.setItem('medi_give_claims', JSON.stringify(claims)), [claims]);
  useEffect(() => localStorage.setItem('medi_give_ngos', JSON.stringify(ngos)), [ngos]);
  useEffect(() => localStorage.setItem('medi_give_theme', isDarkMode ? 'dark' : 'light'), [isDarkMode]);

  // Automated delivery simulation logic (slower background updates)
  useEffect(() => {
    const statusCycle = [DonationStatus.ACCEPTED, DonationStatus.PICKED_UP, DonationStatus.DELIVERED];
    const interval = setInterval(() => {
      setClaims(currentClaims => {
        let changed = false;
        const updatedClaims = currentClaims.map(c => {
          if (c.status === DonationStatus.DELIVERED) return c;
          const idx = statusCycle.indexOf(c.status);
          if (idx !== -1 && idx < statusCycle.length - 1) {
            const nextStatus = statusCycle[idx + 1];
            changed = true;
            return { ...c, status: nextStatus };
          }
          return c;
        });
        return changed ? updatedClaims : currentClaims;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const addNotification = (message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const updateNgoWishlistProgress = (ngoId: string, medicineName: string) => {
    setNgos(currentNgos => {
      return currentNgos.map(n => {
        if (n.id === ngoId) {
          const itemIdx = n.wishlist.findIndex(w => 
            w.medicineName.toLowerCase().includes(medicineName.toLowerCase()) || 
            medicineName.toLowerCase().includes(w.medicineName.toLowerCase())
          );
          if (itemIdx !== -1) {
            const item = n.wishlist[itemIdx];
            const newFulfilled = item.quantityFulfilled + 1;
            
            let newWishlist = [...n.wishlist];
            if (newFulfilled >= item.quantityNeeded) {
              newWishlist = newWishlist.filter((_, i) => i !== itemIdx);
              addNotification(`Requirement met and removed from wishlist: ${item.medicineName}!`, 'success');
            } else {
              newWishlist[itemIdx] = { ...item, quantityFulfilled: newFulfilled };
            }
            return { ...n, wishlist: newWishlist };
          }
        }
        return n;
      });
    });
  };

  const isMatch = useMemo(() => {
    if (!activeMedicine || !targetWishlistItem) return true; // Default to true if not targeting specific item
    return activeMedicine.name.toLowerCase().includes(targetWishlistItem.medicineName.toLowerCase()) ||
           targetWishlistItem.medicineName.toLowerCase().includes(activeMedicine.name.toLowerCase());
  }, [activeMedicine, targetWishlistItem]);

  const availableDonations = useMemo(() => {
    const claimedIds = new Set(claims.map(c => c.donationId));
    const realAvailable = donations
      .filter(d => d.status === DonationStatus.UPLOADED && !claimedIds.has(d.id))
      .map(d => ({
        id: d.id,
        name: d.medicine.name,
        dosage: d.medicine.dosage,
        qty: "1 Unit",
        distance: "Local",
        donor: "Verified User",
        color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
        isReal: true
      }));
    return [...realAvailable, ...initialAvailableMeds.filter(m => !claimedIds.has(m.id))];
  }, [claims, donations]);

  const handleScanComplete = (data: MedicineData) => {
    setActiveMedicine(data);
    setShowScanner(false);
    setCurrentView('submit-donation');
  };

  const submitDonation = (address: string) => {
    if (!activeMedicine) return;
    
    if (targetWishlistItem && !isMatch) {
      addNotification(`Warning: Scanned medicine (${activeMedicine.name}) does not match requested ${targetWishlistItem.medicineName}.`, 'warning');
    }

    const donationId = Math.random().toString(36).substr(2, 9);
    const newDonation: Donation = {
      id: donationId,
      donorId: 'user_1',
      medicine: activeMedicine,
      status: targetNGO ? DonationStatus.ACCEPTED : DonationStatus.UPLOADED,
      timestamp: Date.now(),
      address,
      ngoId: targetNGO?.id,
      ngoName: targetNGO?.name
    };

    if (targetNGO) {
      const claimId = Math.random().toString(36).substr(2, 9);
      const newClaim: Claim = {
        id: claimId,
        donationId: newDonation.id,
        ngoName: targetNGO.name,
        shippingAddress: 'Direct to Clinic Logistics Center',
        paymentMethod: 'NGO Internal Account',
        status: DonationStatus.ACCEPTED,
        timestamp: Date.now(),
        medicineName: activeMedicine.name
      };
      
      setClaims([newClaim, ...claims]);
      updateNgoWishlistProgress(targetNGO.id, activeMedicine.name);
      addNotification(`Donation recorded for ${targetNGO.name}. Logistics assigned.`, 'success');
    }

    setDonations([newDonation, ...donations]);
    setActiveMedicine(null);
    setTargetNGO(null);
    setTargetWishlistItem(null);
    setCurrentView('history');
  };

  const startTrackingSimulation = (claim: Claim) => {
    if (claim.status === DonationStatus.DELIVERED) {
      setTrackingClaim(claim);
    } else {
      setActiveDeliveryInfo({
        medicineName: claim.medicineName,
        ngoName: claim.ngoName,
        claimId: claim.id
      });
    }
  };

  const handleFastDeliveryComplete = () => {
    if (activeDeliveryInfo) {
      // Update claim and its corresponding donation
      setClaims(prev => prev.map(c => 
        c.id === activeDeliveryInfo.claimId ? { ...c, status: DonationStatus.DELIVERED } : c
      ));
      
      const completedClaim = claims.find(c => c.id === activeDeliveryInfo.claimId);
      if (completedClaim) {
        setDonations(prev => prev.map(d => 
          d.id === completedClaim.donationId ? { ...d, status: DonationStatus.DELIVERED } : d
        ));
      }

      addNotification(`Delivery verified & completed for ${activeDeliveryInfo.ngoName}!`, 'success');
      setActiveDeliveryInfo(null);
    }
  };

  const handleClaimSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!claimingDonation) return;
    
    const claimId = Math.random().toString(36).substr(2, 9);
    const ngoId = 'ngo1'; // Mocking current NGO ID
    const newClaim: Claim = {
      id: claimId,
      donationId: claimingDonation.id,
      ngoName: formData.get('ngoName') as string,
      shippingAddress: formData.get('shippingAddress') as string,
      paymentMethod: formData.get('paymentMethod') as string,
      status: DonationStatus.ACCEPTED,
      timestamp: Date.now(),
      medicineName: claimingDonation.name
    };

    setDonations(prev => prev.map(d => {
      if (d.id === claimingDonation.id) {
        return { 
          ...d, 
          status: DonationStatus.ACCEPTED, 
          ngoId: ngoId, 
          ngoName: formData.get('ngoName') as string 
        };
      }
      return d;
    }));

    setClaims([newClaim, ...claims]);
    updateNgoWishlistProgress(ngoId, claimingDonation.name);
    setClaimingDonation(null);
    addNotification(`Claim confirmed for ${claimingDonation.name}`, 'success');
    setCurrentView('ngo-dashboard');
  };

  const addToWishlist = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newItem: WishlistItem = {
      id: Math.random().toString(36).substr(2, 9),
      medicineName: formData.get('medicineName') as string,
      quantityNeeded: parseInt(formData.get('quantityNeeded') as string),
      quantityFulfilled: 0,
      urgency: formData.get('urgency') as any
    };

    setNgos(prev => prev.map(n => n.id === 'ngo1' ? {
      ...n,
      wishlist: [...n.wishlist, newItem]
    } : n));
    setIsAddingToWishlist(false);
    addNotification(`Added ${newItem.medicineName} to wishlist`, 'info');
  };

  const removeFromWishlist = (itemId: string) => {
    setNgos(prev => prev.map(n => n.id === 'ngo1' ? {
      ...n,
      wishlist: n.wishlist.filter(w => w.id !== itemId)
    } : n));
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  // Dynamic theme classes
  const themeBg = isDarkMode ? 'bg-slate-950' : 'bg-slate-50';
  const themeText = isDarkMode ? 'text-slate-50' : 'text-slate-900';
  const themeCard = isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const themeSubText = isDarkMode ? 'text-slate-400' : 'text-slate-600';
  const themeAltBg = isDarkMode ? 'bg-slate-950/50' : 'bg-slate-100/50';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeBg} ${themeText} selection:bg-cyan-500/30`}>
      <Navigation 
        currentRole={currentRole} 
        onRoleChange={setCurrentRole} 
        onNavigate={setCurrentView}
        currentView={currentView}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
      />

      {/* Notification Toast System */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4 max-w-sm w-full">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-2xl border shadow-2xl animate-[slideInRight_0.3s_ease-out] flex items-center gap-4 ${
            n.type === 'success' ? 'bg-emerald-600/90 border-emerald-500 text-white' : 
            n.type === 'warning' ? 'bg-amber-600/90 border-amber-500 text-white' :
            'bg-cyan-600/90 border-cyan-500 text-white'
          }`}>
            {n.type === 'success' ? <ICONS.Check className="w-5 h-5 flex-shrink-0" /> : <ICONS.Shield className="w-5 h-5 flex-shrink-0" />}
            <p className="text-sm font-bold">{n.message}</p>
          </div>
        ))}
      </div>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto min-h-screen">
        {currentView === 'home' && (
          <div className="flex flex-col items-center justify-center py-12 text-center animate-[fadeIn_0.5s_ease-out]">
            <div className={`inline-block px-4 py-1.5 mb-6 rounded-full border text-sm font-medium ${
              isDarkMode ? 'bg-cyan-950/50 border-cyan-800 text-cyan-400' : 'bg-cyan-50 border-cyan-200 text-cyan-600'
            }`}>
              Join 500+ NGOs saving lives through surplus medicine
            </div>
            <h1 className="text-7xl font-bold tracking-tight mb-8 max-w-4xl leading-[1.1]">
              Bridge the Gap. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-indigo-500 bg-clip-text text-transparent">Donate Life-Saving Medicine.</span>
            </h1>
            <p className={`text-xl mb-12 max-w-2xl leading-relaxed ${themeSubText}`}>
              Scan your unexpired medicines and connect directly with verified clinics. Zero waste, maximum impact.
            </p>
            
            <div className="flex items-center gap-6 mb-20">
              <button 
                onClick={() => { setTargetNGO(null); setTargetWishlistItem(null); setShowScanner(true); }}
                className="group relative px-10 py-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-bold text-lg transition-all shadow-[0_0_30px_rgba(8,145,178,0.3)] hover:scale-105 active:scale-95 flex items-center gap-3 text-white"
              >
                <ICONS.Scan className="w-6 h-6" /> Start General Donation
              </button>
              <button 
                onClick={() => setCurrentView('discover-ngos')}
                className={`px-10 py-5 border rounded-2xl font-bold text-lg transition-all flex items-center gap-3 ${
                  isDarkMode ? 'bg-slate-900 hover:bg-slate-800 border-slate-700' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
                }`}
              >
                Discover NGOs
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-8 w-full">
              {[
                { title: "AI-Powered Verification", desc: "OCR ensures 100% accuracy in medicine identification.", icon: <ICONS.Shield className="w-6 h-6" /> },
                { title: "Direct Logistics", desc: "Coordinated doorstep pickup and direct delivery to NGOs.", icon: <ICONS.Box className="w-6 h-6" /> },
                { title: "Impact Tracking", desc: "See exactly which clinic received your life-saving contribution.", icon: <ICONS.Check className="w-6 h-6" /> }
              ].map((feature, i) => (
                <div key={i} className={`p-8 rounded-3xl border glow-hover text-left transition-all ${themeCard}`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-cyan-500 ${isDarkMode ? 'bg-slate-800' : 'bg-cyan-50'}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className={`leading-relaxed ${themeSubText}`}>{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'discover-ngos' && (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <h2 className="text-4xl font-bold mb-4">Discover Verified NGOs</h2>
            <p className={`${themeSubText} mb-12`}>Browse clinics in need and donate directly to fulfill their wishlist.</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              {ngos.map(ngo => (
                <div key={ngo.id} className={`p-8 rounded-3xl border transition-all hover:border-cyan-500/30 ${themeCard}`}>
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex gap-4">
                      <img src={ngo.logo} className="w-16 h-16 rounded-2xl object-cover shadow-sm" alt="" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-bold">{ngo.name}</h3>
                          {ngo.verified && <ICONS.Check className="w-4 h-4 text-cyan-500" />}
                        </div>
                        <p className={`text-sm flex items-center gap-1 ${themeSubText}`}>
                          <ICONS.Home className="w-3.5 h-3.5" /> {ngo.location}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Impact Score</p>
                      <span className="text-2xl font-bold text-emerald-500">{Math.floor(ngo.impactScore)}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className={`text-xs font-bold uppercase tracking-widest ${themeSubText}`}>Active Wishlist</h4>
                    {ngo.wishlist.length === 0 ? (
                      <div className={`p-6 border border-dashed rounded-2xl flex items-center justify-center gap-3 ${isDarkMode ? 'bg-emerald-950/20 border-emerald-800/30 text-emerald-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                         <ICONS.Check className="w-5 h-5" />
                         <p className="text-sm font-medium">All current requirements fulfilled!</p>
                      </div>
                    ) : ngo.wishlist.map(item => (
                      <div key={item.id} className={`p-4 border rounded-2xl flex items-center justify-between group ${themeAltBg} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                        <div className="flex-1 mr-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold">{item.medicineName}</span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              item.urgency === 'Critical' ? 'bg-rose-500/20 text-rose-500' : 
                              item.urgency === 'High' ? 'bg-orange-500/20 text-orange-500' : 
                              'bg-cyan-500/20 text-cyan-500'
                            }`}>{item.urgency}</span>
                          </div>
                          <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div 
                              className="h-full bg-cyan-500 transition-all duration-500" 
                              style={{ width: `${(item.quantityFulfilled / item.quantityNeeded) * 100}%` }} 
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2">
                            {item.quantityFulfilled} of {item.quantityNeeded} units fulfilled
                          </p>
                        </div>
                        <button 
                          onClick={() => { setTargetNGO(ngo); setTargetWishlistItem(item); setShowScanner(true); }}
                          className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-xs font-bold transition-all shadow-lg shadow-cyan-600/10 text-white"
                        >
                          Fulfill
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'ngo-dashboard' && (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-4xl font-bold mb-2">NGO Hub</h2>
                <p className={themeSubText}>Clinic: <span className="text-cyan-500 font-bold">{ngos[0].name}</span></p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsAddingToWishlist(true)}
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-600/20 text-white"
                >
                  <ICONS.Plus className="w-5 h-5" /> Request Medicine
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-12">
                <section>
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    Available Community Donations
                    <span className="text-xs bg-cyan-600/20 text-cyan-500 px-2 py-0.5 rounded-full">{availableDonations.length}</span>
                  </h3>
                  <div className="space-y-4">
                    {availableDonations.map((item) => (
                      <div key={item.id} className={`p-6 border rounded-2xl flex items-center justify-between group transition-all ${themeCard} hover:border-cyan-500/20`}>
                        <div className="flex gap-4">
                          <div className={`w-14 h-14 rounded-xl border flex items-center justify-center transition-colors ${
                            isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                          }`}>
                            <ICONS.Box className={`w-7 h-7 group-hover:text-cyan-400 transition-colors ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold">{item.name}</h4>
                            <p className={`text-sm ${themeSubText}`}>{item.dosage} • {item.qty}</p>
                            <p className="text-[11px] text-slate-500 uppercase mt-1">Donor: {item.donor}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setClaimingDonation(item)}
                          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/10 text-white"
                        >
                          Claim Shipment
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-xl font-bold mb-6">Track Claimed Shipments</h3>
                  <div className="space-y-4">
                    {claims.map(claim => (
                      <div key={claim.id} className={`p-6 border rounded-2xl transition-all ${themeCard} hover:border-cyan-500/10`}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h4 className="text-lg font-bold text-cyan-500">{claim.medicineName}</h4>
                            <p className="text-xs text-slate-500 mt-1">Ref: #{claim.id}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${claim.status === DonationStatus.DELIVERED ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'}`}>
                            {claim.status}
                          </span>
                        </div>
                        <div onClick={() => startTrackingSimulation(claim)} className="pt-4 border-t border-slate-800 text-cyan-500 text-xs font-bold cursor-pointer hover:text-cyan-400 flex items-center gap-2 transition-colors">
                          <ICONS.Scan className="w-4 h-4" /> Live GPS Tracking
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className={`p-8 rounded-3xl h-fit border ${themeCard}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Manage Wishlist</h3>
                  <button onClick={() => setIsAddingToWishlist(true)} className={`p-2 rounded-lg transition-all ${isDarkMode ? 'bg-slate-800 hover:bg-cyan-600' : 'bg-slate-100 hover:bg-cyan-600 hover:text-white'}`}>
                    <ICONS.Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  {ngos[0].wishlist.length === 0 ? (
                    <div className={`py-12 text-center rounded-xl border border-dashed flex flex-col items-center gap-3 ${isDarkMode ? 'bg-slate-950/30 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500">
                         <ICONS.Check className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-500 font-medium px-4">Your community clinic has no urgent medicine requirements. Great job!</p>
                    </div>
                  ) : ngos[0].wishlist.map(item => (
                    <div key={item.id} className={`p-4 rounded-xl border group relative ${themeAltBg} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-sm font-bold">{item.medicineName}</p>
                          <p className="text-[10px] text-slate-500">{item.quantityFulfilled} of {item.quantityNeeded} units fulfilled</p>
                        </div>
                        <button 
                          onClick={() => removeFromWishlist(item.id)}
                          className={`p-1.5 rounded opacity-0 group-hover:opacity-100 transition-all ${isDarkMode ? 'bg-slate-900 text-slate-500 hover:text-rose-500' : 'bg-white text-slate-400 hover:text-rose-500 shadow-sm'}`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full transition-all duration-700 ${item.urgency === 'Critical' ? 'bg-rose-500' : 'bg-cyan-500'}`}
                          style={{ width: `${Math.min(100, (item.quantityFulfilled / item.quantityNeeded) * 100)}%` }} 
                        />
                      </div>
                      <span className={`absolute top-2 right-2 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter ${
                        item.urgency === 'Critical' ? 'bg-rose-500/10 text-rose-500' : 'bg-cyan-500/10 text-cyan-600'
                      }`}>
                        {item.urgency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'donate' && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-[fadeIn_0.5s_ease-out]">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-8 border transition-colors ${
              isDarkMode ? 'bg-cyan-600/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200 shadow-sm'
            }`}>
              <ICONS.Heart className="w-12 h-12 text-cyan-500" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Ready to Make an Impact?</h2>
            <p className={`mb-12 max-w-lg ${themeSubText}`}>We accept factory-sealed, unexpired medicines. We verified them with AI before they ever leave your house.</p>
            <button onClick={() => { setTargetNGO(null); setTargetWishlistItem(null); setShowScanner(true); }} className="px-12 py-5 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-bold text-xl transition-all shadow-xl flex items-center gap-3 text-white">
              <ICONS.Camera className="w-6 h-6" /> Open AI Scanner
            </button>
          </div>
        )}

        {currentView === 'history' && (
          <div className="animate-[fadeIn_0.4s_ease-out]">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-4xl font-bold">Donation History</h2>
              <button onClick={() => { setTargetNGO(null); setTargetWishlistItem(null); setCurrentView('donate'); }} className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg text-white">
                <ICONS.Plus className="w-5 h-5" /> New Donation
              </button>
            </div>
            <div className="space-y-8">
              {donations.map((d) => (
                <div key={d.id} className={`p-8 rounded-3xl border transition-all group ${themeCard} hover:border-cyan-500/30`}>
                  <div className="flex flex-wrap items-center justify-between gap-8">
                    <div className="flex items-center gap-6">
                      <img src={d.medicine.imageUrl} className="w-24 h-24 rounded-2xl object-cover shadow-md" alt="" />
                      <div>
                        <h3 className="text-2xl font-bold mb-1">{d.medicine.name}</h3>
                        <p className={`text-sm font-medium ${themeSubText}`}>{d.medicine.dosage} • {new Date(d.timestamp).toLocaleDateString()}</p>
                        {d.ngoName && (
                          <div className="mt-3 flex items-center gap-2 text-[11px] font-bold text-cyan-500 uppercase tracking-widest">
                            <ICONS.Heart className="w-3.5 h-3.5" /> Recipient NGO: {d.ngoName}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <div className={`px-5 py-2 rounded-2xl text-sm font-bold border ${
                        d.status === DonationStatus.DELIVERED ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
                      }`}>
                        {d.status.toUpperCase()}
                      </div>
                      {d.ngoName && d.status !== DonationStatus.DELIVERED && (
                        <button 
                          onClick={() => {
                            const relevantClaim = claims.find(c => c.donationId === d.id);
                            if (relevantClaim) startTrackingSimulation(relevantClaim);
                          }}
                          className="text-xs font-bold text-cyan-500 hover:text-cyan-400 flex items-center gap-2 transition-colors uppercase tracking-widest"
                        >
                          <ICONS.Scan className="w-4 h-4" /> Track Order
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'submit-donation' && activeMedicine && (
          <div className="max-w-4xl mx-auto animate-[fadeIn_0.4s_ease-out]">
            <button onClick={() => setCurrentView('home')} className={`flex items-center gap-2 mb-8 transition-colors ${themeSubText} hover:text-cyan-500`}>
              <ICONS.ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            
            {targetNGO && (
              <div className={`mb-8 p-6 border rounded-3xl flex items-center justify-between transition-all ${
                isDarkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-600/20">
                    <ICONS.Heart className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-cyan-500 uppercase tracking-widest mb-1">Target Fulfillment</p>
                    <p className="text-lg font-bold">Donating to <span className="text-cyan-500">{targetNGO.name}</span></p>
                    {targetWishlistItem && (
                      <p className="text-sm text-slate-500">Requirement: {targetWishlistItem.medicineName} ({targetWishlistItem.urgency})</p>
                    )}
                  </div>
                </div>
                
                {targetWishlistItem && (
                  <div className={`px-6 py-3 rounded-2xl border flex items-center gap-3 transition-all ${
                    isMatch 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
                  }`}>
                    {isMatch ? <ICONS.Check className="w-5 h-5" /> : <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                    <span className="font-bold text-sm uppercase tracking-wider">
                      {isMatch ? "AI Verified Match" : "Medicine Mismatch"}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className={`grid md:grid-cols-2 gap-12 rounded-3xl p-10 overflow-hidden relative shadow-2xl border ${themeCard}`}>
              <div className="relative group">
                <img src={activeMedicine.imageUrl} className="w-full aspect-square object-cover rounded-2xl shadow-lg transition-transform" alt="Medicine" />
                <div className="mt-6 space-y-4">
                  <div className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className={`text-sm ${themeSubText}`}>Security Check</span>
                    <span className={activeMedicine.isSealed ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                      {activeMedicine.isSealed ? "✓ SEALED" : "✗ UNSEALED"}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h2 className="text-4xl font-bold mb-6">{activeMedicine.name}</h2>
                <div className="space-y-6 mb-10">
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${themeSubText}`}>Composition</label>
                    <p className="text-xl font-medium">{activeMedicine.dosage}</p>
                  </div>
                  <div>
                    <label className={`text-xs font-bold uppercase tracking-widest mb-1 block ${themeSubText}`}>Expires On</label>
                    <p className="text-xl text-cyan-500 font-mono font-bold">{activeMedicine.expiryDate}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <label className={`text-sm font-bold block ${themeSubText}`}>Pickup Details</label>
                  <textarea 
                    placeholder="Enter pickup address..."
                    className={`w-full rounded-xl p-4 outline-none transition-all ring-offset-2 focus:ring-2 focus:ring-cyan-500 border ${
                      isDarkMode ? 'bg-slate-950 border-slate-800 ring-offset-slate-900' : 'bg-white border-slate-200 ring-offset-white'
                    }`}
                    id="pickup-address"
                  />
                  <button 
                    onClick={() => submitDonation((document.getElementById('pickup-address') as HTMLTextAreaElement).value)}
                    className="w-full py-5 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold text-lg transition-all shadow-xl shadow-cyan-600/10 active:scale-[0.98] text-white"
                  >
                    Confirm Donation
                  </button>
                  <p className="text-[10px] text-center text-slate-500 uppercase font-bold tracking-widest">
                    AI verification successful. Donation logistics will be assigned immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Background Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden opacity-30">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full" />
      </div>

      {/* Active Delivery Fast-Track Overlay */}
      {activeDeliveryInfo && (
        <ActiveDelivery 
          isDarkMode={isDarkMode}
          medicineName={activeDeliveryInfo.medicineName}
          ngoName={activeDeliveryInfo.ngoName}
          onComplete={handleFastDeliveryComplete}
        />
      )}

      {/* Modals for Wishlist and Claims */}
      {showScanner && (
        <Scanner 
          onScanComplete={handleScanComplete}
          onClose={() => setShowScanner(false)}
        />
      )}

      {isAddingToWishlist && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl relative border ${themeCard}`}>
            <button onClick={() => setIsAddingToWishlist(false)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg></button>
            <h2 className="text-2xl font-bold mb-6 text-cyan-500">Request Medicine</h2>
            <form onSubmit={addToWishlist} className="space-y-6">
              <input name="medicineName" required placeholder="Medicine Name" className={`w-full rounded-xl p-4 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              <div className="grid grid-cols-2 gap-4">
                <input name="quantityNeeded" type="number" required placeholder="Qty" className={`w-full rounded-xl p-4 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
                <select name="urgency" className={`w-full rounded-xl p-4 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}>
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Standard">Standard</option>
                </select>
              </div>
              <button type="submit" className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold">Update Wishlist</button>
            </form>
          </div>
        </div>
      )}

      {claimingDonation && (
        <div className="fixed inset-0 z-[70] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className={`w-full max-w-lg rounded-3xl p-8 shadow-2xl relative border ${themeCard}`}>
            <button onClick={() => setClaimingDonation(null)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg></button>
            <h2 className="text-2xl font-bold mb-6 text-cyan-500">Claim {claimingDonation.name}</h2>
            <form onSubmit={handleClaimSubmit} className="space-y-6">
              <input name="ngoName" required defaultValue={ngos[0].name} className={`w-full rounded-xl p-4 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              <textarea name="shippingAddress" required placeholder="Delivery Address" className={`w-full rounded-xl p-4 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`} />
              <select name="paymentMethod" required className={`w-full rounded-xl p-4 border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50'}`}>
                <option value="NGO Internal Account">NGO Internal Account</option>
              </select>
              <button type="submit" className="w-full py-4 bg-cyan-600 text-white rounded-xl font-bold">Confirm Claim</button>
            </form>
          </div>
        </div>
      )}

      {trackingClaim && (
        <div className="fixed inset-0 z-[80] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className={`w-full max-w-2xl rounded-3xl p-10 relative border ${themeCard}`}>
            <button onClick={() => setTrackingClaim(null)} className="absolute top-6 right-6 p-2 text-slate-500 hover:text-rose-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" strokeWidth="2"/></svg></button>
            <h2 className="text-3xl font-bold mb-10 text-center">Tracking Details: {trackingClaim.medicineName}</h2>
            <div className="space-y-8 max-w-sm mx-auto">
              {[DonationStatus.ACCEPTED, DonationStatus.PICKED_UP, DonationStatus.DELIVERED].map((status, idx) => {
                const statusOrder = [DonationStatus.ACCEPTED, DonationStatus.PICKED_UP, DonationStatus.DELIVERED];
                const currentIdx = statusOrder.indexOf(trackingClaim.status);
                const isDone = idx <= currentIdx;
                return (
                  <div key={status} className="flex gap-6 items-center">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${isDone ? 'bg-cyan-600 border-cyan-500' : 'bg-slate-800 border-slate-700'}`}>
                      {isDone ? <ICONS.Check className="w-5 h-5 text-white" /> : <div className="w-2 h-2 rounded-full bg-slate-600" />}
                    </div>
                    <span className={`text-lg font-bold ${isDone ? 'text-white' : 'text-slate-500'}`}>{status}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setTrackingClaim(null)} className="mt-12 w-full py-4 bg-slate-800 text-white rounded-xl font-bold">Close Details</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
