import { useEffect, type ComponentType } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import InventoryApp from "./pages/InventoryApp";
import { LoginPage, SignupPage } from "./pages/Auth";
import MovementsPage from "./pages/Movements";
import UsersPage from "./pages/Users";
import ProfilePage from "./pages/Profile";

function FullScreenLoader() { return <div className="boot-loader"><div className="boot-spinner" /></div>; }

/** Renders the page only for signed-in users (and, optionally, a minimum role). */
function Protected({ component: Page, adminOnly = false }: { component: ComponentType; adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Redirect to="/login" />;
  if (adminOnly && !isAdmin) return <Redirect to="/inventory-management" />;
  return <Page />;
}

/** Login/signup are skipped when already signed in. */
function GuestOnly({ component: Page }: { component: ComponentType }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Redirect to="/inventory-management" />;
  return <Page />;
}

function Router() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [location]);
  const inventory = () => <Protected component={InventoryApp} />;
  return <Switch>
    <Route path="/login">{() => <GuestOnly component={LoginPage} />}</Route>
    <Route path="/signup">{() => <GuestOnly component={SignupPage} />}</Route>
    <Route path="/">{inventory}</Route>
    <Route path="/inventory-management">{inventory}</Route>
    <Route path="/administration">{inventory}</Route>
    <Route path="/warehouse">{inventory}</Route>
    <Route path="/products">{inventory}</Route>
    <Route path="/categories">{inventory}</Route>
    <Route path="/pos">{inventory}</Route>
    <Route path="/movements">{() => <Protected component={MovementsPage} />}</Route>
    <Route path="/profile">{() => <Protected component={ProfilePage} />}</Route>
    <Route path="/users">{() => <Protected component={UsersPage} adminOnly />}</Route>
    <Route component={NotFound} />
  </Switch>;
}

export default function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><AuthProvider><Router /></AuthProvider></TooltipProvider></ThemeProvider></ErrorBoundary>;
}
