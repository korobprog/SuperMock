const fs = require('fs');
const path = require('path');

// Поддерживаемые языки
const SUPPORTED_LANGUAGES = ['ru', 'en', 'es', 'de', 'fr', 'zh'];

// Профессии
const PROFESSIONS = [
  'frontend-developer',
  'backend-developer',
  'fullstack-developer',
  'mobile-developer',
  'devops-engineer',
  'qa-engineer',
  'ux-ui-designer',
  'data-analyst',
  'data-scientist',
  'product-manager'
];

// Категории
const VALID_CATEGORIES = [
  'interview-questions',
  'technical-tasks',
  'system-design',
  'behavioral',
  'algorithms',
  'best-practices'
];

// Уровни сложности
const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

// Схема валидации
const materialSchema = {
  profession: { type: 'string', required: true, enum: PROFESSIONS },
  language: { type: 'string', required: true, enum: SUPPORTED_LANGUAGES },
  categories: { type: 'array', required: true },
  materials: { type: 'array', required: true }
};

const categorySchema = {
  id: { type: 'string', required: true, enum: VALID_CATEGORIES },
  name: { type: 'string', required: true },
  count: { type: 'number', required: true },
  icon: { type: 'string', required: true },
  color: { type: 'string', required: true }
};

const materialItemSchema = {
  id: { type: 'number', required: true },
  title: { type: 'string', required: true, minLength: 1 },
  description: { type: 'string', required: true, minLength: 1 },
  category: { type: 'string', required: true, enum: VALID_CATEGORIES },
  difficulty: { type: 'string', required: true, enum: VALID_DIFFICULTIES },
  readTime: { type: 'number', required: true, min: 1 },
  rating: { type: 'number', required: true, min: 0, max: 5 },
  reads: { type: 'number', required: true, min: 0 },
  tags: { type: 'array', required: true },
  content: { type: 'string', required: true, minLength: 1 },
  isNew: { type: 'boolean', required: true },
  isPopular: { type: 'boolean', required: true },
  createdAt: { type: 'string', required: true }
};

function validateSchema(data, schema, path = '') {
  const errors = [];

  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    const currentPath = path ? `${path}.${key}` : key;

    // Проверяем обязательные поля
    if (rules.required && (value === undefined || value === null)) {
      errors.push(`${currentPath}: обязательное поле`);
      continue;
    }

    if (value === undefined || value === null) {
      continue; // Пропускаем необязательные поля
    }

    // Проверяем тип
    if (rules.type === 'string' && typeof value !== 'string') {
      errors.push(`${currentPath}: должно быть строкой`);
    } else if (rules.type === 'number' && typeof value !== 'number') {
      errors.push(`${currentPath}: должно быть числом`);
    } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
      errors.push(`${currentPath}: должно быть булевым значением`);
    } else if (rules.type === 'array' && !Array.isArray(value)) {
      errors.push(`${currentPath}: должно быть массивом`);
    }

    // Проверяем enum
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${currentPath}: должно быть одним из [${rules.enum.join(', ')}]`);
    }

    // Проверяем min/max для чисел
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push(`${currentPath}: должно быть не меньше ${rules.min}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        errors.push(`${currentPath}: должно быть не больше ${rules.max}`);
      }
    }

    // Проверяем minLength для строк
    if (rules.type === 'string' && rules.minLength && value.length < rules.minLength) {
      errors.push(`${currentPath}: должно содержать минимум ${rules.minLength} символов`);
    }

    // Рекурсивная валидация для объектов
    if (rules.type === 'object' && rules.schema && typeof value === 'object') {
      errors.push(...validateSchema(value, rules.schema, currentPath));
    }
  }

  return errors;
}

function validateMaterial(material, index) {
  const errors = validateSchema(material, materialItemSchema, `materials[${index}]`);
  
  // Дополнительные проверки
  if (material.tags && !Array.isArray(material.tags)) {
    errors.push(`materials[${index}].tags: должно быть массивом`);
  }

  if (material.tags && material.tags.length > 0) {
    material.tags.forEach((tag, tagIndex) => {
      if (typeof tag !== 'string' || tag.length === 0) {
        errors.push(`materials[${index}].tags[${tagIndex}]: должно быть непустой строкой`);
      }
    });
  }

  // Проверяем дату
  if (material.createdAt) {
    const date = new Date(material.createdAt);
    if (isNaN(date.getTime())) {
      errors.push(`materials[${index}].createdAt: неверный формат даты`);
    }
  }

  return errors;
}

function validateCategories(categories) {
  const errors = [];
  
  if (!Array.isArray(categories)) {
    errors.push('categories: должно быть массивом');
    return errors;
  }

  categories.forEach((category, index) => {
    errors.push(...validateSchema(category, categorySchema, `categories[${index}]`));
  });

  return errors;
}

function validateMaterialsFile(filePath) {
  console.log(`🔍 Валидация файла: ${path.basename(filePath)}`);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileContent);

    const errors = [];

    // Валидируем основную структуру
    errors.push(...validateSchema(data, materialSchema));

    // Валидируем категории
    if (data.categories) {
      errors.push(...validateCategories(data.categories));
    }

    // Валидируем материалы
    if (data.materials && Array.isArray(data.materials)) {
      data.materials.forEach((material, index) => {
        errors.push(...validateMaterial(material, index));
      });
    }

    if (errors.length === 0) {
      console.log(`✅ Файл валиден`);
      return { valid: true, errors: [] };
    } else {
      console.log(`❌ Найдено ошибок: ${errors.length}`);
      errors.forEach(error => console.log(`  - ${error}`));
      return { valid: false, errors };
    }

  } catch (error) {
    console.log(`❌ Ошибка чтения файла: ${error.message}`);
    return { valid: false, errors: [error.message] };
  }
}

function validateAllMaterials() {
  console.log('🚀 Начинаем валидацию всех файлов материалов...\n');

  const materialsDir = path.join(__dirname, '..', 'materials');
  let totalFiles = 0;
  let validFiles = 0;
  let invalidFiles = 0;
  const allErrors = [];

  // Проверяем существование директории
  if (!fs.existsSync(materialsDir)) {
    console.log('❌ Директория materials не найдена');
    return;
  }

  // Проходим по всем профессиям и языкам
  for (const profession of PROFESSIONS) {
    for (const language of SUPPORTED_LANGUAGES) {
      const fileName = `${profession}-${language}.json`;
      const filePath = path.join(materialsDir, fileName);
      
      if (fs.existsSync(filePath)) {
        totalFiles++;
        const result = validateMaterialsFile(filePath);
        
        if (result.valid) {
          validFiles++;
        } else {
          invalidFiles++;
          allErrors.push({
            file: fileName,
            errors: result.errors
          });
        }
      } else {
        console.log(`⚠️  Файл не найден: ${fileName}`);
      }
    }
  }

  // Выводим итоговую статистику
  console.log('\n📊 Итоговая статистика:');
  console.log(`📁 Всего файлов: ${totalFiles}`);
  console.log(`✅ Валидных файлов: ${validFiles}`);
  console.log(`❌ Невалидных файлов: ${invalidFiles}`);

  if (invalidFiles > 0) {
    console.log('\n❌ Детали ошибок:');
    allErrors.forEach(({ file, errors }) => {
      console.log(`\n📄 ${file}:`);
      errors.forEach(error => console.log(`  - ${error}`));
    });
  }

  if (validFiles === totalFiles && totalFiles > 0) {
    console.log('\n🎉 Все файлы валидны!');
  }
}

// Обработка аргументов командной строки
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'all':
    validateAllMaterials();
    break;
  case 'file':
    const filePath = args[1];
    if (!filePath) {
      console.log('Использование: node validate-materials.js file <путь_к_файлу>');
      process.exit(1);
    }
    validateMaterialsFile(filePath);
    break;
  default:
    console.log('Использование:');
    console.log('  node validate-materials.js all                    - Валидировать все файлы');
    console.log('  node validate-materials.js file <путь_к_файлу>    - Валидировать конкретный файл');
    break;
}
