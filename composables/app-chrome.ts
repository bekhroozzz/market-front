let shareHandler: (() => void) | null = null

export function useSelectedCity() {
  return useState('lf-city', () => 'Ташкент')
}

export function useAppChrome() {
  const title = useState('lf-chrome-title', () => '')
  const backHref = useState('lf-chrome-back', () => '')
  const favorite = useState('lf-chrome-fav', () => false)
  const showFavorite = useState('lf-chrome-show-fav', () => false)
  const showShare = useState('lf-chrome-show-share', () => false)

  function configure(options: {
    title?: string
    backHref?: string
    showShare?: boolean
    showFavorite?: boolean
    onShare?: (() => void) | null
  }) {
    title.value = options.title ?? ''
    backHref.value = options.backHref ?? ''
    showShare.value = Boolean(options.showShare)
    showFavorite.value = Boolean(options.showFavorite)
    shareHandler = options.onShare ?? null
  }

  function reset() {
    title.value = ''
    backHref.value = ''
    showShare.value = false
    showFavorite.value = false
    favorite.value = false
    shareHandler = null
  }

  function triggerShare() {
    shareHandler?.()
  }

  return {
    title,
    backHref,
    favorite,
    showFavorite,
    showShare,
    configure,
    reset,
    triggerShare,
  }
}
