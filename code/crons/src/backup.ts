import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import pg from 'pg'
import { randomUUID } from 'crypto'
import 'dotenv/config'

const { Pool } = pg

const s3 = new S3Client({ region: process.env.AWS_REGION || 'eu-west-3' })
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export async function handler() {
  console.log('Début du backup...')

  try {
    // 1. Dump toutes les tables en JSON
    const tables = ['users', 'teams', 'team_members', 'invitations', 'projects', 'tasks', 'assets', 'backups']

    const backup: Record<string, any[]> = {}

    for (const table of tables) {
      const result = await db.query(`SELECT * FROM ${table}`)
      backup[table] = result.rows
      console.log(`  -> ${table}: ${result.rows.length} lignes`)
    }

    // 2. Crée le fichier backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${timestamp}.json`
    const s3Key = `backups/${filename}`
    const content = JSON.stringify(backup, null, 2)

    // 3. Upload sur S3
    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_ASSETS_BUCKET!,
      Key: s3Key,
      Body: content,
      ContentType: 'application/json'
    }))
    console.log(`Backup uploadé sur S3 : ${s3Key}`)

    // 4. Enregistre en BDD
    await db.query(
      `INSERT INTO backups (filename, s3_key) VALUES ($1, $2)`,
      [filename, s3Key]
    )
    console.log('Backup enregistré en BDD')

    return { success: true, filename }

  } catch (err) {
    console.error('Erreur backup :', err)
    throw err
  } finally {
    await db.end()
  }
}

// Lance en local si pas dans Lambda
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  handler()
    .then(res => console.log('Résultat :', res))
    .catch(console.error)
}