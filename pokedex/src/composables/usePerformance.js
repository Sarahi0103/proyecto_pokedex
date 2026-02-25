/**
 * usePerformance - Composable para optimizaciones de performance
 */

import { onMounted, onBeforeUnmount } from 'vue'

export function usePerformance() {
  /**
   * Lazy Loading de imágenes con Intersection Observer
   */
  function setupImageLazyLoading() {
    const images = document.querySelectorAll('img[data-src]')

    if (!('IntersectionObserver' in window)) {
      // Fallback para navegadores sin soporte
      images.forEach((img) => {
        img.src = img.getAttribute('data-src')
      })
      return
    }

    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target
          img.src = img.getAttribute('data-src')
          img.removeAttribute('data-src')
          imageObserver.unobserve(img)
        }
      })
    }, {
      rootMargin: '50px',
    })

    images.forEach((img) => {
      imageObserver.observe(img)
    })

    return () => imageObserver.disconnect()
  }

  /**
   * Lazy Loading de componentes con Intersection Observer
   */
  function observeElement(element, callback, options = {}) {
    if (!('IntersectionObserver' in window)) {
      callback()
      return
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        callback()
        observer.unobserve(element)
      }
    }, {
      rootMargin: options.rootMargin || '100px',
      threshold: options.threshold || 0.1,
      ...options,
    })

    observer.observe(element)
    return observer
  }

  /**
   * Debounce para optimizar event handlers
   */
  function debounce(func, wait = 300) {
    let timeout
    return function executedFunction(...args) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  /**
   * Throttle para limitar frecuencia de ejecución
   */
  function throttle(func, limit = 300) {
    let inThrottle
    return function throttledFunction(...args) {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }

  /**
   * Request Animation Frame debounce (para smooth scrolling)
   */
  function raf(func) {
    let rafId
    return function (...args) {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => func(...args))
    }
  }

  /**
   * Medir performance de una función
   */
  async function measurePerformance(label, fn) {
    const startTime = performance.now()

    try {
      const result = await fn()
      const endTime = performance.now()
      const duration = endTime - startTime

      if (duration > 100) {
        console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms`)
      } else if (duration > 16) {
        console.log(`[Performance] ${label} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (error) {
      const endTime = performance.now()
      console.error(`[Performance] ${label} errored after ${(endTime - startTime).toFixed(2)}ms`, error)
      throw error
    }
  }

  /**
   * Monitorear Web Vitals
   */
  function monitorWebVitals() {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          // console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime)
        })
        observer.observe({ entryTypes: ['largest-contentful-paint'] })
      } catch (e) {
        console.warn('LCP monitoring not supported')
      }
    }

    // FID - First Input Delay (usando PerformanceEventTiming)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            // console.log('FID:', entry.processingDuration)
          })
        })
        observer.observe({ entryTypes: ['first-input'] })
      } catch (e) {
        console.warn('FID monitoring not supported')
      }
    }

    // CLS - Cumulative Layout Shift
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          let cls = 0
          list.getEntries().forEach((entry) => {
            if (!entry.hadRecentInput) {
              cls += entry.value
            }
          })
          // console.log('CLS:', cls)
        })
        observer.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('CLS monitoring not supported')
      }
    }
  }

  /**
   * Prefetch links
   */
  function setupPrefetch() {
    const links = document.querySelectorAll('a[data-prefetch]')

    links.forEach((link) => {
      link.addEventListener('mouseenter', () => {
        const href = link.getAttribute('href')
        if (href && !href.startsWith('http')) {
          const prefetchLink = document.createElement('link')
          prefetchLink.rel = 'prefetch'
          prefetchLink.href = href
          document.head.appendChild(prefetchLink)
        }
      }, { once: true })
    })
  }

  /**
   * Request idle callback polyfill
   */
  function scheduleIdleTask(callback) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(callback)
    } else {
      setTimeout(callback, 1)
    }
  }

  /**
   * Monitorear memoria (Chrome only)
   */
  function monitorMemory() {
    if ('memory' in performance) {
      const mem = performance.memory
      const used = mem.usedJSHeapSize / 1048576
      const limit = mem.jsHeapSizeLimit / 1048576

      console.log(`Memory: ${used.toFixed(2)}MB / ${limit.toFixed(2)}MB`)

      if (used > limit * 0.9) {
        console.warn('Memory usage is high!')
      }
    }
  }

  /**
   * Obtener métricas de página
   */
  function getPageMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] || {}
    const paint = performance.getEntriesByType('paint')

    return {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domParse: navigation.domInteractive - navigation.domLoading,
      domComplete: navigation.domComplete - navigation.domLoading,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstPaint: paint.find((p) => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find((p) => p.name === 'first-contentful-paint')?.startTime,
    }
  }

  /**
   * Log de métricas (útil para debugging)
   */
  function logPageMetrics() {
    const metrics = getPageMetrics()
    console.table(metrics)
  }

  return {
    setupImageLazyLoading,
    observeElement,
    debounce,
    throttle,
    raf,
    measurePerformance,
    monitorWebVitals,
    setupPrefetch,
    scheduleIdleTask,
    monitorMemory,
    getPageMetrics,
    logPageMetrics,
  }
}
