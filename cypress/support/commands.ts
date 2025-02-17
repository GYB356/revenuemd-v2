Cypress.Commands.add('login', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
  }).then((response) => {
    // Store tokens in cookies
    cy.setCookie('token', response.body.token)
    cy.setCookie('refreshToken', response.body.refreshToken)
  })
})

Cypress.Commands.add('createPatient', (patientData: any) => {
  cy.request({
    method: 'POST',
    url: '/api/patients',
    body: patientData,
    headers: {
      Cookie: `token=${Cypress.env('token')}`,
    },
  })
})

Cypress.Commands.add('createClaim', (claimData: any) => {
  cy.request({
    method: 'POST',
    url: '/api/claims',
    body: claimData,
    headers: {
      Cookie: `token=${Cypress.env('token')}`,
    },
  })
}) 