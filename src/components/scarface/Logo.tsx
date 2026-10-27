export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary font-display text-2xl text-primary-foreground shadow-glow">
        S
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="font-display text-2xl tracking-wider text-foreground">SCARFACE</div>
          <div className="font-display text-base tracking-[0.3em] text-gradient-gold">OPTIMIZER</div>
        </div>
      )}
    </div>
  );
}
