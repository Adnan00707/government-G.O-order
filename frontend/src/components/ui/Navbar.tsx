"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sun, Moon, Cpu, Globe } from "lucide-react";
import { useTheme } from "../ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Extract G.O.", href: "/extractor" },
    { name: "AI Assistant", href: "/assistant" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/40 bg-white/75 backdrop-blur-md transition-colors duration-300 dark:border-slate-800/40 dark:bg-slate-950/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 text-white shadow-md shadow-indigo-500/20 transition-transform group-hover:scale-105">
                <Cpu className="h-5 w-5" />
              </div>
              <div>
                <span className="bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-lg font-bold tracking-tight text-transparent dark:from-white dark:to-slate-200">
                  GovOrder <span className="text-amber-500 font-extrabold">NER</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  AI-Powered Metadata Extraction
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex sm:items-center sm:gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {item.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Actions: Theme Toggle & Language indicator */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200/60 bg-slate-50/50 px-3 py-1 text-[11px] font-semibold text-slate-600 dark:border-slate-800/60 dark:bg-slate-900/50 dark:text-slate-400">
              <Globe className="h-3 w-3 text-indigo-500" />
              <span>English & Malayalam</span>
            </div>

            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
              ) : (
                <Moon className="h-4.5 w-4.5 text-indigo-600" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
