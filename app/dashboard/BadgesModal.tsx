"use client";

import {
  AnimatePresence,
  LayoutGroup,
  Reorder,
  motion,
  useAnimationControls,
} from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  Calendar,
  Check,
  Copy,
  ExternalLink,
  Eye,
  GripVertical,
  Loader2,
  Pencil,
  Save,
  Sparkles,
  User as UserIcon,
  X,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { useScrollLock } from "@/lib/useScrollLock";
import { cn } from "@/lib/cn";
import type { Auth } from "@/lib/auth";
import { getSigner } from "@/lib/nostrSigner";
import {
  publishProfileBadges,
  type AwardedBadge,
  type ProfileBadges,
} from "@/lib/nostrBadges";
import { useNostrProfile } from "@/lib/nostrProfile";

type Mode = "view" | "edit";

/**
 * Drives a one-shot wobble on entry to edit mode. 5° each side, three back-
 * and-forth oscillations over 1.5s, settling at 0°. Each tile gets a random
 * start delay so the wobble looks naturally desynced across the grid.
 *
 * Applied to an inner wrapper inside the tile because Framer's `layout` /
 * `layoutId` projection system on the outer element resets `transform` to
 * none — rotating the outer would be silently ignored.
 */
function useWobble(wobbleNonce: number) {
  const controls = useAnimationControls();
  const delay = useMemo(() => Math.random() * 0.3, []);

  useEffect(() => {
    if (wobbleNonce === 0) {
      controls.set({ rotate: 0 });
      return;
    }
    controls.start({
      rotate: [0, -5, 5, -5, 5, -5, 5, 0],
      transition: { duration: 1.5, delay, ease: "easeInOut" },
    });
  }, [wobbleNonce, controls, delay]);

  return controls;
}

export default function BadgesModal({
  open,
  onClose,
  auth,
  badges,
  loading,
  profileBadges,
  onProfileBadgesUpdated,
}: {
  open: boolean;
  onClose: () => void;
  auth: Auth;
  badges: AwardedBadge[];
  loading: boolean;
  profileBadges: ProfileBadges | null;
  onProfileBadgesUpdated: (pb: ProfileBadges) => void;
}) {
  const { push: pushToast } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("view");
  const [detail, setDetail] = useState<AwardedBadge | null>(null);
  // Bumping this nonce on every view → edit transition fires a one-shot
  // wobble on each tile to signal that they're now draggable.
  const [wobbleNonce, setWobbleNonce] = useState(0);
  const prevMode = useRef<Mode>("view");
  useEffect(() => {
    if (prevMode.current === "view" && mode === "edit") {
      setWobbleNonce((n) => n + 1);
    }
    prevMode.current = mode;
  }, [mode]);

  useScrollLock(open);

  // Hydrate selection from the live profile_badges whenever the modal opens.
  useEffect(() => {
    if (!open) return;
    setSelected(profileBadges?.aTags ?? []);
  }, [open, profileBadges]);

  // Reset transient UI state on close so a re-open lands on the default view.
  useEffect(() => {
    if (open) return;
    setMode("view");
    setDetail(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, saving]);

  // Positional comparison: adding, removing AND reordering all count as
  // changes, because the `selected` order maps 1:1 onto the published NIP-58
  // event's tag order.
  const currentATags = useMemo<string[]>(
    () => profileBadges?.aTags ?? [],
    [profileBadges],
  );
  const dirty = useMemo(() => {
    if (selected.length !== currentATags.length) return true;
    return selected.some((a, i) => a !== currentATags[i]);
  }, [selected, currentATags]);

  function toggle(aTag: string) {
    if (saving) return;
    setSelected((prev) =>
      prev.includes(aTag) ? prev.filter((a) => a !== aTag) : [...prev, aTag],
    );
  }

  // In view mode, render against the published state (currentATags) so users
  // see what's actually live on their profile. In edit mode render against
  // the working `selected` so toggles/reorders update immediately.
  const displayATags = mode === "edit" ? selected : currentATags;
  const wornBadges = useMemo(() => {
    const byATag = new Map(badges.map((b) => [b.aTag, b]));
    return displayATags
      .map((a) => byATag.get(a))
      .filter((b): b is AwardedBadge => Boolean(b));
  }, [badges, displayATags]);
  const unwornBadges = useMemo(
    () => badges.filter((b) => !displayATags.includes(b.aTag)),
    [badges, displayATags],
  );
  // Only the subset of `selected` that has a resolved badge; passed to the
  // reorder group so we don't expose unresolved aTags (they'd have no UI
  // element to drag).
  const wornATags = useMemo(
    () => wornBadges.map((b) => b.aTag),
    [wornBadges],
  );

  function handleReorder(next: string[]) {
    // Preserve any previously-selected aTags whose badge hasn't resolved —
    // tack them onto the end so they survive the publish.
    const unresolvedTail = selected.filter((a) => !wornATags.includes(a));
    setSelected([...next, ...unresolvedTail]);
  }

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    let signer: Awaited<ReturnType<typeof getSigner>> | null = null;
    try {
      signer = await getSigner(auth, {
        onAuthUrl: (url) => {
          pushToast({
            kind: "info",
            title: "Autorizá en tu bunker",
            description: url,
            duration: 15000,
          });
          try {
            window.open(url, "_blank", "noopener,noreferrer");
          } catch {
            /* popup blocked */
          }
        },
      });
      const worn = selected
        .map((a) => badges.find((b) => b.aTag === a))
        .filter((b): b is AwardedBadge => Boolean(b));
      const result = await publishProfileBadges(signer, worn);
      const ok = result.relays.filter((r) => r.ok).length;
      pushToast({
        kind: "success",
        title: "Badges actualizados",
        description: `Publicado en ${ok}/${result.relays.length} relays.`,
      });
      onProfileBadgesUpdated({
        aTags: worn.map((b) => b.aTag),
        eventIdByATag: Object.fromEntries(worn.map((b) => [b.aTag, b.awardId])),
        eventId: result.signed.id,
        eventCreatedAt: result.signed.created_at,
      });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      pushToast({
        kind: "error",
        title: "No se pudo guardar",
        description: msg,
        duration: 12000,
      });
    } finally {
      signer?.close?.().catch(() => {});
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !saving && onClose()}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-3xl glass-strong rounded-2xl border border-border-strong overflow-hidden flex flex-col max-h-[92vh]"
          >
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-[40%] h-px bg-gradient-to-r from-transparent via-nostr to-transparent" />

            <div className="relative flex items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-nostr/15 border border-nostr/30 flex items-center justify-center">
                  <Award className="h-5 w-5 text-nostr" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-xl truncate">
                    Mis badges
                  </h2>
                  <p className="text-xs text-foreground-muted">
                    NIP-58 · {badges.length} otorgado
                    {badges.length === 1 ? "" : "s"}
                    {wornBadges.length > 0 && (
                      <>
                        {" · "}
                        <span className="text-nostr">
                          {wornBadges.length} usado
                          {wornBadges.length === 1 ? "" : "s"} en perfil
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {badges.length > 0 && !detail && (
                  <ModeToggle
                    mode={mode}
                    onChange={(m) => {
                      if (saving) return;
                      setMode(m);
                      // Discard any unsaved selection edits when leaving edit
                      // mode — keeps view mode honest about the published state.
                      if (m === "view") setSelected(currentATags);
                    }}
                    disabled={saving}
                  />
                )}
                <button
                  onClick={() => !saving && onClose()}
                  disabled={saving}
                  className="p-2 rounded-lg text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-y-auto px-6 py-5">
              {detail ? (
                <BadgeDetailView
                  badge={detail}
                  isWorn={displayATags.includes(detail.aTag)}
                  onBack={() => setDetail(null)}
                />
              ) : loading && badges.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-foreground-muted">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs font-mono uppercase tracking-widest">
                    buscando badges en relays…
                  </span>
                </div>
              ) : badges.length === 0 ? (
                <div className="py-16 flex flex-col items-center gap-3 text-center">
                  <Award className="h-8 w-8 text-foreground-subtle" />
                  <p className="font-display text-lg font-bold">
                    Todavía no recibiste badges
                  </p>
                  <p className="text-xs text-foreground-muted max-w-md">
                    Cuando alguien te otorgue un badge NIP-58 lo vas a ver acá
                    y vas a poder elegir cuáles mostrar en tu perfil.
                  </p>
                </div>
              ) : (
                <LayoutGroup>
                  <div className="space-y-6">
                    {mode === "edit" ? (
                      <WornSection
                        badges={wornBadges}
                        values={wornATags}
                        onReorder={handleReorder}
                        onToggle={toggle}
                        disabled={saving}
                        wobbleNonce={wobbleNonce}
                      />
                    ) : (
                      <ViewWornSection
                        badges={wornBadges}
                        onOpen={(b) => setDetail(b)}
                      />
                    )}

                    {unwornBadges.length > 0 && (
                      <BadgeSection
                        title="Otros"
                        count={unwornBadges.length}
                        accent="muted"
                      >
                        <AnimatePresence initial={false}>
                          {unwornBadges.map((b) =>
                            mode === "edit" ? (
                              <MiniBadgeTile
                                key={b.awardId}
                                badge={b}
                                selected={false}
                                onToggle={() => toggle(b.aTag)}
                                disabled={saving}
                                wobbleNonce={wobbleNonce}
                              />
                            ) : (
                              <ViewBadgeTile
                                key={b.awardId}
                                badge={b}
                                worn={false}
                                onClick={() => setDetail(b)}
                              />
                            ),
                          )}
                        </AnimatePresence>
                      </BadgeSection>
                    )}
                  </div>
                </LayoutGroup>
              )}
            </div>

            <div className="relative flex items-center justify-between gap-3 px-6 py-4 bg-black/30 border-t border-border">
              <div className="text-[11px] text-foreground-subtle font-mono tabular-nums">
                {mode === "edit"
                  ? dirty
                    ? "Hay cambios sin guardar"
                    : "Sincronizado con tu perfil"
                  : "Sincronizado con tu perfil"}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => !saving && onClose()}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-white/5 disabled:opacity-50"
                >
                  Cerrar
                </button>
                {mode === "edit" && (
                  <button
                    onClick={save}
                    disabled={!dirty || saving}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-nostr to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Firmando…
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Guardar selección
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** "En el perfil" section — draggable reorder via Framer Motion's Reorder.
 *  The values passed to Reorder.Group are the aTags (strings) which maps
 *  directly to the `selected` state; `onReorder` receives the re-ordered
 *  aTags which we merge back into the selection. */
function WornSection({
  badges,
  values,
  onReorder,
  onToggle,
  disabled,
  wobbleNonce,
}: {
  badges: AwardedBadge[];
  values: string[];
  onReorder: (next: string[]) => void;
  onToggle: (aTag: string) => void;
  disabled: boolean;
  wobbleNonce: number;
}) {
  const accent: "success" | "muted" = "success";
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-display font-bold text-[11px] uppercase tracking-widest text-foreground-muted">
          En el perfil
        </h3>
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-mono tabular-nums",
            accent === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-white/[0.03] border-border text-foreground-subtle",
          )}
        >
          {badges.length}
        </span>
        {badges.length > 1 && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono text-foreground-subtle">
            <GripVertical className="h-3 w-3" />
            arrastrá para reordenar
          </span>
        )}
      </div>
      {badges.length === 0 ? (
        <div className="text-xs text-foreground-subtle italic px-1 py-4 border border-dashed border-border rounded-lg text-center">
          Todavía no elegiste ningún badge para mostrar.
        </div>
      ) : (
        <Reorder.Group
          as="div"
          axis="x"
          values={values}
          onReorder={onReorder}
          className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2"
        >
          <AnimatePresence initial={false}>
            {badges.map((b) => (
              <DraggableWornBadge
                key={b.aTag}
                badge={b}
                disabled={disabled}
                onToggle={() => onToggle(b.aTag)}
                wobbleNonce={wobbleNonce}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </section>
  );
}

/**
 * A single worn badge, wrapped in a `Reorder.Item` so drag-to-reorder works.
 *
 * Framer Motion's `Reorder.Item` captures pointer events for drag detection
 * and swallows native clicks. Its built-in `onTap` *should* fire on a
 * pointer release without drag, but in practice (especially with a parent
 * `LayoutGroup` + `layoutId` cross-section animation) it can miss clicks.
 * We therefore add our own manual tap discriminator: remember
 * pointer-down position + time, and on pointer-up fire the toggle if the
 * release happened close enough (in space and time) to count as a tap.
 */
function DraggableWornBadge({
  badge,
  disabled,
  onToggle,
  wobbleNonce,
}: {
  badge: AwardedBadge;
  disabled: boolean;
  onToggle: () => void;
  wobbleNonce: number;
}) {
  const tapStart = useRef<{ x: number; y: number } | null>(null);
  // Distance-based discriminator: anything under this counts as a tap,
  // otherwise Framer's drag kicked in. No time gate — users can press and
  // hold without triggering a toggle.
  const TAP_MAX_DISTANCE = 6; // px
  const name = badge.definition?.name ?? badge.definition?.d ?? "Badge";
  const wobble = useWobble(wobbleNonce);

  return (
    <Reorder.Item
      value={badge.aTag}
      as="div"
      drag={!disabled}
      dragListener={!disabled}
      layoutId={`badge-tile-${badge.awardId}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 24, stiffness: 320 }}
      whileDrag={{
        scale: 1.1,
        zIndex: 20,
        boxShadow: "0 14px 34px rgba(0,0,0,0.55)",
        cursor: "grabbing",
      }}
      onPointerDown={(e) => {
        tapStart.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const start = tapStart.current;
        tapStart.current = null;
        if (disabled || !start) return;
        const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
        if (dist <= TAP_MAX_DISTANCE) {
          onToggle();
        }
      }}
      onPointerCancel={() => {
        tapStart.current = null;
      }}
      role="button"
      aria-pressed={true}
      aria-label={`Quitar del perfil: ${name}`}
      title={name}
      className={cn(
        "relative aspect-square touch-none select-none rounded-lg overflow-hidden border transition-[border-color,box-shadow] border-success/40 shadow-[0_0_0_1px_rgba(34,197,94,0.18)] group",
        disabled ? "cursor-progress" : "cursor-grab active:cursor-grabbing",
      )}
    >
      <motion.div className="absolute inset-0" animate={wobble}>
        <BadgeVisual badge={badge} selected />
      </motion.div>
    </Reorder.Item>
  );
}

/** Presentational badge content — shared by the draggable Reorder.Item
 *  (worn) and the plain motion.button (unworn). No motion/event wiring;
 *  the parent owns click/drag behavior. */
function BadgeVisual({
  badge,
  selected,
}: {
  badge: AwardedBadge;
  selected: boolean;
}) {
  const def = badge.definition;
  const [imgOk, setImgOk] = useState(true);
  const image = imgOk ? (def?.thumb ?? def?.image) : null;
  const name = def?.name || def?.d || "Badge";
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-nostr/10 via-transparent to-bitcoin/5" />
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgOk(false)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-nostr pointer-events-none">
          <Award className="h-5 w-5" />
        </div>
      )}
      <AnimatePresence initial={false}>
        {selected && (
          <motion.div
            key="check"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 380 }}
            className="absolute top-1 right-1 h-5 w-5 rounded-full bg-success flex items-center justify-center ring-2 ring-background-card shadow-lg shadow-success/30 pointer-events-none"
          >
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="text-[9px] font-semibold text-white truncate leading-tight">
          {name}
        </div>
      </div>
    </>
  );
}

/** Section wrapper that titles + counts a group of badge tiles. The grid
 *  itself is sized with `auto-fill` so the tiles stay tight regardless of
 *  how many badges fall into this section. */
function BadgeSection({
  title,
  count,
  empty,
  accent,
  children,
}: {
  title: string;
  count: number;
  empty?: string;
  accent: "success" | "muted";
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-display font-bold text-[11px] uppercase tracking-widest text-foreground-muted">
          {title}
        </h3>
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-mono tabular-nums",
            accent === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-white/[0.03] border-border text-foreground-subtle",
          )}
        >
          {count}
        </span>
      </div>
      {count === 0 && empty ? (
        <div className="text-xs text-foreground-subtle italic px-1 py-4 border border-dashed border-border rounded-lg text-center">
          {empty}
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2"
        >
          {children}
        </motion.div>
      )}
    </section>
  );
}

/**
 * Compact badge tile — 50% smaller than before. Single click toggles
 * selection. Selected tiles display a green check overlay in the top-right
 * corner; unselected tiles render at 50% opacity and pop to full opacity on
 * hover.
 *
 * Uses a Framer Motion `layoutId` so that when a badge moves between the
 * two sections (worn ↔ unworn) on toggle, it animates across the grid
 * rather than popping in/out abruptly.
 */
function MiniBadgeTile({
  badge,
  selected,
  onToggle,
  disabled,
  wobbleNonce,
}: {
  badge: AwardedBadge;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
  wobbleNonce: number;
}) {
  const def = badge.definition;
  const name = def?.name || def?.d || "Badge";
  const wobble = useWobble(wobbleNonce);
  return (
    <motion.button
      layout
      layoutId={`badge-tile-${badge.awardId}`}
      type="button"
      onClick={onToggle}
      disabled={disabled}
      title={name}
      aria-pressed={selected}
      aria-label={`${selected ? "Quitar del perfil" : "Poner en el perfil"}: ${name}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 24, stiffness: 320 }}
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.93 }}
      className={cn(
        "group relative aspect-square rounded-lg overflow-hidden border transition-[opacity,border-color,box-shadow]",
        selected
          ? "border-success/40 opacity-100 shadow-[0_0_0_1px_rgba(34,197,94,0.18)]"
          : "border-border opacity-50 hover:opacity-100 hover:border-border-strong",
        disabled && "cursor-progress",
      )}
    >
      <motion.div className="absolute inset-0" animate={wobble}>
        <BadgeVisual badge={badge} selected={selected} />
      </motion.div>
    </motion.button>
  );
}

/** Segmented toggle between view and edit modes. Mirrors the look of pill
 *  controls used elsewhere in the dashboard. */
function ModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  disabled: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Modo"
      className="inline-flex items-center rounded-lg border border-border bg-white/[0.03] p-0.5"
    >
      <ModeToggleButton
        active={mode === "view"}
        disabled={disabled}
        onClick={() => onChange("view")}
        label="Ver"
        icon={<Eye className="h-3.5 w-3.5" />}
      />
      <ModeToggleButton
        active={mode === "edit"}
        disabled={disabled}
        onClick={() => onChange("edit")}
        label="Editar"
        icon={<Pencil className="h-3.5 w-3.5" />}
      />
    </div>
  );
}

function ModeToggleButton({
  active,
  disabled,
  onClick,
  label,
  icon,
}: {
  active: boolean;
  disabled: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors disabled:opacity-50",
        active
          ? "bg-nostr/15 border border-nostr/30 text-nostr"
          : "border border-transparent text-foreground-muted hover:text-foreground hover:bg-white/5",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** View-mode worn section. No drag, no toggle — clicking a tile opens the
 *  detail view. Mirrors WornSection visually so the layout is stable across
 *  modes. */
function ViewWornSection({
  badges,
  onOpen,
}: {
  badges: AwardedBadge[];
  onOpen: (b: AwardedBadge) => void;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="font-display font-bold text-[11px] uppercase tracking-widest text-foreground-muted">
          En el perfil
        </h3>
        <span
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded-full border text-[10px] font-mono tabular-nums",
            badges.length > 0
              ? "bg-success/10 border-success/30 text-success"
              : "bg-white/[0.03] border-border text-foreground-subtle",
          )}
        >
          {badges.length}
        </span>
      </div>
      {badges.length === 0 ? (
        <div className="text-xs text-foreground-subtle italic px-1 py-4 border border-dashed border-border rounded-lg text-center">
          Todavía no elegiste ningún badge para mostrar.
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2"
        >
          <AnimatePresence initial={false}>
            {badges.map((b) => (
              <ViewBadgeTile
                key={b.awardId}
                badge={b}
                worn
                onClick={() => onOpen(b)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </section>
  );
}

/** Read-only badge tile for view mode. Click opens the detail view. Worn
 *  badges get a subtle green ring; unworn render at full opacity (unlike
 *  edit mode, which dims unworn to suggest selectability). */
function ViewBadgeTile({
  badge,
  worn,
  onClick,
}: {
  badge: AwardedBadge;
  worn: boolean;
  onClick: () => void;
}) {
  const def = badge.definition;
  const name = def?.name || def?.d || "Badge";
  return (
    <motion.button
      layout
      layoutId={`badge-tile-${badge.awardId}`}
      type="button"
      onClick={onClick}
      title={name}
      aria-label={`Ver detalle: ${name}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", damping: 24, stiffness: 320 }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.93 }}
      className={cn(
        "group relative aspect-square rounded-lg overflow-hidden border cursor-pointer transition-[border-color,box-shadow]",
        worn
          ? "border-success/40 shadow-[0_0_0_1px_rgba(34,197,94,0.18)]"
          : "border-border hover:border-border-strong",
      )}
    >
      <BadgeVisual badge={badge} selected={worn} />
    </motion.button>
  );
}

/** Detail panel for a single badge — large image, name, description, and
 *  metadata (issuer npub, awarded date). Rendered inside the modal body
 *  with a back button to return to the grid. */
function BadgeDetailView({
  badge,
  isWorn,
  onBack,
}: {
  badge: AwardedBadge;
  isWorn: boolean;
  onBack: () => void;
}) {
  const { push: pushToast } = useToast();
  const def = badge.definition;
  const [imgOk, setImgOk] = useState(true);
  const image = imgOk ? (def?.image ?? def?.thumb) : null;
  const name = def?.name || def?.d || "Badge";
  const description = def?.description?.trim() || "";
  const date = useMemo(
    () =>
      new Date(badge.awardedAt * 1000).toLocaleDateString("es-AR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [badge.awardedAt],
  );

  const [issuerNpub, setIssuerNpub] = useState<string>(badge.issuer);
  useEffect(() => {
    let cancelled = false;
    import("nostr-tools")
      .then(({ nip19 }) => {
        if (cancelled) return;
        try {
          setIssuerNpub(nip19.npubEncode(badge.issuer));
        } catch {
          /* keep hex fallback */
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [badge.issuer]);

  const shortNpub = useMemo(
    () =>
      issuerNpub.startsWith("npub1")
        ? `${issuerNpub.slice(0, 12)}…${issuerNpub.slice(-6)}`
        : `${issuerNpub.slice(0, 8)}…${issuerNpub.slice(-6)}`,
    [issuerNpub],
  );

  const { profile: issuerProfile, loading: issuerLoading } = useNostrProfile(
    badge.issuer,
  );
  const issuerName =
    issuerProfile?.display_name?.trim() || issuerProfile?.name?.trim() || "";
  const issuerHandle = issuerProfile?.nip05?.trim() || "";
  const profileHref = issuerNpub.startsWith("npub1")
    ? `https://njump.me/${issuerNpub}`
    : `https://njump.me/${badge.issuer}`;

  async function copyNpub() {
    try {
      await navigator.clipboard.writeText(issuerNpub);
      pushToast({ kind: "success", title: "Copiado", duration: 2000 });
    } catch {
      pushToast({ kind: "error", title: "No se pudo copiar" });
    }
  }

  return (
    <motion.div
      key="detail"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ type: "spring", damping: 24, stiffness: 280 }}
      className="space-y-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver
      </button>

      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative h-48 w-48 sm:h-56 sm:w-56 rounded-2xl overflow-hidden border border-border-strong bg-gradient-to-br from-nostr/10 via-transparent to-bitcoin/5">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-nostr">
              <Award className="h-16 w-16" />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h3 className="font-display font-bold text-2xl">{name}</h3>
          {isWorn && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-success/10 border border-success/30 text-success text-[11px] font-mono uppercase tracking-widest">
              <Sparkles className="h-3 w-3" />
              en el perfil
            </span>
          )}
          {description && (
            <p className="text-sm text-foreground-muted max-w-md mx-auto whitespace-pre-line">
              {description}
            </p>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground-subtle">
            <Calendar className="h-3 w-3" />
            otorgado
          </dt>
          <dd className="mt-1 font-semibold">{date}</dd>
        </div>
        <div className="rounded-lg border border-border bg-white/[0.02] px-3 py-2.5">
          <dt className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground-subtle">
            <Award className="h-3 w-3" />
            identificador
          </dt>
          <dd className="mt-1 font-mono text-xs break-all">
            {def?.d ?? badge.aTag}
          </dd>
        </div>
        <div className="rounded-lg border border-border bg-white/[0.02] px-3 py-2.5 sm:col-span-2">
          <dt className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-foreground-subtle">
            <Sparkles className="h-3 w-3" />
            emitido por
          </dt>
          <dd className="mt-2 flex items-center gap-3">
            <IssuerAvatar
              picture={issuerProfile?.picture}
              name={issuerName || badge.issuer}
              loading={issuerLoading && !issuerProfile}
            />
            <div className="min-w-0 flex-1">
              <a
                href={profileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-display font-bold text-sm text-foreground hover:text-nostr transition-colors"
              >
                <span className="truncate">
                  {issuerName ||
                    (issuerLoading ? "Resolviendo perfil…" : shortNpub)}
                </span>
                <ExternalLink className="h-3 w-3 shrink-0 opacity-60" />
              </a>
              <div className="text-[11px] text-foreground-subtle font-mono truncate">
                {issuerHandle || shortNpub}
              </div>
            </div>
            <button
              type="button"
              onClick={copyNpub}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-widest text-foreground-muted hover:text-foreground hover:bg-white/5 transition-colors shrink-0"
              aria-label="Copiar npub"
            >
              <Copy className="h-3 w-3" />
              copiar
            </button>
          </dd>
        </div>
      </dl>
    </motion.div>
  );
}

/** Round avatar for the issuer card. Falls back to an icon when the profile
 *  has no picture or the image fails to load. */
function IssuerAvatar({
  picture,
  name,
  loading,
}: {
  picture?: string;
  name: string;
  loading: boolean;
}) {
  const [imgOk, setImgOk] = useState(true);
  const showImage = !!picture && imgOk;
  return (
    <div
      className={cn(
        "relative h-11 w-11 shrink-0 rounded-full overflow-hidden border border-border bg-white/[0.04] flex items-center justify-center",
        loading && "animate-pulse",
      )}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={picture}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgOk(false)}
        />
      ) : (
        <UserIcon className="h-5 w-5 text-foreground-muted" />
      )}
    </div>
  );
}
