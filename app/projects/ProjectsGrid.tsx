"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  ExternalLink,
  Search,
  Users,
  Calendar,
} from "lucide-react";
import {
  PROJECTS,
  deriveTags,
  HACKATHON_LABELS,
  type Project,
  type ProjectStatus,
} from "@/lib/projects";
import { GithubIcon } from "@/components/BrandIcons";
import { cn } from "@/lib/cn";

type FilterId =
  | "all"
  | "official"
  | "foundations"
  | "identity"
  | "lightning"
  | "nostr"
  | "bitcoin"
  | "ai";

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "official", label: "Oficiales" },
  { id: "foundations", label: "Foundations · Mar 2026" },
  { id: "identity", label: "Identity · Abr 2026" },
  { id: "lightning", label: "Lightning" },
  { id: "nostr", label: "Nostr" },
  { id: "bitcoin", label: "Bitcoin" },
  { id: "ai", label: "IA" },
];

type BadgeStyle = { text: string; bg: string; border: string; label: string };

function getBadge(status: ProjectStatus): BadgeStyle {
  if (status === "official") {
    return {
      text: "text-bitcoin",
      bg: "bg-bitcoin/10",
      border: "border-bitcoin/40",
      label: "OFICIAL",
    };
  }
  if (status === "live") {
    return {
      text: "text-success",
      bg: "bg-success/10",
      border: "border-success/30",
      label: "EN LÍNEA",
    };
  }
  return {
    text: "text-nostr",
    bg: "bg-nostr/10",
    border: "border-nostr/30",
    label: "COMMUNITY",
  };
}

const TAG_STYLES: Record<string, string> = {
  bitcoin: "bg-bitcoin/10 text-bitcoin border-bitcoin/30",
  lightning: "bg-lightning/10 text-lightning border-lightning/30",
  nostr: "bg-nostr/10 text-nostr border-nostr/30",
  infra: "bg-cyan/10 text-cyan border-cyan/30",
  ai: "bg-success/10 text-success border-success/30",
  wallet: "bg-white/5 text-foreground-muted border-border",
};

export default function ProjectsGrid() {
  const [filter, setFilter] = useState<FilterId>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let out = PROJECTS;
    if (filter === "official") {
      out = out.filter((p) => p.status === "official" || p.status === "live");
    } else if (filter === "foundations" || filter === "identity") {
      out = out.filter((p) => p.hackathon === filter);
    } else if (["lightning", "nostr", "bitcoin", "ai"].includes(filter)) {
      out = out.filter((p) => deriveTags(p).includes(filter));
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.tech ?? []).some((t) => t.toLowerCase().includes(q)) ||
          p.team.some((m) => m.name.toLowerCase().includes(q)),
      );
    }
    return [...out].sort((a, b) => {
      const order: ProjectStatus[] = [
        "live",
        "official",
        "winner",
        "finalist",
        "submitted",
        "building",
        "idea",
      ];
      const ai = order.indexOf(a.status);
      const bi = order.indexOf(b.status);
      if (ai !== bi) return ai - bi;
      return (b.submittedAt ?? "").localeCompare(a.submittedAt ?? "");
    });
  }, [filter, query]);

  return (
    <section className="relative py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 mb-10">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar proyectos, tecnologías o builders…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-border focus:border-bitcoin/50 focus:bg-white/[0.05] text-sm placeholder:text-foreground-subtle transition-colors"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all",
                    active
                      ? "bg-bitcoin text-black shadow-lg shadow-bitcoin/20"
                      : "bg-white/[0.03] text-foreground-muted border border-border hover:bg-white/[0.06] hover:text-foreground",
                  )}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-6 text-sm font-mono text-foreground-subtle">
          {filtered.length} proyecto{filtered.length !== 1 ? "s" : ""}
        </div>

        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-bold mb-2">
              No hay proyectos que coincidan
            </p>
            <p className="text-foreground-muted text-sm">
              Probá limpiar el filtro o la búsqueda para ver todo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const status = getBadge(project.status);
  const tags = deriveTags(project);
  const href = project.demo || project.repo || "#";
  const external = Boolean(project.demo || project.repo);

  const Wrapper: React.ElementType = external ? "a" : "div";
  const wrapperProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3 }}
    >
      <Wrapper
        {...wrapperProps}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-background-card hover:border-border-strong hover:-translate-y-1 transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

        <div className="relative flex flex-col h-full p-6">
          <div className="flex items-start justify-between gap-3 mb-4">
            <span
              className={cn(
                "px-2 py-0.5 rounded-full border text-[10px] font-mono font-semibold tracking-widest whitespace-nowrap",
                status.bg,
                status.border,
                status.text,
              )}
            >
              {status.label}
            </span>
            {project.hackathon && (
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-foreground-subtle">
                <Calendar className="h-3 w-3" />
                {HACKATHON_LABELS[project.hackathon].split(" · ")[1]}
              </span>
            )}
          </div>

          <h3 className="font-display text-xl font-bold mb-2 tracking-tight group-hover:text-bitcoin transition-colors">
            {project.name}
          </h3>
          <p className="text-sm text-foreground-muted leading-relaxed line-clamp-4">
            {project.description}
          </p>

          {project.team.length > 0 && (
            <div className="mt-4 flex items-center gap-1.5 text-xs text-foreground-muted">
              <Users className="h-3.5 w-3.5 opacity-60" />
              <span className="truncate">
                {project.team.map((m) => m.name).join(" · ")}
              </span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className={cn(
                    "px-2 py-0.5 rounded-md border text-[10px] font-mono font-semibold uppercase tracking-wider",
                    TAG_STYLES[tag] ?? TAG_STYLES.wallet,
                  )}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {project.tech && project.tech.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {project.tech.slice(0, 5).map((t) => (
                <span
                  key={t}
                  className="px-1.5 py-0.5 rounded text-[10px] font-mono text-foreground-subtle bg-white/[0.03] border border-border"
                >
                  {t}
                </span>
              ))}
              {project.tech.length > 5 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono text-foreground-subtle">
                  +{project.tech.length - 5}
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-5 border-t border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-foreground-muted">
              {project.repo && (
                <span className="inline-flex items-center gap-1 text-xs hover:text-foreground transition-colors">
                  <GithubIcon className="h-3.5 w-3.5" />
                  Repo
                </span>
              )}
              {project.demo && (
                <span className="inline-flex items-center gap-1 text-xs hover:text-foreground transition-colors">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Demo
                </span>
              )}
            </div>
            <ArrowUpRight className="h-4 w-4 text-foreground-muted group-hover:text-bitcoin group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}
