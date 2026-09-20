const ICON_RULES: Array<{ test: RegExp; icon: string }> = [
  { test: /боулинг|bowl/i, icon: 'sports_score' },
  { test: /басс|pool|aqua|spa|саун/i, icon: 'pool' },
  { test: /футбол|soccer|football/i, icon: 'sports_soccer' },
  { test: /теннис|падел|padel/i, icon: 'sports_tennis' },
  { test: /карт/i, icon: 'sports_motorsports' },
  { test: /караоке|karaoke/i, icon: 'mic' },
  { test: /бильярд|billiard|пул/i, icon: 'radio_button_checked' },
  { test: /кино|cinema|movie/i, icon: 'movie' },
  { test: /game|gaming|компьютер|playstation|пс клуб|pc/i, icon: 'sports_esports' },
  { test: /ресторан|лаунж|кафе|food/i, icon: 'restaurant' },
  { test: /vr|виртуал/i, icon: 'view_in_ar' },
  { test: /фитнес|sport|спорт/i, icon: 'fitness_center' },
]

export function categoryIcon(name = ''): string {
  const match = ICON_RULES.find(rule => rule.test.test(name))
  return match?.icon ?? 'local_activity'
}
