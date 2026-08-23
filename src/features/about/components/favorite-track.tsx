import { FAVORITE_TRACK } from "../data/profile";

const CARD = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:rounded-3xl sm:p-5";

export function FavoriteTrack({ label }: { label: string }) {
  if (!FAVORITE_TRACK) {
    return (
      <div className={CARD}>
        <p className={label}>On Repeat</p>
        <p className="mt-3 text-sm text-white/40 sm:text-base">
          Still picking the one. Check back for it.
        </p>
      </div>
    );
  }

  return (
    <div className={CARD}>
      <p className={label}>On Repeat</p>

      {/* theme=0 is Spotify's dark player; minWidth avoids its cramped narrow layout. */}
      <iframe
        title={`${FAVORITE_TRACK.title} by ${FAVORITE_TRACK.artist} on Spotify`}
        src={`https://open.spotify.com/embed/track/${FAVORITE_TRACK.id}?utm_source=generator&theme=0`}
        width="100%"
        height="152"
        loading="lazy"
        allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        style={{ minWidth: 260 }}
        className="mt-4 block rounded-xl border-0"
      />
    </div>
  );
}
