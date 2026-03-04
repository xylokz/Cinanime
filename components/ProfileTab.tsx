"use client";
import React, { useState, useEffect, useRef } from 'react';
import { auth } from '@/lib/firebase';
import { signOut, updateProfile, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'sonner';
import { User, LogOut, Camera, ChevronDown, Check, X, Edit2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const IMGBB_API_KEY = "ce35ccbd929943147582da385f2853ce"; // <--- PASTE YOUR KEY HERE

const ProfileTab = ({ user }: { user: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tempName, setTempName] = useState("");
  
  const [userData, setUserData] = useState({
    displayName: "",
    photoURL: "",
    email: ""
  });

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserData({
          displayName: user.displayName || "",
          photoURL: user.photoURL || "",
          email: user.email || ""
        });
        setTempName(user.displayName || "");
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsEditingName(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getInitials = () => {
    const name = userData.displayName || userData.email || "?";
    return name.charAt(0).toUpperCase();
  };

  // --- 1. DYNAMIC USERNAME UPDATE ---
  const handleUpdateName = async () => {
    if (!auth.currentUser || !tempName.trim()) return;
    try {
      await updateProfile(auth.currentUser, { displayName: tempName });
      setUserData(prev => ({ ...prev, displayName: tempName }));
      setIsEditingName(false);
      toast.success("Username updated!");
    } catch (error) {
      toast.error("Failed to update name");
    }
  };

  // --- 2. UPLOAD TO IMGBB (BYPASSING FIREBASE STORAGE) ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setIsUploading(true);
    const toastId = toast.loading("Uploading to cloud...");

    // Create Form Data for ImgBB
    const formData = new FormData();
    formData.append("image", file);

    try {
      // Post to ImgBB API
      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const directUrl = data.data.url;
        
        // Save the URL to Firebase Auth Profile
        await updateProfile(auth.currentUser, { photoURL: directUrl });
        
        setUserData(prev => ({ ...prev, photoURL: directUrl }));
        toast.success("Profile photo updated!", { id: toastId });
      } else {
        throw new Error("ImgBB Upload Failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Upload failed. Check your API Key.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full bg-secondary hover:bg-accent border border-border shadow-sm transition-all"
      >
        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary flex items-center justify-center text-white font-bold relative">
          {userData.photoURL ? (
            <img src={userData.photoURL} alt="pfp" className="w-full h-full object-cover" />
          ) : (
            getInitials()
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-72 bg-popover border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-6 flex flex-col items-center bg-muted/30">
              <div className="relative group">
                <div className="w-20 h-20 rounded-full border-4 border-background overflow-hidden shadow-md flex items-center justify-center bg-primary text-white text-3xl font-bold">
                   {userData.photoURL ? (
                    <img src={userData.photoURL} alt="pfp" className="w-full h-full object-cover" />
                  ) : (
                    getInitials()
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                  <Camera className="text-white w-6 h-6" />
                  <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                </label>
              </div>

              <div className="mt-4 w-full text-center">
                {isEditingName ? (
                  <div className="flex items-center gap-1 bg-background p-1 rounded-lg border">
                    <input 
                      autoFocus
                      className="bg-transparent px-2 py-1 text-sm w-full outline-none"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateName()}
                    />
                    <button onClick={handleUpdateName} className="text-green-600"><Check size={18}/></button>
                    <button onClick={() => setIsEditingName(false)} className="text-red-500"><X size={18}/></button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 group">
                    <h3 className="font-bold text-foreground truncate -mr-6">{userData.displayName || "Set Name"}</h3>
                    <button onClick={() => setIsEditingName(true)} className="p-1 opacity-0 group-hover:opacity-100 hover:bg-accent rounded transition-all">
                      <Edit2 size={12} className="text-muted-foreground" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{userData.email}</p>
              </div>
            </div>

            <div className="p-2 bg-popover">
              <button onClick={() => setIsEditingName(true)} className="flex items-center w-full gap-3 p-3 text-sm hover:bg-accent rounded-xl transition-colors">
                <User className="w-4 h-4 text-primary" /> Edit Username
              </button>
              <button onClick={() => signOut(auth)} className="flex items-center w-full gap-3 p-3 text-sm hover:bg-destructive/10 text-destructive rounded-xl transition-colors">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfileTab;