export function presenceText(lastSeen) {
  if (!lastSeen) return "не в сети";
  const diff = Date.now() - new Date(lastSeen).getTime();
  const min = Math.floor(diff / 60000);
  const hour = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 2) return "в сети";
  if (min < 60) return `был(а) ${min} мин назад`;
  if (hour < 24) return `был(а) ${hour} ч назад`;
  if (day < 7) return `был(а) ${day} дн назад`;
  return "давно не заходил(а)";
}

export function isOnline(lastSeen) {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 2 * 60_000;
}