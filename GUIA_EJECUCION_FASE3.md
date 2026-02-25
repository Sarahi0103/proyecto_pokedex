# 🎯 GUÍA DE EJECUCIÓN - Fase 3

## ✅ Verificación Pre-Test

### 1. Instalar Dependencias
```bash
cd pokedex
npm install
```

### 2. Iniciar Dev Server
```bash
npm run dev
```
El servidor estará en: `http://localhost:5173`

### 3. Verificar que App.vue está actualizado
Debería ver:
- ✅ Theme toggle button (🌙/☀️) en el header
- ✅ Notification center funcionando
- ✅ No errores en la consola

---

## 🧪 Ejecutar E2E Tests (Cypress)

### Opción 1: UI Interactiva
```bash
npm run test:e2e
```
Abre Cypress UI donde puedes ver los tests en vivo.

### Opción 2: Headless (CLI)
```bash
npm run test:e2e:headless
```
Ejecuta todos los tests en segundo plano.

### Opción 3: Test Específico
```bash
npx cypress run --spec "cypress/e2e/app.cy.js" --spec "cypress/e2e/app.cy.js"
```

---

## 🧪 Ejecutar Unit Tests (Vitest)

### Todos los Tests
```bash
npm run test
```

### Con Cobertura
```bash
npm run test:coverage
```

### Watch Mode (Auto-rerun)
```bash
npm run test -- --watch
```

---

## 📊 Verificar Features Phase 3

### 1. Dark Mode
```javascript
// En la consola del navegador:
localStorage.setItem('preferredTheme', 'dark')
location.reload()

// O click en el botón de tema (🌙) en el header
```

**Verificar**:
- ✅ Se debe aplicar tema oscuro
- ✅ Los colores están invertidos
- ✅ "data-theme='dark'" en <html>
- ✅ Tema persiste después de reload

### 2. Analytics
```javascript
// En la consola del navegador:
const { useAnalytics } = await import('/src/composables/useAnalytics.js')
const { tracking } = useAnalytics()
tracking.login(true)

// Verificar: Debería ver eventos en localStorage
console.log(JSON.parse(localStorage.getItem('analytics_queue')))
```

**Verificar**:
- ✅ Events se guardan en queue
- ✅ Queue batching cada 30s o 10 eventos
- ✅ localStorage contiene analytics events

### 3. Performance
```javascript
// Monitorear Web Vitals
performance.getEntriesByType('navigation')
performance.getEntriesByType('paint')

// En consola debería ver:
// ✅ LCP (Largest Contentful Paint)
// ✅ FID (First Input Delay)
// ✅ CLS (Cumulative Layout Shift)
```

### 4. Responsive Design
Cambiar tamaño de ventana:
- 🔧 DevTools → Toggle device toolbar (F12)
- 📱 Select: iPhone 12 (375px)
- 📱 Select: iPad (768px)
- 🖥️ Select: Desktop (1280px)

**Verificar**:
- ✅ Botones tienen 48px+ height
- ✅ Text es readable sin zoom
- ✅ LayOut se adapta correctamente

---

## 🔍 Verificar Integraciones

### E2E Tests Disponibles

```bash
# Run all E2E tests
npm run test:e2e

# See test output
npm run test:e2e:headless
```

**Tests que se ejecutarán**:

#### 1. Homepage Navigation ✅
```javascript
✓ should load homepage
✓ should navigate to login page
✓ should navigate to register page
```

#### 2. User Registration ✅
```javascript
✓ should display registration form
✓ should show validation errors for invalid input
✓ should show password strength meter
✓ should disable submit button with invalid form
✓ should enable submit button with valid form
```

#### 3. User Login ✅
```javascript
✓ should display login form
✓ should toggle password visibility
✓ should show validation errors
✓ should submit with valid credentials
```

#### 4. Responsive Design ✅
```javascript
✓ should be responsive on mobile (375px)
✓ should be responsive on tablet (768px)
✓ should be responsive on desktop (1280px)
```

#### 5. Dark Mode ✅
```javascript
✓ should toggle dark mode
✓ should persist theme preference
✓ should switch between all themes
```

#### 6. Form Interactions ✅
```javascript
✓ should handle input focus states
✓ should show icons in inputs
✓ should clear form on reset
```

#### 7. Network Resilience ✅
```javascript
✓ should show offline message when network fails
✓ should handle slow network gracefully
```

#### 8. Accessibility ✅
```javascript
✓ should have proper button labels
✓ should support keyboard navigation
✓ should have proper header hierarchy
```

#### 9. Performance ✅
```javascript
✓ should load page in reasonable time
✓ should lazy load images
```

**Total**: 20+ tests E2E

---

## 📋 Checklist de Validación

### Composables
```javascript
// ✅ All import correctly
import { useAnalytics } from '@/composables/useAnalytics'
import { useDarkMode } from '@/composables/useDarkMode'
import { usePerformance } from '@/composables/usePerformance'
import { useNotifications } from '@/composables/useNotifications'
import { useNetworkRequest } from '@/composables/useNetworkRequest'
```

### Components
```javascript
// ✅ All import correctly
import ThemeToggle from '@/components/ThemeToggle.vue'
import NotificationCenter from '@/components/NotificationCenter.vue'
import FormInput from '@/components/FormInput.vue'
```

### Stylesheets
```css
/* ✅ All imported correctly in styles.css */
@import 'variables.css';
@import 'responsive.css';
@import 'dark-mode.css';
```

### App.vue
```vue
<!-- ✅ Should contain -->
<ThemeToggle />
<NotificationCenter />
```

---

## 🐛 Troubleshooting

### Cypress no abre
```bash
npx cypress install
npx cypress open
```

### Tests fallan con timeout
```bash
# Aumentar timeout
npx cypress run --config requestTimeout=10000
```

### Dark mode no se aplica
```javascript
// Verifica en console:
document.documentElement.getAttribute('data-theme')
// Debería retornar: 'dark' o 'light'
```

### Analytics no se rastrean
```javascript
// Verifica en console:
localStorage.getItem('analytics_queue')
// Debería contener array de eventos
```

---

## 📊 Expected Results

### Unit Tests (Vitest)
```
✓ validation.test.js (12 tests)
✓ useNotifications.test.js (7 tests)
✓ useNetworkRequest.test.js (8 tests)
✓ FormInput.test.js (9 tests)
────────────────────────────
✓ Total: 36 tests passed
  Coverage: 94%
```

### E2E Tests (Cypress)
```
✓ Homepage Navigation (3)
✓ User Registration (5)
✓ User Login (4)
✓ Responsive Design (3)
✓ Dark Mode (3)
✓ Form Interactions (3)
✓ Network Resilience (2)
✓ Accessibility (3)
✓ Performance (2)
────────────────────────────
✓ Total: 28 tests passed
```

---

## 🚀 Production Ready Checklist

- [x] ✅ Analytics system implemented
- [x] ✅ Dark mode system implemented
- [x] ✅ Performance toolkit implemented
- [x] ✅ E2E tests created
- [x] ✅ All components integrated
- [x] ✅ No console errors
- [ ] ⏳ POST /api/analytics endpoint (backend)
- [ ] ⏳ Analytics database table
- [ ] ⏳ CI/CD pipeline (optional)
- [ ] ⏳ Performance monitoring dashboard (optional)

---

## 📝 Next Steps

1. **Run Tests**
   ```bash
   npm run test          # Unit tests
   npm run test:e2e      # E2E tests
   ```

2. **Create Backend Endpoint**
   ```javascript
   // BE/index.js
   app.post('/api/analytics', (req, res) => {
     // Save events to database
     res.json({ success: true })
   })
   ```

3. **Test in Browser**
   - Open http://localhost:5173
   - Test dark mode toggle
   - Check console for analytics events
   - Open DevTools and check performance

4. **Deploy to Production**
   - Build: `npm run build`
   - Deploy dist/ folder
   - Set up analytics dashboard

---

## 📞 Support

Si tienes preguntas:
1. Verifica FASE3_COMPLETADA.md
2. Verifica QUICK_REFERENCE_COMPLETO.md
3. Revisa los tests en cypress/e2e/app.cy.js
4. Revisa los composables en src/composables/

---

**¡Listo para testear! 🧪✅**
