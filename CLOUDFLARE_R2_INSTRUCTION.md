# 📦 Cloudflare R2 — Инструкция по настройке для JARYQ

Cloudflare R2 — это объектное хранилище с **10 GB бесплатно**, CDN и полной поддержкой стриминга аудио.

---

## 🚀 Шаг 1: Создание аккаунта Cloudflare

1. Перейдите на [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Зарегистрируйтесь (если нет аккаунта)
3. Подтвердите email

---

## 📂 Шаг 2: Создание R2 Bucket

1. В левом меню нажмите **R2**
2. Нажмите **Create bucket**
3. Назовите bucket: `jaryq-audio`
4. Выберите регион: **Automatic** (или ближе к вашим пользователям)
5. Нажмите **Create bucket** ✅

---

## 🔓 Шаг 3: Настройка публичного доступа

### Вариант A: Через R2 Subdomain (простой)

1. В R2 Dashboard нажмите **Settings**
2. Найдите раздел **R2.dev subdomain**
3. Нажмите **Allow Access** (разрешить публичный доступ)
4. Ваш bucket будет доступен по адресу:
   ```
   https://pub-XXXXX.r2.dev
   ```
## 🔑 Шаг 4: Создание API токена

1. Перейдите в **R2 API Tokens** (в настройках R2)
2. Нажмите **Create API token**
3. Выберите разрешения:
   - **Object Read & Write** (чтение и запись объектов)
4. Скопируйте:
   - **Access Key ID**
   - **Secret Access Key**

---

## 🎵 Шаг 5: Конвертация MP3 в M4A

Перед загрузкой переведи файлы в формат AAC (M4A) — весит в 2 раза меньше при том же качестве.

Из корня проекта выполни:

```bash
chmod +x convert-audio.sh && ./convert-audio.sh *.mp3
```

Если MP3 лежат в отдельной папке:

```bash
chmod +x convert-audio.sh && ./convert-audio.sh ./папка/*.mp3
```

Готовые `.m4a` файлы появятся в папке `./converted/`.

> Если нужен битрейт выше (лучше качество, больше размер):
> ```bash
> ./convert-audio.sh -b 96 *.mp3
> ```

---

## 📤 Шаг 6: Загрузка аудиофайлов

1. Откройте ваш bucket `jaryq-audio`
2. Нажмите **Upload** → **Files**
3. Загрузите `.m4a` файлы из папки `./converted/`
4. **Рекомендуемое именование:**
   ```
   book-slug-chapter-01.m4a
   book-slug-chapter-02.m4a
   ```


## 🔗 Шаг 7: Получение публичных URL

После загрузки файла:

1. В Dashboard нажмите на файл
2. Скопируйте **Public URL**:
   ```
   https://pub-XXXXX.r2.dev/book-chapter-01.m4a
   ```

**Или сформируйте вручную:**
```
https://pub-XXXXX.r2.dev/{имя_файла}
```

---

## 💾 Шаг 8: Добавление в базу данных Supabase

### 8.1: Добавить книгу

Откройте [Supabase SQL Editor](https://app.supabase.com/project/_/sql) и выполните:

```sql
-- Добавить книгу
INSERT INTO books (
  title, 
  author, 
  narrator, 
  description,
  cover_url,
  is_new, 
  is_popular,
  total_chapters, 
  total_duration,
  language,
  genre_id
)
VALUES (
  'Название книги',
  'Имя Автора',
  'Имя Диктора',
  'Описание книги (необязательно)',
  'https://pub-XXXXX.r2.dev/covers/название.jpg',  -- ← URL обложки
  true,       -- is_new
  false,      -- is_popular
  5,          -- total_chapters
  18000,      -- total_duration (в секундах, 5 часов)
  'ru',
  (SELECT id FROM genres WHERE name = 'Классика' LIMIT 1)
)
RETURNING id;
```

**Скопируйте UUID книги из результата!**

### 8.2: Добавить главы с URL из Cloudflare R2

```sql
-- Добавить главы
INSERT INTO chapters (book_id, chapter_number, title, audio_url, duration)
VALUES
  (
    'ВСТАВЬТЕ_UUID_КНИГИ',  -- book_id из предыдущего шага
    1,
    'Глава 1: Начало',
    'https://pub-XXXXX.r2.dev/book-chapter-01.m4a',  -- URL из R2
    3600  -- duration в секундах (1 час)
  ),
  (
    'ВСТАВЬТЕ_UUID_КНИГИ',
    2,
    'Глава 2: Продолжение',
    'https://pub-XXXXX.r2.dev/book-chapter-02.m4a',
    3600
  ),
  (
    'ВСТАВЬТЕ_UUID_КНИГИ',
    3,
    'Глава 3: Заключение',
    'https://pub-XXXXX.r2.dev/book-chapter-03.m4a',
    3600
  );
```

### 8.3: Обновить общую длительность книги

```sql
-- Автоматически посчитать total_duration из глав
UPDATE books 
SET total_duration = (
  SELECT SUM(duration) FROM chapters WHERE book_id = books.id
)
WHERE id = 'ВСТАВЬТЕ_UUID_КНИГИ';
```

---

## ✅ Шаг 9: Проверка в приложении

1. Запустите приложение:
   ```bash
   npm start
   ```

2. Войдите в аккаунт

3. Книга появится в **"Новые поступления"** (так как `is_new = true`)

4. Откройте книгу → нажмите **"Слушать с начала"**

5. 🎧 Аудио должно воспроизводиться!

---

## 🔧 Устранение проблем

### Ошибка "Failed to load audio"

**Причина:** Неправильный URL или файл не доступен публично

**Решение:**
1. Откройте URL в браузере — файл должен скачиваться
2. Проверьте, что bucket публичный
3. Убедитесь, что URL правильный

### Перемотка не работает

**Причина:** Сервер не поддерживает Range requests

**Решение:**
- Cloudflare R2 поддерживает Range requests по умолчанию
- Проверьте, что файл `.m4a` или `.mp3`, а не HTML страница

### Медленная загрузка

**Причина:** Большой файл или медленное соединение

**Решение:**
- Конвертируйте в AAC с битрейтом 64-96 kbps
- Проверьте скорость интернета

---

## 💡 Советы по оптимизации

### 1. Конвертация в AAC

Используйте скрипт `convert-audio.sh` в корне проекта:

```bash
# Сделать скрипт исполняемым
chmod +x convert-audio.sh

# Конвертировать один файл
./convert-audio.sh input.mp3

# Конвертировать все MP3 в папке
./convert-audio.sh ./audiobooks/*.mp3

# Конвертировать с указанием битрейта
./convert-audio.sh -b 96 input.mp3
```

**Результат:**
- MP3 10 MB → M4A 4-5 MB
- Экономия места **50-60%**
- Качество для аудиокниг **отличное**

### 2. Структура файлов

Рекомендуемая структура в R2:

```
jaryq-audio/
├── book-slug-1/
│   ├── chapter-01.m4a
│   ├── chapter-02.m4a
│   └── chapter-03.m4a
├── book-slug-2/
│   ├── chapter-01.m4a
│   └── chapter-02.m4a
└── ...
```

### 3. Именование файлов

```
{книга-slug}-gl-{номер-главы}.m4a

Примеры:
  voyna-i-mir-gl-01.m4a
  voyna-i-mir-gl-02.m4a
  prestuplenie-i-nakazanie-gl-01.m4a
```

---

## 📊 Лимиты Cloudflare R2

| Параметр | Бесплатно | Платно |
|----------|-----------|--------|
| **Хранилище** | 10 GB | $0.015/GB/месяц |
| **Записи (Class A)** | 1,000,000/месяц | $4.50/миллион |
| **Чтения (Class B)** | 10,000,000/месяц | $0.36/миллион |

**Для аудиокниг:**
- 10 GB ≈ **150-200 часов** аудио (при 64kbps AAC)
- Это примерно **15-20 полных книг**

---

## 🎵 Где взять бесплатные аудиокниги

1. [LibriVox](https://librivox.org/) — общественное достояние
2. [Project Gutenberg](https://www.gutenberg.org/) — книги + аудио
3. [Open Culture](https://www.openculture.com/freeaudiobooks) — коллекция

---

## 🚀 Бонус: Автоматическая загрузка скриптом

Создайте файл `upload-to-r2.sh`:

```bash
#!/bin/bash
# Пример загрузки файла в R2 через curl

ACCOUNT_ID="ваш_account_id"
BUCKET_NAME="jaryq-audio"
ACCESS_KEY="ваш_access_key"
SECRET_KEY="ваш_secret_key"
FILE_PATH="$1"
OBJECT_NAME="$2"

# Получить дату для подписи
DATE=$(date -u +"%a, %d %b %Y %H:%M:%S GMT")
CONTENT_TYPE="audio/mp4"

# Создать подпись (требует openssl)
STRING_TO_SIGN="PUT\n\n${CONTENT_TYPE}\n${DATE}\n/${BUCKET_NAME}/${OBJECT_NAME}"
SIGNATURE=$(echo -n "$STRING_TO_SIGN" | openssl sha1 -hmac "$SECRET_KEY" -binary | base64)

# Загрузить файл
curl -X PUT \
  -H "Date: ${DATE}" \
  -H "Content-Type: ${CONTENT_TYPE}" \
  -H "Authorization: AWS ${ACCESS_KEY}:${SIGNATURE}" \
  -T "${FILE_PATH}" \
  "https://${ACCOUNT_ID}.r2.cloudflarestorage.com/${BUCKET_NAME}/${OBJECT_NAME}"

echo "✅ Загружено: ${OBJECT_NAME}"
```

---

## 📞 Поддержка

- [Документация Cloudflare R2](https://developers.cloudflare.com/r2/)
- [Документация Supabase](https://supabase.com/docs)
- [Экспо AV документация](https://docs.expo.dev/versions/latest/sdk/av/)

---

**Готово!** 🎉 Теперь у вас есть масштабируемое хранилище для аудиокниг.
