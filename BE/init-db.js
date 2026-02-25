#!/usr/bin/env node
/**
 * Script de inicialización de la base de datos
 * Lee y ejecuta schema.sql en PostgreSQL
 * Uso: node init-db.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Configuración de PostgreSQL
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'pokedex',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '123',
      }
);

async function initializeDatabase() {
  let client;
  try {
    console.log('🔌 Conectando a PostgreSQL...');
    client = await pool.connect();
    console.log('✅ Conectado exitosamente');

    // Leer archivo schema.sql
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    console.log(`📖 Leyendo schema desde: ${schemaPath}`);
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`No se encontró el archivo schema.sql en ${schemaPath}`);
    }

    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Ejecutar schema
    console.log('🔨 Ejecutando schema SQL...');
    await client.query(schema);
    console.log('✅ Schema ejecutado correctamente');

    // Verificar tablas creadas
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tablas creadas:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✨ Base de datos inicializada exitosamente\n');
    
  } catch (error) {
    console.error('\n❌ Error al inicializar la base de datos:');
    console.error(error.message);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Ejecutar
initializeDatabase();
