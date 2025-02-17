describe('Claims Management', () => {
  beforeEach(() => {
    // Log in before each test
    cy.login('admin@example.com', 'password123')
  })

  it('should display claims list', () => {
    cy.visit('/claims')
    cy.get('table').should('exist')
    cy.get('tr').should('have.length.gt', 0)
  })

  it('should create a new claim', () => {
    cy.visit('/claims/new')
    
    // Fill out claim form
    cy.get('input[name="patientId"]').type('1')
    cy.get('input[name="claimAmount"]').type('100')
    cy.get('input[name="procedureCodes"]').type('CODE1')
    
    // Submit form
    cy.get('button[type="submit"]').click()
    
    // Verify success
    cy.url().should('include', '/claims')
    cy.contains('Claim created successfully')
  })

  it('should filter claims by status', () => {
    cy.visit('/claims')
    
    // Click status filter
    cy.get('select[name="status"]').select('PENDING')
    
    // Verify filtered results
    cy.get('tr').should('contain', 'PENDING')
    cy.get('tr').should('not.contain', 'APPROVED')
  })

  it('should handle errors gracefully', () => {
    cy.visit('/claims/new')
    
    // Submit empty form
    cy.get('button[type="submit"]').click()
    
    // Verify error messages
    cy.contains('Patient ID is required')
    cy.contains('Claim amount is required')
  })
}) 