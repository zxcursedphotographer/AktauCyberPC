export default function Avatar({ user, size = 32 }) {
  const s = { width: size, height: size };
  return user.avatarUrl
    ? <img src={user.avatarUrl} alt="" style={s} className="shrink-0 rounded-full object-cover" />
    : <span style={{ ...s, fontSize: size / 2.2 }} className="inline-flex shrink-0 items-center justify-center rounded-full bg-accent font-bold text-white">{user.username[0].toUpperCase()}</span>;
}
