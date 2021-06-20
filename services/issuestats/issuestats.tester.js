import { ServiceTester } from '../tester.js'

export const t = new ServiceTester({ id: 'issuestats', title: 'Issue Stats' })

t.create('no longer available (previously issue analysis)')
  .get('/i/github/expressjs/express.json')
  .expectBadge({
    label: 'issue stats',
    message: 'no longer available',
  })

t.create('no longer available (previously pull request analysis, long form)')
  .get('/p/long/github/expressjs/express.json')
  .expectBadge({
    label: 'issue stats',
    message: 'no longer available',
  })
