import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { User, Mail, BookOpen, Bell, Save } from "lucide-react";
import { toast } from "sonner";
import { fetchProfile, updateProfile } from "@/lib/api";
import PageLoader from "@/components/PageLoader";

const Profile = () => {
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  const mutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateProfile>[0]) => updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Settings saved!");
    },
  });

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  const [notifications, setNotifications] = useState(true);

  if (isLoading || !profile) return <PageLoader rows={2} />;

  const displayName = name ?? profile.name;
  const displayEmail = email ?? profile.email;
  const displayStyle = style ?? profile.learningStyle;

  const handleSave = () => {
    mutation.mutate({ name: displayName, email: displayEmail, learningStyle: displayStyle });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile & Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="bg-card-gradient border border-border rounded-xl p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full gradient-neural flex items-center justify-center text-xl font-bold text-primary-foreground">{profile.avatar}</div>
          <div>
            <p className="text-foreground font-semibold text-lg">{displayName}</p>
            <p className="text-sm text-muted-foreground font-mono">Level {profile.level} · {profile.xp} XP</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><User size={12} /> Name</label>
            <input value={displayName} onChange={(e) => setName(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><Mail size={12} /> Email</label>
            <input value={displayEmail} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wide mb-1.5 flex items-center gap-1.5"><BookOpen size={12} /> Learning Style</label>
            <select value={displayStyle} onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary/40 transition-colors">
              <option value="Visual-Kinesthetic">Visual-Kinesthetic</option>
              <option value="Auditory">Auditory</option>
              <option value="Reading/Writing">Reading/Writing</option>
              <option value="Multimodal">Multimodal</option>
            </select>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-muted-foreground" />
              <span className="text-sm text-foreground">Push Notifications</span>
            </div>
            <button onClick={() => setNotifications(!notifications)}
              className={`w-10 h-6 rounded-full transition-all ${notifications ? "bg-primary" : "bg-secondary"}`}>
              <div className={`w-4 h-4 rounded-full bg-primary-foreground transition-all ${notifications ? "ml-5" : "ml-1"}`} />
            </button>
          </div>
        </div>

        <button onClick={handleSave} disabled={mutation.isPending}
          className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-xl gradient-neural text-primary-foreground font-semibold hover:opacity-90 transition-all disabled:opacity-50">
          <Save size={16} /> {mutation.isPending ? "Saving..." : "Save Changes"}
        </button>
      </motion.div>
    </div>
  );
};

export default Profile;
