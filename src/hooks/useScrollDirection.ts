import { useState, useEffect } from 'react'

type ScrollDirection = 'up' | 'down' | null

interface ScrollState {
  direction: ScrollDirection
  isVisible: boolean
}

const useScrollDirection = (threshold: number = 10): ScrollState => {
  const [scrollDirection, setScrollDirection] = useState<ScrollDirection>(null)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    let ticking = false

    const updateScrollDirection = () => {
      const scrollY = window.pageYOffset

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false
        return
      }

      const direction = scrollY > lastScrollY ? 'down' : 'up'
      setScrollDirection(direction)
      setIsVisible(direction !== 'down' || scrollY < 100)
      setLastScrollY(scrollY > 0 ? scrollY : 0)
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollDirection)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll)

    return () => window.removeEventListener('scroll', onScroll)
  }, [lastScrollY, threshold])

  return { direction: scrollDirection, isVisible }
}

export default useScrollDirection