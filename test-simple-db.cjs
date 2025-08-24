// Простой тест подключения к базе данных без Prisma
const { Client } = require('pg');

async function testSimpleConnection() {
  console.log('🔍 Простой тест подключения к базе данных...\n');

  const client = new Client({
    host: 'localhost',
    port: 5432,
    database: 'supermock',
    user: 'supermock',
    password: 'krishna1284',
  });

  try {
    // Подключение
    console.log('1️⃣ Подключаемся к базе данных...');
    await client.connect();
    console.log('✅ Подключение успешно!');

    // Простой запрос
    console.log('\n2️⃣ Выполняем простой запрос...');
    const result = await client.query('SELECT 1 as test');
    console.log('✅ Запрос выполнен:', result.rows[0]);

    // Проверяем таблицы
    console.log('\n3️⃣ Проверяем таблицы...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('✅ Найденные таблицы:', tables.rows.map(r => r.table_name));

    // Проверяем таблицу feedback
    console.log('\n4️⃣ Проверяем таблицу feedback...');
    const feedbackTable = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'feedback'
      ORDER BY ordinal_position
    `);
    console.log('✅ Структура таблицы feedback:', feedbackTable.rows);

    // Создаем тестовых пользователей
    console.log('\n5️⃣ Создаем тестовых пользователей...');
    const user1Result = await client.query(`
      INSERT INTO users (id, username, first_name, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `, ['1', 'testuser1', 'Тестовый Пользователь 1']);
    
    const user2Result = await client.query(`
      INSERT INTO users (id, username, first_name, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `, ['2', 'testuser2', 'Тестовый Пользователь 2']);
    
    console.log('✅ Пользователи созданы:', {
      user1: user1Result.rows[0] || 'уже существует',
      user2: user2Result.rows[0] || 'уже существует'
    });

    // Создаем тестовую сессию
    console.log('\n6️⃣ Создаем тестовую сессию...');
    const sessionResult = await client.query(`
      INSERT INTO sessions (id, interviewer_user_id, candidate_user_id, profession, language, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `, ['test-session-1', '1', '2', 'JavaScript', 'ru', 'completed']);
    
    console.log('✅ Сессия создана:', sessionResult.rows[0] || 'уже существует');

    // Тест вставки фидбека
    console.log('\n7️⃣ Тестируем вставку фидбека...');
    const insertResult = await client.query(`
      INSERT INTO feedback (session_id, from_user_id, to_user_id, rating, comments, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT DO NOTHING
      RETURNING id, session_id, from_user_id, to_user_id, rating, comments
    `, ['test-session-1', '1', '2', 5, 'Тестовый комментарий']);
    
    if (insertResult.rows.length > 0) {
      console.log('✅ Фидбек вставлен:', insertResult.rows[0]);
    } else {
      console.log('✅ Фидбек уже существует');
    }

    // Тест получения фидбека
    console.log('\n8️⃣ Тестируем получение фидбека...');
    const selectResult = await client.query(`
      SELECT * FROM feedback WHERE session_id = $1
    `, ['test-session-1']);
    
    console.log('✅ Получено фидбеков:', selectResult.rows.length);
    if (selectResult.rows.length > 0) {
      console.log('📊 Последний фидбек:', selectResult.rows[0]);
    }

    // Тест расширенного фидбека
    console.log('\n9️⃣ Тестируем расширенный фидбек...');
    const enhancedInsertResult = await client.query(`
      INSERT INTO feedback (session_id, from_user_id, to_user_id, rating, comments, ratings, recommendations, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT DO NOTHING
      RETURNING id, session_id, from_user_id, to_user_id, rating, comments, ratings, recommendations
    `, [
      'test-session-1', 
      '2', 
      '1', 
      4, 
      'Очень хорошее собеседование!',
      JSON.stringify({
        preparation: 5,
        communication: 4,
        technicalSkills: 4,
        problemSolving: 5,
        overall: 4
      }),
      'Продолжайте практиковаться в решении алгоритмических задач'
    ]);
    
    if (enhancedInsertResult.rows.length > 0) {
      console.log('✅ Расширенный фидбек вставлен:', enhancedInsertResult.rows[0]);
    } else {
      console.log('✅ Расширенный фидбек уже существует');
    }

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
  } finally {
    await client.end();
  }
}

testSimpleConnection().then(() => {
  console.log('\n🏁 Тест завершен!');
  process.exit(0);
}).catch(error => {
  console.error('💥 Критическая ошибка:', error);
  process.exit(1);
});
