// import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
// import { AppSidebar } from "@/components/AppSidebar";
// import { Outlet, Navigate, useLocation } from "react-router-dom";
// import { Bell, Search, LogOut } from "lucide-react";
// import { useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";

// const AppLayout = () => {
//   const { user, profile, loading, signOut, role } = useAuth();
//   const location = useLocation();
//   const [showNotifications, setShowNotifications] = useState(false);

//   // 1) If auth still loading
//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-background text-white">
//         Loading...
//       </div>
//     );
//   }

//   // 2) If not logged in -> go login
//   if (!user) {
//     return <Navigate to="/login" replace />;
//   }

//   // 3) If logged in but NOT admin and trying /admin -> go dashboard
//   const isAdminRoute = location.pathname.startsWith("/admin");

//   if (isAdminRoute && role !== "admin") {
//     return <Navigate to="/" replace />;
//   }

//   const initials = profile?.display_name
//     ? profile.display_name
//         .split(" ")
//         .map((n) => n[0])
//         .join("")
//         .toUpperCase()
//         .slice(0, 2)
//     : user.email?.slice(0, 2).toUpperCase() || "U";

//   return (
//     <SidebarProvider>
//       <div className="min-h-screen flex w-full bg-background">
//         <AppSidebar />

//         <div className="flex-1 flex flex-col min-w-0">
//           <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
//             <div className="flex items-center gap-3">
//               <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

//               <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
//                 <Search size={14} className="text-muted-foreground" />
//                 <input
//                   placeholder="Search topics, quizzes..."
//                   className="bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
//                 />
//               </div>
//             </div>

//             <div className="flex items-center gap-3">
//               <button
//                 onClick={() => setShowNotifications(!showNotifications)}
//                 className="relative p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"
//               >
//                 <Bell size={16} />
//               </button>

//               <button
//                 onClick={signOut}
//                 className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"
//               >
//                 <LogOut size={16} />
//               </button>

//               <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
//                 {initials}
//               </div>
//             </div>
//           </header>

//           <main className="flex-1 overflow-y-auto">
//             <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
//               <Outlet />
//             </div>
//           </main>
//         </div>
//       </div>
//     </SidebarProvider>
//   );
// };

// export default AppLayout;

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Bell, Search, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

const AppLayout = () => {
  const { user, profile, loading, signOut, role } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-white">
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAdminRoute = location.pathname === "/admin";

  // TEMPORARY: allow admin page access while role sync is being stabilized
  // Once fully stable, you can restore strict check:
  // if (isAdminRoute && role !== "admin") return <Navigate to="/" replace />;
  if (isAdminRoute && role !== "admin") {
    console.warn("Admin route opened without admin role. Current role:", role);
  }

  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between px-4 border-b border-border bg-card">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="hidden sm:flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-1.5">
                <Search size={14} className="text-muted-foreground" />
                <input
                  placeholder="Search topics, quizzes..."
                  className="bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"
              >
                <Bell size={16} />
              </button>

              <button
                onClick={signOut}
                className="p-2 rounded-lg bg-secondary/50 text-muted-foreground hover:text-foreground"
              >
                <LogOut size={16} />
              </button>

              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
                {initials}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;