import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/useTheme.js";
import { useLanguage } from "../context/useLanguage.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const navigationRef = useRef(null);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const isAdmin = user?.role === "admin";
  const homePath = isAdmin ? "/admin" : "/candidates";

  useEffect(() => {
    const intervalId = window.setInterval(
      () => setCurrentTime(new Date()),
      1000,
    );
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    function dismissMenu(event) {
      if (!navigationRef.current?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }

    function dismissMenuOnEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", dismissMenu);
    document.addEventListener("keydown", dismissMenuOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissMenu);
      document.removeEventListener("keydown", dismissMenuOnEscape);
    };
  }, [isMenuOpen]);

  function handleLogout() {
    setIsLogoutDialogOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <header className="app-navbar border-b border-slate-200 bg-white">
      <nav
        ref={navigationRef}
        aria-label={t("Main navigation")}
        className="app-navbar-inner mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6"
      >
        <Link
          className="app-brand text-lg font-bold tracking-tight text-slate-900"
          to={homePath}
        >
          {t("Voting App")}
        </Link>

        <time
          aria-label={t("Current time")}
          className="text-xs tabular-nums text-slate-500"
          dateTime={currentTime.toISOString()}
        >
          {currentTime.toLocaleTimeString(
            language === "hi" ? "hi-IN" : "en-US",
            {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            },
          )}
        </time>

        <button
          aria-controls="primary-navigation"
          aria-expanded={isMenuOpen}
          aria-label={t(
            isMenuOpen ? "Close navigation menu" : "Open navigation menu",
          )}
          className="navbar-toggle"
          onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          <span />
          <span />
          <span />
        </button>
        <div
          className={`navbar-menu ${isMenuOpen ? "is-open" : ""}`}
          id="primary-navigation"
        >
          <NavLink
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600 hover:text-slate-900"
              }`
            }
            end={isAdmin}
            onClick={() => setIsMenuOpen(false)}
            to={homePath}
          >
            {t(isAdmin ? "Admin dashboard" : "Vote")}
          </NavLink>
          {isAdmin ? (
            <NavLink
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600  hover:text-slate-900"
                }`
              }
              onClick={() => setIsMenuOpen(false)}
              to="/admin/candidates"
            >
              {t("Candidates")}
            </NavLink>
          ) : (
            <NavLink
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-slate-600  hover:text-slate-900"
                }`
              }
              onClick={() => setIsMenuOpen(false)}
              to="/voting-history"
            >
              {t("Election history")}
            </NavLink>
          )}
          <NavLink
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 text-sm font-medium ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-600  hover:text-slate-900"
              }`
            }
            onClick={() => setIsMenuOpen(false)}
            to={isAdmin ? "/admin/complaints" : "/complaints"}
          >
            {t("Complaints")}
          </NavLink>
          <button
            aria-label={t(theme === "dark" ? "Light theme" : "Dark theme")}
            className="theme-toggle rounded-lg px-3 py-2 text-sm font-medium text-slate-700"
            onClick={toggleTheme}
            type="button"
          >
            {t(theme === "dark" ? "☀ Light" : "☾ Dark")}
          </button>
          <Link
            className="app-profile-link rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-800 transition hover:border-indigo-300"
            onClick={() => setIsMenuOpen(false)}
            to="/profile"
          >
            {user?.name}
          </Link>
          <button
            className="navbar-logout rounded-lg px-3 py-2 text-sm font-semibold text-white"
            onClick={() => {
              setIsLogoutDialogOpen(true);
              setIsMenuOpen(false);
            }}
            type="button"
          >
            {t("Log out")}
          </button>
        </div>
      </nav>
      <ConfirmDialog
        cancelText={t("Stay logged in")}
        confirmText={t("Log out")}
        isOpen={isLogoutDialogOpen}
        message={t("Are you sure you want to log out?")}
        onCancel={() => setIsLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        title={t("Confirm logout")}
      />
    </header>
  );
}

export default Navbar;
