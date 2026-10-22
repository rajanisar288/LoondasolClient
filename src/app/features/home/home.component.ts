import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-slate-50 dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 selection:bg-[#2A65F6] selection:text-white transition-colors duration-200 font-sans">
      <!-- HEADER NAVBAR -->
      <header class="sticky top-0 z-50 backdrop-blur-md bg-white/85 dark:bg-[#0f172a]/85 border-b border-slate-200/80 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-9 h-9 rounded-xl bg-[#2A65F6] flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div class="flex items-center space-x-2">
              <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Workiv<span class="text-[#2A65F6]">Lab</span></span>
              <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#2A65F6] border border-blue-200 dark:border-blue-800 uppercase tracking-wider">v2.0 AI ERP</span>
            </div>
          </div>

          <nav class="hidden md:flex items-center space-x-8 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <a href="#features" class="hover:text-[#2A65F6] dark:hover:text-blue-400 transition">Features</a>
            <a href="#ai-copilot" class="hover:text-[#2A65F6] dark:hover:text-blue-400 transition">AI Co-Pilot</a>
            <a href="#architecture" class="hover:text-[#2A65F6] dark:hover:text-blue-400 transition">Architecture</a>
            <a href="#pricing" class="hover:text-[#2A65F6] dark:hover:text-blue-400 transition">Pricing</a>
          </nav>

          <div class="flex items-center space-x-3">
            <button
              (click)="toggleDarkMode()"
              class="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Toggle Theme"
            >
              @if (isDark()) {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              } @else {
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              }
            </button>

            @if (authService.token()) {
              <a
                routerLink="/dashboard"
                class="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#2A65F6] hover:bg-[#1e54d8] shadow-md shadow-blue-500/20 transition"
              >
                Enter Dashboard &rarr;
              </a>
            } @else {
              <a
                routerLink="/auth/login"
                class="hidden sm:inline-flex items-center px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-[#2A65F6] dark:hover:text-blue-400 transition"
              >
                Sign In
              </a>
              <a
                routerLink="/auth/register"
                class="inline-flex items-center px-4 py-2 text-xs font-bold rounded-xl text-white bg-[#2A65F6] hover:bg-[#1e54d8] shadow-md shadow-blue-500/20 transition"
              >
                Start Free Trial
              </a>
            }
          </div>
        </div>
      </header>

      <!-- HERO SECTION -->
      <section class="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div class="absolute inset-0 -z-10 flex items-center justify-center opacity-25 dark:opacity-15 pointer-events-none">
          <div class="w-[50rem] h-[25rem] bg-gradient-to-tr from-[#2A65F6] to-indigo-500 blur-3xl rounded-full transform -rotate-12"></div>
        </div>

        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-800/80 text-[#2A65F6] text-xs font-bold uppercase tracking-wider mb-6">
            <span>🤖 AI-Powered Enterprise Workforce Operating System</span>
          </div>

          <h1 class="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-tight sm:leading-none">
            Unified HR, Attendance, Payroll & <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#2A65F6] via-blue-500 to-indigo-500">AI Intelligence</span>
          </h1>

          <p class="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Manage employees, geofenced attendance, manual punches, Kanban task boards, play/pause todo timers, automated payroll with PDF slips, and AI Co-Pilot workspace insights in one clean platform.
          </p>

          <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            @if (authService.token()) {
              <a
                routerLink="/dashboard"
                class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-[#2A65F6] hover:bg-[#1e54d8] shadow-lg shadow-blue-500/25 transition text-sm flex items-center justify-center space-x-2"
              >
                <span>Launch Workspace Dashboard</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            } @else {
              <a
                routerLink="/auth/register"
                class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-[#2A65F6] hover:bg-[#1e54d8] shadow-lg shadow-blue-500/25 transition text-sm flex items-center justify-center space-x-2"
              >
                <span>Get Started Free (Up to 10 Users)</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <a
                routerLink="/auth/login"
                class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition text-sm"
              >
                Sign In to Workspace
              </a>
            }
          </div>

          <div class="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span class="flex items-center space-x-1.5">
              <svg class="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              <span>No credit card required</span>
            </span>
            <span class="flex items-center space-x-1.5">
              <svg class="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              <span>ChatGPT / DeepSeek AI Co-Pilot</span>
            </span>
            <span class="flex items-center space-x-1.5">
              <svg class="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
              <span>Multi-Region DB Sharding</span>
            </span>
          </div>

          <!-- APP INTERACTIVE PREVIEW CARD -->
          <div class="mt-14 relative mx-auto max-w-5xl rounded-2xl p-2 bg-gradient-to-b from-blue-500/15 via-indigo-500/10 to-slate-200/20 dark:to-slate-800/20 backdrop-blur-sm border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div class="rounded-xl overflow-hidden bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 p-5">
              <div class="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 rounded-full bg-red-400"></div>
                  <div class="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div class="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span class="ml-3 text-xs font-mono text-slate-400">app.workivlab.com/dashboard</span>
                </div>
                <div class="flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">● Live Sockets Connected</span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">Regional Shard: PK / USA / EU</span>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-4 gap-3.5 text-left">
                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-[11px] font-semibold text-slate-500">Live Attendance</span>
                    <span class="text-[11px] font-bold text-emerald-500">96% Present</span>
                  </div>
                  <div class="text-xl font-bold text-slate-900 dark:text-white">128 / 134</div>
                  <p class="text-[11px] text-slate-400 mt-1">Geofenced GPS Verified</p>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-[11px] font-semibold text-slate-500">Task Velocity</span>
                    <span class="text-[11px] font-bold text-blue-500">+22% Sprint</span>
                  </div>
                  <div class="text-xl font-bold text-slate-900 dark:text-white">48 Completed</div>
                  <p class="text-[11px] text-slate-400 mt-1">Live Play/Pause Timer</p>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-[11px] font-semibold text-slate-500">Automated Payroll</span>
                    <span class="text-[11px] font-bold text-indigo-500">PDF Slips</span>
                  </div>
                  <div class="text-xl font-bold text-slate-900 dark:text-white">$84,250.00</div>
                  <p class="text-[11px] text-slate-400 mt-1">Late Deductions Calculated</p>
                </div>

                <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                  <div class="flex justify-between items-center mb-1.5">
                    <span class="text-[11px] font-semibold text-slate-500">AI Co-Pilot</span>
                    <span class="text-[11px] font-bold text-purple-500">RBAC Telemetry</span>
                  </div>
                  <div class="text-xl font-bold text-slate-900 dark:text-white">ChatGPT Tables</div>
                  <p class="text-[11px] text-slate-400 mt-1">Real-Time Data Parsing</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- STATS BANNER -->
      <section class="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131519] py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <div class="text-3xl font-extrabold text-[#2A65F6]">10,000+</div>
              <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Active Workspace Teams</div>
            </div>
            <div>
              <div class="text-3xl font-extrabold text-[#2A65F6]">99.99%</div>
              <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">High Availability Uptime</div>
            </div>
            <div>
              <div class="text-3xl font-extrabold text-[#2A65F6]">5 Regions</div>
              <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">PK, IND, USA, EU, UAE Shards</div>
            </div>
            <div>
              <div class="text-3xl font-extrabold text-[#2A65F6]">Real-Time</div>
              <div class="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">WebSocket Socket Sync</div>
            </div>
          </div>
        </div>
      </section>

      <!-- FEATURES & SERVICES GRID -->
      <section id="features" class="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center max-w-3xl mx-auto mb-14">
          <h2 class="text-xs font-bold uppercase tracking-widest text-[#2A65F6] mb-2">Core Application Services</h2>
          <p class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Everything Your Enterprise Needs in One Platform
          </p>
          <p class="mt-3 text-sm text-slate-600 dark:text-slate-300">
            No third-party plugins needed. Built natively with NestJS regional database sharding and Angular signals.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">🤖 ChatGPT & DeepSeek Style AI Co-Pilot</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Ask natural language questions like *"Show me today's attendance"*. Automatically outputs clean Markdown tables, bullet lists, and data-backed workspace insights.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-[#2A65F6] flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">📍 Attendance & Manual Punch</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Clock in/out with GPS geofencing verification, track shift completion, and submit manual punch requests with manager approval workflow.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">📋 Kanban Tasks & Todo Timers</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Drag-and-drop task boards with priority tags, assignee management, and personal employee todo lists with live play/pause session time tracking.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">💰 Automated Payroll & PDF Slips</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Auto-calculate monthly salaries based on real attendance, compute late penalty deductions, and generate branded downloadable PDF payslips.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">💬 Real-Time Chat & Voice Notes</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Clustered WebSocket team chat. Pin messages and channels, record audio voice notes, and broadcast email campaigns directly to departments.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-2xs hover:shadow-md transition">
            <div class="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2">🛡️ Multi-Tenant RBAC & Super Admin</h3>
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Granular per-user permission matrix, multi-branch location hierarchy, and dedicated Super Admin control center for tenant lifecycle monitoring.
            </p>
          </div>
        </div>
      </section>

      <!-- ARCHITECTURE & INFRASTRUCTURE SECTION -->
      <section id="architecture" class="py-20 bg-white dark:bg-[#131519] border-t border-slate-200 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span class="text-xs font-bold uppercase tracking-widest text-[#2A65F6]">Enterprise Architecture</span>
              <h2 class="text-3xl font-extrabold text-slate-900 dark:text-white mt-2 mb-4 leading-tight">
                Architected for Multi-Region Scale & Sub-Millisecond Speed
              </h2>
              <p class="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                WorkivLab uses intelligent database sharding across PK, IND, USA, EU, and UAE regions, ensuring customer data resides in compliant regional datacenters.
              </p>

              <div class="space-y-3.5">
                <div class="flex items-start space-x-3">
                  <div class="mt-1 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/50 text-[#2A65F6] flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white">Regional Shard Auto-Routing</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Requests automatically route to regional database clusters for fast query execution.</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <div class="mt-1 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/50 text-[#2A65F6] flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white">Customizable Onboarding Data Fields</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Company owners toggle whether CNIC, Address, and Bank Account fields are mandatory or optional.</p>
                  </div>
                </div>

                <div class="flex items-start space-x-3">
                  <div class="mt-1 w-5 h-5 rounded-full bg-blue-50 dark:bg-blue-900/50 text-[#2A65F6] flex items-center justify-center flex-shrink-0 text-xs font-bold">✓</div>
                  <div>
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white">Real-time System Audit Trail</h4>
                    <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Every user creation, company status toggle, and attendance punch is logged with IP and payload inspection.</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl p-6 bg-slate-50 dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white mb-4">Enterprise Infrastructure Health</h3>
              <div class="space-y-2.5 text-xs">
                <div class="p-3 rounded-xl bg-white dark:bg-[#202226] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div class="flex items-center space-x-2.5">
                    <span class="text-base">⚡</span>
                    <div>
                      <p class="font-bold text-slate-900 dark:text-white">Sub-Millisecond Regional Query Latency</p>
                      <p class="text-[11px] text-slate-400">Direct MongoDB & Redis shard routing</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">Active</span>
                </div>

                <div class="p-3 rounded-xl bg-white dark:bg-[#202226] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div class="flex items-center space-x-2.5">
                    <span class="text-base">🔒</span>
                    <div>
                      <p class="font-bold text-slate-900 dark:text-white">Role-Based Access Control (RBAC)</p>
                      <p class="text-[11px] text-slate-400">Strict guards on endpoints and UI links</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">Active</span>
                </div>

                <div class="p-3 rounded-xl bg-white dark:bg-[#202226] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div class="flex items-center space-x-2.5">
                    <span class="text-base">📡</span>
                    <div>
                      <p class="font-bold text-slate-900 dark:text-white">Real-Time Socket Event Pipeline</p>
                      <p class="text-[11px] text-slate-400">Clustered WebSocket message broadcasting</p>
                    </div>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- PRICING SECTION -->
      <section id="pricing" class="py-20 bg-slate-100 dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-3xl mx-auto mb-14">
            <h2 class="text-xs font-bold uppercase tracking-widest text-[#2A65F6] mb-2">Transparent Subscription Plans</h2>
            <p class="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Start Free, Scale as Your Workspace Expands
            </p>
            <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Free Trial supports up to 10 employees — upgrade anytime with zero downtime.
            </p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            <!-- Free Plan -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Free Tier</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-3">Free Trial</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Ideal for small teams and startups.</p>
                <div class="mt-5 flex items-baseline">
                  <span class="text-3xl font-extrabold text-slate-900 dark:text-white">$0</span>
                  <span class="ml-1.5 text-xs text-slate-500">/ forever trial</span>
                </div>

                <div class="mt-3 p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60 text-xs font-semibold text-[#2A65F6]">
                  Strictly up to 10 employees
                </div>

                <ul class="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>HR & Employee Directory</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Kanban Tasks & Personal Todo Timers</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>WebSocket Chat & Voice Notes</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>ChatGPT / DeepSeek AI Co-Pilot</span>
                  </li>
                </ul>
              </div>

              <div class="mt-6">
                <a
                  routerLink="/auth/register"
                  class="w-full block text-center py-2.5 px-4 rounded-xl font-bold text-[#2A65F6] bg-blue-50 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 transition border border-blue-200 dark:border-slate-700 text-xs"
                >
                  Start Free Trial
                </a>
              </div>
            </div>

            <!-- Pro Plan -->
            <div class="relative p-6 rounded-2xl bg-white dark:bg-[#181a1f] border-2 border-[#2A65F6] shadow-lg flex flex-col justify-between transform lg:-translate-y-1">
              <div class="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold bg-[#2A65F6] text-white shadow-xs uppercase tracking-wider">
                Most Popular
              </div>

              <div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-[#2A65F6]">Professional</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-3">Growth Pro</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">For growing teams requiring automated payroll and geofenced punches.</p>
                <div class="mt-5 flex items-baseline">
                  <span class="text-3xl font-extrabold text-slate-900 dark:text-white">$49</span>
                  <span class="ml-1.5 text-xs text-slate-500">/ month</span>
                </div>

                <div class="mt-3 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/60 text-xs font-semibold text-emerald-600">
                  Up to 100 employees
                </div>

                <ul class="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Everything in Free Trial</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Automated Payroll & PDF Payslips</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Geofenced GPS Attendance & Manual Punches</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Multi-Branch Hierarchy Support</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Accountant & Expense Management</span>
                  </li>
                </ul>
              </div>

              <div class="mt-6">
                <a
                  routerLink="/auth/register"
                  class="w-full block text-center py-2.5 px-4 rounded-xl font-bold text-white bg-[#2A65F6] hover:bg-[#1e54d8] shadow-md shadow-blue-500/20 transition text-xs"
                >
                  Get Started with Pro
                </a>
              </div>
            </div>

            <!-- Ultra Plan -->
            <div class="p-6 rounded-2xl bg-white dark:bg-[#181a1f] border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
              <div>
                <span class="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-600">Enterprise</span>
                <h3 class="text-xl font-bold text-slate-900 dark:text-white mt-3">Enterprise Ultra</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Full enterprise customization, Super Admin access, and priority shards.</p>
                <div class="mt-5 flex items-baseline">
                  <span class="text-3xl font-extrabold text-slate-900 dark:text-white">$149</span>
                  <span class="ml-1.5 text-xs text-slate-500">/ month</span>
                </div>

                <div class="mt-3 p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200/60 dark:border-purple-900/60 text-xs font-semibold text-purple-600">
                  Unlimited Employees
                </div>

                <ul class="mt-5 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Everything in Growth Pro</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Dedicated Regional Redis & Socket Cluster</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Social Media Marketing Studio</span>
                  </li>
                  <li class="flex items-center space-x-2">
                    <span class="text-emerald-500 font-bold">✓</span>
                    <span>Super Admin System Control Center</span>
                  </li>
                </ul>
              </div>

              <div class="mt-6">
                <a
                  routerLink="/auth/register"
                  class="w-full block text-center py-2.5 px-4 rounded-xl font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition border border-slate-200 dark:border-slate-700 text-xs"
                >
                  Contact Enterprise Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FOOTER -->
      <footer class="bg-white dark:bg-[#0f172a] border-t border-slate-200 dark:border-slate-800 py-10">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center space-x-2.5">
            <div class="w-7 h-7 rounded-lg bg-[#2A65F6] flex items-center justify-center text-white font-bold text-xs">
              W
            </div>
            <span class="text-sm font-bold text-slate-900 dark:text-white">WorkivLab Enterprise ERP</span>
          </div>

          <div class="flex items-center space-x-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <a href="#features" class="hover:text-[#2A65F6] transition">Features</a>
            <a href="#architecture" class="hover:text-[#2A65F6] transition">Architecture</a>
            <a href="#pricing" class="hover:text-[#2A65F6] transition">Pricing</a>
            <a routerLink="/auth/login" class="hover:text-[#2A65F6] transition">Sign In</a>
            <a routerLink="/auth/register" class="hover:text-[#2A65F6] transition">Sign Up</a>
          </div>

          <p class="text-xs text-slate-400">
            &copy; 2026 WorkivLab Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  `,
})
export class HomeComponent {
  readonly authService = inject(AuthService);
  readonly isDark = signal<boolean>(
    typeof window !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  toggleDarkMode(): void {
    if (typeof window === 'undefined') return;
    const isNowDark = !this.isDark();
    this.isDark.set(isNowDark);
    if (isNowDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }
}
