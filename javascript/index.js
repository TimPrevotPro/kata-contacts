const sqlite3 = require('sqlite3')
const open = require('sqlite').open
const fs = require('fs')
const process = require('process')

const filename = 'contacts.sqlite3'
const numContacts = parseInt(process.argv[2], 10);

const shouldMigrate = !fs.existsSync(filename)

/**
 * Generate `numContacts` contacts,
 * one at a time
 *
 */
function * generateContacts () {
  let index = 1

  while (index <= numContacts) {
    yield [`name-${index}`, `email-${index}'@domain.tld`]
    index++
  }
}

const migrate = async (db) => {
  console.log('Migrating db ...')
  await db.exec(`
        CREATE TABLE contacts(
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL
         )
     `)
  console.log('Done migrating db')
}

const insertContacts = async (db) => {
  console.log('Inserting contacts ...')

  const contacts = generateContacts()

  for (const contact of contacts) {
    const res = await db.run('INSERT INTO contacts (name, email) VALUES (?, ?)', contact)
  }

  console.log('Done inserting contacts')
}

const queryContact = async (db) => {
  const start = Date.now()
  const res = await db.get('SELECT name FROM contacts WHERE email = ?', [`email-${numContacts}@domain.tld`])
  if (!res || !res.name) {
    console.error('Contact not found')
    process.exit(1)
  }
  const end = Date.now()
  const elapsed = (end - start) / 1000
  console.log(`Query took ${elapsed} seconds`)
}

(async () => {
  const db = await open({
    filename,
    driver: sqlite3.Database
  })
  if (shouldMigrate) {
    await migrate(db)
  }

  await insertContacts(db)
  await queryContact(db)
  await db.close()
})()