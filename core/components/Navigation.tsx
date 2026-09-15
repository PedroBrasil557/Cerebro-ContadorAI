"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  Calendar,
  Briefcase,
  User,
  LogOut,
  Sparkles,
  RefreshCw,
  Scissors,
  ShoppingCart,
  Lock,
  ShieldAlert,
} from "lucide-react";
import { ActiveTab } from "@/types";
import { toast } from "sonner";
import UpgradeModal from "@/core/components/UpgradeModal";
import { useRouter } from "next/navigation";
import { useEntitlements } from "@/core/hooks/useEntitlements";

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  user: SupabaseUser;
  systemRole?: "user" | "admin" | "founder";
  onAccountModeChange?: (mode: "personal" | "professional") => void;
}

interface MenuItem {
  id: ActiveTab;
  label: string;
  icon: LucideIcon;
  isPro: boolean;
}

const THEMES = {
  personal: {
    bg: "bg-[#665CFF]/10",
    border: "border-[#665CFF]/20",
    icon: "text-[#8B84FF]",
    text: "text-[#8B84FF]",
  },
  professional: {
    bg: "bg-[#4F8CFF]/10",
    border: "border-[#4F8CFF]/20",
    icon: "text-[#69A0FF]",
    text: "text-[#69A0FF]",
  },
};

export default function Navigation({
  activeTab,
  onSelectTab,
  onLogout,
  isOpen,
  onClose,
  user,
  systemRole = "user",
  onAccountModeChange,
}: NavigationProps) {
  const supabase = createClient();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { plan, entitlements, refresh } = useEntitlements();

  const [accountMode, setAccountMode] = useState<"personal" | "professional">(
    user.user_metadata?.account_mode === "professional"
      ? "professional"
      : "personal",
  );
  const isFreePlan = plan === "free";

  // ✅ AJUSTE: O modo profissional só aparece para parceiros "premium"
  const hasProfessionalAddon = entitlements.professional;

  const theme =
    accountMode === "personal" ? THEMES.personal : THEMES.professional;

  // 🔄 Efeito para atualizar sessão após compra (Limpa URL primeiro para evitar loop)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      router.replace("/");
      void refresh();
    }
  }, [refresh, router]);

  const handleRefreshSession = async (isAutomatic = false) => {
    setIsRefreshing(true);
    try {
      await refresh();
      if (!isAutomatic) toast.success("Dados sincronizados com sucesso!");
      router.refresh();
    } catch {
      if (!isAutomatic) toast.error("Erro ao sincronizar.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const personalMenuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Painel Central",
      icon: LayoutDashboard,
      isPro: false,
    },
    {
      id: "compras inteligentes",
      label: "Smart Shopping",
      icon: ShoppingCart,
      isPro: false,
    },
    {
      id: "transações",
      label: "Transações",
      icon: ArrowLeftRight,
      isPro: false,
    },
    { id: "investimentos", label: "Patrimônio", icon: PieChart, isPro: true },
    {
      id: "minha carteira",
      label: "Carteira de Cartões",
      icon: Wallet,
      isPro: false,
    },
    {
      id: "central de dividas",
      label: "Central de Dívidas",
      icon: ShieldAlert,
      isPro: true,
    },
    ...(systemRole === "founder" || systemRole === "admin"
      ? [
          {
            id: "admin" as const,
            label: "Administração",
            icon: ShieldAlert,
            isPro: false,
          },
        ]
      : []),
  ];

  const professionalMenuItems: MenuItem[] = [
    {
      id: "nail design",
      label: "Gestão de Serviços",
      icon: Scissors,
      isPro: false,
    },
    {
      id: "caixa empresarial",
      label: "Caixa Empresarial",
      icon: Briefcase,
      isPro: false,
    },
    { id: "agenda smart", label: "Agenda Smart", icon: Calendar, isPro: false },
  ];

  const activeMenu =
    accountMode === "personal" ? personalMenuItems : professionalMenuItems;

  const handleTabClick = (item: MenuItem) => {
    if (item.isPro && isFreePlan) {
      setShowUpgradeModal(true);
      onClose();
      return;
    }
    onSelectTab(item.id);
    onClose();
  };

  const toggleAccountMode = async () => {
    setIsSwitching(true);
    const newMode = accountMode === "personal" ? "professional" : "personal";
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ account_mode: newMode })
        .eq("id", user.id);
      if (error) throw error;
      setAccountMode(newMode);
      onAccountModeChange?.(newMode);
      toast.success(
        `Modo ${newMode === "personal" ? "Pessoal" : "Empresarial"} ativado!`,
      );
      onSelectTab(newMode === "personal" ? "dashboard" : "nail design");
      router.refresh();
    } catch {
      toast.error("Erro ao alternar modo.");
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-[2px] lg:hidden"
          />
        )}
      </AnimatePresence>

      <aside
        aria-label="Menu principal"
        className={`fixed left-0 top-0 z-50 flex h-screen w-[232px] flex-col border-r border-white/[0.075] bg-[#080B11] px-4 py-5 text-[#F4F6F8] transition-transform duration-200 ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:sticky lg:translate-x-0`}
      >
        <div className="mb-6 flex h-11 items-center px-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[11px] border border-[#8B84FF]/25 bg-gradient-to-br from-[#4F46FF] to-[#665CFF] shadow-[0_0_18px_rgba(102,92,255,0.22)]">
              <Sparkles
                aria-hidden="true"
                className="h-5 w-5 text-white"
              />
            </div>
            <div>
              <h1 className="text-[17px] font-bold leading-none tracking-[-0.02em] text-white">
                CÉREBRO<span className={theme.text}>.IA</span>
              </h1>
              <p className="mt-1 text-[9px] font-medium tracking-[0.2em] text-[#A0A8B5]">
                DECISION ENGINE
              </p>
            </div>
          </div>
        </div>

        {hasProfessionalAddon && (
          <div className="mb-6 border-y border-white/[0.065] py-3">
            <button
              onClick={toggleAccountMode}
              disabled={isSwitching}
              className="flex min-h-[52px] w-full items-center justify-between rounded-[12px] border border-white/[0.075] bg-[#0D1118] px-3 text-left transition-colors duration-150 hover:border-white/[0.13] hover:bg-[#111722] disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-[9px] ${accountMode === "personal" ? "bg-[#665CFF]/10 text-[#8B84FF]" : "bg-[#4F8CFF]/10 text-[#69A0FF]"}`}
                >
                  {accountMode === "personal" ? (
                    <User aria-hidden="true" size={16} />
                  ) : (
                    <Briefcase aria-hidden="true" size={16} />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-[11px] text-[#A0A8B5]">Área atual</p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {accountMode === "personal" ? "Pessoal" : "Empresarial"}
                  </p>
                </div>
              </div>
              <RefreshCw
                aria-hidden="true"
                size={14}
                className={`text-[#6F7887] ${isSwitching ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        )}

        <nav
          className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar"
          aria-label={
            accountMode === "personal"
              ? "Módulos pessoais"
              : "Módulos profissionais"
          }
        >
          <p className="mb-2 px-3 text-[11px] font-medium text-[#A0A8B5]">
            Módulos
          </p>
          {activeMenu.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            const locked = item.isPro && isFreePlan;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item)}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex h-11 w-full items-center justify-between rounded-[11px] border px-3 transition-colors duration-150 ${isActive ? `${theme.bg} ${theme.border} text-white` : "border-transparent text-[#A0A8B5] hover:border-white/[0.055] hover:bg-white/[0.035] hover:text-white"} ${locked ? "opacity-80" : ""}`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute -left-px top-2.5 h-6 w-0.5 rounded-full bg-[#665CFF]"
                  />
                )}
                <div className="flex min-w-0 items-center gap-3">
                  <Icon
                    aria-hidden="true"
                    className={`h-[19px] w-[19px] shrink-0 ${isActive ? theme.icon : "text-[#6F7887]"}`}
                  />
                  <span className="truncate text-sm font-medium">
                    {item.label}
                  </span>
                </div>
                {locked && (
                  <Lock
                    aria-label="Recurso PRO"
                    size={13}
                    className="shrink-0 text-[#8B84FF]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-4 space-y-1.5 border-t border-white/[0.065] pt-4">
          {isFreePlan ? (
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="mb-2 flex h-11 w-full items-center gap-3 rounded-[11px] border border-[#665CFF]/20 bg-[#665CFF]/10 px-3 text-sm font-medium text-[#B4AFFF] transition-colors duration-150 hover:border-[#665CFF]/35 hover:bg-[#665CFF]/15"
            >
              <Sparkles aria-hidden="true" size={17} />
              <span>Upgrade para PRO</span>
            </button>
          ) : (
            <button
              onClick={() => handleRefreshSession(false)}
              disabled={isRefreshing}
              className="mb-2 flex h-11 w-full items-center gap-3 rounded-[11px] border border-transparent px-3 text-sm font-medium text-[#A0A8B5] transition-colors duration-150 hover:border-white/[0.055] hover:bg-white/[0.035] hover:text-white disabled:opacity-60"
            >
              <RefreshCw
                aria-hidden="true"
                size={17}
                className={isRefreshing ? "animate-spin" : ""}
              />
              Sincronizar Plano
            </button>
          )}
          <button
            onClick={onLogout}
            className="flex h-11 w-full items-center gap-3 rounded-[11px] border border-transparent px-3 text-sm font-medium text-[#A0A8B5] transition-colors duration-150 hover:border-[#FF5876]/10 hover:bg-[#FF5876]/[0.06] hover:text-[#FF7890]"
          >
            <LogOut aria-hidden="true" size={17} />
            Sair do Cérebro
          </button>
        </div>
      </aside>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
