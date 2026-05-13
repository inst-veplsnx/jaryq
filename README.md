<div align="center">

<img src="assets/icon.png" alt="Jaryq Logo" width="120" height="120" />

# Jaryq — Аудиокiтапхана

### Аудиобиблиотека для незрячих и слабовидящих пользователей

[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?logo=react&logoColor=white)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-51-000020?logo=expo&logoColor=white)](https://expo.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

[Возможности](#возможности) · [Установка](#установка) · [База данных](#база-данных) · [TalkBack](#поддержка-talkback) · [Сборка APK](#сборка-apk)

</div>

---

## О проекте

**Jaryq** (каз. *жарык* — «свет») — мобильное приложение аудиобиблиотеки, разработанное специально для незрячих и слабовидящих пользователей. Каждый элемент интерфейса оптимизирован для работы с Samsung TalkBack и стандартным Android Accessibility.

Пользователи могут слушать аудиокниги, сохранять прогресс, добавлять книги в избранное и продолжать с того места, где остановились — на любом устройстве.

---

## Возможности

| Функция | Описание |
|---|---|
| Авторизация | Регистрация и вход по email/паролю |
| Аудиоплеер | Воспроизведение с регулировкой скорости (75%–200%) |
| Автосохранение | Прогресс сохраняется каждые 10 секунд |
| Избранное | Сохранение понравившихся книг |
| Книжная полка | Все прослушанные книги с прогрессом |
| Поиск | По названию, автору и диктору |
| Жанры | Навигация по категориям |
| TalkBack | Полная поддержка экранного диктора |
| Офлайн-режим | Скачивание глав для прослушивания без интернета |

---

## Стек технологий

```
Frontend:   React Native 0.74 + Expo 51 + TypeScript
Backend:    Supabase (PostgreSQL + Auth + Storage)
Аудио:      expo-av (фоновое воспроизведение)
Навигация:  React Navigation 6 (Stack + Bottom Tabs)
State:      Zustand
```

**Почему Supabase:**

- Бесплатный тариф — 500 MB БД, 1 GB Storage, 50 000 пользователей/мес
- Встроенная аутентификация с защитой Row Level Security
- Хранилище для аудиофайлов и обложек
- Автоматические REST и Realtime API

---

## Поддержка TalkBack

Приложение полностью совместимо с Samsung TalkBack и стандартным Android TalkBack:

- Каждый элемент имеет `accessibilityLabel` и `accessibilityHint`
- Все кнопки имеют минимальный размер касания 52dp
- Роли элементов: `button`, `header`, `switch`, `adjustable`
- Плеер зачитывается одним блоком: автор, книга, глава, время, скорость
- Смена главы сопровождается голосовым анонсом
- Слайдер перемотки управляется свайпом вверх/вниз

```typescript
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Следующая глава"
  accessibilityHint="Дважды нажмите для перехода к следующей главе"
  accessibilityState={{ disabled: isLastChapter }}
>
```

---

## Установка

### Требования

- [Node.js 18+](https://nodejs.org)
- [Expo Go](https://expo.dev/client) на Android-устройстве
- Аккаунт [Supabase](https://supabase.com) (бесплатно)

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/YOUR_USERNAME/jaryq.git
cd jaryq
npm install
```

### 2. Настройте Supabase

1. Создайте новый проект на [supabase.com](https://supabase.com)
2. В **SQL Editor** выполните файл [`supabase_schema.sql`](./supabase_schema.sql)
3. Скопируйте ключи из **Settings → API**

### 3. Настройте переменные окружения

Скопируйте файл примера и заполните своими данными:

```bash
cp .env.example .env
```

Откройте `.env` и укажите значения:

```
SUPABASE_URL=https://ВАШ_ПРОЕКТ.supabase.co
SUPABASE_ANON_KEY=ВАШ_ANON_KEY
```

### 4. Запустите приложение

```bash
npx expo start
```

Отсканируйте QR-код приложением **Expo Go** на телефоне.

---

## База данных

### Схема таблиц

```
profiles        — пользователи (id, email, full_name)
books           — книги (title, author, narrator, description, ...)
chapters        — главы (book_id, chapter_number, audio_url, duration)
genres          — жанры (name, icon)
user_progress   — прогресс (user_id, book_id, chapter_id, position)
favorites       — избранное (user_id, book_id)
```

### Добавление аудиокниг

> Рекомендуется использовать Cloudflare R2 вместо Supabase Storage для хранения аудиофайлов.
> Cloudflare R2 предоставляет 10 GB бесплатно с поддержкой CDN и стриминга.

#### Вариант 1: Cloudflare R2 (рекомендуется)

Полная инструкция: [CLOUDFLARE_R2_INSTRUCTION.md](./CLOUDFLARE_R2_INSTRUCTION.md)

Кратко:
1. Создайте bucket в Cloudflare R2
2. Конвертируйте MP3 → AAC с помощью скрипта `./convert-audio.sh`
3. Загрузите `.m4a` файлы в R2
4. Скопируйте публичные URL
5. Добавьте в базу данных через SQL Editor

```bash
# Один файл
./convert-audio.sh book.mp3

# Все MP3 в папке
./convert-audio.sh ./audiobooks/*.mp3

# С битрейтом 96kbps
./convert-audio.sh -b 96 book.mp3
```

#### Вариант 2: Supabase Storage

1. Storage → New bucket → назовите `audio` (Public)
2. Загрузите аудиофайл (MP3/M4A)
3. Скопируйте публичный URL файла

#### Добавление в базу данных

```sql
-- Добавьте книгу
INSERT INTO books (title, author, narrator, is_new, total_chapters, total_duration)
VALUES ('Название', 'Автор', 'Диктор', true, 10, 36000);

-- Добавьте главы (audio_url — прямая ссылка на аудиофайл)
INSERT INTO chapters (book_id, chapter_number, title, audio_url, duration)
VALUES ('uuid-книги', 1, 'Глава 1', 'https://...file.m4a', 3600);
```

---

## Структура проекта

```
jaryq/
├── App.tsx                          # Точка входа
├── app.json                         # Конфигурация Expo
├── app.config.js                    # Динамическая конфигурация (env vars)
├── supabase_schema.sql              # SQL схема базы данных
├── .env.example                     # Шаблон переменных окружения
│
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx         # Навигация (Stack + Tabs)
    ├── screens/
    │   ├── LoginScreen.tsx          # Вход
    │   ├── RegisterScreen.tsx       # Регистрация
    │   ├── HomeScreen.tsx           # Главная
    │   ├── SearchScreen.tsx         # Поиск
    │   ├── BookDetailScreen.tsx     # Страница книги
    │   ├── PlayerScreen.tsx         # Аудиоплеер
    │   ├── ProfileScreen.tsx        # Профиль и настройки
    │   └── lists/                   # Новинки, Жанры, Избранное, Полка
    ├── components/
    │   ├── AccessibleButton.tsx     # Кнопка с TalkBack поддержкой
    │   ├── BookListItem.tsx         # Элемент списка книг
    │   ├── FormInput.tsx            # Поле ввода формы
    │   ├── Icon.tsx                 # Компонент иконки
    │   └── SkeletonLoader.tsx       # Скелетон загрузки
    ├── services/
    │   ├── supabase.ts              # Supabase клиент
    │   ├── bookService.ts           # CRUD операции с книгами
    │   ├── audioService.ts          # Управление воспроизведением
    │   └── downloadService.ts       # Офлайн-загрузка глав
    ├── store/
    │   ├── authStore.ts             # Состояние авторизации (Zustand)
    │   ├── playerStore.ts           # Состояние плеера (Zustand)
    │   ├── downloadStore.ts         # Состояние загрузок (Zustand)
    │   └── settingsStore.ts         # Настройки приложения (Zustand)
    ├── theme/
    │   ├── designTokens.ts          # Дизайн-токены
    │   └── useAppScale.ts           # Масштабирование UI
    ├── hooks/
    │   └── useCoverSource.ts        # Хук для обложек книг
    ├── types/
    │   └── index.ts                 # TypeScript типы
    └── utils/
        ├── accessibility.ts         # Утилиты для TalkBack
        ├── constants.ts             # Константы приложения
        └── validation.ts            # Валидация форм
```

---

## Сборка APK

```bash
# Установите EAS CLI
npm install -g eas-cli

# Войдите в аккаунт Expo
eas login

# Соберите APK
eas build --platform android --profile preview
```

Готовый APK будет доступен для скачивания через 15–20 минут.

---

## Вклад в проект

Pull requests приветствуются. Для крупных изменений сначала откройте Issue.

1. Fork репозитория
2. Создайте ветку: `git checkout -b feature/новая-функция`
3. Commit: `git commit -m 'feat: добавить новую функцию'`
4. Push: `git push origin feature/новая-функция`
5. Откройте Pull Request

---

## Лицензия

[MIT](LICENSE) © 2024 Jaryq

---

<div align="center">
  Сделано для незрячих и слабовидящих пользователей Казахстана
</div>
