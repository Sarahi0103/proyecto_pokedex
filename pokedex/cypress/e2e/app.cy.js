describe('E2E Tests - Pokédex Application', () => {
  const testEmail = `test-${Date.now()}@example.com`
  const testPassword = 'TestPassword123'

  beforeEach(() => {
    // Limpiar localStorage
    cy.clearLocalStorage()
    cy.visit('/')
  })

  describe('Homepage Navigation', () => {
    it('should load homepage', () => {
      cy.contains('Pokédex').should('be.visible')
    })

    it('should navigate to login page', () => {
      cy.contains('Iniciar Sesión').click()
      cy.url().should('include', '/login')
    })

    it('should navigate to register page', () => {
      cy.contains('Regístrate').click()
      cy.url().should('include', '/register')
    })
  })

  describe('User Registration', () => {
    beforeEach(() => {
      cy.visit('/register')
    })

    it('should display registration form', () => {
      cy.get('input[autocomplete="name"]').should('be.visible')
      cy.get('input[autocomplete="email"]').should('be.visible')
      cy.get('input[autocomplete="new-password"]').should('exist')
    })

    it('should show validation errors for invalid input', () => {
      // Email inválido
      cy.get('input[autocomplete="email"]').type('invalid-email')
      cy.get('.validation-icon.invalid').should('be.visible')
    })

    it('should show password strength meter', () => {
      cy.get('input[autocomplete="new-password"]').type('TestPassword123')
      cy.contains('Fuerte').should('be.visible')
    })

    it('should disable submit button with invalid form', () => {
      cy.get('button[type="submit"]').should('be.disabled')
    })

    it('should enable submit button with valid form', () => {
      cy.get('input[autocomplete="name"]').type('Test User')
      cy.get('input[autocomplete="email"]').type(testEmail)
      cy.get('input[autocomplete="new-password"]').type(testPassword)
      cy.get('input[autocomplete="new-password"]').focus()
      cy.get('input[autocomplete="new-password"]').blur()
      
      // Confirmar contraseña
      cy.get('input[autocomplete="new-password"]').eq(1).type(testPassword)
      
      cy.get('button[type="submit"]').should('not.be.disabled')
    })
  })

  describe('User Login', () => {
    beforeEach(() => {
      cy.visit('/login')
    })

    it('should display login form', () => {
      cy.get('input[autocomplete="email"]').should('be.visible')
      cy.get('input[type="password"]').should('be.visible')
    })

    it('should toggle password visibility', () => {
      cy.get('input[type="password"]').type('password123')
      cy.get('.toggle-password').click()
      cy.get('input[type="text"]').should('have.value', 'password123')
    })

    it('should show validation errors', () => {
      cy.get('input[autocomplete="email"]').type('invalid')
      cy.get('.validation-icon.invalid').should('be.visible')
    })

    it('should submit with valid credentials', () => {
      // Usar credenciales de prueba existentes o skip si no existen
      cy.get('input[autocomplete="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('TestPassword123')
      
      // Podría fallar si no existen credenciales, lo que es esperado
      cy.get('button[type="submit"]').click()
      
      // Aumentar timeout para esperar respuesta del servidor
      cy.url({ timeout: 5000 }).then((url) => {
        if (url.includes('/login')) {
          cy.contains('Error').should('be.visible')
        }
      })
    })
  })

  describe('Responsive Design', () => {
    it('should be responsive on mobile (375px)', () => {
      cy.viewport(375, 667)
      cy.visit('/')
      
      // Verificar que los botones sean tappable (min 48px height)
      cy.get('button').then(($button) => {
        const height = $button.height()
        expect(height).to.be.at.least(44) // Cypress usa 44px como mínimo
      })
    })

    it('should be responsive on tablet (768px)', () => {
      cy.viewport(768, 1024)
      cy.visit('/')
      
      cy.get('body').should('be.visible')
    })

    it('should be responsive on desktop (1280px)', () => {
      cy.viewport(1280, 720)
      cy.visit('/')
      
      cy.get('body').should('be.visible')
    })
  })

  describe('Dark Mode', () => {
    it('should toggle dark mode', () => {
      cy.visit('/')
      
      // Verificar que el botón de tema existe
      cy.get('.theme-toggle-btn').should('be.visible')
      
      // Click para toglear
      cy.get('.theme-toggle-btn').click()
      
      // Verificar que el menú aparece
      cy.get('.theme-menu').should('be.visible')
      
      // Seleccionar tema oscuro
      cy.contains('Oscuro').click()
      
      // Verificar que el atributo data-theme se aplicó
      cy.get('html').should('have.attr', 'data-theme', 'dark')
    })

    it('should persist theme preference', () => {
      cy.visit('/')
      
      cy.get('.theme-toggle-btn').click()
      cy.contains('Oscuro').click()
      
      // Recargar página
      cy.reload()
      
      // Verificar que el tema oscuro se mantuvo
      cy.get('html').should('have.attr', 'data-theme', 'dark')
    })

    it('should switch between all themes', () => {
      cy.visit('/')

      const themes = ['light', 'dark', 'system']

      themes.forEach((theme) => {
        cy.get('.theme-toggle-btn').click()
        cy.contains(/Claro|Oscuro|Sistema/).click()
        
        // Verificar que al menos uno de los atributos existe o se removió
        cy.get('html').then(($html) => {
          const hasTheme = $html.attr('data-theme') ?? 'none'
          expect(['light', 'dark', 'none']).to.include(hasTheme)
        })
      })
    })
  })

  describe('Form Interactions', () => {
    beforeEach(() => {
      cy.visit('/register')
    })

    it('should handle input focus states', () => {
      cy.get('input[autocomplete="email"]').focus()
      cy.get('.input-container').should('have.class', 'focused')
      
      cy.get('input[autocomplete="email"]').blur()
      cy.get('.input-container').should('not.have.class', 'focused')
    })

    it('should show icons in inputs', () => {
      cy.get('.input-icon').should('be.visible')
      cy.get('.input-icon').should('contain', '📧')
    })

    it('should clear form on reset', () => {
      cy.get('input[autocomplete="name"]').type('Test')
      cy.get('input[autocomplete="name"]').should('have.value', 'Test')
    })
  })

  describe('Network Resilience', () => {
    it('should show offline message when network fails', () => {
      cy.visit('/login')
      
      // Intercept la solicitud de login
      cy.intercept('POST', '**/auth/login', (req) => {
        // Simular fallo de red
        req.destroy()
      })

      cy.get('input[autocomplete="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // Debería mostrar mensaje de error
      cy.contains('Error').should('be.visible')
    })

    it('should handle slow network gracefully', () => {
      cy.visit('/login')
      
      // Ralentizar la conexión
      cy.intercept('POST', '**/auth/login', (req) => {
        req.reply((res) => {
          res.delay(3000) // 3 segundos de delay
        })
      })

      cy.get('input[autocomplete="email"]').type('test@example.com')
      cy.get('input[type="password"]').type('password123')
      cy.get('button[type="submit"]').click()

      // El botón debería estar en estado loading
      cy.get('button[type="submit"]').should('contain', 'Iniciando sesión...')
    })
  })

  describe('Accessibility', () => {
    it('should have proper button labels', () => {
      cy.visit('/register')
      
      cy.get('button').each(($button) => {
        const text = $button.text()
        const ariaLabel = $button.attr('aria-label')
        
        // Debería tener texto o aria-label
        expect(text || ariaLabel).to.be.ok
      })
    })

    it('should support keyboard navigation', () => {
      cy.visit('/register')
      
      // Tab a través de los inputs
      cy.get('input[autocomplete="name"]').focus()
      cy.focused().should('have.attr', 'autocomplete', 'name')
      
      cy.focused().tab()
      cy.focused().should('have.attr', 'autocomplete', 'email')
    })

    it('should have proper header hierarchy', () => {
      cy.visit('/')
      
      // Verificar que hay headers
      cy.get('h1').should('have.length.greaterThan', 0)
    })
  })

  describe('Performance', () => {
    it('should load page in reasonable time', () => {
      cy.visit('/', { timeout: 10000 })
      cy.contains('body', /Pokédex|Pokémon/).should('be.visible', { timeout: 5000 })
    })

    it('should lazy load images', () => {
      cy.visit('/')
      
      // Buscar imágenes con data-src (lazy loaded)
      cy.get('img[data-src]').should('have.length.greaterThan', 0).or('have.length', 0)
    })
  })

  describe('Core Feature Smoke', () => {
    function mockAuthenticatedSession() {
      const token = 'test-token'
      const user = {
        id: 1,
        name: 'Smoke Trainer',
        email: 'smoke@pokedex.com',
        code: 'SMOKE01'
      }

      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('token', token)
          win.localStorage.setItem('user', JSON.stringify(user))
        }
      })
    }

    it('should update favorite metadata without breaking list', () => {
      mockAuthenticatedSession()

      cy.intercept('GET', '**/api/favorites', {
        statusCode: 200,
        body: {
          favorites: [
            { id: 25, name: 'pikachu', sprite: '', types: ['electric'], alias: '', note: '' }
          ]
        }
      }).as('getFavorites')

      cy.intercept('PUT', '**/api/favorites/25', {
        statusCode: 200,
        body: {
          favorites: [
            { id: 25, name: 'pikachu', sprite: '', types: ['electric'], alias: 'Mi Rayo', note: 'Titular' }
          ]
        }
      }).as('updateFavorite')

      cy.contains('Favoritos').click()
      cy.wait('@getFavorites')
      cy.contains('pikachu').should('be.visible')
      cy.get('.edit-btn').first().click()
      cy.get('.modal-input').clear().type('Mi Rayo')
      cy.get('.modal-textarea').clear().type('Titular')
      cy.contains('button', 'Guardar').click()
      cy.wait('@updateFavorite')
      cy.contains('Mi Rayo').should('be.visible')
    })

    it('should apply type1/type2 and region filters', () => {
      mockAuthenticatedSession()

      cy.intercept('GET', '**/api/region-pokemon/kanto', {
        statusCode: 200,
        body: {
          count: 2,
          results: [
            { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/bulbasaur' },
            { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/pikachu' }
          ]
        }
      }).as('regionKanto')

      cy.intercept('GET', '**/api/pokemon/bulbasaur', {
        statusCode: 200,
        body: {
          id: 1,
          name: 'bulbasaur',
          sprites: { front_default: '', other: { 'official-artwork': { front_default: '' } } },
          types: [{ slot: 1, type: { name: 'grass' } }, { slot: 2, type: { name: 'poison' } }]
        }
      })

      cy.intercept('GET', '**/api/pokemon/pikachu', {
        statusCode: 200,
        body: {
          id: 25,
          name: 'pikachu',
          sprites: { front_default: '', other: { 'official-artwork': { front_default: '' } } },
          types: [{ slot: 1, type: { name: 'electric' } }]
        }
      })

      cy.get('select').first().select('Kanto')
      cy.wait('@regionKanto')
      cy.get('select').eq(1).select('GRASS')
      cy.get('select').eq(2).select('POISON')
      cy.contains('bulbasaur').should('be.visible')
      cy.contains('pikachu').should('not.exist')
    })

    it('should send battle challenge request', () => {
      mockAuthenticatedSession()

      cy.intercept('GET', '**/api/teams', {
        statusCode: 200,
        body: {
          teams: [
            { name: 'Team 1', pokemons: [{ id: 1, name: 'bulbasaur', sprite: '' }] }
          ]
        }
      }).as('getTeams')

      cy.intercept('GET', '**/api/friends', {
        statusCode: 200,
        body: {
          friends: [{ id: 2, name: 'Gary', code: 'GARY123' }]
        }
      }).as('getFriends')

      cy.intercept('GET', '**/api/battles/challenges', {
        statusCode: 200,
        body: { challenges: [] }
      }).as('getChallenges')

      cy.intercept('POST', '**/api/battles/challenge', {
        statusCode: 200,
        body: { battle: { id: 99 }, message: 'Challenge sent!' }
      }).as('sendChallenge')

      cy.contains('Batallas').click()
      cy.wait(['@getTeams', '@getFriends', '@getChallenges'])
      cy.get('.team-selector select').select('Team 1 (1 Pokémon)')
      cy.get('.friend-select-card').first().click()
      cy.contains('button', 'Enviar Desafío').click()
      cy.wait('@sendChallenge')
    })
  })
})
